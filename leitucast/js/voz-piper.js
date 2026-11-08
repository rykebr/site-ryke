/* Worker das vozes neurais abertas (Piper / VITS).
   Converte texto em fonemas com o eSpeak-ng (WASM) e gera o áudio com o ONNX Runtime, tudo no aparelho.
   Os arquivos (modelo da voz, ONNX Runtime e dados de fonemas) ficam guardados no Cache Storage
   depois do primeiro download, então a narração funciona offline. */
'use strict';
const ORT_VER = '1.27.0';
const ORT_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VER}/dist/`;
const PHON_BASE = 'https://cdn.jsdelivr.net/npm/@diffusionstudio/piper-wasm@1.0.0/build/';
const CACHE = 'lc-vozes-v1';

let ORT = null, criarFonemizador = null, fonemizador = null, wasmFon = null, dadosFon = null;
const sessoes = new Map();

async function obter(url, aoProgresso) {
  let cache = null;
  try { cache = await caches.open(CACHE); const r = await cache.match(url); if (r) return await r.arrayBuffer(); } catch (e) { cache = null; }
  const r = await fetch(url);
  if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
  const total = +(r.headers.get('Content-Length') || 0);
  const leitor = r.body.getReader();
  const partes = [];
  let n = 0;
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    partes.push(value); n += value.length;
    if (aoProgresso) aoProgresso(n, total);
  }
  const buf = new Uint8Array(n);
  let o = 0;
  for (const p of partes) { buf.set(p, o); o += p.length; }
  if (cache) { try { await cache.put(url, new Response(buf, { headers: { 'Content-Type': 'application/octet-stream' } })); } catch (e) { /* sem espaço */ } }
  return buf.buffer;
}
async function existe(url) {
  try { const c = await caches.open(CACHE); return !!(await c.match(url)); } catch (e) { return false; }
}

async function prepararBase(prog) {
  if (!ORT) {
    importScripts(ORT_BASE + 'ort.wasm.min.js');
    ORT = self.ort;
    // com isolamento de origem dá para usar vários núcleos (a Dora/Kokoro precisa disso para tocar sem pausas)
    ORT.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;
    ORT.env.wasm.wasmPaths = ORT_BASE;
    ORT.env.wasm.wasmBinary = await obter(ORT_BASE + 'ort-wasm-simd-threaded.wasm', (n, t) => prog('motor', n, t));
  }
  if (!criarFonemizador) {
    importScripts(PHON_BASE + 'piper_phonemize.js');
    criarFonemizador = self.createPiperPhonemize;
    wasmFon = await obter(PHON_BASE + 'piper_phonemize.wasm', (n, t) => prog('fonemas', n, t));
    const dados = await obter(PHON_BASE + 'piper_phonemize.data', (n, t) => prog('fonemas', n, t));
    dadosFon = URL.createObjectURL(new Blob([dados]));
  }
}

function fonemas(texto, vozEspeak) {
  return new Promise((resolve, reject) => {
    let saiu = false;
    const opcoes = {
      print: (d) => { if (saiu) return; saiu = true; try { resolve(JSON.parse(d)); } catch (e) { reject(e); } },
      printErr: () => {},
      wasmBinary: wasmFon,
      locateFile: (u) => (u.endsWith('.data') ? dadosFon : u),
    };
    const rodar = (m) => {
      try { m.callMain(['-l', vozEspeak, '--input', JSON.stringify([{ text: texto }]), '--espeak_data', '/espeak-ng-data']); }
      catch (e) { if (!saiu) reject(e); }
    };
    // o fonemizador é recriado a cada frase (o programa C++ não aceita rodar duas vezes na mesma instância)
    criarFonemizador(opcoes).then(rodar, reject);
  });
}

function idsDeFonemas(lista, mapa) {
  const pega = (s) => mapa[s] || [];
  const ids = [...pega('^'), ...pega('_')];
  for (const f of lista) { const v = mapa[f]; if (!v) continue; ids.push(...v, ...pega('_')); }
  ids.push(...pega('$'));
  return ids;
}

async function carregarVoz(voz, prog) {
  if (sessoes.has(voz.id)) return sessoes.get(voz.id);
  await prepararBase(prog);
  if (voz.tipo === 'kokoro') {
    // Kokoro-82M: vocabulário de fonemas IPA do tokenizer e o vetor de estilo da voz (510 × 256)
    const tok = JSON.parse(new TextDecoder().decode(await obter(voz.cfg, () => {})));
    const estilo = new Float32Array(await obter(voz.estilo, () => {}));
    const modelo = await obter(voz.onnx, (n, t) => prog('voz', n, t || (voz.mb || 90) * 1048576));
    const sess = await ORT.InferenceSession.create(modelo, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
    const s = { kokoro: true, vocab: tok.model.vocab, estilo, sess, cfg: { audio: { sample_rate: 24000 } } };
    sessoes.set(voz.id, s);
    return s;
  }
  const cfg = JSON.parse(new TextDecoder().decode(await obter(voz.cfg, () => {})));
  const modelo = await obter(voz.onnx, (n, t) => prog('voz', n, t || voz.bytes || 0));
  const sess = await ORT.InferenceSession.create(modelo, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  const s = { cfg, sess };
  sessoes.set(voz.id, s);
  return s;
}

function aparar(pcm, sr) {
  const lim = 0.008;
  let a = 0, b = pcm.length - 1;
  while (a < b && Math.abs(pcm[a]) < lim) a++;
  while (b > a && Math.abs(pcm[b]) < lim) b--;
  a = Math.max(0, a - Math.floor(sr * 0.02));
  b = Math.min(pcm.length, b + Math.floor(sr * 0.06));
  return pcm.slice(a, b);
}

/* Kokoro: os fonemas do eSpeak (pt-br) viram ids do vocabulário; o estilo depende do número de fonemas */
async function falarKokoro(s, texto, opt) {
  const r = await fonemas(texto, 'pt-br');
  let ps = Array.isArray(r.phonemes) ? r.phonemes.map((x) => (Array.isArray(x) ? x.join('') : x)).join(' ') : String(r.phonemes || '');
  // mesmos ajustes que o misaki (EspeakG2P) faz antes do Kokoro
  ps = ps.replace(/ʲ/g, 'j').replace(/r/g, 'ɾ').replace(/x/g, 'k').replace(/ɬ/g, 'l').replace(/\s+/g, ' ').trim();
  const ids = [];
  for (const ch of ps) if (s.vocab[ch] !== undefined) ids.push(s.vocab[ch]);
  if (!ids.length) throw new Error('sem fonemas');
  const partes = [];
  for (let i = 0; i < ids.length; i += 500) partes.push(ids.slice(i, i + 500));
  const saida = [];
  for (const p of partes) {
    const toks = [0, ...p, 0];
    const n = Math.min(p.length, 509);
    const estilo = s.estilo.slice(n * 256, n * 256 + 256);
    const out = await s.sess.run({
      input_ids: new ORT.Tensor('int64', BigInt64Array.from(toks.map((x) => BigInt(x))), [1, toks.length]),
      style: new ORT.Tensor('float32', estilo, [1, 256]),
      speed: new ORT.Tensor('float32', Float32Array.from([1 / (opt.ritmo || 1)]), [1]),
    });
    saida.push(out[Object.keys(out)[0]].data);
  }
  const total = saida.reduce((t, a) => t + a.length, 0);
  const pcm = new Float32Array(total);
  let o = 0;
  for (const a of saida) { pcm.set(a, o); o += a.length; }
  return { pcm: aparar(pcm, 24000), sr: 24000 };
}

async function falar(voz, texto, opt) {
  const sk = await carregarVoz(voz, () => {});
  if (sk.kokoro) return falarKokoro(sk, texto, opt);
  const { cfg, sess } = sk;
  const r = await fonemas(texto, cfg.espeak && cfg.espeak.voice || 'pt-br');
  let ids;
  if (r.phonemes && cfg.phoneme_id_map) {
    const lista = Array.isArray(r.phonemes[0]) ? r.phonemes.flat() : (typeof r.phonemes === 'string' ? Array.from(r.phonemes) : r.phonemes);
    ids = idsDeFonemas(lista, cfg.phoneme_id_map);
  }
  if (!ids || ids.length < 3) ids = r.phoneme_ids;
  if (!ids || !ids.length) throw new Error('sem fonemas');
  const inf = cfg.inference || {};
  const feeds = {
    input: new ORT.Tensor('int64', BigInt64Array.from(ids.map((x) => BigInt(x))), [1, ids.length]),
    input_lengths: new ORT.Tensor('int64', BigInt64Array.from([BigInt(ids.length)]), [1]),
    scales: new ORT.Tensor('float32', Float32Array.from([opt.ruido ?? inf.noise_scale ?? 0.667, (inf.length_scale ?? 1) * (opt.ritmo || 1), opt.ruidoW ?? inf.noise_w ?? 0.8]), [3]),
  };
  if ((cfg.num_speakers || 1) > 1) feeds.sid = new ORT.Tensor('int64', BigInt64Array.from([0n]), [1]);
  const out = await sess.run(feeds);
  const pcm = aparar(out[Object.keys(out)[0]].data, cfg.audio.sample_rate);
  return { pcm, sr: cfg.audio.sample_rate };
}

self.onmessage = async (e) => {
  const m = e.data;
  try {
    if (m.tipo === 'existe') {
      const ok = await existe(m.voz.onnx);
      self.postMessage({ id: m.id, ok: true, existe: ok });
    } else if (m.tipo === 'baixar') {
      await carregarVoz(m.voz, (parte, n, t) => self.postMessage({ id: m.id, progresso: { parte, n, t } }));
      self.postMessage({ id: m.id, ok: true });
    } else if (m.tipo === 'falar') {
      const r = await falar(m.voz, m.texto, m.opt || {});
      self.postMessage({ id: m.id, ok: true, pcm: r.pcm, sr: r.sr }, [r.pcm.buffer]);
    } else if (m.tipo === 'remover') {
      const c = await caches.open(CACHE);
      await c.delete(m.voz.onnx); await c.delete(m.voz.cfg); if (m.voz.estilo) await c.delete(m.voz.estilo);
      sessoes.delete(m.voz.id);
      self.postMessage({ id: m.id, ok: true });
    }
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, erro: String(err && err.message || err) });
  }
};
