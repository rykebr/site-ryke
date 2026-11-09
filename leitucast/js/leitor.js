/* Leitor do LeituCast Ingrid.
   Paginação por colunas CSS (cada página é uma "janela" sobre o capítulo), virada de página em 3D
   com sombra e arrasto pelo dedo, duas páginas lado a lado em telas largas, textura de papel, brilho
   e luz quente, marcadores, destaques, busca no livro e progresso com tempo restante. */
'use strict';
const Leitor = (() => {
  const GAP = 48;
  let L = null, info = null, raiz = null, ops = {};
  let cfg = null;
  let geo = null;
  let pos = { c: 0, col: 0 };
  const cols = [];
  const tpl = [];
  const tamCap = [];
  let charsPorPagina = 1500;
  let pg = {};
  let animando = false, fila = null, animandoDesde = 0;
  /* a trava de animação nunca fica presa: se passar de 2,5 s (toque que o navegador "engoliu"), solta sozinha */
  function travar() { animando = true; animandoDesde = performance.now(); }
  function destravarSePreso() {
    if (animando && performance.now() - animandoDesde > 2500) { animando = false; try { encerrarFolha(); pintarAtual(); } catch (e) { /* nada */ } }
  }
  async function esperarAnimacao(max = 1600) {
    const t0 = performance.now();
    while (animando && performance.now() - t0 < max) await sleep(40);
    destravarSePreso();
  }
  let medindo = 0;
  let paginaDesde = Date.now();
  let ppm = 230;
  let assinatura = '';
  let marcas = [];
  let marcadores = [];
  let aoMudar = () => {};

  const ppv = () => (geo && geo.duas ? 2 : 1);
  const inicioSpread = (col) => (ppv() === 2 ? col - (col % 2) : col);
  const ultimaPagina = (c) => inicioSpread(Math.max(0, (cols[c] || 1) - 1));

  /* ================= construção ================= */
  function criarPagina(cls) {
    const d = document.createElement('div');
    d.className = 'pg ' + cls;
    d.innerHTML = '<div class="pg-cab"></div><div class="pg-janela"><div class="pg-marcas"><div class="mk-palavra"></div></div><div class="pg-fluxo"></div></div><div class="pg-num"></div><div class="pg-fita" hidden></div>';
    d.fluxo = d.querySelector('.pg-fluxo');
    d.janela = d.querySelector('.pg-janela');
    d.marcasEl = d.querySelector('.pg-marcas');
    d.palavra = d.querySelector('.mk-palavra');
    d.cap = -1;
    return d;
  }
  function montar() {
    raiz.innerHTML = `
      <div class="lt-palco" id="ltPalco">
        <div class="lt-livro" id="ltLivro">
          <div class="lt-borda-paginas"></div>
          <div class="lt-folha" id="ltFolha" hidden><div class="lt-face lt-frente"><div class="lt-tom"></div></div><div class="lt-face lt-verso"><div class="lt-tom"></div></div><div class="lt-luz"></div></div>
          <div class="lt-sombra" id="ltSombra" hidden></div>
          <div class="lt-lombada"></div>
        </div>
        <div class="lt-medida" aria-hidden="true"></div>
      </div>
      <div class="lt-filtro lt-escuro" id="ltEscuro"></div>
      <div class="lt-filtro lt-quente" id="ltQuente"></div>`;
    const livro = $('#ltLivro', raiz);
    pg = { E: criarPagina('pg-e'), D: criarPagina('pg-d'), S: criarPagina('pg-s'), F: criarPagina('pg-face'), V: criarPagina('pg-face pg-verso'), M: criarPagina('pg-m') };
    livro.prepend(pg.S); livro.prepend(pg.D); livro.prepend(pg.E);
    $('.lt-frente', raiz).appendChild(pg.F);
    $('.lt-verso', raiz).appendChild(pg.V);
    $('.lt-medida', raiz).appendChild(pg.M);
    pg.S.hidden = true;
    ligarGestos();
  }

  /* ================= ajustes visuais ================= */
  const FONTES = {
    literata: "'Literata', Georgia, serif", lora: "'Lora', Georgia, serif", atkinson: "'Atkinson Hyperlegible', Verdana, sans-serif",
    fraunces: "'Fraunces', Georgia, serif", manrope: "'Manrope', 'Segoe UI', sans-serif", georgia: "Georgia, 'Times New Roman', serif",
  };
  const MARGENS = { estreita: 18, media: 30, larga: 46 };
  function aplicarVisual() {
    const s = raiz.style;
    s.setProperty('--lt-fonte', FONTES[cfg.fonte] || FONTES.literata);
    s.setProperty('--lt-tam', cfg.tam + 'px');
    s.setProperty('--lt-entre', cfg.entre);
    s.setProperty('--lt-alinha', cfg.alinha === 'esquerda' ? 'left' : 'justify');
    const sec = raiz.closest('.leitor') || raiz;
    sec.dataset.tema = cfg.tema;
    sec.dataset.textura = cfg.textura ? 'sim' : 'nao';
    sec.dataset.virar = cfg.virar;
    $('#ltEscuro', raiz).style.opacity = String(clamp((100 - cfg.brilho) / 100, 0, 0.75));
    $('#ltQuente', raiz).style.opacity = String(clamp(cfg.quente / 100, 0, 1) * 0.55);
  }
  function calcularGeo() {
    const palco = $('#ltPalco', raiz);
    const w = palco.clientWidth, h = palco.clientHeight;
    const celular = w < 600;
    const padX = celular ? 10 : 28, padY = celular ? 8 : 20;
    const H = Math.max(260, h - padY * 2);
    const larga = w >= 900 && w / h > 1.15;
    const duas = cfg.duas === 'duas' ? w >= 700 : cfg.duas === 'uma' ? false : larga;
    let W = duas ? Math.min((w - padX * 2) / 2, H * 0.76, 660) : Math.min(w - padX * 2, celular ? 9999 : Math.min(760, H * 0.82));
    W = Math.floor(W);
    const mx = Math.round(Math.min(MARGENS[cfg.margem] || 30, W * 0.11));
    const mt = celular ? 38 : 46, mb = celular ? 40 : 48;
    const cw = W - mx * 2;
    const linha = cfg.tam * cfg.entre;
    const ch = Math.max(linha * 4, Math.floor((H - mt - mb) / linha) * linha);
    geo = { W, H, mx, mt, mb, cw, ch: Math.floor(ch), duas, celular };
    const livro = $('#ltLivro', raiz);
    livro.style.width = (duas ? W * 2 : W) + 'px';
    livro.style.height = H + 'px';
    livro.classList.toggle('duas', duas);
    raiz.style.setProperty('--pg-w', W + 'px');
    raiz.style.setProperty('--pg-h', H + 'px');
    raiz.style.setProperty('--pg-mx', mx + 'px');
    raiz.style.setProperty('--pg-mt', mt + 'px');
    raiz.style.setProperty('--pg-cw', cw + 'px');
    raiz.style.setProperty('--pg-ch', geo.ch + 'px');
    raiz.style.setProperty('--pg-gap', GAP + 'px');
    pg.E.hidden = !duas;
    const nova = [cfg.fonte, cfg.tam, cfg.entre, cfg.margem, cfg.alinha, W, H, duas].join('|');
    const mudou = nova !== assinatura;
    assinatura = nova;
    return mudou;
  }

  /* ================= capítulos ================= */
  async function garantirTpl(c) {
    if (tpl[c]) return tpl[c];
    const d = document.createElement('div');
    d.innerHTML = L.caps[c].html;
    for (const im of d.querySelectorAll('img[data-lc]')) {
      try { im.src = await L.img(im.dataset.lc); } catch (e) { im.remove(); }
      im.loading = 'eager';
      im.decoding = 'sync';
    }
    for (const a of d.querySelectorAll('a[href]')) a.setAttribute('tabindex', '-1');
    aplicarMarcasNoTpl(d, c);
    tpl[c] = d;
    tamCap[c] = d.textContent.length;
    return d;
  }
  function textoNos(root) {
    const out = [];
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n, ini = 0;
    while ((n = w.nextNode())) { out.push({ n, ini }); ini += n.nodeValue.length; }
    out.total = ini;
    return out;
  }
  function mapaDe(p) {
    if (!p._mapa || p._mapaCap !== p.cap) { p._mapa = textoNos(p.fluxo); p._mapaCap = p.cap; }
    return p._mapa;
  }
  function localizar(mapa, o) {
    let a = 0, b = mapa.length - 1;
    while (a < b) { const m = (a + b + 1) >> 1; if (mapa[m].ini <= o) a = m; else b = m - 1; }
    const it = mapa[a];
    if (!it) return null;
    return { n: it.n, off: clamp(o - it.ini, 0, it.n.nodeValue.length) };
  }
  function faixa(p, ini, fim) {
    const mapa = mapaDe(p);
    const a = localizar(mapa, ini), b = localizar(mapa, Math.max(ini, fim));
    if (!a || !b) return null;
    const r = document.createRange();
    r.setStart(a.n, a.off);
    r.setEnd(b.n, b.off);
    return r;
  }
  async function mostrarCap(p, c) {
    if (p.cap === c) return;
    const t = await garantirTpl(c);
    p.fluxo.replaceChildren(...Array.from(t.cloneNode(true).childNodes));
    p.cap = c;
    p._mapa = null;
  }
  async function esperarImagens(p) {
    const ims = Array.from(p.fluxo.querySelectorAll('img'));
    await Promise.all(ims.map((im) => (im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 2500); }))));
  }
  async function medir(c) {
    if (cols[c]) return cols[c];
    const m = pg.M;
    await mostrarCap(m, c);
    m.fluxo.style.transform = 'none';
    await esperarImagens(m);
    const passo = geo.cw + GAP;
    let n = Math.round((m.fluxo.scrollWidth + GAP) / passo);
    const r = document.createRange();
    r.selectNodeContents(m.fluxo);
    const base = m.fluxo.getBoundingClientRect().left;
    let dir = 0;
    for (const q of r.getClientRects()) if (q.width) dir = Math.max(dir, q.right - base);
    n = Math.max(1, n, Math.ceil((dir - 1) / passo));
    cols[c] = n;
    if (tamCap[c]) charsPorPagina = charsPorPagina * 0.7 + (tamCap[c] / n) * 0.3;
    return n;
  }
  async function medirTudo() {
    const meu = ++medindo;
    for (let c = 0; L && c < L.caps.length; c++) {
      if (meu !== medindo || !L) return;
      if (!cols[c]) { await medir(c); await sleep(16); }
    }
    if (meu === medindo) atualizarRodape();
  }

  /* ================= páginas ================= */
  function nomePagina(c, col) {
    let n = 0;
    for (let i = 0; i < c; i++) n += cols[i] || Math.max(1, Math.ceil((tamCap[i] || L.tamTexto[i] || 1) / charsPorPagina));
    return n + col + 1;
  }
  function totalPaginas() {
    let n = 0;
    for (let i = 0; i < L.caps.length; i++) n += cols[i] || Math.max(1, Math.ceil((tamCap[i] || L.tamTexto[i] || 1) / charsPorPagina));
    return n;
  }
  async function pintar(p, ref) {
    p.classList.toggle('vazia', !ref);
    p.querySelector('.pg-fita').hidden = true;
    if (!ref || ref.col >= (cols[ref.c] || 1)) {
      p.fluxo.replaceChildren(); p.cap = -1;
      p.querySelector('.pg-num').textContent = '';
      p.querySelector('.pg-cab').textContent = '';
      p.classList.add('vazia');
      p.ref = null;
      return;
    }
    await mostrarCap(p, ref.c);
    p.fluxo.style.transform = `translateX(${-ref.col * (geo.cw + GAP)}px)`;
    p.ref = { c: ref.c, col: ref.col };
    p.querySelector('.pg-num').textContent = nomePagina(ref.c, ref.col);
    p.querySelector('.pg-cab').textContent = ref.col === 0 ? '' : (L.caps[ref.c].titulo || info.t || '').slice(0, 60);
    p.palavra.style.opacity = '0';
    p.marcasEl.querySelectorAll('.mk-frase').forEach((x) => x.remove());
    const fita = marcadorNaPagina(ref);
    p.querySelector('.pg-fita').hidden = !fita;
  }
  async function pintarAtual() {
    if (geo.duas) {
      await pintar(pg.E, { c: pos.c, col: pos.col });
      await pintar(pg.D, pos.col + 1 < cols[pos.c] ? { c: pos.c, col: pos.col + 1 } : null);
    } else await pintar(pg.D, { c: pos.c, col: pos.col });
    pg.D.classList.remove('escondida'); pg.E.classList.remove('escondida');
    atualizarRodape();
  }
  async function alvoFrente() {
    const n = ppv();
    if (pos.col + n < cols[pos.c]) return { c: pos.c, col: pos.col + n };
    if (pos.c + 1 < L.caps.length) { await medir(pos.c + 1); return { c: pos.c + 1, col: 0 }; }
    return null;
  }
  async function alvoTras() {
    const n = ppv();
    if (pos.col - n >= 0) return { c: pos.c, col: pos.col - n };
    if (pos.col > 0) return { c: pos.c, col: 0 };
    if (pos.c > 0) { await medir(pos.c - 1); return { c: pos.c - 1, col: ultimaPagina(pos.c - 1) }; }
    return null;
  }

  /* ================= virada de página ================= */
  const easing = (t) => 1 - Math.pow(1 - t, 3);
  const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  /* a cada quadro só mudam transform e opacity (feitos pela placa de vídeo, sem redesenhar o texto) */
  let fx = null;
  function ajustarFolha(ang, dir) {
    if (!fx || !fx.folha.isConnected) fx = { folha: $('#ltFolha', raiz), sombra: $('#ltSombra', raiz), tons: $$('.lt-tom', raiz) };
    fx.folha.style.transform = `rotateY(${ang.toFixed(2)}deg)`;
    const k = Math.sin((Math.abs(ang) * Math.PI) / 180).toFixed(3);
    const p = Math.abs(ang) / 180;
    for (const t of fx.tons) t.style.opacity = k;
    fx.sombra.style.opacity = k;
    fx.sombra.style.transform = `scaleX(${(0.3 + p * 0.5).toFixed(3)})`;
  }
  async function prepararFolha(dir, alvo) {
    const folha = $('#ltFolha', raiz), sombra = $('#ltSombra', raiz);
    folha.classList.toggle('duas', geo.duas);
    if (geo.duas) {
      if (dir > 0) {
        await pintar(pg.S, alvo.col + 1 < cols[alvo.c] ? { c: alvo.c, col: alvo.col + 1 } : null);
        pg.S.dataset.slot = 'D';
        await pintar(pg.F, pos.col + 1 < cols[pos.c] ? { c: pos.c, col: pos.col + 1 } : null);
        await pintar(pg.V, { c: alvo.c, col: alvo.col });
        pg.D.classList.add('escondida');
      } else {
        await pintar(pg.S, { c: alvo.c, col: alvo.col });
        pg.S.dataset.slot = 'E';
        await pintar(pg.F, alvo.col + 1 < cols[alvo.c] ? { c: alvo.c, col: alvo.col + 1 } : null);
        await pintar(pg.V, { c: pos.c, col: pos.col });
        pg.E.classList.add('escondida');
      }
    } else {
      if (dir > 0) { await pintar(pg.S, alvo); await pintar(pg.F, pos); }
      else { await pintar(pg.S, pos); await pintar(pg.F, alvo); }
      await pintar(pg.V, null);
      pg.V.classList.add('verso-papel');
      pg.S.dataset.slot = 'D';
      pg.D.classList.add('escondida');
    }
    pg.S.hidden = false;
    folha.hidden = false;
    sombra.hidden = false;
    sombra.dataset.dir = dir > 0 ? 'f' : 't';
    ajustarFolha(dir > 0 ? 0 : -180, dir);
  }
  function encerrarFolha() {
    $('#ltFolha', raiz).hidden = true;
    $('#ltSombra', raiz).hidden = true;
    pg.S.hidden = true;
    pg.V.classList.remove('verso-papel');
  }
  function animar(de, ate, ms, dir, curva = easing) {
    return new Promise((res) => {
      const t0 = performance.now();
      const passo = (t) => {
        const k = clamp((t - t0) / ms, 0, 1);
        ajustarFolha(de + (ate - de) * curva(k), dir);
        if (k < 1) requestAnimationFrame(passo); else res();
      };
      requestAnimationFrame(passo);
    });
  }
  async function virar(dir, alvoForcado, rapido) {
    if (!L) return false;
    destravarSePreso();
    if (animando) { fila = dir; return false; }
    const alvo = alvoForcado || (dir > 0 ? await alvoFrente() : await alvoTras());
    if (!alvo) { if (dir > 0) ops.aoFim && ops.aoFim(); return false; }
    registrarTempo();
    travar();
    try {
      const modo = matchMedia('(prefers-reduced-motion: reduce)').matches && cfg.virar === 'folha' ? 'deslizar' : cfg.virar;
      if (modo === 'folha' && !rapido) {
        await prepararFolha(dir, alvo);
        await animar(dir > 0 ? 0 : -180, dir > 0 ? -180 : 0, geo.celular ? 560 : 680, dir, suave);
        pos = { c: alvo.c, col: alvo.col };
        await pintarAtual();
        encerrarFolha();
      } else if (modo === 'deslizar' && !rapido) {
        pos = { c: alvo.c, col: alvo.col };
        await pintarAtual();
        const livro = $('#ltLivro', raiz);
        livro.classList.remove('entra-f', 'entra-t');
        void livro.offsetWidth;
        livro.classList.add(dir > 0 ? 'entra-f' : 'entra-t');
      } else {
        pos = { c: alvo.c, col: alvo.col };
        await pintarAtual();
      }
    } finally {
      animando = false;
    }
    salvarPosicao();
    if (fila !== null) { const d = fila; fila = null; virar(d); }
    return true;
  }

  /* ---------- gestos ---------- */
  function ligarGestos() {
    const palco = $('#ltPalco', raiz);
    let g = null, toque = 0;
    palco.addEventListener('pointerdown', (e) => {
      destravarSePreso();
      if (e.button > 0 || animando) return;
      if (e.target.closest('a,button,.lt-menu-sel')) return;
      g = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, arrastando: false, dir: 0, alvo: null, pronto: null };
      toque = setTimeout(() => { if (g && !g.arrastando) g.longo = true; }, 480);
    });
    palco.addEventListener('pointermove', (e) => {
      if (!g || e.pointerId !== g.id || g.longo) return;
      const dx = e.clientX - g.x, dy = e.clientY - g.y;
      g.dx = dx;
      if (!g.arrastando) {
        if (Math.abs(dx) < 12 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
        if (window.getSelection && String(getSelection()).length) return;
        clearTimeout(toque);
        g.arrastando = true;
        g.dir = dx < 0 ? 1 : -1;
        try { palco.setPointerCapture(e.pointerId); } catch (er) { /* sem captura */ }
        if (cfg.virar === 'folha') {
          travar();
          g.pronto = (g.dir > 0 ? alvoFrente() : alvoTras()).then(async (alvo) => {
            g.alvo = alvo;
            if (alvo) {
              await prepararFolha(g.dir, alvo);
              const p0 = clamp(Math.abs(g.dx || 0) / (geo.W * 0.95), 0, 1);
              g.p = p0;
              ajustarFolha(g.dir > 0 ? -180 * p0 : -180 * (1 - p0), g.dir);
            } else animando = false;
          });
        }
      }
      if (g.arrastando && cfg.virar === 'folha' && g.alvo) {
        const p = clamp(Math.abs(dx) / (geo.W * 0.95), 0, 1);
        if ((g.dir > 0 && dx > 0) || (g.dir < 0 && dx < 0)) return;
        g.p = p;
        ajustarFolha(g.dir > 0 ? -180 * p : -180 * (1 - p), g.dir);
      }
    });
    const solta = async (e) => {
      clearTimeout(toque);
      if (!g || (e.pointerId !== undefined && e.pointerId !== g.id)) return;
      const gg = g; g = null;
      const dt = performance.now() - gg.t;
      const dx = e.clientX - gg.x;
      if (gg.longo) return;
      if (!gg.arrastando) {
        if (dt < 450 && Math.abs(dx) < 10) tocar(e);
        return;
      }
      if (cfg.virar !== 'folha') { if (Math.abs(dx) > 40) virar(gg.dir); return; }
      await gg.pronto;
      if (!gg.alvo) { animando = false; return; }
      const v = Math.abs(dx) / Math.max(dt, 1);
      const p = ((gg.dir > 0 && dx < 0) || (gg.dir < 0 && dx > 0)) ? clamp(Math.abs(dx) / (geo.W * 0.95), 0, 1) : 0;
      const completa = p > 0.3 || v > 0.45;
      const angAgora = gg.dir > 0 ? -180 * p : -180 * (1 - p);
      registrarTempo();
      if (completa) {
        await animar(angAgora, gg.dir > 0 ? -180 : 0, 300 * (1 - p) + 120, gg.dir);
        pos = { c: gg.alvo.c, col: gg.alvo.col };
        await pintarAtual();
        salvarPosicao();
      } else {
        await animar(angAgora, gg.dir > 0 ? 0 : -180, 260, gg.dir);
        await pintarAtual();
      }
      encerrarFolha();
      animando = false;
    };
    palco.addEventListener('pointerup', solta);
    palco.addEventListener('pointercancel', solta);
    palco.addEventListener('lostpointercapture', (e) => { if (g && g.arrastando) solta(e); });
    palco.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) < 8 && Math.abs(e.deltaX) < 8) return;
      e.preventDefault();
      const agora = Date.now();
      if (agora - (palco._roda || 0) < 420) return;
      palco._roda = agora;
      virar((e.deltaY || e.deltaX) > 0 ? 1 : -1);
    }, { passive: false });
    palco.addEventListener('click', (e) => {
      const a = e.target.closest('a[data-ir]');
      if (a) { e.preventDefault(); irParaAlvo(a.dataset.ir); }
    });
  }
  function tocar(e) {
    if (String(getSelection && getSelection()).length) return;
    const palco = $('#ltPalco', raiz);
    const r = palco.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    if (ops.aoTocarTexto && ops.aoTocarTexto(e)) return;
    if (x < 0.28) virar(-1);
    else if (x > 0.72) virar(1);
    else ops.aoMeio && ops.aoMeio();
  }
  function teclas(e) {
    if (!L || /input|textarea|select/i.test((e.target && e.target.tagName) || '')) return;
    if (['ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); virar(1); }
    else if (['ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); virar(-1); }
  }

  /* ================= posição, progresso e tempo ================= */
  function paginaVisivel(col) { return geo.duas && col === pos.col + 1 ? pg.D : geo.duas ? pg.E : pg.D; }
  function offsetDoInicio(p) {
    if (!p || !p.ref) return 0;
    const mapa = mapaDe(p);
    if (!mapa.length) return 0;
    const jr = p.janela.getBoundingClientRect();
    const dentro = (rect) => rect && rect.width + rect.height > 0 && rect.left >= jr.left - 2 && rect.left < jr.right - 1;
    const depois = (rect) => rect && rect.left >= jr.left - 2;
    const rectDe = (n, off) => { const r = document.createRange(); r.setStart(n, off); r.setEnd(n, Math.min(n.nodeValue.length, off + 1)); const q = r.getClientRects(); return q[0] || r.getBoundingClientRect(); };
    let a = 0, b = mapa.length - 1, achou = -1;
    while (a <= b) {
      const m = (a + b) >> 1;
      // nós só com espaço não têm posição na tela: usa o próximo nó com texto (antes eles puxavam a busca
      // para o começo do capítulo, e a narração e o progresso saíam do lugar errado)
      let k = m;
      while (k <= b && !mapa[k].n.nodeValue.trim()) k++;
      if (k > b) { b = m - 1; continue; }
      const rr = document.createRange(); rr.selectNodeContents(mapa[k].n);
      const rs = rr.getClientRects();
      const ult = rs[rs.length - 1];
      if (!ult || ult.right <= jr.left + 1) a = k + 1; else { achou = k; b = m - 1; }
    }
    if (achou < 0) return 0;
    const n = mapa[achou].n;
    let lo = 0, hi = n.nodeValue.length - 1, off = 0;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (depois(rectDe(n, m))) { off = m; hi = m - 1; } else lo = m + 1;
    }
    if (!dentro(rectDe(n, off)) && achou + 1 < mapa.length) return mapa[achou + 1].ini;
    return mapa[achou].ini + off;
  }
  async function colunaDoOffset(c, o) {
    await medir(c);
    const m = pg.M;
    await mostrarCap(m, c);
    m.fluxo.style.transform = 'none';
    const r = faixa(m, o, o + 1);
    if (!r) return 0;
    const q = r.getClientRects()[0] || r.getBoundingClientRect();
    const base = m.fluxo.getBoundingClientRect().left;
    return clamp(Math.floor((q.left - base + 2) / (geo.cw + GAP)), 0, cols[c] - 1);
  }
  function pctAtual() {
    const total = L.tamTexto.reduce((s, x) => s + x, 0) || 1;
    let antes = 0;
    for (let i = 0; i < pos.c; i++) antes += L.tamTexto[i];
    const noCap = cols[pos.c] ? (pos.col / cols[pos.c]) * L.tamTexto[pos.c] : 0;
    const fimDaVista = cols[pos.c] && pos.col + ppv() >= cols[pos.c] && pos.c === L.caps.length - 1;
    return fimDaVista ? 1 : clamp((antes + noCap) / total, 0, 1);
  }
  function registrarTempo() {
    const seg = (Date.now() - paginaDesde) / 1000;
    paginaDesde = Date.now();
    if (seg < 3 || seg > 600) return;
    const palavrasVistas = (charsPorPagina * ppv()) / 5.8;
    const taxa = palavrasVistas / (seg / 60);
    if (taxa > 60 && taxa < 900) ppm = ppm * 0.85 + taxa * 0.15;
    ops.aoTempo && ops.aoTempo(Math.min(seg, 300), ppm);
  }
  function restante() {
    const totalChars = L.tamTexto.reduce((s, x) => s + x, 0);
    const lidos = pctAtual() * totalChars;
    const minLivro = (totalChars - lidos) / 5.8 / ppm;
    const capChars = L.tamTexto[pos.c] || 0;
    const capLidos = cols[pos.c] ? ((pos.col + ppv()) / cols[pos.c]) * capChars : 0;
    const minCap = Math.max(0, capChars - capLidos) / 5.8 / ppm;
    return { minLivro, minCap };
  }
  function atualizarRodape() {
    if (!L) return;
    const tot = totalPaginas();
    const pag = nomePagina(pos.c, pos.col);
    const pct = pctAtual();
    const r = restante();
    aoMudar({ pag, tot, pct, minLivro: r.minLivro, minCap: r.minCap, cap: L.caps[pos.c].titulo, c: pos.c, ncaps: L.caps.length, marcado: !!marcadorNaPagina(pos), medindoTudo: cols.filter(Boolean).length < L.caps.length });
  }
  let salvarT = 0;
  function salvarPosicao() {
    clearTimeout(salvarT);
    salvarT = setTimeout(() => {
      if (!L) return;
      const o = offsetDoInicio(paginaVisivel(pos.col));
      ops.aoSalvar && ops.aoSalvar({ c: pos.c, o, pct: pctAtual(), pag: nomePagina(pos.c, pos.col), tot: totalPaginas(), ppm: Math.round(ppm) });
    }, 350);
    atualizarRodape();
  }

  /* ================= navegação direta ================= */
  async function irPara(c, o = 0, { animar = false } = {}) {
    c = clamp(c, 0, L.caps.length - 1);
    await medir(c);
    const col = inicioSpread(o ? await colunaDoOffset(c, o) : 0);
    if (c === pos.c && col === pos.col) return;
    const dir = c > pos.c || (c === pos.c && col > pos.col) ? 1 : -1;
    const vizinha = (c === pos.c && Math.abs(col - pos.col) === ppv()) || (c === pos.c + 1 && col === 0 && pos.col + ppv() >= cols[pos.c]);
    if (animar && vizinha) return virar(dir, { c, col });
    pos = { c, col };
    await pintarAtual();
    salvarPosicao();
  }
  function irParaAlvo(alvo) {
    const [p, frag] = String(alvo).split('#');
    let c = L.caps.findIndex((x) => x.path === p && (!frag || x.ids.includes(frag)));
    if (c < 0) c = L.caps.findIndex((x) => x.path === p);
    if (c < 0) return;
    if (!frag) return irPara(c, 0);
    garantirTpl(c).then((t) => {
      const el = t.querySelector(`[data-id="${CSS.escape(frag)}"]`);
      if (!el) return irPara(c, 0);
      const mapa = textoNos(t);
      const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const n1 = w.nextNode();
      const it = n1 && mapa.find((x) => x.n === n1);
      irPara(c, it ? it.ini : 0);
    });
  }
  async function irParaPct(pct) {
    const total = L.tamTexto.reduce((s, x) => s + x, 0);
    let alvo = pct * total, c = 0;
    while (c < L.caps.length - 1 && alvo > L.tamTexto[c]) { alvo -= L.tamTexto[c]; c++; }
    await garantirTpl(c);
    const ajustado = Math.round((alvo / (L.tamTexto[c] || 1)) * (tamCap[c] || 1));
    return irPara(c, ajustado);
  }

  /* ================= marcadores de página ================= */
  function faixaDaPagina(ref) {
    // offsets aproximados de início e fim da página (pelo número de colunas)
    const t = tamCap[ref.c] || L.tamTexto[ref.c] || 0;
    const n = cols[ref.c] || 1;
    return [Math.floor((ref.col / n) * t), Math.floor(((ref.col + ppv()) / n) * t)];
  }
  function marcadorNaPagina(ref) {
    if (!ref || !marcadores.length) return null;
    const [a, b] = faixaDaPagina(ref);
    return marcadores.find((m) => m.c === ref.c && m.o >= a && m.o < b) || null;
  }
  function alternarMarcador() {
    const m = marcadorNaPagina(pos);
    if (m) marcadores.splice(marcadores.indexOf(m), 1);
    else {
      const p = paginaVisivel(pos.col);
      const o = offsetDoInicio(p);
      const txt = (tpl[pos.c] ? textoNos(tpl[pos.c]).map((x) => x.n.nodeValue).join('').slice(o, o + 120) : '').replace(/\s+/g, ' ').trim();
      marcadores.push({ c: pos.c, o, pct: Math.round(pctAtual() * 1000) / 10, pag: nomePagina(pos.c, pos.col), txt, cap: L.caps[pos.c].titulo, ts: Date.now() });
      marcadores.sort((x, y) => x.c - y.c || x.o - y.o);
    }
    ops.aoMarcadores && ops.aoMarcadores(marcadores.slice());
    pintarAtual();
    return !m;
  }

  /* ================= destaques (marca-texto) ================= */
  function envolver(root, ini, fim, attrs) {
    const mapa = textoNos(root);
    for (const { n, ini: s } of mapa) {
      const e = s + n.nodeValue.length;
      if (e <= ini || s >= fim) continue;
      const a = Math.max(0, ini - s), b = Math.min(n.nodeValue.length, fim - s);
      if (b <= a) continue;
      let alvo = n;
      if (a > 0) alvo = alvo.splitText(a);
      if (b - a < alvo.nodeValue.length) alvo.splitText(b - a);
      const mk = document.createElement('mark');
      for (const [k, v] of Object.entries(attrs)) mk.setAttribute(k, v);
      alvo.parentNode.insertBefore(mk, alvo);
      mk.appendChild(alvo);
    }
  }
  function aplicarMarcasNoTpl(d, c) {
    marcas.forEach((m, i) => { if (m.c === c) envolver(d, m.i, m.f, { class: 'mk mk-' + (m.cor || 'amarelo') + (m.nota ? ' mk-nota' : ''), 'data-m': String(i) }); });
  }
  function selecaoAtual() {
    const s = getSelection();
    if (!s || s.isCollapsed || !s.rangeCount) return null;
    const r = s.getRangeAt(0);
    const p = [pg.E, pg.D].find((x) => x.fluxo.contains(r.startContainer));
    if (!p || !p.ref) return null;
    const mapa = mapaDe(p);
    const achar = (node, off) => { const it = mapa.find((x) => x.n === node); return it ? it.ini + off : null; };
    let i = r.startContainer.nodeType === 3 ? achar(r.startContainer, r.startOffset) : null;
    let f = r.endContainer.nodeType === 3 ? achar(r.endContainer, r.endOffset) : null;
    if (i == null || f == null || f <= i) return null;
    return { c: p.ref.c, i, f, txt: String(s).trim(), rect: r.getBoundingClientRect() };
  }
  function destacar(sel, cor = 'amarelo', nota = '') {
    marcas.push({ c: sel.c, i: sel.i, f: sel.f, cor, nota, txt: sel.txt.slice(0, 600), cap: L.caps[sel.c].titulo, ts: Date.now() });
    delete tpl[sel.c];
    [pg.E, pg.D, pg.M].forEach((p) => { if (p.cap === sel.c) p.cap = -1; });
    getSelection().removeAllRanges();
    ops.aoMarcas && ops.aoMarcas(marcas.slice());
    return pintarAtual();
  }
  function removerMarca(i) {
    const m = marcas[i];
    if (!m) return;
    marcas.splice(i, 1);
    delete tpl[m.c];
    [pg.E, pg.D, pg.M].forEach((p) => { if (p.cap === m.c) p.cap = -1; });
    ops.aoMarcas && ops.aoMarcas(marcas.slice());
    pintarAtual();
  }

  /* ================= destaque da narração ================= */
  async function textoCapitulo(c) {
    const t = await garantirTpl(c);
    const mapa = textoNos(t);
    const txt = mapa.map((x) => x.n.nodeValue).join('');
    // inícios de bloco (parágrafos) para a separação de frases
    const blocos = [];
    let ultimoBloco = null;
    for (const { n, ini } of mapa) {
      let b = n.parentElement;
      while (b && b !== t && !/^(P|DIV|H[1-6]|LI|BLOCKQUOTE|TD|DT|DD|FIGCAPTION|PRE)$/.test(b.tagName)) b = b.parentElement;
      if (b !== ultimoBloco) { blocos.push(ini); ultimoBloco = b; }
    }
    return { txt, blocos };
  }
  /* ---------- início da história (para "Pular introdução") ----------
     Pula capítulos de abertura (índice, prefácio, introdução, dedicatória, nota do editor, licença) e,
     dentro do capítulo, os blocos de índice e créditos, até o primeiro parágrafo de história de verdade. */
  const FRENTE = /^(capa|cover|title page|titulo|folha de rosto|rosto|sumario|indice|index|contents|table of contents|prefacio|preface|prefacio d[ao] .*|prologo d[oa] (editor|tradutor)|introducao|introduction|nota(s)?( d[oa] (editor|editora|tradutor|tradutora|autor|edicao))?|advertencia|ao leitor|aos leitores|dedicatoria|dedicacao|epigrafe|apresentacao|agradecimentos?|acknowledg.*|foreword|sobre (o|a) (autor|autora|livro|obra)|biografia|cronologia|the project gutenberg.*|project gutenberg.*|copyright|licenca|frontispiece|ilustracoes|list of illustrations|errata|obras d[oa] autor.*|do mesmo autor.*)$/;
  const CREDITO = /project gutenberg|copyright|licen[cs]|todos os direitos|typograph|tipografia|livraria|editores?\b|impressor|imprensa nacional|isbn|erros tipogr|transcri[cç]|transcriber/i;
  const NOTA = /^(nota d[eoa] (editor|editora|tradutor|tradutora|transcri\w*|edicao)|nota de transcricao|nota previa|nota|notas|transcriber s note|prefacio|preface|introducao|introduction|advertencia|dedicatoria|errata)\b/;
  const nt = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
  let inicioCache = null;
  async function inicioDaHistoria() {
    if (!L) return null;
    if (inicioCache && inicioCache.L === L) return inicioCache.r;
    let r = null;
    for (let c = 0; c < Math.min(L.caps.length, 15) && !r; c++) {
      if (L.caps.length > 1 && FRENTE.test(nt(L.caps[c].titulo))) continue;
      const { txt, blocos } = await textoCapitulo(c);
      if (!L) return null; // o livro foi fechado no meio
      if (txt.replace(/\s/g, '').length < 300) continue;
      let pulando = false;
      const bl = blocos.map((ini, k) => ({ ini, b: txt.slice(ini, k + 1 < blocos.length ? blocos[k + 1] : txt.length).trim() })).filter((x) => x.b);
      for (let k = 0; k < bl.length; k++) {
        const { ini, b } = bl[k];
        if (b.length < 90) {
          if (FRENTE.test(nt(b))) pulando = true;
          else if (pulando && /^(capitulo|chapter|parte|part|livro|book|canto|[ivxlcdm]+|\d+)\b/.test(nt(b)) && !(bl[k + 1] && bl[k + 1].b.length < 90 && bl[k + 2] && bl[k + 2].b.length < 90 && /^([ivxlcdm]+|\d+)\b/.test(nt(bl[k + 2].b)))) pulando = false;
          continue;
        }
        if (pulando || CREDITO.test(b) || NOTA.test(nt(b.slice(0, 60)))) continue;
        // antes do primeiro título de capítulo, texto entre aspas é nota ou epígrafe, não a história
        if (/^[«“]/.test(b) && !bl.slice(0, k).some((x) => x.b.length < 40 && /^(capitulo|chapter|[ivxlcdm]+\.?|\d+\.?)$/.test(nt(x.b)))) continue;
        if (b.length >= 160) {
          // inclui até dois títulos curtos logo antes ("I" e "Do título")
          let o = ini;
          // (epígrafes entre aspas ou parênteses não contam como título)
          for (let j = k - 1; j >= Math.max(0, k - 2); j--) { const t = bl[j].b; if (t.length < 90 && !FRENTE.test(nt(t)) && !CREDITO.test(t) && !/^[«"“(\[]|[»"”)\]]\.?$/.test(t)) o = bl[j].ini; else break; }
          r = { c, o };
          break;
        }
      }
    }
    inicioCache = { L, r };
    return r;
  }
  function posicaoAtual() {
    const p = paginaVisivel(pos.col);
    return { c: pos.c, o: offsetDoInicio(p) };
  }
  async function mostrarDestaque(c, ini, fim, frase) {
    if (!L) return;
    // a narração não desiste de virar a página: espera a animação em andamento terminar
    if (animando) await esperarAnimacao();
    if (!L || animando) return;
    let col = await colunaDoOffset(c, ini);
    const visivel = c === pos.c && col >= pos.col && col < pos.col + ppv();
    if (!visivel) {
      const alvo = { c, col: inicioSpread(col) };
      const vizinha = (c === pos.c && alvo.col === pos.col + ppv()) || (c === pos.c + 1 && alvo.col === 0);
      if (vizinha) await virar(1, alvo); else { pos = alvo; await pintarAtual(); salvarPosicao(); }
    }
    const p = paginaVisivel(col);
    if (!p.ref || p.ref.c !== c) return;
    const jr = p.janela.getBoundingClientRect();
    const r = faixa(p, ini, fim);
    if (!r) return;
    const q = Array.from(r.getClientRects()).filter((x) => x.width > 0 && x.left >= jr.left - 2 && x.left < jr.right);
    const w = q[0];
    [pg.E, pg.D].forEach((x) => { if (x !== p) x.palavra.style.opacity = '0'; });
    if (w) {
      const esc_ = geo.W / p.janela.offsetWidth ? 1 : 1;
      p.palavra.style.transform = `translate(${(w.left - jr.left) * esc_ - 3}px, ${(w.top - jr.top) * esc_ - 1}px)`;
      p.palavra.style.width = w.width + 6 + 'px';
      p.palavra.style.height = w.height + 2 + 'px';
      p.palavra.style.opacity = '1';
    }
    if (frase) {
      const chave = c + ':' + frase.ini;
      if (p._frase !== chave) {
        p._frase = chave;
        p.marcasEl.querySelectorAll('.mk-frase').forEach((x) => x.remove());
        const rf = faixa(p, frase.ini, frase.fim);
        if (rf) {
          for (const x of Array.from(rf.getClientRects())) {
            if (x.width < 2 || x.left < jr.left - 2 || x.left >= jr.right) continue;
            const d = document.createElement('div');
            d.className = 'mk-frase';
            d.style.cssText = `transform:translate(${x.left - jr.left - 2}px,${x.top - jr.top}px);width:${x.width + 4}px;height:${x.height}px`;
            p.marcasEl.appendChild(d);
          }
        }
      }
    }
  }
  function limparDestaque() {
    [pg.E, pg.D].forEach((p) => { p.palavra.style.opacity = '0'; p._frase = null; p.marcasEl.querySelectorAll('.mk-frase').forEach((x) => x.remove()); });
  }
  /* offset do texto no ponto tocado (para "ouvir daqui") */
  function offsetNoPonto(x, y) {
    let n = null, off = 0;
    if (document.caretPositionFromPoint) { const c = document.caretPositionFromPoint(x, y); if (c) { n = c.offsetNode; off = c.offset; } }
    else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) { n = r.startContainer; off = r.startOffset; } }
    if (!n || n.nodeType !== 3) return null;
    const p = [pg.E, pg.D].find((q) => q.fluxo.contains(n));
    if (!p || !p.ref) return null;
    const it = mapaDe(p).find((q) => q.n === n);
    return it ? { c: p.ref.c, o: it.ini + off } : null;
  }

  /* ================= busca no livro ================= */
  async function buscarNoLivro(q, max = 80) {
    const nq = norm(q);
    if (nq.length < 2) return [];
    const out = [];
    for (let c = 0; c < L.caps.length && out.length < max; c++) {
      const { txt } = await textoCapitulo(c);
      const base = txt.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
      let i = base.indexOf(nq);
      while (i >= 0 && out.length < max) {
        out.push({ c, o: i, cap: L.caps[c].titulo, trecho: txt.slice(Math.max(0, i - 50), i + q.length + 70).replace(/\s+/g, ' ') });
        i = base.indexOf(nq, i + nq.length);
      }
    }
    return out;
  }

  /* ================= abrir e fechar ================= */
  let ajusteT = 0;
  async function reajustar(forcar) {
    if (!L) return;
    const o = offsetDoInicio(paginaVisivel(pos.col));
    const c = pos.c;
    if (!calcularGeo() && forcar !== true) { await pintarAtual(); return; }
    cols.length = 0;
    [pg.E, pg.D, pg.S, pg.F, pg.V, pg.M].forEach((p) => { p.cap = -1; });
    await medir(c);
    pos = { c, col: inicioSpread(await colunaDoOffset(c, o)) };
    await pintarAtual();
    medirTudo();
  }
  const aoRedimensionar = () => { clearTimeout(ajusteT); ajusteT = setTimeout(reajustar, 180); };
  const aoFontes = () => { clearTimeout(ajusteT); ajusteT = setTimeout(() => reajustar(true), 180); };

  async function abrir(livro, dados, el, opcoes = {}) {
    fechar();
    L = livro; info = dados; raiz = el; ops = opcoes;
    cfg = { ...opcoes.cfg };
    marcas = (opcoes.marcas || []).slice();
    marcadores = (opcoes.marcadores || []).slice();
    aoMudar = opcoes.aoMudar || (() => {});
    ppm = opcoes.ppm || 230;
    L.tamTexto = L.caps.map((c) => Formatos.textoDe(c.html).length || 1);
    cols.length = 0; tpl.length = 0; tamCap.length = 0;
    montar();
    const idioma = (dados && dados.l) || (L.meta && L.meta.idioma) || 'pt';
    Object.values(pg).forEach((p) => p.fluxo.setAttribute('lang', idioma === 'pt' ? 'pt-BR' : idioma));
    aplicarVisual();
    calcularGeo();
    const p0 = opcoes.posicao || { c: 0, o: 0 };
    const c0 = clamp(p0.c || 0, 0, L.caps.length - 1);
    // espera a fonte do livro carregar antes de medir as páginas (senão as linhas mudam depois e cortam palavras)
    try { await Promise.race([document.fonts.ready, sleep(1500)]); } catch (e) { /* navegador sem a API */ }
    if (!L) return;
    await medir(c0);
    pos = { c: c0, col: p0.o ? inicioSpread(await colunaDoOffset(c0, p0.o)) : 0 };
    await pintarAtual();
    paginaDesde = Date.now();
    addEventListener('resize', aoRedimensionar);
    // iPhone: a barra do Safari aparece e some mudando a altura útil; e fontes que chegam depois mudam as linhas
    if (window.visualViewport) visualViewport.addEventListener('resize', aoRedimensionar);
    try { document.fonts.addEventListener('loadingdone', aoFontes); } catch (e) { /* sem a API */ }
    addEventListener('keydown', teclas);
    setTimeout(medirTudo, 400);
  }
  function fechar() {
    if (!L) return;
    registrarTempo();
    clearTimeout(salvarT);
    try { const o = offsetDoInicio(paginaVisivel(pos.col)); ops.aoSalvar && ops.aoSalvar({ c: pos.c, o, pct: pctAtual(), pag: nomePagina(pos.c, pos.col), tot: totalPaginas(), ppm: Math.round(ppm) }); } catch (e) { /* tela já saiu */ }
    medindo++;
    removeEventListener('resize', aoRedimensionar);
    if (window.visualViewport) visualViewport.removeEventListener('resize', aoRedimensionar);
    try { document.fonts.removeEventListener('loadingdone', aoFontes); } catch (e) { /* sem a API */ }
    removeEventListener('keydown', teclas);
    try { L.liberar && L.liberar(); } catch (e) { /* nada */ }
    L = null;
    if (raiz) raiz.innerHTML = '';
  }
  async function ajustar(novo) {
    const antes = { ...cfg };
    cfg = { ...cfg, ...novo };
    aplicarVisual();
    const mudouLayout = ['fonte', 'tam', 'entre', 'margem', 'alinha', 'duas'].some((k) => antes[k] !== cfg[k]);
    if (mudouLayout) await reajustar();
  }

  return {
    abrir, fechar, ajustar, virar, irPara, irParaPct, irParaAlvo, alternarMarcador, destacar, removerMarca, selecaoAtual,
    textoCapitulo, posicaoAtual, inicioDaHistoria, mostrarDestaque, limparDestaque, offsetNoPonto, buscarNoLivro,
    get livro() { return L; }, get pos() { return { ...pos }; }, get aberto() { return !!L; }, get marcas() { return marcas.slice(); }, get marcadores() { return marcadores.slice(); },
    progresso: () => (L ? { pct: pctAtual(), pag: nomePagina(pos.c, pos.col), tot: totalPaginas(), ...restante() } : null),
  };
})();
