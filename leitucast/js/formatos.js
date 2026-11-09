/* Abre ebooks em vários formatos e devolve um modelo único para o leitor:
   { meta: {titulo, autor, idioma, descricao, assuntos, data, isbn}, capa: Blob|null,
     caps: [{titulo, html, ids}], toc: [{titulo, cap, ancora, nivel}], img(path) -> Promise<url>, amostra: texto inicial }
   Formatos: EPUB 2/3, PDF (texto), TXT, FB2, DOCX, HTML. O HTML de cada capítulo é limpo (sem scripts nem estilos). */
'use strict';
const Formatos = (() => {
  const MAX_CAP = 140000;

  /* ---------- limpeza de HTML ---------- */
  const MANTER = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'em', 'i', 'strong', 'b', 'u', 's', 'sup', 'sub', 'small', 'br', 'hr', 'blockquote',
    'ul', 'ol', 'li', 'dl', 'dt', 'dd', 'pre', 'code', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'figure', 'figcaption', 'cite', 'q', 'abbr', 'mark']);
  const COMO_DIV = new Set(['div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'center', 'body', 'nav']);
  const DESCARTAR = new Set(['script', 'style', 'link', 'meta', 'head', 'title', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'select', 'textarea', 'audio', 'video', 'canvas', 'noscript', 'template', 'math']);
  const CLASSES = [[/center|centr|\bc\b|titlepage/i, 'c-centro'], [/poem|poetry|stanza|verse|linegroup|\blg\b/i, 'c-poema'], [/right|signature|dateline/i, 'c-direita'], [/noindent|no-indent|first|nind/i, 'c-semrecuo'], [/smcap|small-?caps/i, 'c-versalete'], [/caption/i, 'c-legenda']];

  function caminho(base, href) {
    if (!href) return '';
    if (/^[a-z]+:/i.test(href)) return href;
    const [p, frag] = href.split('#');
    const partes = (base.includes('/') ? base.slice(0, base.lastIndexOf('/') + 1) : '').split('/').filter(Boolean);
    for (const s of decodeURIComponent(p || '').split('/')) {
      if (!s || s === '.') continue;
      if (s === '..') partes.pop(); else partes.push(s);
    }
    const r = p ? partes.join('/') : base;
    return frag !== undefined ? r + '#' + frag : r;
  }
  function limpar(raiz, docPath, imgs) {
    const out = [];
    const ids = [];
    const anda = (n) => {
      if (n.nodeType === 3) { out.push(esc(n.nodeValue)); return; }
      if (n.nodeType !== 1) return;
      const tag = n.localName.toLowerCase();
      if (DESCARTAR.has(tag)) return;
      const id = n.getAttribute('id') || n.getAttribute('name');
      if (id === 'pg-header' || /pg-boilerplate|pgheader/.test(n.getAttribute('class') || '')) return;
      let attrs = '';
      if (id) { attrs += ` data-id="${esc(id)}"`; ids.push(id); }
      const cls = (n.getAttribute('class') || '') + ' ' + (/text-align:\s*center/i.test(n.getAttribute('style') || '') ? 'center' : '');
      const mine = CLASSES.filter(([rx]) => rx.test(cls)).map(([, c]) => c);
      if (mine.length) attrs += ` class="${mine.join(' ')}"`;
      if (tag === 'img' || tag === 'image') {
        const src = n.getAttribute('src') || n.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || n.getAttribute('href') || n.getAttribute('xlink:href');
        if (src && /^data:image\//.test(src)) { out.push(`<img src="${esc(src)}" alt="${esc(n.getAttribute('alt') || '')}"${attrs}>`); return; } // ilustração já embutida no livro
        if (src && !/^https?:/.test(src)) {
          const p = caminho(docPath, src);
          imgs.add(p);
          out.push(`<img data-lc="${esc(p)}" alt="${esc(n.getAttribute('alt') || '')}"${attrs}>`);
        }
        return;
      }
      if (tag === 'svg') { for (const im of n.getElementsByTagName('image')) anda(im); return; }
      if (tag === 'a') {
        const href = n.getAttribute('href') || n.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '';
        if (/^https?:/i.test(href)) out.push(`<a href="${esc(href)}" target="_blank" rel="noopener noreferrer"${attrs}>`);
        else if (href) out.push(`<a data-ir="${esc(caminho(docPath, href))}"${attrs}>`);
        else out.push(`<span${attrs}>`);
        n.childNodes.forEach(anda);
        out.push(href ? '</a>' : '</span>');
        return;
      }
      let t = MANTER.has(tag) ? tag : COMO_DIV.has(tag) ? 'div' : (tag === 'span' || tag === 'font' || tag === 'big') ? 'span' : 'div';
      if (tag === 'span' && !attrs) { n.childNodes.forEach(anda); return; }
      if (t === 'br' || t === 'hr') { out.push(`<${t}${attrs}>`); return; }
      out.push(`<${t}${attrs}>`);
      n.childNodes.forEach(anda);
      out.push(`</${t}>`);
    };
    raiz.childNodes.forEach(anda);
    return { html: out.join('').replace(/(\s*<br>\s*){3,}/g, '<br><br>'), ids };
  }
  const textoDe = (html) => html.replace(/<(p|div|h\d|li|br|blockquote)[^>]*>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n\n').trim();
  const tituloDoHtml = (html) => {
    const rx = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
    const m1 = rx.exec(html);
    if (!m1) return '';
    let t = textoDe(m1[2]).replace(/\s+/g, ' ').trim();
    const resto = html.slice(rx.lastIndex);
    const m2 = /^(\s|<hr[^>]*>|<br>)*<h([1-6])[^>]*>([\s\S]*?)<\/h\2>/i.exec(resto);
    if (m2) { const t2 = textoDe(m2[3]).replace(/\s+/g, ' ').trim(); if (t2 && t2.length < 80) t = t ? `${t} · ${t2}` : t2; }
    return t.slice(0, 90);
  };

  /* divide documentos grandes nos capítulos (títulos e linhas de separação) e nunca deixa passar do limite */
  // tamanho do texto, sem contar ilustrações embutidas (data:), que não pesam na diagramação
  const tamTexto = (s) => (s.indexOf('data:') < 0 ? s.length : s.replace(/src="data:[^"]*"/g, 'src=""').length);
  function dividir(cap) {
    if (tamTexto(cap.html) <= 60000) return [cap];
    const tmp = document.createElement('div');
    tmp.innerHTML = cap.html;
    let alvo = tmp;
    while (alvo.children.length === 1 && alvo.firstElementChild.children.length > 1) alvo = alvo.firstElementChild;
    const ehTit = (el) => el.nodeType === 1 && /^H[1-6]$/.test(el.tagName);
    const partes = [];
    let atual = [], tam = 0, antTit = false;
    for (const el of Array.from(alvo.childNodes)) {
      const h = el.nodeType === 1 ? el.outerHTML : esc(el.nodeValue || '');
      if (el.nodeType === 3 && !el.nodeValue.trim()) { atual.push(h); continue; }
      const tit = ehTit(el);
      const secao = el.nodeType === 1 && !tit && el.firstElementChild && /^H[1-6]$/.test(el.firstElementChild.tagName) && el.textContent.length > 400;
      const quebra = (el.nodeType === 1 && el.tagName === 'HR') || (tit && !antTit) || secao;
      const th = tamTexto(h);
      if ((quebra && tam > 2500) || (tam + th > MAX_CAP && tam > 0)) { partes.push(atual.join('')); atual = []; tam = 0; }
      atual.push(h); tam += th;
      if (el.nodeType === 1) antTit = tit || el.tagName === 'HR' ? true : false;
    }
    if (atual.length) partes.push(atual.join(''));
    return partes.map((html, i) => ({ titulo: tituloDoHtml(html) || (cap.titulo ? `${cap.titulo} (${i + 1})` : ''), html, ids: Array.from(html.matchAll(/data-id="([^"]+)"/g), (m) => m[1]), path: cap.path }));
  }

  /* ================= EPUB ================= */
  async function epub(blob) {
    if (!self.JSZip) throw new Error('JSZip não carregou');
    const zip = await JSZip.loadAsync(blob);
    const arq = (p) => zip.file(p) || zip.file(decodeURIComponent(p)) || zip.file(p.replace(/%20/g, ' '));
    const ler = async (p) => { const f = arq(p); return f ? f.async('string') : null; };
    const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
    const cont = await ler('META-INF/container.xml');
    if (!cont) throw new Error('EPUB inválido (sem container.xml)');
    const opfPath = (cont.match(/full-path="([^"]+)"/) || [])[1];
    const opf = xml(await ler(opfPath));
    const tagNS = (el, n) => Array.from(el.getElementsByTagNameNS('*', n));
    const meta = opf.getElementsByTagNameNS('*', 'metadata')[0] || opf;
    const dc = (n) => tagNS(meta, n).map((e) => e.textContent.trim()).filter(Boolean);
    const m = {
      titulo: dc('title')[0] || '', autor: dc('creator').join(', '), idioma: (dc('language')[0] || '').slice(0, 2).toLowerCase(),
      descricao: textoDe(dc('description')[0] || ''), assuntos: dc('subject'), data: dc('date')[0] || '', editora: dc('publisher')[0] || '',
      isbn: (dc('identifier').find((x) => /97[89]\d{10}|\d{9}[\dX]/.test(x.replace(/-/g, ''))) || '').replace(/[^\dX]/g, ''),
    };
    const man = {};
    for (const it of tagNS(opf, 'item')) man[it.getAttribute('id')] = { href: caminho(opfPath, it.getAttribute('href')), tipo: it.getAttribute('media-type') || '', props: it.getAttribute('properties') || '' };
    // capa
    let capaPath = '';
    const capaMeta = tagNS(meta, 'meta').find((x) => x.getAttribute('name') === 'cover');
    if (capaMeta && man[capaMeta.getAttribute('content')]) capaPath = man[capaMeta.getAttribute('content')].href;
    if (!capaPath) { const c = Object.values(man).find((x) => /cover-image/.test(x.props)); if (c) capaPath = c.href; }
    if (!capaPath) { const c = Object.entries(man).find(([id, x]) => /cover/i.test(id + x.href) && /^image\//.test(x.tipo)); if (c) capaPath = c[1].href; }
    let capa = null;
    if (capaPath && arq(capaPath)) capa = new Blob([await arq(capaPath).async('arraybuffer')], { type: (Object.values(man).find((x) => x.href === capaPath) || {}).tipo || 'image/jpeg' });
    // espinha
    const spineEl = opf.getElementsByTagNameNS('*', 'spine')[0];
    const spine = tagNS(spineEl, 'itemref').map((r) => man[r.getAttribute('idref')]).filter((x) => x && /html|xml/.test(x.tipo));
    const imgs = new Set();
    let caps = [];
    for (const it of spine) {
      const s = await ler(it.href);
      if (s == null) continue;
      let doc = new DOMParser().parseFromString(s, 'application/xhtml+xml');
      if (doc.getElementsByTagName('parsererror').length) doc = new DOMParser().parseFromString(s, 'text/html');
      const body = doc.body || doc.getElementsByTagName('body')[0];
      if (!body) continue;
      const { html, ids } = limpar(body, it.href, imgs);
      const texto = textoDe(html);
      const soImagem = texto.length < 40 && /<img/.test(html);
      if (!texto && !soImagem) continue;
      if (soImagem && capaPath && html.includes(capaPath) && caps.length === 0) continue; // página que só mostra a capa
      caps.push({ titulo: tituloDoHtml(html), html, ids, path: it.href });
    }
    // sumário
    const toc = [];
    const nav = Object.values(man).find((x) => /\bnav\b/.test(x.props));
    if (nav) {
      const s = await ler(nav.href);
      if (s) {
        let d = new DOMParser().parseFromString(s, 'application/xhtml+xml');
        if (d.getElementsByTagName('parsererror').length) d = new DOMParser().parseFromString(s, 'text/html');
        const navs = Array.from(d.getElementsByTagName('nav'));
        const tn = navs.find((n) => /toc/.test(n.getAttribute('epub:type') || n.getAttributeNS('http://www.idpf.org/2007/ops', 'type') || '')) || navs[0];
        const percorre = (ol, nivel) => {
          for (const li of Array.from(ol.children).filter((x) => x.localName === 'li')) {
            const a = Array.from(li.children).find((x) => x.localName === 'a' || x.localName === 'span');
            if (a && a.getAttribute('href')) toc.push({ titulo: a.textContent.replace(/\s+/g, ' ').trim(), alvo: caminho(nav.href, a.getAttribute('href')), nivel });
            const sub = Array.from(li.children).find((x) => x.localName === 'ol');
            if (sub) percorre(sub, nivel + 1);
          }
        };
        const ol = tn && Array.from(tn.getElementsByTagName('ol'))[0];
        if (ol) percorre(ol, 0);
      }
    }
    if (!toc.length) {
      const ncxId = spineEl && spineEl.getAttribute('toc');
      const ncx = (ncxId && man[ncxId]) || Object.values(man).find((x) => /ncx/.test(x.tipo));
      if (ncx) {
        const s = await ler(ncx.href);
        if (s) {
          const d = xml(s);
          const percorre = (el, nivel) => {
            for (const np of Array.from(el.children).filter((x) => x.localName === 'navPoint')) {
              const lab = np.getElementsByTagNameNS('*', 'text')[0];
              const c = np.getElementsByTagNameNS('*', 'content')[0];
              if (lab && c) toc.push({ titulo: lab.textContent.replace(/\s+/g, ' ').trim(), alvo: caminho(ncx.href, c.getAttribute('src')), nivel });
              percorre(np, nivel + 1);
            }
          };
          const nm = d.getElementsByTagNameNS('*', 'navMap')[0];
          if (nm) percorre(nm, 0);
        }
      }
    }
    caps = caps.flatMap(dividir);
    const tocFinal = resolverToc(toc, caps);
    caps.forEach((c, i) => { if (!c.titulo) { const t = tocFinal.find((x) => x.cap === i && !x.ancora); c.titulo = t ? t.titulo : ''; } });
    const urls = new Map();
    const img = async (p) => {
      if (urls.has(p)) return urls.get(p);
      const f = arq(p);
      if (!f) return '';
      const ext = p.split('.').pop().toLowerCase();
      const tipo = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' }[ext] || 'image/jpeg';
      const u = URL.createObjectURL(new Blob([await f.async('arraybuffer')], { type: tipo }));
      urls.set(p, u);
      return u;
    };
    return finalizar({ meta: m, capa, caps, toc: tocFinal, img, liberar: () => urls.forEach((u) => URL.revokeObjectURL(u)) });
  }
  function resolverToc(toc, caps) {
    const out = [];
    for (const t of toc) {
      const [p, frag] = t.alvo.split('#');
      let cap = -1;
      if (frag) cap = caps.findIndex((c) => c.path === p && c.ids.includes(frag));
      if (cap < 0) cap = caps.findIndex((c) => c.path === p);
      if (cap < 0) continue;
      out.push({ titulo: t.titulo || `Capítulo ${cap + 1}`, cap, ancora: frag || '', nivel: t.nivel || 0 });
    }
    if (!out.length) caps.forEach((c, i) => out.push({ titulo: c.titulo || `Parte ${i + 1}`, cap: i, ancora: '', nivel: 0 }));
    return out;
  }
  function finalizar(l) {
    l.caps = l.caps.filter((c) => c.html && c.html.trim());
    l.caps.forEach((c, i) => { c.titulo = c.titulo || `Parte ${i + 1}`; });
    let amostra = '';
    for (const c of l.caps) { const t = textoDe(c.html); if (t.length > 300) amostra += t + '\n\n'; if (amostra.length > 40000) break; }
    l.amostra = amostra.slice(0, 40000);
    l.palavras = l.caps.reduce((s, c) => s + (textoDe(c.html).match(/\S+/g) || []).length, 0);
    if (!l.img) l.img = async () => '';
    if (!l.liberar) l.liberar = () => {};
    return l;
  }

  /* ================= Texto puro ================= */
  function decodificar(buf) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch (e) { return new TextDecoder('windows-1252').decode(buf); }
  }
  const RX_CAP = /^\s*((cap[ií]tulo|chapter|parte|part|livro|book|cant[oa]|chapitre|cap[ií]tulo)\s+([\divxlc]+|[a-zà-ú]+)\b.*|[IVXLC]{1,6}\.?|\d{1,3}\.?)\s*$/i;
  function deTexto(txt, nomeArq) {
    txt = txt.replace(/\r\n?/g, '\n');
    const ini = txt.search(/\*\*\*\s*START OF (THE|THIS) PROJECT GUTENBERG[^\n]*\n/i);
    if (ini >= 0) txt = txt.slice(txt.indexOf('\n', ini) + 1);
    const fim = txt.search(/\*\*\*\s*END OF (THE|THIS) PROJECT GUTENBERG/i);
    if (fim >= 0) txt = txt.slice(0, fim);
    const temVazias = /\n\s*\n/.test(txt);
    const blocos = (temVazias ? txt.split(/\n\s*\n+/) : txt.split('\n')).map((b) => b.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean);
    const caps = [];
    let atual = { titulo: '', partes: [] };
    for (const b of blocos) {
      if (b.length < 70 && RX_CAP.test(b)) {
        if (atual.partes.length) caps.push(atual);
        atual = { titulo: b, partes: [`<h2>${esc(b)}</h2>`] };
      } else atual.partes.push(`<p>${esc(b)}</p>`);
    }
    if (atual.partes.length) caps.push(atual);
    let lista = caps.map((c, i) => ({ titulo: c.titulo || (i === 0 ? 'Início' : `Parte ${i + 1}`), html: c.partes.join(''), ids: [], path: 'txt' }));
    if (lista.length > 400) { // detecção exagerada: junta tudo
      lista = [{ titulo: 'Início', html: blocos.map((b) => `<p>${esc(b)}</p>`).join(''), ids: [], path: 'txt' }];
    }
    lista = lista.flatMap(dividir);
    const nome = Lia.doNomeDoArquivo(nomeArq || '');
    return finalizar({ meta: { titulo: nome.titulo, autor: nome.autor, idioma: '', descricao: '', assuntos: [] }, capa: null, caps: lista, toc: resolverToc([], lista) });
  }

  /* ================= HTML ================= */
  function deHtml(s, nomeArq) {
    const doc = new DOMParser().parseFromString(s, 'text/html');
    const imgs = new Set();
    const { html } = limpar(doc.body, 'x.html', imgs);
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    const caps = [];
    let atual = [], titulo = '';
    const flush = () => { if (atual.length) caps.push({ titulo, html: atual.join(''), ids: [], path: 'html' }); atual = []; };
    // conteúdo embrulhado num único bloco: desce para o bloco que tem o texto (não para o primeiro, que pode ser só o título)
    let plano = tmp;
    const filhos = Array.from(tmp.children);
    if (filhos.length && filhos.length <= 3) {
      const total = tmp.textContent.length || 1;
      const maior = filhos.reduce((a, b) => (b.textContent.length > a.textContent.length ? b : a));
      if (maior.textContent.length / total > 0.9 && maior.children.length > 1) plano = maior;
    }
    for (const el of Array.from(plano.childNodes)) {
      if (el.nodeType === 1 && /^H[12]$/.test(el.tagName)) { flush(); titulo = el.textContent.trim().slice(0, 90); }
      atual.push(el.nodeType === 1 ? el.outerHTML : esc(el.nodeValue || ''));
    }
    flush();
    const t = (doc.querySelector('title') || {}).textContent || '';
    const autor = (doc.querySelector('meta[name=author]') || { getAttribute: () => '' }).getAttribute('content') || '';
    const nome = Lia.doNomeDoArquivo(nomeArq || '');
    const lista = caps.flatMap(dividir);
    return finalizar({ meta: { titulo: t.trim() || nome.titulo, autor: autor || nome.autor, idioma: (doc.documentElement.lang || '').slice(0, 2), descricao: '', assuntos: [] }, capa: null, caps: lista, toc: resolverToc([], lista) });
  }

  /* ================= FB2 ================= */
  function deFb2(s) {
    const d = new DOMParser().parseFromString(s, 'application/xml');
    const ti = d.getElementsByTagName('title-info')[0];
    const pega = (el, n) => (el && el.getElementsByTagName(n)[0] ? el.getElementsByTagName(n)[0].textContent.trim() : '');
    const au = ti && ti.getElementsByTagName('author')[0];
    const autor = au ? [pega(au, 'first-name'), pega(au, 'middle-name'), pega(au, 'last-name')].filter(Boolean).join(' ') : '';
    const bins = {};
    for (const b of Array.from(d.getElementsByTagName('binary'))) bins[b.getAttribute('id')] = { tipo: b.getAttribute('content-type'), dados: b.textContent.replace(/\s+/g, '') };
    const blobDe = (id) => { const b = bins[id]; if (!b) return null; const bin = atob(b.dados); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Blob([u8], { type: b.tipo }); };
    const cp = ti && ti.getElementsByTagName('coverpage')[0];
    const cimg = cp && cp.getElementsByTagName('image')[0];
    const capaId = cimg ? (cimg.getAttribute('l:href') || cimg.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || cimg.getAttribute('xlink:href') || '').replace('#', '') : '';
    const conv = (el) => {
      let h = '';
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === 3) { h += esc(n.nodeValue); continue; }
        if (n.nodeType !== 1) continue;
        const t = n.localName;
        if (t === 'p') h += `<p>${conv(n)}</p>`;
        else if (t === 'title') h += `<h2>${textoDe(conv(n))}</h2>`;
        else if (t === 'subtitle') h += `<h3>${conv(n)}</h3>`;
        else if (t === 'emphasis') h += `<em>${conv(n)}</em>`;
        else if (t === 'strong') h += `<strong>${conv(n)}</strong>`;
        else if (t === 'empty-line') h += '<br>';
        else if (t === 'poem' || t === 'stanza') h += `<div class="c-poema">${conv(n)}</div>`;
        else if (t === 'v') h += `<p>${conv(n)}</p>`;
        else if (t === 'epigraph' || t === 'cite') h += `<blockquote>${conv(n)}</blockquote>`;
        else if (t === 'image') { const id = (n.getAttribute('l:href') || n.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || '').replace('#', ''); if (bins[id]) h += `<img data-lc="${esc(id)}" alt="">`; }
        else if (t !== 'section') h += conv(n);
      }
      return h;
    };
    const body = d.getElementsByTagName('body')[0];
    const caps = [];
    const secoes = body ? Array.from(body.children).filter((x) => x.localName === 'section') : [];
    const anda = (sec) => {
      const filhas = Array.from(sec.children).filter((x) => x.localName === 'section');
      const proprio = conv(sec);
      if (textoDe(proprio).length > 20) caps.push({ titulo: textoDe(conv(sec.getElementsByTagName('title')[0] || document.createElement('x'))).slice(0, 90), html: proprio, ids: [], path: 'fb2' });
      filhas.forEach(anda);
    };
    if (secoes.length) secoes.forEach(anda); else if (body) caps.push({ titulo: '', html: conv(body), ids: [], path: 'fb2' });
    const urls = new Map();
    const img = async (id) => { if (urls.has(id)) return urls.get(id); const b = blobDe(id); const u = b ? URL.createObjectURL(b) : ''; urls.set(id, u); return u; };
    const lista = caps.flatMap(dividir);
    return finalizar({ meta: { titulo: pega(ti, 'book-title'), autor, idioma: pega(ti, 'lang'), descricao: textoDe(conv(ti && ti.getElementsByTagName('annotation')[0] || document.createElement('x'))), assuntos: Array.from(ti ? ti.getElementsByTagName('genre') : []).map((g) => g.textContent) }, capa: capaId ? blobDe(capaId) : null, caps: lista, toc: resolverToc([], lista), img, liberar: () => urls.forEach((u) => URL.revokeObjectURL(u)) });
  }

  /* ================= DOCX ================= */
  async function deDocx(blob, nomeArq) {
    const zip = await JSZip.loadAsync(blob);
    const xmlS = await zip.file('word/document.xml').async('string');
    const d = new DOMParser().parseFromString(xmlS, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const caps = [];
    let atual = { titulo: '', partes: [] };
    for (const p of Array.from(d.getElementsByTagNameNS(W, 'p'))) {
      const st = p.getElementsByTagNameNS(W, 'pStyle')[0];
      const estilo = st ? st.getAttributeNS(W, 'val') || st.getAttribute('w:val') || '' : '';
      let h = '';
      for (const r of Array.from(p.getElementsByTagNameNS(W, 'r'))) {
        const t = Array.from(r.getElementsByTagNameNS(W, 't')).map((x) => x.textContent).join('');
        if (!t) { if (r.getElementsByTagNameNS(W, 'br').length) h += '<br>'; continue; }
        const rp = r.getElementsByTagNameNS(W, 'rPr')[0];
        let s = esc(t);
        if (rp && rp.getElementsByTagNameNS(W, 'i').length) s = `<em>${s}</em>`;
        if (rp && rp.getElementsByTagNameNS(W, 'b').length) s = `<strong>${s}</strong>`;
        h += s;
      }
      const texto = textoDe(h);
      if (/^(heading1|heading2|title|t[ií]tulo1|t[ií]tulo|ttulo1|cabealho1)$/i.test(estilo.replace(/\s/g, '')) && texto) {
        if (atual.partes.length) caps.push(atual);
        atual = { titulo: texto.slice(0, 90), partes: [`<h2>${h}</h2>`] };
      } else if (texto) atual.partes.push(/^heading/i.test(estilo) ? `<h3>${h}</h3>` : `<p>${h}</p>`);
    }
    if (atual.partes.length) caps.push(atual);
    let titulo = '', autor = '';
    const core = zip.file('docProps/core.xml');
    if (core) { const c = new DOMParser().parseFromString(await core.async('string'), 'application/xml'); titulo = (c.getElementsByTagNameNS('*', 'title')[0] || {}).textContent || ''; autor = (c.getElementsByTagNameNS('*', 'creator')[0] || {}).textContent || ''; }
    const nome = Lia.doNomeDoArquivo(nomeArq || '');
    const lista = caps.map((c, i) => ({ titulo: c.titulo || (i ? `Parte ${i + 1}` : 'Início'), html: c.partes.join(''), ids: [], path: 'docx' })).flatMap(dividir);
    return finalizar({ meta: { titulo: titulo || nome.titulo, autor: autor || nome.autor, idioma: '', descricao: '', assuntos: [] }, capa: null, caps: lista, toc: resolverToc([], lista) });
  }

  /* ================= PDF (texto refluido) ================= */
  let pdfjs = null;
  async function dePdf(blob, nomeArq, progresso = () => {}) {
    if (!pdfjs) {
      pdfjs = await import(new URL('vendor/pdf.min.mjs', location.href).href);
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('vendor/pdf.worker.min.mjs', location.href).href;
    }
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
    const info = await pdf.getMetadata().catch(() => ({}));
    const paginas = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const pg = await pdf.getPage(i);
      const tc = await pg.getTextContent();
      const linhas = [];
      let linha = '', y = null, alturas = [];
      for (const it of tc.items) {
        if (!('str' in it)) continue;
        const yi = it.transform[5];
        if (y !== null && Math.abs(yi - y) > 2) { linhas.push({ t: linha, y }); linha = ''; }
        linha += (linha && !linha.endsWith(' ') && !it.str.startsWith(' ') ? ' ' : '') + it.str;
        if (it.height) alturas.push(it.height);
        y = yi;
        if (it.hasEOL) { linhas.push({ t: linha, y }); linha = ''; y = null; }
      }
      if (linha) linhas.push({ t: linha, y });
      alturas.sort((a, b) => a - b);
      paginas.push({ linhas: linhas.filter((l) => l.t.trim()), alt: alturas[Math.floor(alturas.length / 2)] || 10 });
      if (i % 5 === 0) progresso(i / pdf.numPages);
    }
    // cabeçalhos e rodapés repetidos
    const conta = new Map();
    for (const p of paginas) for (const l of [p.linhas[0], p.linhas[p.linhas.length - 1]]) if (l) { const k = norm(l.t).replace(/\d+/g, '#'); conta.set(k, (conta.get(k) || 0) + 1); }
    const repetidos = new Set(Array.from(conta).filter(([, c]) => c > Math.max(3, paginas.length * 0.3)).map(([k]) => k));
    const parags = [];
    paginas.forEach((p, pi) => {
      let atual = '';
      let yAnt = null;
      p.linhas.forEach((l) => {
        const t = l.t.trim();
        if (/^\d{1,4}$/.test(t) || repetidos.has(norm(t).replace(/\d+/g, '#'))) return;
        const salto = yAnt !== null && Math.abs(yAnt - l.y) > p.alt * 1.9;
        if (salto && atual) { parags.push({ t: atual, pg: pi }); atual = ''; }
        if (atual.endsWith('-') && /^[a-zà-ú]/.test(t)) atual = atual.slice(0, -1) + t;
        else atual += (atual ? ' ' : '') + t;
        if (/[.!?:"”»]$/.test(t) && t.length < 45) { parags.push({ t: atual, pg: pi }); atual = ''; }
        yAnt = l.y;
      });
      if (atual) parags.push({ t: atual, pg: pi, cont: true });
    });
    // junta parágrafos que continuam na página seguinte
    const final = [];
    for (const p of parags) {
      const ant = final[final.length - 1];
      if (ant && ant.cont && /^[a-zà-ú]/.test(p.t)) { ant.t += ' ' + p.t; ant.cont = p.cont; } else final.push({ ...p });
    }
    // capítulos: pelo sumário do PDF, por títulos ou a cada 12 páginas
    let marcos = [];
    try {
      const out = await pdf.getOutline();
      if (out && out.length) {
        for (const o of out) {
          let dest = o.dest;
          if (typeof dest === 'string') dest = await pdf.getDestination(dest);
          if (dest && dest[0]) { const idx = await pdf.getPageIndex(dest[0]); marcos.push({ pg: idx, titulo: o.title }); }
        }
      }
    } catch (e) { marcos = []; }
    const caps = [];
    if (marcos.length >= 2) {
      marcos.sort((a, b) => a.pg - b.pg);
      marcos.forEach((m, i) => {
        const ate = i + 1 < marcos.length ? marcos[i + 1].pg : Infinity;
        const ps = final.filter((p) => p.pg >= m.pg && p.pg < ate);
        if (ps.length) caps.push({ titulo: m.titulo, html: `<h2>${esc(m.titulo)}</h2>` + ps.map((p) => `<p>${esc(p.t)}</p>`).join(''), ids: [], path: 'pdf' });
      });
      const antes = final.filter((p) => p.pg < marcos[0].pg);
      if (antes.length) caps.unshift({ titulo: 'Início', html: antes.map((p) => `<p>${esc(p.t)}</p>`).join(''), ids: [], path: 'pdf' });
    } else {
      let atual = { titulo: 'Início', ps: [] };
      for (const p of final) {
        if (p.t.length < 60 && RX_CAP.test(p.t)) { if (atual.ps.length) caps.push(atual); atual = { titulo: p.t, ps: [`<h2>${esc(p.t)}</h2>`] }; }
        else atual.ps.push(`<p>${esc(p.t)}</p>`);
      }
      if (atual.ps.length) caps.push(atual);
      caps.forEach((c) => { c.html = c.ps.join(''); c.ids = []; c.path = 'pdf'; delete c.ps; });
    }
    // capa: primeira página renderizada
    let capa = null;
    try {
      const pg = await pdf.getPage(1);
      const vp0 = pg.getViewport({ scale: 1 });
      const vp = pg.getViewport({ scale: 420 / vp0.width });
      const cv = document.createElement('canvas');
      cv.width = vp.width; cv.height = vp.height;
      await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
      capa = await new Promise((r) => cv.toBlob(r, 'image/jpeg', 0.85));
    } catch (e) { capa = null; }
    const nome = Lia.doNomeDoArquivo(nomeArq || '');
    const I = info.info || {};
    const lista = caps.flatMap(dividir);
    return finalizar({ meta: { titulo: (I.Title || '').trim() || nome.titulo, autor: (I.Author || '').trim() || nome.autor, idioma: '', descricao: (I.Subject || '').trim(), assuntos: [] }, capa, caps: lista, toc: resolverToc([], lista) });
  }

  /* ================= Entrada única ================= */
  const EXT_ACEITAS = ['epub', 'pdf', 'txt', 'fb2', 'docx', 'html', 'htm', 'xhtml', 'md'];
  async function abrir(arquivo, nome, progresso) {
    const ext = (nome || arquivo.name || '').split('.').pop().toLowerCase();
    const cab = new Uint8Array(await arquivo.slice(0, 64).arrayBuffer());
    const ehZip = cab[0] === 0x50 && cab[1] === 0x4b;
    const asc = new TextDecoder('latin1').decode(cab);
    if (/^(mobi|azw|azw3|kfx|prc)$/.test(ext) || asc.includes('BOOKMOBI')) {
      const e = new Error('kindle'); e.amigavel = 'Arquivos do Kindle (MOBI/AZW) não abrem aqui. Converta para EPUB (o Calibre faz isso de graça) ou envie a versão EPUB. Livros comprados na Amazon com proteção (DRM) só abrem no app Kindle.'; throw e;
    }
    if (ehZip && (ext === 'epub' || ext === 'zip' || !EXT_ACEITAS.includes(ext))) {
      const zipTxt = new TextDecoder('latin1').decode(new Uint8Array(await arquivo.slice(0, 200).arrayBuffer()));
      if (zipTxt.includes('epub') || ext === 'epub') return epub(arquivo);
    }
    if (ehZip && ext === 'docx') return deDocx(arquivo, nome);
    if (asc.startsWith('%PDF') || ext === 'pdf') return dePdf(arquivo, nome, progresso);
    const buf = await arquivo.arrayBuffer();
    const txt = decodificar(new Uint8Array(buf));
    if (ext === 'fb2' || /<FictionBook/i.test(txt.slice(0, 500))) return deFb2(txt);
    if (/^(html|htm|xhtml)$/.test(ext) || /^\s*<(!doctype html|html)/i.test(txt.slice(0, 200))) return deHtml(txt, nome);
    if (ext === 'epub') throw Object.assign(new Error('epub_invalido'), { amigavel: 'Este EPUB parece estar corrompido.' });
    return deTexto(txt, nome);
  }

  return { abrir, epub, textoDe, EXT_ACEITAS };
})();
