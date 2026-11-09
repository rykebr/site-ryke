/* Narrador do LeituCast Ingrid.
   Dois motores com a mesma interface:
   - "sistema": vozes do navegador (Web Speech). No Microsoft Edge aparecem as vozes neurais "Natural"
     (Francisca, Antônio, Thalita...). No iPhone, as vozes da Apple. No Android, as do Google.
   - "piper": vozes neurais abertas (Piper), baixadas uma vez e rodando offline num worker.
   Lê frase por frase, destaca cada palavra no ritmo da fala e vira a página sozinho. */
'use strict';
const Narrador = (() => {
  const HF = 'https://huggingface.co/rhasspy/piper-voices/resolve/main/';
  const AMOSTRA = 'https://rhasspy.github.io/piper-samples/samples/';
  const piper = (lang, nome, q, extra) => {
    const [l] = lang.split('_');
    const base = `${l}/${lang}/${nome}/${q}/${lang}-${nome}-${q}`;
    return { id: `piper:${lang}-${nome}-${q}`, motor: 'piper', lang: lang.replace('_', '-'), onnx: HF + encodeURI(base) + '.onnx', cfg: HF + encodeURI(base) + '.onnx.json', amostra: AMOSTRA + encodeURI(`${l}/${lang}/${nome}/${q}/speaker_0.mp3`), mb: 63, lic: 'MIT (Rhasspy Piper)', ...extra };
  };
  const VOZES_ABERTAS = [
    piper('pt_BR', 'faber', 'medium', { nome: 'Faber', genero: 'm', desc: 'Masculina, clara e calma. A mais natural em português.', recomendada: true }),
    // Dii (OpenVoiceOS): voz feminina neural em português do Brasil, no formato Piper. Licença de uso pessoal.
    {
      id: 'piper:pt_BR-dii-ovos', motor: 'piper', lang: 'pt-BR', nome: 'Dii', genero: 'f', desc: 'Feminina, suave e clara. Uso pessoal, não comercial.', recomendada: true,
      onnx: 'https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii/resolve/main/dii_pt-BR.onnx', cfg: 'https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii/resolve/main/dii_pt-BR.onnx.json',
      amostra: 'https://huggingface.co/OpenVoiceOS/pipertts_pt-BR_dii/resolve/main/sample.wav', mb: 63, lic: 'CC BY-NC-ND 4.0 (OpenVoiceOS / TigreGotico)',
    },
    piper('pt_BR', 'cadu', 'medium', { nome: 'Cadu', genero: 'm', desc: 'Masculina, jovem e próxima' }),
    piper('pt_BR', 'jeff', 'medium', { nome: 'Jeff', genero: 'm', desc: 'Masculina, firme, boa para suspense' }),
    piper('pt_BR', 'edresson', 'low', { nome: 'Edresson', genero: 'm', desc: 'Masculina, simples e leve' }),
    piper('en_US', 'amy', 'medium', { nome: 'Amy', genero: 'f', desc: 'Inglês americano, feminina' }),
    piper('en_US', 'kristin', 'medium', { nome: 'Kristin', genero: 'f', desc: 'Inglês americano, feminina e calma' }),
    piper('en_US', 'ryan', 'medium', { nome: 'Ryan', genero: 'm', desc: 'Inglês americano, masculina' }),
    piper('en_US', 'joe', 'medium', { nome: 'Joe', genero: 'm', desc: 'Inglês americano, masculina e grave' }),
    piper('en_GB', 'alba', 'medium', { nome: 'Alba', genero: 'f', desc: 'Inglês britânico, feminina' }),
    piper('es_AR', 'daniela', 'high', { nome: 'Daniela', genero: 'f', desc: 'Espanhol, feminina', mb: 114 }),
    piper('es_ES', 'davefx', 'medium', { nome: 'Davefx', genero: 'm', desc: 'Espanhol, masculina' }),
    piper('fr_FR', 'siwis', 'medium', { nome: 'Siwis', genero: 'f', desc: 'Francês, feminina' }),
    piper('fr_FR', 'tom', 'medium', { nome: 'Tom', genero: 'm', desc: 'Francês, masculina' }),
  ];
  const ESTILOS = [
    { id: 'natural', nome: 'Natural', vel: 1, tom: 1, ruido: 0.667 },
    { id: 'suave', nome: 'Suave', vel: 0.93, tom: 0.97, ruido: 0.55 },
    { id: 'narrador', nome: 'Narrador grave', vel: 0.95, tom: 0.84, ruido: 0.6 },
    { id: 'animada', nome: 'Animada', vel: 1.06, tom: 1.12, ruido: 0.8 },
    { id: 'dormir', nome: 'Para dormir', vel: 0.86, tom: 0.92, ruido: 0.5 },
  ];
  const FEM = /francisca|thalita|maria|luciana|joana|raquel|fernanda|helena|vit[oó]ria|brenda|leila|let[ií]cia|manuela|yara|elza|giovanna|camila|isabela|fab[ií]ola|catarina|samantha|karen|victoria|allison|ava|emma|jenny|aria|sonia|libby|michelle|zira|hazel|susan|m[oô]nica|paulina|elvira|denise|female|feminin|mulher|ines|in[eê]s|amelie|anna|alice|ellen|kate|serena|moira|tessa|fiona|veena|joana|paola|dalia|lupe|google portugu[eê]s do brasil/i;
  const MASC = /antonio|ant[oô]nio|daniel|felipe|duarte|donato|f[aá]bio|humberto|j[uú]lio|nicolau|val[eé]rio|macerio|guy|andrew|brian|christopher|eric|roger|ryan|thomas|david|mark|george|jorge|[aá]lvaro|henri|paul|male|masculin|homem|diego|carlos|reed|rocko|eddy|grandpa|ralph|fred|junior|alex|aaron|arthur|gordon|oliver|lee|rishi|cristiano|luca|thomas/i;
  const generoDe = (nome) => (FEM.test(nome) ? 'f' : MASC.test(nome) ? 'm' : '');

  /* ---------------- estado ---------------- */
  let cfg = { voz: '', estilo: 'natural', vel: 1 };
  let ativo = false, tocando = false, pausado = false;
  let cap = 0, txt = '', frases = [], fi = 0, base = 0, ultimaPalavra = null;
  let ouvintes = {};
  let worker = null, pedidos = new Map(), nPed = 0;
  let ctx = null, fonte = null, inicioAudio = 0, durAtual = 0, palavrasAtual = [], raf = 0;
  let prefetch = new Map();
  let livroAtual = null;
  const baixadas = new Set();
  const baixando = new Map();
  let avisouLenta = false;
  let semNeural = false; // a voz neural falhou nesta sessão (sem internet no primeiro uso): usa a do aparelho
  let vigia = 0, estimador = 0, temLimites = {};
  let dormirAte = 0, dormirFimCap = false, dormirT = 0;
  let cps = LS.get('lc-cps', 14);
  let geracao = 0;

  const emitir = (ev, d) => { (ouvintes[ev] || []).forEach((f) => { try { f(d); } catch (e) { console.error(e); } }); };
  const on = (ev, f) => { (ouvintes[ev] = ouvintes[ev] || []).push(f); };

  /* ---------------- vozes do sistema ---------------- */
  function vozesSistema() {
    if (!('speechSynthesis' in window)) return [];
    return speechSynthesis.getVoices().map((v) => ({
      id: 'sis:' + v.voiceURI, motor: 'sistema', nome: v.name.replace(/^(Microsoft|Google|Apple)\s+/, '').replace(/\s*-\s*(Portuguese|English|Spanish|French).*$/i, '').replace(/\s*\((Natural|Neural)\)/i, ''),
      bruto: v.name, lang: v.lang, local: v.localService, genero: generoDe(v.name), natural: /natural|neural|online|premium|enhanced|aprimorad/i.test(v.name), edge: /Microsoft.*(Online|Natural)/i.test(v.name), voz: v,
    }));
  }
  const carregadas = new Promise((res) => {
    if (!('speechSynthesis' in window)) return res();
    if (speechSynthesis.getVoices().length) return res();
    speechSynthesis.onvoiceschanged = () => res();
    setTimeout(res, 2500);
  });
  function notaVoz(v, lang) {
    const l = (v.lang || '').toLowerCase().replace('_', '-');
    const alvo = (lang || 'pt-BR').toLowerCase();
    let s = 0;
    if (l === alvo) s += 6; else if (l.slice(0, 2) === alvo.slice(0, 2)) s += 3.5; else return -1;
    if (v.natural) s += 4;
    if (/francisca/i.test(v.bruto)) s += 3;
    else if (/thalita/i.test(v.bruto)) s += 2.6;
    else if (/luciana/i.test(v.bruto)) s += 2.2;
    else if (/google/i.test(v.bruto)) s += 2;
    else if (/antonio|ant[oô]nio/i.test(v.bruto)) s += 1.8;
    if (!v.local) s += 0.4;
    if (v.genero === 'f') s += 0.3; // empate: a voz feminina soa mais suave para leitura longa
    return s;
  }
  async function listarVozes(lang = 'pt-BR') {
    await carregadas;
    const l2 = lang.slice(0, 2);
    const sis = vozesSistema().map((v) => ({ ...v, nota: notaVoz(v, lang) })).filter((v) => v.nota >= 0).sort((a, b) => b.nota - a.nota);
    const abertas = VOZES_ABERTAS.filter((v) => v.lang.slice(0, 2) === l2);
    return { sistema: sis, abertas };
  }
  async function vozPadrao(lang = 'pt-BR') {
    // em português a padrão é a Faber (neural, offline); ela é baixada na primeira narração
    if (/^pt/i.test(lang) && !semNeural) return 'piper:pt_BR-faber-medium';
    const { sistema } = await listarVozes(lang);
    return sistema[0] ? sistema[0].id : (VOZES_ABERTAS.find((v) => v.lang.slice(0, 2) === lang.slice(0, 2)) || {}).id || '';
  }
  async function acharVoz(id, lang) {
    if (id && id.startsWith('piper:')) return VOZES_ABERTAS.find((v) => v.id === id) || null;
    await carregadas;
    const sis = vozesSistema();
    return sis.find((v) => v.id === id) || null;
  }

  /* ---------------- worker Piper ---------------- */
  function chamar(tipo, dados, aoProg) {
    if (!worker) {
      worker = new Worker(new URL('js/voz-piper.js?v=18', location.href).href);
      worker.onmessage = (e) => {
        const p = pedidos.get(e.data.id);
        if (!p) return;
        if (e.data.progresso) { p.prog && p.prog(e.data.progresso); return; }
        pedidos.delete(e.data.id);
        if (e.data.ok) p.res(e.data); else p.rej(new Error(e.data.erro));
      };
      worker.onerror = (e) => { pedidos.forEach((p) => p.rej(new Error(e.message || 'worker'))); pedidos.clear(); worker = null; };
    }
    const id = ++nPed;
    return new Promise((res, rej) => { pedidos.set(id, { res, rej, prog: aoProg }); worker.postMessage({ id, tipo, ...dados }); });
  }
  const vozBaixada = async (v) => { try { return (await chamar('existe', { voz: v })).existe; } catch (e) { return false; } };
  function baixarVoz(v, aoProg) {
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* sem persistência */ }
    return chamar('baixar', { voz: v }, aoProg);
  }
  const removerVoz = (v) => chamar('remover', { voz: v });

  /* ---------------- frases ---------------- */
  const ABREV = new Set(['sr', 'sra', 'srs', 'sras', 'drs', 'srta', 'dr', 'dra', 'd', 'prof', 'profa', 'exmo', 'exma', 'v', 's', 'sto', 'sta', 'etc', 'cap', 'pag', 'p', 'n', 'no', 'nº', 'vol', 'ed', 'st', 'mr', 'mrs', 'ms', 'jr', 'vs', 'art', 'fig', 'ilmo', 'gen', 'cel', 'ten', 'pe', 'fr', 'mme', 'mlle', 'm', 'dna', 'sr.', 'av', 'tel']);
  function segmentar(t, blocos) {
    const lim = [...blocos, t.length].filter((x, i, a) => i === 0 || x > a[i - 1]);
    if (!lim.length || lim[0] !== 0) lim.unshift(0);
    const out = [];
    const empurra = (a, b) => {
      while (a < b && /\s/.test(t[a])) a++;
      while (b > a && /\s/.test(t[b - 1])) b--;
      if (b - a < 1 || !/[\p{L}\p{N}]/u.test(t.slice(a, b))) return;
      if (b - a <= 240) { out.push({ ini: a, fim: b }); return; }
      // frase longa: divide em pontuação intermediária perto do meio
      let corte = -1;
      const meio = a + Math.min(220, (b - a) / 2 + 60);
      for (let k = Math.floor(meio); k > a + 60; k--) if (/[;:,—–]/.test(t[k]) && /\s/.test(t[k + 1] || '')) { corte = k + 1; break; }
      if (corte < 0) for (let k = Math.floor(a + 200); k > a + 60; k--) if (/\s/.test(t[k])) { corte = k; break; }
      if (corte < 0) corte = a + 220;
      empurra(a, corte); empurra(corte, b);
    };
    for (let i = 0; i < lim.length - 1; i++) {
      const a0 = lim[i], b0 = lim[i + 1];
      const pedaco = t.slice(a0, b0);
      const rx = /[.!?…]+["'”’»)\]]*(?=\s|$)/g;
      let ini = a0, m;
      while ((m = rx.exec(pedaco))) {
        const fim = a0 + m.index + m[0].length;
        const antes = pedaco.slice(Math.max(0, m.index - 12), m.index).split(/\s+/).pop().toLowerCase().replace(/[^\p{L}º]/gu, '');
        if (m[0] === '.' && (ABREV.has(antes) || /^\p{Lu}$/u.test(pedaco[m.index - 1] || '') && /\s\p{Lu}$|^\p{Lu}$/u.test(pedaco.slice(Math.max(0, m.index - 2), m.index)))) continue;
        empurra(ini, fim);
        ini = fim;
      }
      empurra(ini, b0);
    }
    return out;
  }
  function palavrasDe(ini, fim) {
    const out = [];
    const rx = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu;
    const s = txt.slice(ini, fim);
    let m;
    while ((m = rx.exec(s))) out.push({ i: ini + m.index, f: ini + m.index + m[0].length, peso: m[0].length + 2 + (/[,;:]/.test(s[m.index + m[0].length] || '') ? 3 : 0) + (/[.!?…]/.test(s[m.index + m[0].length] || '') ? 5 : 0) });
    return out;
  }

  /* ---------------- texto falável ----------------
     As vozes leem "Srs." como "S, R, S". Aqui as abreviações viram palavras e os números romanos
     sozinhos ("XIV", títulos de capítulo) viram números. mapa[i] = posição no texto original do
     caractere i do texto falado, para o destaque da palavra continuar certo. */
  const ABREV_PT = [
    ['Srs.', 'Senhores'], ['Sras.', 'Senhoras'], ['Srta.', 'Senhorita'], ['Sr.ª', 'Senhora'], ['Sra.', 'Senhora'], ['Sr.', 'Senhor'],
    ['Drs.', 'Doutores'], ['Dra.', 'Doutora'], ['Dr.', 'Doutor'], ['Profa.', 'Professora'], ['Prof.', 'Professor'], ['Exmo.', 'Excelentíssimo'], ['Exma.', 'Excelentíssima'],
    ['V. Exa.', 'Vossa Excelência'], ['V. Ex.ª', 'Vossa Excelência'], ['V. Sa.', 'Vossa Senhoria'], ['V. S.ª', 'Vossa Senhoria'], ['Ilmo.', 'Ilustríssimo'], ['Ilma.', 'Ilustríssima'],
    ['Sto.', 'Santo'], ['Sta.', 'Santa'], ['Pe.', 'Padre'], ['Fr.', 'Frei'], ['Gen.', 'General'], ['Cel.', 'Coronel'], ['Ten.', 'Tenente'], ['Cap.', 'Capitão'], ['Maj.', 'Major'], ['Sarg.', 'Sargento'],
    ['etc.', 'etcétera'], ['&c.', 'etcétera'], ['n.º', 'número'], ['nº', 'número'], ['pág.', 'página'], ['págs.', 'páginas'], ['cap.', 'capítulo'], ['vol.', 'volume'], ['séc.', 'século'],
    ['Cia.', 'Companhia'], ['Ltda.', 'Limitada'], ['Av.', 'Avenida'], ['Mr.', 'Míster'], ['Mrs.', 'Mísses'], ['Mme.', 'Madame'], ['Mlle.', 'Mademoiselle'], ['obs.', 'observação'],
  ];
  const RX_ABREV = new RegExp('(^|[\\s(«"“—])(' + ABREV_PT.map(([a]) => a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|') + ')(?=[\\s,;:)»"”!?]|$)', 'g');
  const MAPA_ABREV = new Map(ABREV_PT);
  function romano(s) {
    const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let t = 0;
    for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] || 0; t += a < b ? -a : a; }
    return t;
  }
  function falavel(t, lang) {
    if (!/^pt/i.test(lang || cfg.lang || 'pt')) return { txt: t, mapa: null };
    const trocas = [];
    let m;
    RX_ABREV.lastIndex = 0;
    while ((m = RX_ABREV.exec(t))) { const ini = m.index + m[1].length; trocas.push([ini, ini + m[2].length, MAPA_ABREV.get(m[2])]); }
    // número romano sozinho na frase ("XIV.") ou logo depois de "capítulo"
    const rom = t.match(/^\s*([IVXLCDM]{1,7})\s*\.?\s*$/) || null;
    if (rom && romano(rom[1]) > 0) { const ini = t.indexOf(rom[1]); trocas.push([ini, ini + rom[1].length, String(romano(rom[1]))]); }
    const rc = /\b(cap[ií]tulo|parte|livro|canto)\s+([IVXLCDM]{1,7})\b/gi;
    while ((m = rc.exec(t))) { const ini = m.index + m[0].length - m[2].length; trocas.push([ini, ini + m[2].length, String(romano(m[2].toUpperCase()))]); }
    if (!trocas.length) return { txt: t, mapa: null };
    trocas.sort((a, b) => a[0] - b[0]);
    let txt = '', i = 0;
    const mapa = [];
    for (const [a, b, novo] of trocas) {
      if (a < i) continue;
      for (; i < a; i++) { txt += t[i]; mapa.push(i); }
      for (let k = 0; k < novo.length; k++) { txt += novo[k]; mapa.push(Math.min(b - 1, a + Math.floor((k * (b - a)) / novo.length))); }
      i = b;
    }
    for (; i < t.length; i++) { txt += t[i]; mapa.push(i); }
    return { txt, mapa };
  }

  /* ---------------- destaque ---------------- */
  function mostrar(i, f) {
    if (ultimaPalavra && ultimaPalavra.c === cap && ultimaPalavra.i === i && ultimaPalavra.f === f) return;
    ultimaPalavra = { c: cap, i, f };
    const fr = frases[fi];
    emitir('palavra', { c: cap, i, f, frase: fr ? { ini: fr.ini, fim: fr.fim } : null });
  }

  /* ---------------- motor do sistema (Web Speech) ---------------- */
  function falarSistema(v, est, ger) {
    const fr = frases[fi];
    const de = ultimaPalavra && ultimaPalavra.c === cap && ultimaPalavra.i >= fr.ini && ultimaPalavra.i < fr.fim && pausado ? ultimaPalavra.i : fr.ini;
    base = de;
    const texto = txt.slice(de, fr.fim);
    const fal = falavel(texto);
    const u = new SpeechSynthesisUtterance(fal.txt);
    u.voice = v.voz; u.lang = v.lang;
    u.rate = clamp(cfg.vel * est.vel, 0.5, 2.5);
    u.pitch = clamp(est.tom, 0.5, 1.6);
    const palavras = palavrasDe(de, fr.fim);
    const t0 = { t: 0 };
    let recebeu = false;
    u.onstart = () => {
      t0.t = performance.now();
      if (palavras[0]) mostrar(palavras[0].i, palavras[0].f);
      clearTimeout(estimador);
      if (temLimites[v.id] !== true) {
        estimador = setTimeout(() => { if (!recebeu && ger === geracao) estimar(palavras, t0, u.rate, ger); }, temLimites[v.id] === false ? 0 : 650);
      }
    };
    u.onboundary = (e) => {
      if (ger !== geracao || (e.name && e.name !== 'word')) return;
      recebeu = true; temLimites[v.id] = true;
      cancelAnimationFrame(raf);
      const g = base + (fal.mapa ? fal.mapa[Math.min(e.charIndex, fal.mapa.length - 1)] : e.charIndex);
      const w = palavras.find((p) => p.i <= g && p.f > g) || palavras.find((p) => p.i >= g);
      if (w) mostrar(w.i, w.f);
    };
    u.onend = () => {
      if (ger !== geracao) return;
      cancelAnimationFrame(raf); clearTimeout(vigia); clearTimeout(estimador);
      const dur = (performance.now() - t0.t) / 1000;
      if (dur > 0.6 && texto.length > 20) { cps = cps * 0.8 + (texto.length / dur / u.rate) * 0.2; LS.set('lc-cps', cps); }
      if (!recebeu && temLimites[v.id] === undefined && texto.length > 30) temLimites[v.id] = false;
      proxima(ger);
    };
    u.onerror = (e) => {
      if (ger !== geracao || e.error === 'interrupted' || e.error === 'canceled') return;
      clearTimeout(vigia);
      emitir('erro', 'A voz do aparelho falhou: ' + (e.error || ''));
      setTimeout(() => proxima(ger), 200);
    };
    speechSynthesis.speak(u);
    clearTimeout(vigia);
    vigia = setTimeout(() => { if (ger === geracao && tocando) { speechSynthesis.cancel(); proxima(ger); } }, ((texto.length / (cps * u.rate)) * 2.2 + 6) * 1000);
  }
  function estimar(palavras, t0, rate, ger) {
    const total = palavras.reduce((s, p) => s + p.peso, 0) || 1;
    const durEst = palavras.reduce((s, p) => s + p.peso, 0) / (cps * rate);
    cancelAnimationFrame(raf);
    const meu = ++laco;
    const passo = () => {
      if (meu !== laco || ger !== geracao || !tocando) return;
      const el = (performance.now() - t0.t) / 1000;
      let alvo = (el / durEst) * total, acc = 0;
      for (const p of palavras) { acc += p.peso; if (acc >= alvo) { mostrar(p.i, p.f); break; } }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }

  /* ---------------- motor Piper (offline) ---------------- */
  async function sintetizar(v, idx, est) {
    const k = cap + ':' + idx + ':' + v.id + ':' + est.id + ':' + cfg.vel;
    if (prefetch.has(k)) return prefetch.get(k);
    const fr = frases[idx];
    const p = chamar('falar', { voz: v, texto: falavel(txt.slice(fr.ini, fr.fim)).txt, opt: { ritmo: 1 / clamp(cfg.vel * est.vel, 0.5, 2.2), ruido: est.ruido } }).then((r) => ({ ...r, idx }));
    prefetch.set(k, p);
    if (prefetch.size > 6) prefetch.delete(prefetch.keys().next().value);
    return p;
  }
  async function falarPiper(v, est, ger) {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    let r;
    try {
      // primeira vez com esta voz: baixa mostrando o progresso e só então começa a narrar com ela
      // (fica guardada para usar offline)
      if (!baixadas.has(v.id)) {
        if (await vozBaixada(v)) baixadas.add(v.id);
        else {
          if (!baixando.has(v.id)) {
            emitir('baixandoVoz', { nome: v.nome, pct: 0 });
            const pr = baixarVoz(v, (p) => { if (p.parte === 'voz' && p.t) emitir('baixandoVoz', { nome: v.nome, pct: p.n / p.t }); })
              .then(() => { baixadas.add(v.id); emitir('baixandoVoz', { nome: v.nome, pct: 1, fim: true }); })
              .catch((e) => { emitir('baixandoVoz', { nome: v.nome, falhou: true, motivo: e.message }); throw e; })
              .finally(() => baixando.delete(v.id));
            pr.catch(() => null);
            baixando.set(v.id, pr);
          }
          // espera a voz escolhida terminar de baixar (nunca começa com outra voz); parar continua funcionando
          await baixando.get(v.id);
          if (ger !== geracao) return;
        }
      }
      if (ger !== geracao) return;
      const t0 = performance.now();
      r = await sintetizar(v, fi, est);
      // voz mais lenta que a fala neste aparelho (Dora/Kokoro em CPU simples): avisa uma vez
      const gastou = (performance.now() - t0) / 1000, dura = r.pcm.length / r.sr;
      if (v.tipo === 'kokoro' && dura > 1.5 && gastou > dura * 1.15 && !avisouLenta) { avisouLenta = true; emitir('erro', `A voz ${v.nome} está mais lenta que a leitura neste aparelho e pode pausar entre as frases. A Faber é bem mais rápida.`); }
    } catch (e) {
      if (ger !== geracao) return;
      // não troca de voz sozinho: para e avisa (a pessoa tenta de novo ou escolhe outra voz)
      const baixou = baixadas.has(v.id);
      if (baixou) emitir('erro', `A voz ${v.nome} falhou nesta frase. Toque em Ouvir para tentar de novo.`);
      return parar();
    }
    if (ger !== geracao) return;
    for (let k = 1; k <= 2; k++) if (frases[fi + k]) sintetizar(v, fi + k, est).catch(() => null);
    const buf = ctx.createBuffer(1, r.pcm.length, r.sr);
    buf.copyToChannel(r.pcm, 0);
    fonte = ctx.createBufferSource();
    fonte.buffer = buf;
    fonte.connect(ctx.destination);
    const fr = frases[fi];
    palavrasAtual = palavrasDe(fr.ini, fr.fim);
    durAtual = buf.duration;
    inicioAudio = ctx.currentTime + 0.02;
    fonte.onended = () => { if (ger === geracao && tocando) setTimeout(() => proxima(ger), /[.!?…]["'”»]?$/.test(txt.slice(fr.ini, fr.fim)) ? 140 : 40); };
    fonte.start(inicioAudio);
    acompanharPiper(ger);
  }
  /* um único laço de destaque por vez: cada frase nova cancela o laço da anterior */
  let laco = 0;
  function acompanharPiper(ger) {
    cancelAnimationFrame(raf);
    const meu = ++laco;
    const total = palavrasAtual.reduce((s, p) => s + p.peso, 0) || 1;
    const passo = () => {
      if (meu !== laco || ger !== geracao || !tocando) return;
      const el = ctx.currentTime - inicioAudio;
      if (el >= 0) {
        const alvo = (el / Math.max(0.2, durAtual * 0.97)) * total;
        let acc = 0;
        for (const p of palavrasAtual) { acc += p.peso; if (acc >= alvo) { mostrar(p.i, p.f); break; } }
      }
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
  }

  /* ---------------- controle ---------------- */
  async function carregarCap(c) {
    const r = await ouvintes.texto[0](c);
    cap = c; txt = r.txt; frases = segmentar(r.txt, r.blocos);
    prefetch.clear();
  }
  async function falarAtual(ger) {
    if (ger !== geracao) return;
    if (!frases[fi]) return proxima(ger);
    const v = await acharVoz(cfg.voz) || await acharVoz(await vozPadrao(cfg.lang));
    if (!v) { emitir('erro', 'Este aparelho não tem voz para leitura. Baixe uma voz aberta no Perfil.'); return parar(); }
    const est = ESTILOS.find((e) => e.id === cfg.estilo) || ESTILOS[0];
    pausado = false;
    if (v.motor === 'piper') return falarPiper(v, est, ger);
    return falarSistema(v, est, ger);
  }
  async function proxima(ger) {
    if (ger !== geracao || !tocando) return;
    pausado = false; ultimaPalavra = null;
    fi++;
    if (fi >= frases.length) {
      if (dormirFimCap) { dormirFimCap = false; emitir('dormiu'); return parar(); }
      const prox = cap + 1;
      if (prox >= ouvintes.ncaps[0]()) { emitir('fim'); return parar(); }
      await carregarCap(prox);
      fi = 0;
      emitir('capitulo', prox);
    }
    if (dormirAte && Date.now() >= dormirAte) { dormirAte = 0; emitir('dormiu'); return parar(); }
    falarAtual(ger);
  }
  async function tocar(c, o) {
    pararMotores();
    const ger = ++geracao;
    ativo = true; tocando = true; pausado = false;
    if (c !== cap || !frases.length || !txt) await carregarCap(c);
    else if (c !== cap) await carregarCap(c);
    fi = Math.max(0, frases.findIndex((f) => f.fim > o));
    if (fi < 0) fi = 0;
    const fr = frases[fi];
    if (fr && o > fr.ini && o < fr.fim) { ultimaPalavra = { c, i: o, f: o }; pausado = true; }
    else ultimaPalavra = null;
    metadadosMidia();
    emitir('estado', estado());
    await falarAtual(ger);
  }
  function pararMotores() {
    geracao++;
    cancelAnimationFrame(raf); clearTimeout(vigia); clearTimeout(estimador);
    try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch (e) { /* nada */ }
    try { if (fonte) { fonte.onended = null; fonte.stop(); } } catch (e) { /* já parou */ }
    fonte = null;
  }
  function pausar() {
    if (!tocando) return;
    const voz = cfg.voz || '';
    tocando = false; pausado = true;
    if (voz.startsWith('piper:') && ctx && fonte) { ctx.suspend(); cancelAnimationFrame(raf); }
    else pararMotores();
    emitir('estado', estado());
  }
  async function continuar() {
    if (tocando || !ativo) return;
    const voz = cfg.voz || '';
    tocando = true;
    if (voz.startsWith('piper:') && ctx && fonte && ctx.state === 'suspended') {
      await ctx.resume();
      pausado = false;
      acompanharPiper(geracao);
    } else {
      const ger = ++geracao;
      pausado = true;
      await falarAtual(ger);
    }
    emitir('estado', estado());
  }
  function parar() {
    pararMotores();
    ativo = false; tocando = false; pausado = false; ultimaPalavra = null;
    if (ctx && ctx.state === 'suspended') ctx.resume();
    clearTimeout(dormirT); dormirAte = 0; dormirFimCap = false;
    emitir('estado', estado());
    emitir('parou');
  }
  async function pular(n) {
    if (!ativo) return;
    const ger = ++geracao;
    pararMotores();
    geracao = ger;
    fi = clamp(fi + n, 0, Math.max(0, frases.length - 1));
    ultimaPalavra = null; pausado = false;
    if (tocando) falarAtual(ger); else { const fr = frases[fi]; if (fr) mostrar(fr.ini, fr.ini); }
  }
  async function ajustar(novo) {
    const antes = { ...cfg };
    cfg = { ...cfg, ...novo };
    prefetch.clear();
    if (ativo && tocando && (antes.voz !== cfg.voz || antes.estilo !== cfg.estilo || antes.vel !== cfg.vel)) {
      const ger = ++geracao;
      pararMotores(); geracao = ger;
      pausado = !!ultimaPalavra;
      falarAtual(ger);
    }
  }
  function dormir(min) {
    clearTimeout(dormirT);
    dormirAte = 0; dormirFimCap = false;
    if (min === 'cap') dormirFimCap = true;
    else if (min > 0) { dormirAte = Date.now() + min * 60000; dormirT = setTimeout(() => { if (tocando) { emitir('dormiu'); parar(); } }, min * 60000 + 500); }
    emitir('estado', estado());
  }
  const estado = () => ({ ativo, tocando, pausado, cap, fi, nfrases: frases.length, voz: cfg.voz, dormirAte, dormirFimCap });

  /* amostra de voz (Perfil): fala uma frase curta ou toca a amostra oficial */
  let audioAmostra = null;
  let amostraGer = 0, fimAmostra = null;
  async function amostra(id, frase) {
    pararAmostra();
    const meu = ++amostraGer;
    const v = await acharVoz(id);
    if (!v) return false;
    const fimDe = (res) => { fimAmostra = res; };
    if (v.motor === 'sistema') {
      const u = new SpeechSynthesisUtterance(frase);
      u.voice = v.voz; u.lang = v.lang;
      const est = ESTILOS.find((e) => e.id === cfg.estilo) || ESTILOS[0];
      u.rate = cfg.vel * est.vel; u.pitch = est.tom;
      return new Promise((r) => { fimDe(r); u.onend = u.onerror = () => r(true); speechSynthesis.speak(u); });
    }
    if (await vozBaixada(v)) {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') await ctx.resume();
      const est = ESTILOS.find((e) => e.id === cfg.estilo) || ESTILOS[0];
      const r = await chamar('falar', { voz: v, texto: falavel(frase, v.lang).txt, opt: { ritmo: 1 / (cfg.vel * est.vel), ruido: est.ruido } });
      if (meu !== amostraGer) return false; // parou enquanto a voz era gerada
      const buf = ctx.createBuffer(1, r.pcm.length, r.sr);
      buf.copyToChannel(r.pcm, 0);
      const s = ctx.createBufferSource();
      s.buffer = buf; s.connect(ctx.destination); s.start();
      audioAmostra = { stop: () => { try { s.stop(); } catch (e) { /* já parou */ } } };
      return new Promise((res) => { fimDe(res); s.onended = () => res(true); });
    }
    if (!v.amostra) return 'baixar';
    const a = audioAmostra = new Audio(v.amostra);
    a.crossOrigin = 'anonymous';
    return new Promise((res) => { fimDe(res); a.onended = () => res(true); a.onerror = () => res(false); a.play().catch(() => res(false)); });
  }
  function pararAmostra() {
    try { if ('speechSynthesis' in window && !ativo) speechSynthesis.cancel(); } catch (e) { /* nada */ }
    if (audioAmostra) { try { audioAmostra.pause ? audioAmostra.pause() : audioAmostra.stop(); } catch (e) { /* nada */ } audioAmostra = null; }
    amostraGer++;
    if (fimAmostra) { const f = fimAmostra; fimAmostra = null; f(false); }
  }

  /* controles da tela de bloqueio e dos fones */
  let midia = {};
  function metadadosMidia() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: midia.titulo || 'LeituCast', artist: midia.autor || '', album: 'LeituCast Ingrid', artwork: midia.capa ? [{ src: midia.capa, sizes: '300x450', type: 'image/jpeg' }] : [] });
      navigator.mediaSession.setActionHandler('play', () => continuar());
      navigator.mediaSession.setActionHandler('pause', () => pausar());
      navigator.mediaSession.setActionHandler('previoustrack', () => pular(-1));
      navigator.mediaSession.setActionHandler('nexttrack', () => pular(1));
      navigator.mediaSession.setActionHandler('stop', () => parar());
    } catch (e) { /* navegador sem suporte completo */ }
  }

  /* fala um texto curto (página de historinha) acendendo cada palavra: aoPalavra(índice da palavra).
     Usa a voz escolhida se ela já estiver no aparelho; senão, a melhor voz do sistema. Para com pararAmostra(). */
  async function falarTexto(texto, aoPalavra = () => {}) {
    pararAmostra();
    const meu = ++amostraGer;
    let v = await acharVoz(cfg.voz || await vozPadrao('pt-BR'));
    if (v && v.motor === 'piper' && !(baixadas.has(v.id) || await vozBaixada(v))) {
      // a voz escolhida ainda não está no aparelho: baixa e espera (não troca de voz sozinho)
      if (!baixando.has(v.id)) {
        emitir('baixandoVoz', { nome: v.nome, pct: 0 });
        const pr = baixarVoz(v, (q) => { if (q.parte === 'voz' && q.t) emitir('baixandoVoz', { nome: v.nome, pct: q.n / q.t }); })
          .then(() => { baixadas.add(v.id); emitir('baixandoVoz', { nome: v.nome, pct: 1, fim: true }); })
          .catch((e) => { emitir('baixandoVoz', { nome: v.nome, falhou: true, motivo: e.message }); throw e; })
          .finally(() => baixando.delete(v.id));
        pr.catch(() => null);
        baixando.set(v.id, pr);
      }
      try { await baixando.get(v.id); } catch (e) { return false; }
      if (meu !== amostraGer) return false;
    }
    if (!v) { const { sistema } = await listarVozes('pt-BR'); v = sistema[0] || null; }
    if (!v || meu !== amostraGer) return false;
    const pals = []; const rx = /[\p{L}\p{N}][\p{L}\p{N}'’\-]*/gu; let m;
    while ((m = rx.exec(texto))) pals.push({ i: m.index, f: m.index + m[0].length, peso: m[0].length + 2 + (/[,;:—]/.test(texto[m.index + m[0].length] || '') ? 3 : 0) + (/[.!?…]/.test(texto[m.index + m[0].length] || '') ? 6 : 0) });
    const total = pals.reduce((s, x) => s + x.peso, 0) || 1;
    const est = ESTILOS.find((x) => x.id === cfg.estilo) || ESTILOS[0];
    const acompanhar = (t0, dur) => { let ult = -1; const passo = () => { if (meu !== amostraGer) return; const el = (performance.now() - t0) / 1000; let alvo = (el / dur) * total, acc = 0; for (let k = 0; k < pals.length; k++) { acc += pals[k].peso; if (acc >= alvo) { if (k !== ult) { ult = k; aoPalavra(k); } break; } } if (el < dur + 0.2) requestAnimationFrame(passo); }; requestAnimationFrame(passo); };
    if (v.motor === 'sistema') {
      const fal = falavel(texto, 'pt-BR');
      const u = new SpeechSynthesisUtterance(fal.txt);
      u.voice = v.voz; u.lang = v.lang; u.rate = clamp(cfg.vel * est.vel * 0.92, 0.5, 2); u.pitch = clamp(est.tom * 1.04, 0.5, 1.6);
      let limites = false;
      u.onboundary = (e) => { if (meu !== amostraGer || (e.name && e.name !== 'word')) return; limites = true; const g = fal.mapa ? fal.mapa[Math.min(e.charIndex, fal.mapa.length - 1)] : e.charIndex; const k = pals.findIndex((x) => x.i <= g && x.f > g); if (k >= 0) aoPalavra(k); };
      return new Promise((res) => {
        fimAmostra = res;
        u.onstart = () => { aoPalavra(0); setTimeout(() => { if (!limites && meu === amostraGer) acompanhar(performance.now() - 650, fal.txt.length / (cps * u.rate)); }, 650); };
        u.onend = u.onerror = () => res(meu === amostraGer);
        speechSynthesis.speak(u);
      });
    }
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') await ctx.resume();
    const r = await chamar('falar', { voz: v, texto: falavel(texto, 'pt-BR').txt, opt: { ritmo: 1 / (cfg.vel * est.vel * 0.94), ruido: est.ruido } });
    if (meu !== amostraGer) return false;
    const buf = ctx.createBuffer(1, r.pcm.length, r.sr);
    buf.copyToChannel(r.pcm, 0);
    const s = ctx.createBufferSource();
    s.buffer = buf; s.connect(ctx.destination);
    const t0 = ctx.currentTime + 0.03;
    s.start(t0);
    audioAmostra = { stop: () => { try { s.stop(); } catch (e) { /* já parou */ } } };
    acompanhar(performance.now() + 30, buf.duration * 0.97);
    return new Promise((res) => { fimAmostra = res; s.onended = () => res(meu === amostraGer); });
  }

  return {
    VOZES_ABERTAS, ESTILOS, listarVozes, vozPadrao, acharVoz, vozBaixada, baixarVoz, removerVoz, falarTexto,
    tocar, pausar, continuar, parar, pular, ajustar, dormir, amostra, pararAmostra, on, segmentar, _falavel: falavel,
    definirMidia: (m) => { midia = m; },
    get estado() { return estado(); }, get cfg() { return { ...cfg }; },
    configurar: (c, fns) => {
      // livro novo: para a narração anterior e esquece o texto dele (senão o capítulo 1 do livro antigo seria lido)
      if (c.livro && c.livro !== livroAtual) { if (ativo) parar(); livroAtual = c.livro; cap = -1; txt = ''; frases = []; fi = 0; ultimaPalavra = null; prefetch.clear(); }
      cfg = { ...cfg, ...c }; ouvintes.texto = [fns.texto]; ouvintes.ncaps = [fns.ncaps];
    },
  };
})();
