/* Utilidades gerais do LeituCast Ingrid: texto, datas, armazenamento local e banco de arquivos (IndexedDB). */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}\s'-]/gu, ' ').replace(/\s+/g, ' ').trim();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const primeiroNome = (n) => String(n || '').trim().split(/\s+/)[0] || '';
const iniciais = (n) => String(n || '?').trim().split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('');
const matiz = (s) => { let h = 0; for (const c of String(s || '')) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const fmtNum = (n) => Math.round(n).toLocaleString('pt-BR');
const fmtMin = (min) => {
  min = Math.max(0, Math.round(min));
  if (min < 1) return 'menos de 1 min';
  if (min < 60) return min + ' min';
  const h = Math.floor(min / 60), m = min % 60;
  return h + ' h' + (m ? ' ' + m + ' min' : '');
};
const plural = (n, um, varios) => (n === 1 ? um : varios).replace('#', fmtNum(n));
const PALAVRAS_POR_MIN = 230;
const tempoLeitura = (palavras) => palavras / PALAVRAS_POR_MIN;

/* Distância de edição curta (para tolerar erros de digitação) */
function distancia(a, b, max = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let ant = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let menor = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(ant[j] + 1, cur[j - 1] + 1, ant[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      menor = Math.min(menor, cur[j]);
    }
    if (menor > max) return max + 1;
    ant = cur;
  }
  return ant[b.length];
}
/* Semelhança entre textos por trigramas (0 a 1) */
function trigramas(s) {
  const t = '  ' + norm(s) + ' ';
  const out = new Set();
  for (let i = 0; i < t.length - 2; i++) out.add(t.slice(i, i + 3));
  return out;
}
function parecido(a, b) {
  const A = trigramas(a), B = trigramas(b);
  if (!A.size || !B.size) return 0;
  let c = 0;
  for (const x of A) if (B.has(x)) c++;
  return (2 * c) / (A.size + B.size);
}

/* ---------------- localStorage seguro ---------------- */
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* sem acesso */ } },
};

