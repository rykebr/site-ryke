/* Cantinho das Historinhas: módulo infantil do LeituCast.
   - Desenhos: um pequeno motor de ilustração em SVG (personagens e cenários desenhados aqui, originais).
   - Historinhas: fábulas clássicas de domínio público (Esopo e contos populares) recontadas para o app,
     e histórias originais. Textos curtos, para ler junto ou ouvir com a palavra acendendo.
   Nada do conteúdo adulto do app aparece aqui. */
'use strict';
const Infantil = (() => {
  /* ================= motor de desenho ================= */
  const TINTA = '#2B2340';
  const c = (x, y, r, f, ex = '') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}" ${ex}/>`;
  const e = (x, y, rx, ry, f, ex = '') => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}" ${ex}/>`;
  const p = (d, f, ex = '') => `<path d="${d}" fill="${f}" ${ex}/>`;
  const li = (d, cor = TINTA, w = 2.2) => `<path d="${d}" fill="none" stroke="${cor}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const r = (x, y, w, h, f, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${ex}/>`;
  const olho = (x, y, rr = 3.4, o = {}) => (o.dorme ? li(`M${x - rr} ${y} q${rr} ${rr * 0.9} ${rr * 2} 0`, TINTA, 1.8) : c(x, y, rr, TINTA) + c(x + rr * 0.35, y - rr * 0.38, rr * 0.36, '#fff'));
  const sorriso = (x, y, w = 5, o = {}) => (o.triste ? li(`M${x - w} ${y + w * 0.5} q${w} ${-w * 0.8} ${w * 2} 0`, TINTA, 1.8) : o.boca ? e(x + w * 0.3, y + 1, w * 0.6, w * 0.7, '#8C3B4F') : li(`M${x - w} ${y} q${w} ${w * 0.85} ${w * 2} 0`, TINTA, 1.8));
  const rosto = (x, y, f = 1, o = {}) => e(x, y, 4 * f, 2.6 * f, '#F59AB0', 'opacity=".75"');
  const estrelaPath = (cx, cy, R, rr, n = 5) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (Math.PI / n) * i - Math.PI / 2; const rad = i % 2 ? rr : R; d += `${i ? 'L' : 'M'}${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`; } return d + 'Z'; };

  /* personagens: desenhados virados para a direita, com o chão em y = 0 */
  const P = {
    coelho: (o) => {
      const cor = o.cor || (o.lebre ? '#C9A57C' : '#F4F1EC'), dent = '#F7B6C4', esc = o.lebre ? '#A9835A' : '#E2DCD2';
      const corre = o.corre ? -10 : 0;
      return e(-6, -22, 23, 19, cor) + c(-27, -24, 7, '#fff') + e(8, -3, 11, 4, esc) + e(-14, -3, 9, 4, esc)
        + `<g transform="rotate(${corre} 14 -50)">${e(4, -82, 5.5, 18, cor)}${e(17, -84, 5.5, 18, cor)}${e(4, -82, 2.6, 12, dent)}${e(17, -84, 2.6, 12, dent)}${c(13, -52, 17, cor)}${olho(20, -55, 3.4, o)}${c(29, -49, 2.8, '#E78AA0')}${rosto(19, -45)}${sorriso(24, -45, 3, o)}</g>`
        + (o.corre ? li('M-40 -30 h-14 M-38 -18 h-18 M-40 -8 h-12', '#ffffffaa', 2.5) : '');
    },
    tartaruga: (o) => e(-16, -4, 8, 5, '#7FB069') + e(16, -4, 8, 5, '#7FB069') + c(37, -17, 10, '#8CC37A') + olho(40, -20, 2.8, o) + sorriso(39, -13, 3, o)
      + p('M-32 -8 Q-30 -50 0 -52 Q30 -50 32 -8 Z', '#3E8E5E') + p('M-14 -18 l8 -12 h12 l8 12 l-8 12 h-12 Z', '#58A873') + c(-22, -20, 5, '#58A873') + c(22, -20, 5, '#58A873') + c(0, -42, 5, '#58A873') + e(0, -8, 34, 5, '#2F7049'),
    coruja: (o) => {
      const cor = o.cor || '#9C6B47', esc = o.esc || '#7A5134';
      return e(-20, -30, 8, 17, esc) + e(20, -30, 8, 17, esc) + e(0, -34, 24, 32, cor) + e(0, -26, 16, 22, '#EAD3AE') + p('M-20 -58 l-4 -14 l12 8 Z', cor) + p('M20 -58 l4 -14 l-12 8 Z', cor)
        + c(-9, -46, 9.5, '#fff') + c(9, -46, 9.5, '#fff') + olho(-9, -46, 4.6, o) + olho(9, -46, 4.6, o) + p('M-4 -37 L4 -37 L0 -30 Z', '#F2A43A') + e(-7, -2, 5, 2.5, '#F2A43A') + e(7, -2, 5, 2.5, '#F2A43A');
    },
    leao: (o) => {
      let juba = '';
      for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; juba += c((Math.cos(a) * 26).toFixed(1), (-60 + Math.sin(a) * 26).toFixed(1), 10, '#C96F22'); }
      return e(-10, -24, 28, 20, '#F2C46D') + e(-30, -4, 7, 5, '#E3AE52') + e(8, -4, 7, 5, '#E3AE52') + li('M-36 -30 q-22 -6 -20 -28', '#E3AE52', 4) + c(-56, -58, 6, '#C96F22')
        + juba + c(0, -60, 22, '#D9822B') + c(0, -60, 19, '#F2C46D') + c(-14, -76, 6, '#F2C46D') + c(14, -76, 6, '#F2C46D') + olho(-7, -64, 3.4, o) + olho(7, -64, 3.4, o)
        + p('M-4 -55 h8 l-4 5 Z', '#7A4A2A') + (o.ruge ? e(0, -46, 6, 5, '#8C3B4F') : sorriso(0, -49, 4, o)) + rosto(-11, -54) + rosto(11, -54);
    },
    rato: (o) => {
      const cor = o.cor || '#B3B3C4';
      return li('M-16 -10 q-20 4 -18 -14 q2 -10 10 -6', '#E7A2B3', 2.4) + e(0, -12, 16, 12, cor) + c(8, -30, 8, cor) + c(8, -30, 4.5, '#F2B8C6') + c(14, -21, 10, cor)
        + olho(18, -23, 2.6, o) + c(24, -19, 2.2, '#E78AA0') + li('M24 -19 l8 -2 M24 -18 l8 2', '#8F8FA3', 1) + sorriso(19, -16, 2, o) + e(6, -1, 5, 2.5, '#9C9CB0') + (o.cachecol ? p('M6 -14 q8 4 16 0 v5 q-8 4 -16 0 Z', '#D8394A') + r(8, -10, 4, 10, '#D8394A') : '');
    },
    formiga: (o) => li('M-14 -10 l-6 10 M-2 -12 l-2 12 M8 -14 l4 14', '#5A221B', 2) + c(-14, -14, 8, '#8B3A2E') + c(0, -16, 6.5, '#9A4434') + c(16, -24, 10, '#A84C3A')
      + li('M18 -33 q2 -12 10 -14 M12 -33 q-2 -12 -10 -14', '#5A221B', 1.8) + olho(20, -26, 2.8, o) + sorriso(20, -19, 2.6, o) + (o.carrega ? e(-6, -34, 12, 6, '#7CB342') + li('M-18 -34 h24', '#5A8F2C', 1.2) : ''),
    cigarra: (o) => e(-4, -24, 17, 8, 'rgba(220,240,255,.85)', `stroke="#A7C4D8" stroke-width="1"`) + e(0, -18, 18, 11, '#7CB342') + c(17, -22, 9.5, '#8BC34A') + c(20, -25, 4.6, TINTA) + c(21.6, -26.6, 1.6, '#fff')
      + sorriso(19, -16, 2.6, o) + li('M-10 -8 l-6 8 M2 -8 l2 8', '#557A2D', 2) + (o.violao !== false ? e(30, -10, 8, 6, '#C17A3A') + c(30, -10, 2, '#5E3A1A') + r(36, -13, 14, 3, '#8A5A2B') : ''),
    raposa: (o) => p('M-24 -24 q-30 -2 -34 -26 q14 8 30 10 Z', '#E8772E') + p('M-50 -42 q4 6 4 10 q-6 -2 -8 -8 Z', '#fff') + e(-4, -22, 22, 15, '#E8772E') + e(8, -19, 8, 10, '#FBEBDD')
      + e(-14, -4, 6, 4, '#C25F20') + e(6, -4, 6, 4, '#C25F20') + c(16, -44, 13, '#E8772E') + p('M22 -48 L40 -42 L22 -36 Z', '#FBEBDD') + c(40, -42, 2.6, TINTA)
      + p('M8 -54 L10 -70 L18 -56 Z', '#E8772E') + p('M18 -55 L26 -68 L28 -51 Z', '#E8772E') + olho(20, -47, 3, o) + (o.nariz ? '' : sorriso(26, -38, 2.6, o)),
    porco: (o) => li('M-24 -26 q-8 -6 -2 -10 q4 2 0 6', '#EE8FA6', 2) + e(0, -22, 24, 18, '#F5A3B5') + e(-12, -4, 6, 5, '#EE8FA6') + e(12, -4, 6, 5, '#EE8FA6') + c(18, -36, 15, '#F7B2C1')
      + p('M8 -48 L6 -60 L16 -50 Z', '#F08AA3') + p('M22 -50 L28 -60 L30 -47 Z', '#F08AA3') + e(31, -34, 6.5, 5.5, '#F08AA3') + c(29, -34, 1.4, '#B95A72') + c(33, -34, 1.4, '#B95A72')
      + olho(20, -40, 3, o) + rosto(16, -30) + sorriso(24, -27, 2.4, o) + (o.chapeu ? p(`M8 -50 h22 l-3 -10 h-16 Z`, o.chapeu) : ''),
    lobo: (o) => p('M-26 -28 q-26 0 -28 -22 q12 6 26 6 Z', '#6B7385') + e(-4, -24, 26, 16, '#7D8597') + e(-16, -4, 6, 4, '#626A7C') + e(8, -4, 6, 4, '#626A7C') + c(18, -44, 14, '#8C94A6')
      + p('M24 -48 L44 -42 L24 -34 Z', '#A9B0BF') + c(44, -42, 3, TINTA) + p('M8 -54 L10 -72 L19 -56 Z', '#7D8597') + p('M19 -56 L28 -70 L30 -52 Z', '#7D8597') + olho(21, -47, 3, o)
      + (o.sopra ? e(48, -38, 4, 3, '#8C3B4F') + li('M56 -44 q10 -2 18 2 M56 -38 q12 0 22 4 M56 -32 q10 2 18 6', '#BFE3F5', 3) : sorriso(30, -37, 2.6, o)),
    ovelha: (o) => { let la = ''; for (const [x, y] of [[-14, -26], [-4, -32], [8, -30], [16, -22], [6, -18], [-8, -16], [-18, -18]]) la += c(x, y, 10, '#FAFAF7'); return r(-12, -12, 4, 12, '#3A3346') + r(8, -12, 4, 12, '#3A3346') + la + e(22, -30, 8, 10, '#3A3346') + c(20, -32, 1.8, '#fff') + c(25, -32, 1.8, '#fff') + e(16, -38, 5, 3, '#3A3346'); },
    peixe: (o) => { const cor = o.cor || '#FF8A3D'; return p('M-20 0 L-38 -14 L-38 14 Z', cor) + e(0, 0, 22, 14, cor) + p('M-4 -12 q6 -12 14 -4 Z', o.esc || '#F26A1B') + e(4, 4, 9, 4, '#FFC59A', 'opacity=".7"') + olho(10, -3, 3.4, o) + sorriso(16, 4, 2, o) + (o.bolhas ? c(30, -14, 3, 'none', 'stroke="#fff" stroke-width="1.5"') + c(36, -24, 2, 'none', 'stroke="#fff" stroke-width="1.5"') : ''); },
    passaro: (o) => { const cor = o.cor || '#4FA3E0'; return p('M-12 -16 l-12 -4 l4 8 Z', cor) + c(0, -16, 12, cor) + e(-3, -15, 8, 5, o.esc || '#3B87C4') + p('M11 -18 l9 2 l-9 3 Z', '#F2A43A') + olho(5, -20, 2.4, o) + li('M-3 -4 v4 M3 -4 v4', '#F2A43A', 1.6) + (o.voa ? p('M-6 -22 q-8 -18 -20 -14 q8 4 14 14 Z', o.esc || '#3B87C4') : ''); },
    gato: (o) => { const cor = o.cor || '#F0A04B', esc = o.esc || '#D9822B'; return li('M-18 -18 q-20 -4 -16 -30', cor, 6) + e(-2, -18, 18, 15, cor) + li('M-10 -28 v8 M-2 -31 v8', esc, 3) + e(-10, -3, 5, 3, esc) + e(8, -3, 5, 3, esc)
      + c(14, -38, 13, cor) + p('M4 -46 L4 -60 L13 -50 Z', cor) + p('M16 -50 L26 -60 L25 -45 Z', cor) + p('M6 -48 L6 -55 L10 -50 Z', '#F7B6C4') + olho(10, -40, 2.8, o) + olho(20, -40, 2.8, o)
      + p('M14 -35 h4 l-2 2.5 Z', '#E78AA0') + li('M18 -33 l10 -2 M18 -32 l10 2 M12 -33 l-9 -2', '#8F6A50', 0.9) + sorriso(16, -31, 2, o); },
    cachorro: (o) => { const cor = o.cor || '#C68B59'; return li('M-20 -24 q-12 -10 -6 -20', cor, 5) + e(-2, -20, 20, 15, cor) + c(-8, -24, 6, '#9E6A40') + e(-12, -4, 5, 4, '#9E6A40') + e(8, -4, 5, 4, '#9E6A40')
      + c(16, -38, 14, '#D39C6A') + e(5, -36, 5, 12, '#8B5A35', 'transform="rotate(12 5 -36)"') + e(26, -26, 7, 5, '#EBC9A2') + c(31, -28, 3, TINTA) + olho(19, -41, 3, o) + sorriso(26, -22, 2.4, o) + (o.lingua ? e(28, -18, 2.5, 4, '#E8768F') : ''); },
    sapo: (o) => e(0, -12, 18, 12, '#5DBB63') + c(-8, -24, 7, '#5DBB63') + c(8, -24, 7, '#5DBB63') + olho(-8, -25, 3.2, o) + olho(8, -25, 3.2, o) + sorriso(0, -12, 7, o) + e(-14, -2, 7, 3, '#4AA251') + e(14, -2, 7, 3, '#4AA251'),
    crianca: (o) => {
      const pele = o.pele || '#E8B98A', roupa = o.roupa || '#E25D6A', cabelo = o.cabelo || '#4A2E22';
      const corpo = o.menina ? p('M-14 -16 L-6 -46 h12 L14 -16 Z', roupa) : r(-11, -46, 22, 26, roupa, 'rx="6"');
      const braco = o.aceno ? li('M10 -42 l12 -16', pele, 5) : li('M10 -40 l8 14', pele, 5);
      const cab = o.menina ? c(0, -66, 15, cabelo) + c(-15, -60, 6, cabelo) + c(15, -60, 6, cabelo) : p('M-15 -66 q0 -18 15 -17 q16 0 15 17 q-4 -8 -15 -9 q-10 1 -15 9 Z', cabelo);
      return r(-8, -18, 5, 18, '#3B4A6B', 'rx="2"') + r(3, -18, 5, 18, '#3B4A6B', 'rx="2"') + e(-6, -1, 5, 3, '#2B2340') + e(6, -1, 5, 3, '#2B2340') + corpo + li('M-10 -40 l-8 14', pele, 5) + braco
        + (o.menina ? cab + c(0, -62, 13, pele) : c(0, -62, 13, pele) + cab) + olho(-4.5, -63, 2.4, o) + olho(4.5, -63, 2.4, o) + rosto(-7, -57, 0.8) + rosto(7, -57, 0.8) + sorriso(0, -57, 3, o)
        + (o.capa ? p('M-13 -46 L-20 -14 h40 L13 -46 Z', o.capa, 'opacity=".95"') : '') + (o.botas ? r(-10, -6, 7, 6, o.botas, 'rx="2"') + r(3, -6, 7, 6, o.botas, 'rx="2"') : '');
    },
    estrela: (o) => p(estrelaPath(0, -26, 26, 12), o.cor || '#FFD54F', 'stroke="#F4B400" stroke-width="2"') + olho(-6, -28, 2.6, o) + olho(6, -28, 2.6, o) + sorriso(0, -22, 3.5, o) + rosto(-10, -21, 0.7) + rosto(10, -21, 0.7),
    /* cenário */
    sol: (o) => { let raios = ''; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; raios += li(`M${(Math.cos(a) * 30).toFixed(1)} ${(Math.sin(a) * 30).toFixed(1)} L${(Math.cos(a) * 40).toFixed(1)} ${(Math.sin(a) * 40).toFixed(1)}`, '#FFC83D', 4); } return raios + c(0, 0, 24, '#FFD54F') + (o.rosto ? olho(-7, -3, 2.6) + olho(7, -3, 2.6) + sorriso(0, 5, 5) : ''); },
    lua: (o) => (o.cheia ? c(0, 0, 26, '#FFF3C4') + c(-8, -6, 4, '#F0E1A6') + c(9, 8, 5, '#F0E1A6') + (o.rosto ? olho(-7, -2, 2.4) + olho(7, -2, 2.4) + sorriso(0, 6, 4) : '') : p('M10 -24 a26 26 0 1 0 0 48 a20 20 0 1 1 0 -48 Z', '#FFF3C4')),
    nuvem: (o) => { const f = o.cinza ? '#A7B3C2' : '#FFFFFF'; return c(-22, 0, 16, f) + c(0, -10, 22, f) + c(24, -2, 17, f) + r(-22, 0, 46, 16, f, 'rx="8"') + (o.chuva ? li('M-18 22 l-4 10 M-4 24 l-4 10 M10 22 l-4 10 M24 24 l-4 10', '#6FB7E8', 2.4) : ''); },
    arvore: (o) => r(-7, -54, 14, 54, '#8B5A35', 'rx="4"') + c(0, -78, 30, o.cor || '#5BAA55') + c(-24, -62, 20, o.cor || '#5BAA55') + c(24, -62, 20, o.cor || '#5BAA55') + c(-8, -90, 6, '#7DC56E', 'opacity=".6"') + (o.frutas ? c(-14, -70, 5, '#E5484D') + c(12, -84, 5, '#E5484D') + c(20, -64, 5, '#E5484D') : ''),
    flor: (o) => { const cor = o.cor || '#F48FB1'; let pet = ''; for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pet += c((Math.cos(a) * 7).toFixed(1), (-34 + Math.sin(a) * 7).toFixed(1), 5.5, cor); } return li('M0 0 V-30', '#4E9A44', 3) + e(6, -12, 6, 3, '#5BAA55') + pet + c(0, -34, 4.5, '#FFD54F'); },
    girassol: () => { let pet = ''; for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; pet += e((Math.cos(a) * 18).toFixed(1), (-90 + Math.sin(a) * 18).toFixed(1), 9, 4.5, '#FFC83D', `transform="rotate(${(a * 180) / Math.PI} ${(Math.cos(a) * 18).toFixed(1)} ${(-90 + Math.sin(a) * 18).toFixed(1)})"`); } return li('M0 0 V-80', '#4E9A44', 5) + e(12, -40, 14, 6, '#5BAA55') + e(-12, -56, 14, 6, '#5BAA55') + pet + c(0, -90, 13, '#7A4A1E') + olho(-4, -92, 2.2) + olho(4, -92, 2.2) + sorriso(0, -86, 3); },
    casa: (o) => {
      const t = o.tipo || 'tijolo';
      const parede = t === 'palha' ? '#F2D27A' : t === 'madeira' ? '#B07A4A' : t === 'formigueiro' ? '#A0704A' : '#C8553D';
      let tex = '';
      if (t === 'palha') for (let i = 0; i < 9; i++) tex += li(`M${-38 + i * 9} -4 l3 -40`, '#D9B354', 1.4);
      if (t === 'madeira') for (let i = 0; i < 4; i++) tex += li(`M-40 ${-10 - i * 11} h80`, '#8A5A30', 1.4);
      if (t === 'tijolo') for (let y = 0; y < 4; y++) for (let x = 0; x < 5; x++) tex += r(-40 + x * 16 + (y % 2) * 8, -12 - y * 11, 14, 9, '#B2462F', 'rx="1.5"');
      if (t === 'formigueiro') return p('M-50 0 Q-40 -56 0 -58 Q40 -56 50 0 Z', parede) + p('M-12 0 v-16 a12 12 0 0 1 24 0 v16 Z', '#5A3A22') + c(-24, -24, 3, '#8A5A3A') + c(26, -30, 3, '#8A5A3A');
      return r(-42, -48, 84, 48, parede) + tex + p('M-52 -46 L0 -86 L52 -46 Z', t === 'palha' ? '#E0B84F' : t === 'madeira' ? '#8A5A30' : '#7A3B2E') + r(-10, -30, 20, 30, '#5A3A22', 'rx="3"') + c(6, -15, 1.8, '#F2C46D') + r(18, -38, 16, 14, '#BFE3F5', 'stroke="#fff" stroke-width="2"');
    },
    uvas: () => { let g = li('M0 -40 q-6 -14 6 -22', '#6B8E23', 3) + e(10, -58, 9, 5, '#7CB342'); for (const [x, y] of [[-8, -34], [0, -34], [8, -34], [-4, -26], [4, -26], [0, -18], [-12, -42], [12, -42], [0, -42]]) g += c(x, y, 5.5, '#7B3FA0') + c(x - 1.5, y - 1.5, 1.6, '#B98AD6'); return g; },
    parreira: () => r(-60, -150, 8, 150, '#8B5A35') + r(52, -150, 8, 150, '#8B5A35') + li('M-60 -148 q60 -16 120 0', '#6B8E23', 6) + e(-30, -140, 16, 8, '#7CB342') + e(30, -142, 16, 8, '#7CB342') + `<g transform="translate(0 -96)">${P.uvas()}</g>`,
    montanha: (o) => p('M-90 0 L-20 -110 L50 0 Z', o.cor || '#8FA9C9') + p('M-20 -110 L-38 -80 L-26 -84 L-20 -72 L-12 -86 L-2 -80 Z', '#fff') + p('M10 0 L60 -70 L110 0 Z', '#A9BDD6'),
    arcoiris: () => ['#E5484D', '#F59E0B', '#FACC15', '#4ADE80', '#38BDF8', '#818CF8'].map((cor, i) => li(`M${-110 + i * 9} 0 A${110 - i * 9} ${110 - i * 9} 0 0 1 ${110 - i * 9} 0`, cor, 9)).join(''),
    guardachuva: () => li('M0 0 V-46 M0 0 q0 6 6 6', '#5A3A22', 3) + p('M-34 -46 Q0 -84 34 -46 q-8 -6 -17 0 q-8 -6 -17 0 q-8 -6 -17 0 q-9 -6 -17 0 Z', '#FACC15'),
    semente: () => e(0, -5, 8, 5, '#8B5A35') + li('M-4 -6 q4 -3 8 0', '#A9734A', 1.2),
    broto: (o) => li(`M0 0 V-${o.alto || 26}`, '#4E9A44', 3.5) + e(-9, -(o.alto || 26), 9, 5, '#6CC05B', `transform="rotate(-25 -9 -${o.alto || 26})"`) + e(9, -(o.alto || 26) - 4, 9, 5, '#6CC05B', `transform="rotate(25 9 -${(o.alto || 26) + 4})"`) + olho(-3, -(o.alto || 26) + 8, 1.8) + olho(3, -(o.alto || 26) + 8, 1.8),
    poca: () => e(0, -3, 34, 7, '#7EC8F0') + e(-8, -5, 10, 2, '#BFE6FA'),
    zzz: () => `<text x="0" y="0" font-family="Fraunces, Georgia, serif" font-size="22" font-weight="700" fill="#5B6B9A">Z<tspan font-size="16" dy="-10">z</tspan><tspan font-size="12" dy="-8">z</tspan></text>`,
    bandeira: () => r(0, -90, 4, 90, '#5A3A22') + p('M4 -90 h34 l-8 11 l8 11 h-34 Z', '#E5484D'),
    chegada: () => { let g = ''; for (let i = 0; i < 12; i++) g += r(-6 + (i % 2) * 6, -96 + Math.floor(i / 2) * 16, 6, 8, i % 2 ? '#fff' : TINTA) + r(-6 + ((i + 1) % 2) * 6, -88 + Math.floor(i / 2) * 16, 6, 8, (i + 1) % 2 ? '#fff' : TINTA); return g; },
    rede: () => { let g = ''; for (let i = -3; i <= 3; i++) g += li(`M${i * 14} -96 q${i * 4} 50 ${i * 6} 96`, '#B08A5A', 2) + li(`M-46 ${-96 + (i + 3) * 15} h92`, '#B08A5A', 2); return g + li('M0 -96 V-130', '#8B5A35', 2.4); },
    novelo: (o) => c(0, -12, 12, '#D8394A') + li('M-10 -16 q10 -6 20 2 M-10 -8 q10 -6 20 2 M-6 -22 q8 10 4 20', '#A82534', 1.4) + (o.fio ? li(`M10 -6 q${o.fio / 3} 20 ${o.fio} 4`, '#D8394A', 2) : ''),
    coracao: (o) => p('M0 -4 C-14 -16 -10 -30 0 -22 C10 -30 14 -16 0 -4 Z', o.cor || '#F06292'),
    vagalume: () => c(0, 0, 9, '#FFF59D', 'opacity=".35"') + c(0, 0, 3.5, '#FFEB3B') + c(-4, -2, 2.4, '#5A4A2A'),
    graos: () => c(-8, -4, 4, '#E8B04B') + c(0, -6, 4, '#E8B04B') + c(8, -4, 4, '#E8B04B') + c(-4, -10, 4, '#D99A35') + c(4, -10, 4, '#D99A35'),
    nota: () => li('M0 0 V-18 l10 -4 V-4', TINTA, 2) + e(-3, 0, 4, 3, TINTA) + e(7, -4, 4, 3, TINTA),
    pedra: () => e(0, -8, 20, 10, '#9CA3AF') + e(-6, -11, 6, 3, '#BCC2CA'),
    alga: (o) => li(`M0 0 q-10 -${(o.alto || 50) / 2} 0 -${o.alto || 50} q8 -10 0 -18`, '#3FA56B', 5),
  };

  const CEUS = {
    dia: ['#8FD3F4', '#E3F6FF'], tarde: ['#FFAE73', '#FFE2B3'], noite: ['#1C2659', '#3E4E92'], inverno: ['#C9DDEC', '#F3F8FC'], nublado: ['#9EAEBF', '#DCE3EA'], mar: ['#2E9BD6', '#0E5A93'], casa: ['#F8E7C8', '#FCF3E2'],
  };
  const CHAOS = {
    grama: ['#8BCB6B', '#6FB257'], areia: ['#F2D9A2', '#E2C281'], neve: ['#FFFFFF', '#E3EDF5'], agua: ['#5BB8E8', '#3D9BD1'], fundo: ['#E9D5A6', '#D7BE86'], savana: ['#E2C46A', '#C9A84E'], terra: ['#A9784E', '#8D603A'], piso: ['#C79A6B', '#B0835A'],
  };
  let nCena = 0;
  /* desenha uma cena: { ceu, chao, itens: [[tipo, x, y, escala, opções]] } em 400 × 300 */
  function cena(def) {
    const id = 'k' + (++nCena);
    const [c1, c2] = CEUS[def.ceu || 'dia'];
    const [g1, g2] = CHAOS[def.chao || 'grama'];
    let fundo = `<defs><linearGradient id="${id}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="400" height="300" fill="url(#${id}c)"/>`;
    if (def.ceu === 'noite') { let s = ''; for (let i = 0; i < 26; i++) { const x = (i * 97) % 400, y = (i * 53) % 170; s += c(x, y, i % 4 ? 1.3 : 2.2, '#fff', `opacity="${0.5 + (i % 3) * 0.2}"`); } fundo += s; }
    if (def.ceu === 'mar') fundo += [60, 160, 260, 340].map((x) => p(`M${x} 0 L${x + 30} 0 L${x - 40} 300 L${x - 70} 300 Z`, '#fff', 'opacity=".07"')).join('');
    if (def.neve) { let s = ''; for (let i = 0; i < 40; i++) s += c((i * 71) % 400, (i * 37) % 260, 2 + (i % 3), '#fff', 'opacity=".9"'); fundo += s; }
    const chao = def.chao === 'nenhum' ? '' : def.chao === 'agua' ? p('M0 230 q25 -10 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V300 H0 Z', g1) + p('M0 250 q25 -8 50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 t50 0 V300 H0 Z', g2)
      : p('M0 228 Q100 210 200 222 T400 216 V300 H0 Z', g1) + p('M0 258 Q120 246 230 256 T400 252 V300 H0 Z', g2);
    let itens = '';
    for (const [tipo, x, y, s = 1, o = {}] of def.itens || []) {
      const f = P[tipo];
      if (!f) continue;
      itens += `<g transform="translate(${x} ${y}) scale(${o.vira ? -s : s} ${s})${o.gira ? ` rotate(${o.gira})` : ''}">${f(o)}</g>`;
    }
    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" role="img" preserveAspectRatio="xMidYMid slice">${fundo}${chao}${itens}</svg>`;
  }

  /* ================= historinhas ================= */
  const H = (id, t, tag, cor, capa, paginas, extra = {}) => ({ id, t, tag, cor, capa, paginas, ...extra });
  const pg = (t, ceu, chao, itens, ex = {}) => ({ t, cena: { ceu, chao, itens, ...ex } });
  const HISTORIAS = [
    H('lebre-tartaruga', 'A Lebre e a Tartaruga', 'Fábula de Esopo', '#3E8E5E', { ceu: 'dia', chao: 'grama', itens: [['sol', 340, 60, 0.9, { rosto: 1 }], ['arvore', 60, 232], ['coelho', 160, 240, 1.2, { lebre: 1 }], ['tartaruga', 270, 244, 1.2]] }, [
      pg('Na beira da floresta morava uma lebre muito veloz. Ela adorava contar vantagem: — Ninguém corre mais rápido do que eu!', 'dia', 'grama', [['sol', 340, 56, 0.8], ['nuvem', 120, 60, 0.8], ['arvore', 50, 230], ['coelho', 200, 240, 1.4, { lebre: 1 }]]),
      pg('A tartaruga, que andava devagarinho, respondeu com calma: — Quer apostar uma corrida comigo?', 'dia', 'grama', [['sol', 340, 56, 0.8], ['coelho', 120, 240, 1.2, { lebre: 1 }], ['tartaruga', 270, 244, 1.4]]),
      pg('Todos os bichos vieram assistir. A coruja deu o sinal: um, dois, três, já!', 'dia', 'grama', [['arvore', 320, 228, 1.1], ['coruja', 318, 150, 0.8], ['passaro', 60, 120, 1.2, { voa: 1 }], ['rato', 70, 248, 1.2], ['coelho', 160, 240, 1.1, { lebre: 1 }], ['tartaruga', 240, 244, 1.1], ['bandeira', 380, 240, 0.9]]),
      pg('A lebre disparou na frente e logo sumiu na curva da estrada. A tartaruga seguiu, passinho por passinho.', 'dia', 'grama', [['montanha', 300, 222, 0.9], ['coelho', 300, 230, 0.9, { lebre: 1, corre: 1 }], ['tartaruga', 110, 248, 1.3]]),
      pg('Lá na frente, a lebre olhou para trás e não viu ninguém. — Vou tirar um cochilo. Ainda tenho muito tempo! E dormiu debaixo de uma árvore.', 'tarde', 'grama', [['sol', 330, 90, 0.8], ['arvore', 200, 232, 1.3], ['coelho', 180, 244, 1.1, { lebre: 1, dorme: 1 }], ['zzz', 210, 160, 1.2]]),
      pg('A tartaruga passou bem quietinha ao lado da lebre, sem parar nem um minuto.', 'tarde', 'grama', [['arvore', 120, 232, 1.2], ['coelho', 100, 244, 1, { lebre: 1, dorme: 1 }], ['zzz', 130, 170], ['tartaruga', 270, 248, 1.2]]),
      pg('Quando a lebre acordou, correu o mais rápido que pôde. Mas era tarde: a tartaruga já cruzava a linha de chegada!', 'tarde', 'grama', [['chegada', 260, 236, 1], ['tartaruga', 300, 248, 1.1], ['passaro', 330, 120, 1.2, { voa: 1 }], ['coruja', 370, 238, 0.7], ['coelho', 80, 240, 0.9, { lebre: 1, corre: 1, triste: 1 }]]),
      pg('Naquele dia, todos aprenderam: devagar e sempre, se chega longe. Fim.', 'tarde', 'grama', [['sol', 200, 210, 1.3], ['coelho', 150, 246, 1.1, { lebre: 1 }], ['tartaruga', 250, 248, 1.2], ['coracao', 200, 150, 1.6]]),
    ]),
    H('leao-ratinho', 'O Leão e o Ratinho', 'Fábula de Esopo', '#D9822B', { ceu: 'dia', chao: 'savana', itens: [['sol', 330, 60, 0.9], ['leao', 170, 244, 1.3], ['rato', 290, 248, 1.4]] }, [
      pg('Num dia quente, o grande leão dormia à sombra de uma árvore.', 'dia', 'savana', [['sol', 340, 54, 0.9], ['arvore', 270, 232, 1.4, { cor: '#7FA64A' }], ['leao', 190, 244, 1.3, { dorme: 1 }], ['zzz', 220, 140]]),
      pg('Um ratinho distraído passou correndo e subiu bem em cima do nariz do leão.', 'dia', 'savana', [['leao', 180, 248, 1.5, { dorme: 1 }], ['rato', 188, 166, 0.9]]),
      pg('O leão acordou e prendeu o ratinho com a pata. — Por favor, me solte! — pediu o ratinho. — Um dia eu ajudo você!', 'dia', 'savana', [['leao', 170, 246, 1.5], ['rato', 260, 248, 1.2, { triste: 1 }]]),
      pg('O leão achou graça: — Um bichinho tão pequeno, me ajudar? E deixou o ratinho ir embora.', 'dia', 'savana', [['leao', 150, 246, 1.4, { boca: 1 }], ['rato', 300, 248, 1.1]]),
      pg('Dias depois, o leão caiu numa rede de cordas e não conseguia sair. Ele rugiu tão alto que a floresta inteira ouviu.', 'tarde', 'savana', [['arvore', 330, 232, 1.2, { cor: '#7FA64A' }], ['leao', 190, 246, 1.3, { ruge: 1 }], ['rede', 190, 250, 1.2]]),
      pg('O ratinho reconheceu aquele rugido e veio correndo. Roeu, roeu, roeu as cordas até abrir um buraco.', 'tarde', 'savana', [['leao', 170, 246, 1.3, { triste: 1 }], ['rede', 170, 250, 1.2], ['rato', 250, 248, 1.2]]),
      pg('O leão ficou livre! — Obrigado, amigo. Você era pequeno, mas tinha um coração enorme.', 'dia', 'savana', [['sol', 340, 56, 0.9], ['leao', 170, 246, 1.4], ['rato', 260, 248, 1.2], ['coracao', 215, 130, 1.5]]),
      pg('E os dois viraram amigos para sempre. Ninguém é pequeno demais para ajudar. Fim.', 'tarde', 'savana', [['sol', 200, 214, 1.3], ['leao', 160, 246, 1.2], ['rato', 250, 248, 1.2]]),
    ]),
    H('cigarra-formiga', 'A Cigarra e a Formiga', 'Fábula de Esopo, com final de amizade', '#7CB342', { ceu: 'dia', chao: 'grama', itens: [['sol', 330, 60, 0.9, { rosto: 1 }], ['flor', 60, 236, 1.4], ['cigarra', 160, 236, 2], ['formiga', 280, 244, 2, { carrega: 1 }]] }, [
      pg('No verão, a cigarra passava os dias cantando e tocando seu violão debaixo do sol.', 'dia', 'grama', [['sol', 330, 56, 0.9, { rosto: 1 }], ['flor', 60, 236, 1.4], ['flor', 340, 240, 1.2, { cor: '#FFD54F' }], ['cigarra', 190, 236, 2.4], ['nota', 250, 150, 1.2], ['nota', 280, 120, 0.9]]),
      pg('A formiga trabalhava sem parar, carregando folhas e sementes para o formigueiro.', 'dia', 'grama', [['casa', 320, 236, 1, { tipo: 'formigueiro' }], ['formiga', 200, 244, 2.2, { carrega: 1 }], ['formiga', 100, 246, 1.6, { carrega: 1 }]]),
      pg('— Venha cantar comigo! — chamava a cigarra. — Agora não posso. Estou guardando comida para o inverno — respondia a formiga.', 'dia', 'grama', [['cigarra', 120, 236, 2], ['formiga', 280, 244, 2.2, { carrega: 1 }], ['nota', 170, 150]]),
      pg('Então chegou o inverno. Caiu neve, o vento ficou gelado e não havia mais folhas nem sementes.', 'inverno', 'neve', [['arvore', 90, 232, 1.1, { cor: '#D7E6F0' }], ['cigarra', 230, 240, 2, { triste: 1, violao: false }]], { neve: 1 }),
      pg('Com fome e frio, a cigarra bateu na porta do formigueiro.', 'inverno', 'neve', [['casa', 250, 238, 1.4, { tipo: 'formigueiro' }], ['cigarra', 120, 240, 1.8, { triste: 1, violao: false }]], { neve: 1 }),
      pg('A formiga abriu a porta e disse: — Entre! Aqui tem comida e calor para todos.', 'casa', 'piso', [['formiga', 250, 246, 2.2], ['graos', 320, 250, 1.6], ['cigarra', 130, 240, 1.8, { violao: false }]]),
      pg('Em troca, a cigarra tocou as músicas mais bonitas, e o inverno ficou muito mais alegre.', 'casa', 'piso', [['cigarra', 140, 238, 2.2], ['formiga', 260, 246, 1.8], ['formiga', 330, 248, 1.4], ['nota', 200, 140], ['nota', 240, 110, 0.9]]),
      pg('No verão seguinte, a cigarra cantou e também ajudou a guardar comida. Trabalhar e cantar juntos é muito melhor! Fim.', 'dia', 'grama', [['sol', 330, 56, 0.9, { rosto: 1 }], ['cigarra', 140, 236, 2], ['formiga', 260, 244, 2, { carrega: 1 }], ['coracao', 200, 130, 1.4]]),
    ]),
    H('raposa-uvas', 'A Raposa e as Uvas', 'Fábula de Esopo', '#7B3FA0', { ceu: 'dia', chao: 'grama', itens: [['parreira', 270, 236, 1], ['raposa', 140, 244, 1.5]] }, [
      pg('Uma raposa com fome passeava pelo campo quando viu um cacho de uvas bem roxinhas, lá no alto de uma parreira.', 'dia', 'grama', [['sol', 60, 56, 0.8], ['parreira', 280, 236, 1.1], ['raposa', 130, 244, 1.5]]),
      pg('— Que uvas lindas! Devem ser docinhas — pensou, lambendo os beiços.', 'dia', 'grama', [['parreira', 270, 236, 1.1], ['raposa', 170, 244, 1.6, { boca: 1 }]]),
      pg('Ela pulou uma vez... e não alcançou.', 'dia', 'grama', [['parreira', 260, 236, 1.1], ['raposa', 220, 200, 1.4, { gira: -20 }]]),
      pg('Pulou de novo, mais alto, esticando o focinho... e nada!', 'dia', 'grama', [['parreira', 260, 236, 1.1], ['raposa', 225, 170, 1.4, { gira: -35 }]]),
      pg('Tentou tantas vezes que ficou cansada e com as patas doendo.', 'tarde', 'grama', [['parreira', 280, 236, 1.1], ['raposa', 160, 246, 1.5, { triste: 1, dorme: 1 }]]),
      pg('Então deu as costas e disse, de nariz empinado: — Ah, essas uvas estão verdes. Nem queria mesmo!', 'tarde', 'grama', [['parreira', 300, 236, 1], ['raposa', 160, 244, 1.6, { vira: 1, gira: 10 }]]),
      pg('Um passarinho que viu tudo deu risada. Quando não conseguimos alguma coisa, não adianta fingir que não queríamos. Melhor é pedir ajuda ou tentar de outro jeito. Fim.', 'tarde', 'grama', [['parreira', 230, 236, 1.1], ['passaro', 236, 118, 1.6], ['raposa', 90, 246, 1.2, { vira: 1 }]]),
    ]),
    H('tres-porquinhos', 'Os Três Porquinhos', 'Conto popular', '#F08AA3', { ceu: 'dia', chao: 'grama', itens: [['casa', 300, 232, 1], ['porco', 90, 246, 1.2], ['porco', 170, 246, 1.2, { chapeu: '#4FA3E0' }], ['porco', 250, 246, 1.1, { chapeu: '#E25D6A' }]] }, [
      pg('Três porquinhos irmãos saíram de casa para construir, cada um, a sua casinha.', 'dia', 'grama', [['sol', 340, 56, 0.8, { rosto: 1 }], ['porco', 110, 246, 1.3], ['porco', 200, 246, 1.3, { chapeu: '#4FA3E0' }], ['porco', 290, 246, 1.3, { chapeu: '#E25D6A' }]]),
      pg('O primeiro, com pressa de brincar, fez uma casa de palha.', 'dia', 'grama', [['casa', 250, 234, 1.3, { tipo: 'palha' }], ['porco', 110, 246, 1.4]]),
      pg('O segundo fez uma casa de madeira, um pouco mais firme.', 'dia', 'grama', [['casa', 250, 234, 1.3, { tipo: 'madeira' }], ['porco', 110, 246, 1.4, { chapeu: '#4FA3E0' }]]),
      pg('O terceiro trabalhou o dia inteiro e fez uma casa de tijolos, bem forte.', 'tarde', 'grama', [['casa', 250, 234, 1.3, { tipo: 'tijolo' }], ['porco', 110, 246, 1.4, { chapeu: '#E25D6A' }]]),
      pg('Um dia apareceu o lobo. Ele soprou, soprou... e a casa de palha voou longe! O porquinho correu para a casa do irmão.', 'nublado', 'grama', [['lobo', 100, 246, 1.4, { sopra: 1 }], ['casa', 290, 230, 1, { tipo: 'palha', gira: 14 }], ['porco', 360, 248, 0.9]]),
      pg('O lobo soprou a casa de madeira com toda a força, e ela também caiu! Os dois porquinhos correram para a casa de tijolos.', 'nublado', 'grama', [['lobo', 100, 246, 1.4, { sopra: 1 }], ['casa', 280, 236, 1, { tipo: 'madeira', gira: -10 }], ['porco', 350, 248, 0.9], ['porco', 380, 248, 0.9, { chapeu: '#4FA3E0' }]]),
      pg('O lobo soprou, soprou e soprou a casa de tijolos... mas ela não se mexeu nem um pouquinho.', 'tarde', 'grama', [['lobo', 110, 246, 1.4, { sopra: 1 }], ['casa', 290, 234, 1.4, { tipo: 'tijolo' }]]),
      pg('Cansado e sem fôlego, o lobo desistiu e foi embora. E os três porquinhos viveram juntos e seguros na casa forte. Fim.', 'tarde', 'grama', [['casa', 280, 234, 1.3, { tipo: 'tijolo' }], ['porco', 100, 246, 1.1], ['porco', 160, 246, 1.1, { chapeu: '#4FA3E0' }], ['porco', 220, 246, 1.1, { chapeu: '#E25D6A' }], ['coracao', 160, 150, 1.5]]),
    ]),
    H('menino-lobo', 'O Menino que Gritava Lobo', 'Fábula de Esopo', '#6B7385', { ceu: 'dia', chao: 'grama', itens: [['crianca', 120, 246, 1.4, { roupa: '#4FA3E0' }], ['ovelha', 230, 246, 1.2], ['ovelha', 310, 248, 1]] }, [
      pg('Pedro cuidava das ovelhas no alto do morro. Os dias eram calmos, e ele ficava entediado.', 'dia', 'grama', [['sol', 340, 56, 0.8], ['montanha', 60, 224, 0.8], ['crianca', 150, 246, 1.4, { roupa: '#4FA3E0' }], ['ovelha', 250, 246, 1.1], ['ovelha', 330, 248, 1]]),
      pg('Um dia, só por brincadeira, gritou: — Socorro! O lobo! O lobo!', 'dia', 'grama', [['crianca', 170, 246, 1.6, { roupa: '#4FA3E0', aceno: 1, boca: 1 }], ['ovelha', 290, 248, 1]]),
      pg('Os moradores da vila subiram correndo para ajudar. Mas não havia lobo nenhum, e Pedro deu risada.', 'dia', 'grama', [['crianca', 300, 246, 1.3, { roupa: '#4FA3E0' }], ['crianca', 100, 246, 1.2, { roupa: '#7CB342', menina: 1 }], ['crianca', 170, 246, 1.2, { roupa: '#F59E0B', cabelo: '#9A6A3A' }]]),
      pg('No dia seguinte, ele fez a mesma brincadeira. As pessoas subiram de novo, e de novo não havia lobo.', 'dia', 'grama', [['crianca', 290, 246, 1.3, { roupa: '#4FA3E0', aceno: 1 }], ['crianca', 120, 246, 1.2, { roupa: '#7CB342', menina: 1, triste: 1 }], ['ovelha', 200, 248, 1]]),
      pg('Até que, numa tarde, um lobo de verdade apareceu no meio das ovelhas!', 'tarde', 'grama', [['lobo', 260, 246, 1.4], ['ovelha', 120, 248, 1.1, { vira: 1 }], ['ovelha', 60, 248, 1, { vira: 1 }]]),
      pg('— Socorro! O lobo! — gritou Pedro, assustado. Mas desta vez ninguém acreditou.', 'tarde', 'grama', [['crianca', 150, 246, 1.6, { roupa: '#4FA3E0', aceno: 1, boca: 1 }], ['casa', 330, 236, 0.8, { tipo: 'tijolo' }]]),
      pg('As ovelhas fugiram pelo morro, e Pedro entendeu: quem mente perde a confiança dos outros.', 'tarde', 'grama', [['crianca', 180, 246, 1.5, { roupa: '#4FA3E0', triste: 1 }], ['ovelha', 330, 240, 0.7], ['ovelha', 370, 236, 0.6]]),
      pg('Desde então, Pedro passou a falar sempre a verdade. E todos voltaram a confiar nele. Fim.', 'dia', 'grama', [['sol', 340, 56, 0.8, { rosto: 1 }], ['crianca', 140, 246, 1.3, { roupa: '#4FA3E0' }], ['ovelha', 230, 248, 1], ['ovelha', 300, 248, 0.9], ['coracao', 140, 120, 1.3]]),
    ]),
    H('corujinha', 'A Corujinha que Tinha Medo do Escuro', 'História original · para dormir', '#3E4E92', { ceu: 'noite', chao: 'grama', itens: [['lua', 320, 70, 1, { cheia: 1, rosto: 1 }], ['arvore', 160, 240, 1.4, { cor: '#3E7F52' }], ['coruja', 160, 150, 1, { cor: '#B98A5E' }]] }, [
      pg('Lua era uma corujinha diferente. Toda coruja gosta da noite, mas ela tinha medo do escuro.', 'noite', 'grama', [['arvore', 200, 240, 1.5, { cor: '#3E7F52' }], ['coruja', 200, 146, 0.9, { cor: '#B98A5E', triste: 1 }]]),
      pg('Quando o sol se punha, Lua se escondia debaixo da asa da mamãe.', 'tarde', 'grama', [['arvore', 200, 240, 1.5, { cor: '#4E9A44' }], ['coruja', 180, 146, 1.1], ['coruja', 222, 150, 0.7, { cor: '#B98A5E', dorme: 1 }]]),
      pg('— Vem comigo — disse a mamãe coruja. — Vou te mostrar um segredo da noite.', 'noite', 'grama', [['coruja', 160, 200, 1.4], ['coruja', 250, 210, 0.9, { cor: '#B98A5E' }]]),
      pg('Elas voaram bem alto, e Lua viu o céu cheio de estrelas piscando, como luzinhas de festa.', 'noite', 'nenhum', [['estrela', 90, 90, 0.7], ['estrela', 320, 70, 0.5], ['coruja', 160, 220, 1], ['coruja', 240, 230, 0.7, { cor: '#B98A5E' }]]),
      pg('Lá embaixo, os vaga-lumes dançavam entre as flores, acendendo e apagando.', 'noite', 'grama', [['flor', 80, 240, 1.3], ['flor', 300, 244, 1.2, { cor: '#FFD54F' }], ['vagalume', 120, 170], ['vagalume', 200, 140], ['vagalume', 260, 190], ['vagalume', 330, 150], ['coruja', 200, 250, 0.7, { cor: '#B98A5E' }]]),
      pg('E a lua cheia brilhava tão bonita que parecia sorrir para ela.', 'noite', 'grama', [['lua', 200, 100, 1.8, { cheia: 1, rosto: 1 }], ['coruja', 200, 250, 0.9, { cor: '#B98A5E' }]]),
      pg('— A noite não é escura — disse Lua. — Ela é cheia de luzinhas!', 'noite', 'grama', [['lua', 330, 70, 0.9, { cheia: 1 }], ['vagalume', 100, 150], ['vagalume', 290, 170], ['coruja', 200, 240, 1.4, { cor: '#B98A5E', boca: 1 }]]),
      pg('Desde então, Lua espera a noite chegar para contar as estrelas. Quantas você consegue contar? Boa noite! Fim.', 'noite', 'grama', [['estrela', 80, 80, 0.5], ['estrela', 200, 60, 0.6], ['estrela', 320, 90, 0.5], ['arvore', 200, 240, 1.3, { cor: '#3E7F52' }], ['coruja', 200, 150, 0.9, { cor: '#B98A5E' }]]),
    ]),
    H('peixinho-ceu', 'O Peixinho que Queria Ver o Céu', 'História original', '#2E9BD6', { ceu: 'mar', chao: 'fundo', itens: [['alga', 60, 300, 1.4], ['alga', 340, 300, 1.2, { alto: 70 }], ['peixe', 200, 150, 1.8, { bolhas: 1 }]] }, [
      pg('No fundo do mar morava Tito, um peixinho laranja muito curioso.', 'mar', 'fundo', [['alga', 60, 300, 1.4], ['alga', 90, 300, 1, { alto: 70 }], ['pedra', 320, 280, 1.4], ['peixe', 210, 160, 1.8, { bolhas: 1 }]]),
      pg('Todo dia ele olhava para cima e via uma luz azul brilhando. — O que será que tem lá em cima?', 'mar', 'fundo', [['alga', 340, 300, 1.3], ['peixe', 180, 180, 1.6, { gira: -30 }]]),
      pg('A velha tartaruga explicou: — Lá em cima fica o céu, com o sol, as nuvens e os passarinhos.', 'mar', 'fundo', [['tartaruga', 250, 200, 1.6], ['peixe', 110, 170, 1.3]]),
      pg('Tito nadou, nadou, tomou impulso e deu um pulo bem alto para fora da água!', 'dia', 'agua', [['sol', 330, 56, 0.9, { rosto: 1 }], ['nuvem', 110, 70, 0.9], ['peixe', 200, 150, 1.6, { gira: -25 }]]),
      pg('Por um instante, viu o céu azulzinho, uma nuvem fofa e um passarinho que acenou para ele.', 'dia', 'agua', [['nuvem', 300, 70, 1], ['passaro', 280, 140, 1.4, { voa: 1, vira: 1 }], ['peixe', 160, 170, 1.4, { boca: 1 }]]),
      pg('Splash! Ele voltou para a água, com o coração batendo forte de alegria.', 'mar', 'fundo', [['peixe', 200, 140, 1.7, { bolhas: 1 }], ['coracao', 260, 100, 1.2]]),
      pg('— Vocês não vão acreditar no que eu vi! — contou aos amigos. E todos quiseram ouvir a história.', 'mar', 'fundo', [['peixe', 120, 150, 1.5, { boca: 1 }], ['peixe', 260, 130, 1.1, { cor: '#FFD54F', esc: '#F4B400', vira: 1 }], ['peixe', 300, 200, 1.1, { cor: '#F06292', esc: '#D84B7A', vira: 1 }], ['alga', 40, 300, 1.2]]),
      pg('Tito descobriu que o mundo é enorme, e que a curiosidade nos leva longe. Fim.', 'mar', 'fundo', [['alga', 60, 300, 1.3], ['alga', 350, 300, 1.2], ['peixe', 200, 160, 1.9, { bolhas: 1 }]]),
    ]),
    H('estrelinha', 'A Estrelinha que Caiu do Céu', 'História original · para dormir', '#F4B400', { ceu: 'noite', chao: 'grama', itens: [['estrela', 200, 150, 1.6], ['crianca', 300, 246, 1.1, { menina: 1, roupa: '#9B7BD4' }]] }, [
      pg('Bia era a menor estrela do céu. Ela brilhava pouquinho e achava que ninguém a via.', 'noite', 'nenhum', [['estrela', 200, 150, 0.9, { triste: 1 }], ['lua', 330, 70, 0.9, { cheia: 1 }]]),
      pg('Uma noite, Bia escorregou de uma nuvem e caiu, caiu, caiu... até o jardim de uma casa.', 'noite', 'grama', [['nuvem', 90, 60, 0.9, { cinza: 1 }], ['estrela', 220, 150, 0.8, { gira: 25, boca: 1 }], ['casa', 330, 234, 1, { tipo: 'tijolo' }]]),
      pg('Clara, uma menina que não conseguia dormir, viu uma luz brilhando na grama.', 'noite', 'grama', [['casa', 320, 234, 1.1, { tipo: 'tijolo' }], ['crianca', 170, 246, 1.4, { menina: 1, roupa: '#9B7BD4' }], ['estrela', 90, 250, 0.6]]),
      pg('— Você é uma estrela? — perguntou Clara. — Sou, mas sou tão pequena que ninguém sente a minha falta — disse Bia, triste.', 'noite', 'grama', [['crianca', 160, 246, 1.5, { menina: 1, roupa: '#9B7BD4' }], ['estrela', 250, 200, 0.9, { triste: 1 }]]),
      pg('Clara olhou para o céu e disse: — Olha lá! Ficou um buraquinho escuro onde você brilhava. O céu sente a sua falta, sim!', 'noite', 'grama', [['crianca', 160, 246, 1.5, { menina: 1, roupa: '#9B7BD4', aceno: 1 }], ['estrela', 240, 210, 0.8]]),
      pg('Clara soprou com força, e Bia subiu, subiu, de volta para o seu lugar.', 'noite', 'grama', [['crianca', 140, 246, 1.4, { menina: 1, roupa: '#9B7BD4', boca: 1 }], ['estrela', 260, 90, 0.8, { boca: 1 }]]),
      pg('Toda noite, Bia pisca para Clara lá do alto. E Clara pisca de volta.', 'noite', 'grama', [['estrela', 280, 70, 0.7], ['casa', 160, 234, 1.3, { tipo: 'tijolo' }], ['crianca', 300, 246, 1.1, { menina: 1, roupa: '#9B7BD4', aceno: 1 }]]),
      pg('Mesmo quem é pequenininho faz diferença no mundo. Fim.', 'noite', 'nenhum', [['estrela', 200, 160, 1.6], ['coracao', 200, 70, 1.4, { cor: '#FFD54F' }]]),
    ]),
    H('gato-novelo', 'O Gato Lelé e o Novelo Perdido', 'História original', '#D8394A', { ceu: 'dia', chao: 'grama', itens: [['gato', 160, 244, 1.6], ['novelo', 270, 246, 1.6]] }, [
      pg('O gato Lelé tinha um novelo de lã vermelha que era o seu brinquedo favorito.', 'casa', 'piso', [['gato', 170, 244, 1.7], ['novelo', 270, 246, 1.5]]),
      pg('Um dia, o novelo rolou pelo quintal, passou por baixo da cerca e sumiu!', 'dia', 'grama', [['gato', 100, 244, 1.4, { boca: 1 }], ['novelo', 320, 246, 1, { fio: -120 }]]),
      pg('Lelé procurou atrás das flores e perguntou ao cachorro Bolinha: — Você viu o meu novelo?', 'dia', 'grama', [['flor', 60, 238, 1.3], ['gato', 160, 244, 1.4], ['cachorro', 280, 246, 1.5, { vira: 1 }]]),
      pg('— Vi uma linha vermelha indo para lá! — piou o passarinho, apontando com a asa.', 'dia', 'grama', [['arvore', 270, 232, 1.2], ['passaro', 270, 140, 1.4, { voa: 1 }], ['gato', 120, 244, 1.3]]),
      pg('Lelé seguiu o fio vermelho pelo jardim, pela grama e ao redor da árvore.', 'dia', 'grama', [['arvore', 220, 232, 1.1], ['gato', 120, 244, 1.3], ['novelo', 380, 246, 0.8, { fio: -200 }]]),
      pg('No fim do fio estava a ratinha Nina, fazendo um cachecol com a lã! — Desculpe, Lelé, eu estava com frio.', 'tarde', 'grama', [['rato', 250, 248, 1.6, { cachecol: 1 }], ['novelo', 310, 248, 0.9], ['gato', 110, 244, 1.3]]),
      pg('Lelé pensou um pouco e sorriu: — Pode ficar com um pedaço. Brincar junto é mais gostoso!', 'tarde', 'grama', [['gato', 150, 244, 1.5, { boca: 1 }], ['rato', 260, 248, 1.4, { cachecol: 1 }], ['coracao', 205, 140, 1.3]]),
      pg('Agora Nina tem um cachecol quentinho, e Lelé tem uma amiga para brincar. Fim.', 'dia', 'grama', [['sol', 340, 56, 0.8, { rosto: 1 }], ['gato', 140, 244, 1.4], ['rato', 240, 248, 1.3, { cachecol: 1 }], ['novelo', 310, 248, 1]]),
    ]),
    H('cachorrinho-chuva', 'O Cachorrinho e a Chuva', 'História original', '#4FA3E0', { ceu: 'nublado', chao: 'grama', itens: [['nuvem', 200, 60, 1.2, { cinza: 1, chuva: 1 }], ['guardachuva', 150, 246, 1.4], ['cachorro', 250, 246, 1.5]] }, [
      pg('Totó adorava passear no parque com o Léo.', 'dia', 'grama', [['arvore', 330, 232], ['crianca', 140, 246, 1.4, { roupa: '#F59E0B' }], ['cachorro', 230, 246, 1.4, { lingua: 1 }]]),
      pg('Mas naquele sábado o céu ficou cinza e começou a chover.', 'nublado', 'grama', [['nuvem', 120, 70, 1.1, { cinza: 1, chuva: 1 }], ['nuvem', 290, 60, 1, { cinza: 1, chuva: 1 }], ['casa', 200, 236, 1.2, { tipo: 'tijolo' }]]),
      pg('Totó ficou triste olhando pela janela. — Sem passeio hoje — suspirou o Léo.', 'casa', 'piso', [['cachorro', 160, 246, 1.5, { triste: 1 }], ['crianca', 270, 246, 1.3, { roupa: '#F59E0B', triste: 1 }]]),
      pg('Então o Léo teve uma ideia: pegou as botas, a capa de chuva e um guarda-chuva amarelo.', 'casa', 'piso', [['crianca', 190, 246, 1.5, { roupa: '#F59E0B', capa: '#FACC15', botas: '#E25D6A', aceno: 1 }], ['cachorro', 290, 246, 1.2, { lingua: 1 }]]),
      pg('Os dois foram pular nas poças! Splash, splash! A água espirrava para todo lado.', 'nublado', 'grama', [['nuvem', 300, 60, 1, { cinza: 1, chuva: 1 }], ['poca', 180, 256, 2], ['crianca', 150, 230, 1.3, { roupa: '#F59E0B', capa: '#FACC15', botas: '#E25D6A', boca: 1 }], ['cachorro', 240, 236, 1.3, { lingua: 1 }]]),
      pg('Encontraram um sapo cantando feliz e minhocas passeando na grama molhada.', 'nublado', 'grama', [['sapo', 220, 250, 1.8, { boca: 1 }], ['nota', 260, 170], ['cachorro', 110, 246, 1.3]]),
      pg('Quando a chuva parou, um arco-íris enorme apareceu no céu.', 'dia', 'grama', [['arcoiris', 200, 230, 1.5], ['crianca', 150, 246, 1.2, { roupa: '#F59E0B', aceno: 1 }], ['cachorro', 230, 246, 1.2, { lingua: 1 }]]),
      pg('Totó aprendeu que dia de chuva também pode ser um dia de aventura. Fim.', 'dia', 'grama', [['sol', 330, 60, 0.8, { rosto: 1 }], ['poca', 200, 256, 1.6], ['cachorro', 190, 246, 1.6, { lingua: 1 }]]),
    ]),
    H('sementinha', 'A Sementinha Paciente', 'História original', '#6CC05B', { ceu: 'dia', chao: 'terra', itens: [['sol', 320, 70, 1, { rosto: 1 }], ['girassol', 180, 250, 1.4]] }, [
      pg('Uma sementinha caiu na terra e ficou ali, quietinha, esperando.', 'dia', 'terra', [['sol', 330, 60, 0.7], ['semente', 200, 262, 1.8]]),
      pg('A chuva veio e molhou a terra. — Já posso crescer? — perguntou a sementinha. — Ainda não — respondeu a terra.', 'nublado', 'terra', [['nuvem', 200, 70, 1.2, { chuva: 1 }], ['semente', 200, 262, 1.8]]),
      pg('O sol esquentou o chão por muitos dias. A sementinha esperou, com paciência.', 'dia', 'terra', [['sol', 200, 80, 1.3, { rosto: 1 }], ['semente', 200, 262, 1.8]]),
      pg('Até que, numa manhã, saiu um brotinho verde, pequenininho, olhando o mundo pela primeira vez.', 'dia', 'terra', [['sol', 330, 60, 0.8], ['broto', 200, 256, 1.6]]),
      pg('O brotinho cresceu um pouco a cada dia, ganhou folhas e ficou forte.', 'dia', 'terra', [['sol', 330, 60, 0.8], ['broto', 200, 256, 2.2, { alto: 50 }], ['passaro', 300, 150, 1.2, { voa: 1, vira: 1 }]]),
      pg('Um dia, abriu uma flor amarela, grande e linda, virada para o sol.', 'dia', 'terra', [['sol', 330, 60, 0.9, { rosto: 1 }], ['girassol', 190, 256, 1.6]]),
      pg('E da flor caíram novas sementinhas, prontas para começar tudo de novo.', 'tarde', 'terra', [['girassol', 150, 256, 1.4], ['semente', 240, 262, 1.3], ['semente', 280, 264, 1.2], ['semente', 320, 262, 1.3]]),
      pg('Coisas bonitas levam tempo. Com paciência, tudo cresce. Fim.', 'dia', 'grama', [['sol', 330, 60, 0.8, { rosto: 1 }], ['girassol', 110, 250, 1.1], ['girassol', 200, 250, 1.3], ['girassol', 290, 250, 1.1]]),
    ]),
  ];
  const TAGS = [['todas', 'Todas'], ['fabula', 'Fábulas'], ['original', 'Originais'], ['dormir', 'Para dormir'], ['animais', 'Bichinhos']];
  const ehDe = (h, t) => t === 'todas' || (t === 'fabula' && /Esopo|popular/i.test(h.tag)) || (t === 'original' && /original/i.test(h.tag)) || (t === 'dormir' && /dormir/i.test(h.tag)) || (t === 'animais' && !/menino|estrelinha/.test(h.id));
  const porId = (id) => HISTORIAS.find((h) => h.id === id);
  const minutos = (h) => Math.max(2, Math.round(h.paginas.reduce((s, x) => s + x.t.split(/\s+/).length, 0) / 110));

  /* Livros infantis prontos e gratuitos da web (domínio público no Brasil), conferidos em novembro de 2026:
     Wikisource em português e Project Gutenberg. Abrem no leitor normal, com narração. */
  const W = (titulo, t, a, tag) => ({ src: 'ws:' + titulo, t, a, l: 'pt', tag, fonte: 'Wikisource' });
  const G = (id, t, a, l, tag) => ({ src: 'gb:' + id, t, a, l, tag, fonte: 'Project Gutenberg' });
  const ACERVO = [
    W('A Menina do Narizinho Arrebitado', 'A Menina do Narizinho Arrebitado', 'Monteiro Lobato', 'Sítio do Picapau Amarelo · ilustrado'),
    W('As Reinações de Narizinho', 'As Reinações de Narizinho', 'Monteiro Lobato', 'Sítio do Picapau Amarelo'),
    W('Fabulas de Narizinho', 'Fábulas de Narizinho', 'Monteiro Lobato', 'Fábulas'),
    W('Fabulas (9ª edição)', 'Fábulas', 'Monteiro Lobato', 'Fábulas'),
    W('As Caçadas de Pedrinho', 'As Caçadas de Pedrinho', 'Monteiro Lobato', 'Sítio do Picapau Amarelo'),
    W('O Saci (8ª edição)', 'O Saci', 'Monteiro Lobato', 'Sítio do Picapau Amarelo'),
    W('A Reforma da Natureza (12ª edição)', 'A Reforma da Natureza', 'Monteiro Lobato', 'Sítio do Picapau Amarelo'),
    W('Peter Pan (Lobato, 1935)', 'Peter Pan', 'J. M. Barrie (tradução de Monteiro Lobato)', 'Aventura'),
    W('Alice no País das Maravilhas (Trad. Lobato, 8ª edição)', 'Alice no País das Maravilhas', 'Lewis Carroll (tradução de Monteiro Lobato)', 'Fantasia'),
    W('O Conto de Peter Rabbit', 'O Conto de Peter Rabbit', 'Beatrix Potter', 'Bichinhos · ilustrado'),
    W('O Conto de Jemima Puddle-Duck', 'O Conto de Jemima Puddle-Duck', 'Beatrix Potter', 'Bichinhos · ilustrado'),
    W('O Conto do Sr. Jeremy Fisher', 'O Conto do Sr. Jeremy Fisher', 'Beatrix Potter', 'Bichinhos · ilustrado'),
    W('O Conto da Sra. Tittlemouse', 'O Conto da Sra. Tittlemouse', 'Beatrix Potter', 'Bichinhos · ilustrado'),
    W('Através do Brasil', 'Através do Brasil', 'Olavo Bilac e Manoel Bomfim', 'Aventura pelo Brasil'),
    G(16429, 'Contos para a Infância', 'Guerra Junqueiro', 'pt', 'Contos escolhidos'),
    G(30510, 'Pérolas e Diamantes: Contos Infantis', 'Irmãos Grimm', 'pt', 'Contos de fadas'),
    G(69239, 'Era uma vez...', 'Júlia Lopes de Almeida', 'pt', 'Contos'),
    G(14838, 'The Tale of Peter Rabbit', 'Beatrix Potter', 'en', 'Inglês · ilustrado'),
    G(14220, 'The Tale of the Flopsy Bunnies', 'Beatrix Potter', 'en', 'Inglês · ilustrado'),
    G(14837, 'The Tale of Tom Kitten', 'Beatrix Potter', 'en', 'Inglês · ilustrado'),
    G(15284, 'The Tale of Johnny Town-Mouse', 'Beatrix Potter', 'en', 'Inglês · ilustrado'),
    G(19994, 'The Aesop for Children', 'Esopo', 'en', 'Fábulas · ilustrado'),
    G(11757, 'The Velveteen Rabbit', 'Margery Williams', 'en', 'Inglês · ilustrado'),
    G(15661, 'The Golden Goose Book', 'L. Leslie Brooke', 'en', 'Contos · ilustrado'),
    G(17208, 'The Tales of Mother Goose', 'Charles Perrault', 'en', 'Contos de fadas'),
    G(25609, "A Child's Garden of Verses", 'Robert Louis Stevenson', 'en', 'Poesia'),
    G(2781, 'Just So Stories', 'Rudyard Kipling', 'en', 'Contos · ilustrado'),
    G(500, 'The Adventures of Pinocchio', 'Carlo Collodi', 'en', 'Aventura'),
    G(236, 'The Jungle Book', 'Rudyard Kipling', 'en', 'Aventura'),
    G(1597, "Andersen's Fairy Tales", 'Hans Christian Andersen', 'en', 'Contos de fadas'),
    G(2591, "Grimms' Fairy Tales", 'Irmãos Grimm', 'en', 'Contos de fadas'),
    G(11, "Alice's Adventures in Wonderland", 'Lewis Carroll', 'en', 'Fantasia'),
    G(16, 'Peter Pan', 'J. M. Barrie', 'en', 'Aventura'),
    G(55, 'The Wonderful Wizard of Oz', 'L. Frank Baum', 'en', 'Fantasia'),
  ];
  /* nada de conteúdo adulto nas buscas infantis */
  const PROIBIDO = /erot|sex|lust|porn|amour|venus|nud|sadom|prostitu|libertin|crime|murder|assassin|horror|terror/i;

  return { HISTORIAS, TAGS, ACERVO, PROIBIDO, cena, porId, ehDe, minutos };
})();