/* ---------------- IndexedDB: arquivos de livros, capas e cache da web ---------------- */
const Banco = (() => {
  let db = null;
  const abrir = () => db || (db = new Promise((res, rej) => {
    if (!('indexedDB' in self)) return rej(new Error('sem_indexeddb'));
    const r = indexedDB.open('leitucast', 2);
    r.onupgradeneeded = () => {
      const d = r.result;
      for (const s of ['arquivos', 'capas', 'cache', 'textos']) if (!d.objectStoreNames.contains(s)) d.createObjectStore(s);
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  async function op(loja, modo, fn) {
    const d = await abrir();
    return new Promise((res, rej) => {
      const tx = d.transaction(loja, modo);
      const st = tx.objectStore(loja);
      const req = fn(st);
      tx.oncomplete = () => res(req && req.result);
      tx.onerror = () => rej(tx.error);
      tx.onabort = () => rej(tx.error);
    });
  }
  return {
    get: (loja, k) => op(loja, 'readonly', (s) => s.get(k)).catch(() => undefined),
    set: (loja, k, v) => op(loja, 'readwrite', (s) => s.put(v, k)).catch(() => false),
    del: (loja, k) => op(loja, 'readwrite', (s) => s.delete(k)).catch(() => false),
    chaves: (loja) => op(loja, 'readonly', (s) => s.getAllKeys()).catch(() => []),
    limpar: (loja) => op(loja, 'readwrite', (s) => s.clear()).catch(() => false),
  };
})();

/* Cache da web com validade (respostas de APIs) */
const CacheWeb = {
  async get(k, maxDias = 7) {
    const v = await Banco.get('cache', k);
    if (!v) return undefined;
    if (Date.now() - v.t > maxDias * 864e5) return undefined;
    return v.d;
  },
  set(k, d) { return Banco.set('cache', k, { t: Date.now(), d }); },
};

/* fetch com limite de tempo */
async function buscar(url, { ms = 15000, tipo = 'json', ...op } = {}) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { ...op, signal: ctl.signal });
    if (!r.ok) { const e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
    if (tipo === 'json') return await r.json();
    if (tipo === 'text') return await r.text();
    if (tipo === 'blob') return await r.blob();
    return r;
  } finally { clearTimeout(t); }
}

/* SHA-1 curto de um arquivo (identifica o mesmo ebook em aparelhos diferentes) */
async function impressao(blob) {
  const pedaco = await blob.slice(0, 262144).arrayBuffer();
  const extra = new TextEncoder().encode(String(blob.size));
  const junto = new Uint8Array(pedaco.byteLength + extra.length);
  junto.set(new Uint8Array(pedaco)); junto.set(extra, pedaco.byteLength);
  try {
    const h = await crypto.subtle.digest('SHA-1', junto);
    return Array.from(new Uint8Array(h)).slice(0, 8).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    let h = 2166136261;
    for (let i = 0; i < junto.length; i += 7) h = Math.imul(h ^ junto[i], 16777619);
    return (h >>> 0).toString(16) + blob.size.toString(16);
  }
}

/* Capa gerada (quando o livro não tem): SVG tipográfico com cor derivada do título */
function capaGerada(titulo, autor) {
  const h = matiz(titulo + autor);
  const h2 = (h + 40) % 360;
  const t = String(titulo || 'Sem título');
  const linhas = [];
  let atual = '';
  for (const p of t.split(/\s+/)) {
    if ((atual + ' ' + p).trim().length > 14 && atual) { linhas.push(atual); atual = p; } else atual = (atual + ' ' + p).trim();
  }
  if (atual) linhas.push(atual);
  const ls = linhas.slice(0, 5);
  const tam = ls.length > 3 ? 26 : 32;
  const y0 = 150 - (ls.length * tam * 1.15) / 2;
  const txt = ls.map((l, i) => `<text x="150" y="${y0 + i * tam * 1.15 + tam}" font-family="Fraunces, Georgia, serif" font-size="${tam}" font-weight="600" fill="#fff8ec" text-anchor="middle">${esc(l)}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},45%,32%)"/><stop offset="1" stop-color="hsl(${h2},50%,18%)"/></linearGradient></defs>` +
    `<rect width="300" height="450" fill="url(#g)"/><rect x="14" y="14" width="272" height="422" fill="none" stroke="#f3d9a4" stroke-opacity=".55" stroke-width="1.5"/>` +
    `<rect x="22" y="22" width="256" height="406" fill="none" stroke="#f3d9a4" stroke-opacity=".25"/>${txt}` +
    `<line x1="110" x2="190" y1="${y0 + ls.length * tam * 1.15 + tam + 18}" y2="${y0 + ls.length * tam * 1.15 + tam + 18}" stroke="#f3d9a4" stroke-opacity=".7"/>` +
    `<text x="150" y="395" font-family="Manrope, Arial, sans-serif" font-size="15" letter-spacing="2" fill="#f3d9a4" text-anchor="middle">${esc(String(autor || '').toUpperCase().slice(0, 30))}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* Detecta o idioma de um trecho pelas palavras mais comuns */
function detectarIdioma(txt) {
  const p = norm(txt).split(' ').slice(0, 4000);
  const conta = { pt: 0, en: 0, es: 0, fr: 0, it: 0, de: 0 };
  const PAL = {
    pt: ['que', 'nao', 'uma', 'com', 'para', 'ele', 'ela', 'mas', 'como', 'dos', 'das', 'tambem', 'voce', 'muito', 'isso', 'esta', 'sao', 'ao', 'pelo', 'entao'],
    en: ['the', 'and', 'of', 'to', 'was', 'he', 'that', 'it', 'his', 'with', 'had', 'you', 'she', 'not', 'but', 'for', 'her', 'which', 'were', 'would'],
    es: ['que', 'el', 'los', 'las', 'del', 'por', 'una', 'con', 'pero', 'como', 'muy', 'esta', 'para', 'su', 'mas', 'tambien', 'usted', 'ella', 'cuando', 'porque'],
    fr: ['le', 'les', 'des', 'est', 'une', 'pas', 'que', 'qui', 'dans', 'pour', 'avec', 'sur', 'mais', 'nous', 'vous', 'elle', 'il', 'au', 'ce', 'du'],
    it: ['che', 'il', 'non', 'della', 'per', 'una', 'sono', 'gli', 'con', 'del', 'anche', 'come', 'piu', 'questo', 'nel', 'alla', 'lei', 'era', 'ma', 'suo'],
    de: ['der', 'die', 'und', 'nicht', 'das', 'ist', 'ich', 'sie', 'mit', 'den', 'ein', 'auf', 'sich', 'es', 'dem', 'war', 'auch', 'zu', 'eine', 'aber'],
  };
  const conj = Object.fromEntries(Object.entries(PAL).map(([k, v]) => [k, new Set(v)]));
  for (const w of p) for (const k in conj) if (conj[k].has(w)) conta[k]++;
  return Object.entries(conta).sort((a, b) => b[1] - a[1])[0][0];
}

/* Ícones (SVG em linha, traço) */
const ICO = {
  casa: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
  busca: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  estante: '<path d="M4 4h4v16H4zM10 4h4v16h-4z"/><path d="M16.5 4.5l3.8 1 -3.6 15.4-3.9-1z"/>',
  ia: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  perfil: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-1a7 7 0 0 1 14 0v1"/>',
  voltar: '<path d="M15 5l-7 7 7 7"/>',
  fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
  mais: '<path d="M12 5v14M5 12h14"/>',
  play: '<path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/>',
  pausa: '<rect x="6" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4.5" width="4" height="15" rx="1" fill="currentColor" stroke="none"/>',
  voz: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
  sumario: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
  aa: '<path d="M3 19l5-14 5 14M5 14h6"/><path d="M14 19l3.5-9 3.5 9M15.2 16h4.6"/>',
  marcador: '<path d="M6 3h12v18l-6-4.5L6 21z"/>',
  marcadorCheio: '<path d="M6 3h12v18l-6-4.5L6 21z" fill="currentColor"/>',
  coracao: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  coracaoCheio: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/>',
  baixar: '<path d="M12 4v11M7 10l5 5 5-5"/><path d="M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5"/><path d="M5 4h14"/>',
  livro: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20"/>',
  abrir: '<path d="M2 5c3-1.5 6.5-1.5 10 1 3.5-2.5 7-2.5 10-1v14c-3-1.5-6.5-1.5-10 1-3.5-2.5-7-2.5-10-1z"/><path d="M12 6v14"/>',
  reiniciar: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4h4"/>',
  frente: '<path d="M5 5l7 7-7 7M13 5l7 7-7 7"/>',
  tras: '<path d="M19 5l-7 7 7 7M11 5l-7 7 7 7"/>',
  sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  lixo: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  enviar: '<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',
  sair: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  nuvem: '<path d="M7 18a4.5 4.5 0 0 1-.5-9 6 6 0 0 1 11.5 1.5A3.8 3.8 0 0 1 17.5 18z"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pena: '<path d="M20 4c-6 0-11 4-13 11l-2 5 5-2c7-2 10-8 10-14z"/><path d="M5 19l8-8"/>',
  copiar: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  dicionario: '<path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M9 8h6M9 12h4"/>',
  grafico: '<path d="M4 4v16h16"/><path d="M8 15l4-4 3 3 5-6"/>',
  menu: '<circle cx="12" cy="5" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="19" r="1.5" fill="currentColor"/>',
  instalar: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M12 7v7M9 11l3 3 3-3"/>',
  fone: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>',
};
const ico = (k, cls = '') => `<svg class="ico ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICO[k] || ''}</svg>`;
