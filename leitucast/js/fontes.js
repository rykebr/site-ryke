/* Fontes da web usadas pela Lia. Tudo com cache local e limite de tempo, e o app segue funcionando se uma cair.
   - Project Gutenberg: livros livres (EPUB) e busca (OPDS), pelo proxy do próprio site (/leitucast/gutenberg/)
   - Wikisource em português: clássicos em EPUB gerados pelo ws-export, pelo proxy /leitucast/wikisource/
   - Open Library: bibliografia, capas e fotos de autores (aceita chamadas diretas do navegador)
   - Wikipédia: foto e resumo de autores e livros
   - Google Livros: sinopse, prévia oficial e categorias */
'use strict';
const Fontes = (() => {
  const BASE = new URL('./', location.href);
  const PROXY_GB = new URL('gutenberg/', BASE).href;
  const PROXY_WS = new URL('wikisource/', BASE).href;

  /* ---------- Project Gutenberg ---------- */
  const gutenberg = {
    capa: (id) => `https://www.gutenberg.org/cache/epub/${id}/pg${id}.cover.medium.jpg`,
    epubs: (id) => [`${PROXY_GB}cache/epub/${id}/pg${id}-images-3.epub`, `${PROXY_GB}cache/epub/${id}/pg${id}.epub`],
    pagina: (id) => `https://www.gutenberg.org/ebooks/${id}`,
    async buscar(q) {
      const k = 'gbq:' + norm(q);
      const c = await CacheWeb.get(k, 3);
      if (c) return c;
      // sem extensão no caminho: o site (trailingSlash da Vercel) não redireciona, e o Gutenberg aceita
      const xml = await buscar(`${PROXY_GB}ebooks/search/?query=${encodeURIComponent(q)}&format=opds`, { tipo: 'text', ms: 15000 });
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const out = [];
      for (const e of doc.getElementsByTagName('entry')) {
        const id = (e.getElementsByTagName('id')[0] || {}).textContent || '';
        const m = id.match(/ebooks\/(\d+)\.opds$/);
        if (!m) continue;
        let t = (e.getElementsByTagName('title')[0] || {}).textContent || '';
        const lm = t.match(/\s*\((Portuguese|English|Spanish|French|Italian|German)\)\s*$/);
        const lang = lm ? { Portuguese: 'pt', English: 'en', Spanish: 'es', French: 'fr', Italian: 'it', German: 'de' }[lm[1]] : '';
        t = t.replace(/\s*\([A-Za-z]+\)\s*$/, '');
        const a = (e.getElementsByTagName('content')[0] || {}).textContent || '';
        out.push({ id: +m[1], t, a, l: lang });
      }
      CacheWeb.set(k, out);
      return out;
    },
  };

  /* ---------- Wikisource (pt) ---------- */
  const wikisource = {
    epub: (titulo) => `${PROXY_WS}?format=epub-3&lang=pt&page=${encodeURIComponent(titulo.replace(/ /g, '_'))}`,
    pagina: (titulo) => `https://pt.wikisource.org/wiki/${encodeURIComponent(titulo.replace(/ /g, '_'))}`,
    async buscar(q) {
      const k = 'wsq:' + norm(q);
      const c = await CacheWeb.get(k, 7);
      if (c) return c;
      const u = 'https://pt.wikisource.org/w/api.php?action=query&list=search&srnamespace=0&srlimit=12&format=json&origin=*&srsearch=' + encodeURIComponent(q);
      const d = await buscar(u, { ms: 12000 });
      const out = (d.query && d.query.search || [])
        .filter((r) => !r.title.includes('/') && r.wordcount > 400)
        .map((r) => ({ titulo: r.title, trecho: r.snippet.replace(/<[^>]+>/g, ''), palavras: r.wordcount }));
      CacheWeb.set(k, out);
      return out;
    },
  };

  /* ---------- Open Library ---------- */
  const OL_CAMPOS = 'key,title,author_name,author_key,first_publish_year,cover_i,language,ebook_access,id_project_gutenberg,subject,edition_count,number_of_pages_median,isbn';
  const openlibrary = {
    capa: (id, t = 'M') => (id ? `https://covers.openlibrary.org/b/id/${id}-${t}.jpg?default=false` : ''),
    foto: (olid, t = 'M') => (olid ? `https://covers.openlibrary.org/a/olid/${olid}-${t}.jpg?default=false` : ''),
    async buscar(params, limite = 20) {
      const qs = new URLSearchParams({ ...params, fields: OL_CAMPOS, limit: String(limite) }).toString();
      const k = 'olq:' + qs;
      const c = await CacheWeb.get(k, 7);
      if (c) return c;
      const d = await buscar('https://openlibrary.org/search.json?' + qs, { ms: 15000 });
      const out = (d.docs || []).map((x) => ({
        ol: x.key, t: x.title, a: (x.author_name || [])[0] || '', ak: (x.author_key || [])[0] || '',
        ano: x.first_publish_year, capa: x.cover_i, langs: x.language || [], acesso: x.ebook_access,
        gb: (x.id_project_gutenberg || [])[0], assuntos: (x.subject || []).slice(0, 12), edicoes: x.edition_count || 0,
        paginas: x.number_of_pages_median, isbn: (x.isbn || [])[0],
      }));
      CacheWeb.set(k, out);
      return out;
    },
    async autores(q) {
      const k = 'ola:' + norm(q);
      const c = await CacheWeb.get(k, 14);
      if (c) return c;
      const d = await buscar('https://openlibrary.org/search/authors.json?limit=8&q=' + encodeURIComponent(q), { ms: 12000 });
      const out = (d.docs || []).filter((a) => (a.work_count || 0) > 0).map((a) => ({ key: a.key, n: a.name, obras: a.work_count, top: a.top_work, nasc: a.birth_date, morte: a.death_date }));
      CacheWeb.set(k, out);
      return out;
    },
    async descricao(workKey) {
      const k = 'olw:' + workKey;
      const c = await CacheWeb.get(k, 30);
      if (c !== undefined) return c;
      const d = await buscar(`https://openlibrary.org${workKey}.json`, { ms: 12000 });
      const desc = typeof d.description === 'string' ? d.description : (d.description && d.description.value) || '';
      CacheWeb.set(k, desc);
      return desc;
    },
  };

  /* ---------- Wikipédia ---------- */
  const wikipedia = {
    async resumo(titulo) {
      if (!titulo) return null;
      let lang = 'pt', t = titulo;
      if (/^en:/.test(titulo)) { lang = 'en'; t = titulo.slice(3); }
      const k = 'wp:' + lang + ':' + t;
      const c = await CacheWeb.get(k, 30);
      if (c !== undefined) return c;
      try {
        const d = await buscar(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(t)}`, { ms: 10000 });
        const r = { texto: d.extract || '', foto: d.thumbnail ? d.thumbnail.source : '', url: d.content_urls && d.content_urls.desktop.page, lang };
        CacheWeb.set(k, r);
        return r;
      } catch (e) {
        if (e.status === 404) CacheWeb.set(k, null);
        return null;
      }
    },
    async procurar(q, lang = 'pt') {
      const k = 'wps:' + lang + ':' + norm(q);
      const c = await CacheWeb.get(k, 14);
      if (c) return c;
      const d = await buscar(`https://${lang}.wikipedia.org/w/rest.php/v1/search/page?limit=5&q=${encodeURIComponent(q)}`, { ms: 10000 });
      const out = (d.pages || []).map((p) => ({ titulo: p.key, nome: p.title, desc: p.description || '', foto: p.thumbnail ? 'https:' + p.thumbnail.url : '' }));
      CacheWeb.set(k, out);
      return out;
    },
  };

  /* ---------- Google Livros (prévia oficial e sinopse) ---------- */
  const google = {
    async buscar(q, limite = 10) {
      const k = 'gbk:' + norm(q) + ':' + limite;
      const c = await CacheWeb.get(k, 7);
      if (c) return c;
      const d = await buscar(`https://www.googleapis.com/books/v1/volumes?printType=books&maxResults=${limite}&q=${encodeURIComponent(q)}`, { ms: 12000 });
      const out = (d.items || []).map((v) => {
        const i = v.volumeInfo || {}, ac = v.accessInfo || {};
        return {
          gid: v.id, t: i.title + (i.subtitle ? ': ' + i.subtitle : ''), a: (i.authors || [])[0] || '', ano: parseInt(i.publishedDate, 10) || null,
          sin: i.description || '', cats: i.categories || [], lang: i.language, paginas: i.pageCount,
          capa: i.imageLinks ? (i.imageLinks.thumbnail || i.imageLinks.smallThumbnail || '').replace('http:', 'https:') : '',
          previa: ac.viewability && ac.viewability !== 'NO_PAGES' ? (i.previewLink || '').replace('http:', 'https:') : '',
          gratis: v.saleInfo && v.saleInfo.saleability === 'FREE',
        };
      });
      CacheWeb.set(k, out);
      return out;
    },
  };

  /* Página de bloqueio anti-robô (Anubis, Cloudflare...) ou de erro no lugar do livro */
  // dois sinais (ou um num texto curto), para um livro que cite "Anúbis" ou "captcha" não ser confundido
  const RX_BLOQUEIO = /anubis|n[aã]o [eé] um bot|not a bot|making sure you|checking your browser|verifique se voc[eê]|just a moment|captcha|access denied|cf-chl|recarregue a p[aá]gina|enable javascript|hashcash|proof-of-work|prova de valida/gi;
  const ehBloqueio = (txt) => {
    const s = String(txt || '').slice(0, 6000);
    const achados = new Set((s.match(RX_BLOQUEIO) || []).map((x) => x.toLowerCase()));
    return achados.size >= 2 || (achados.size === 1 && s.replace(/\s+/g, ' ').length < 1500);
  };

  /* Monta o livro direto do Wikisource (API pública com CORS), página principal + capítulos (subpáginas) */
  async function wikisourceHtml(titulo, progresso) {
    const api = (p) => `https://pt.wikisource.org/w/api.php?action=parse&prop=text&format=json&formatversion=2&redirects=1&disableeditsection=1&disablelimitreport=1&origin=*&page=${encodeURIComponent(p.replace(/ /g, '_'))}`;
    const pegar = async (p) => {
      let erro;
      for (let k = 0; k < 4; k++) {
        try {
          const d = await buscar(api(p), { ms: 20000 });
          if (d && d.parse) return { titulo: d.parse.title, html: d.parse.text };
          erro = new Error('ws_sem_pagina');
          if (d && d.error && d.error.code === 'missingtitle') break;
        } catch (e) { erro = e; }
        await new Promise((r) => setTimeout(r, 600 * (k + 1))); // o Wikisource limita pedidos seguidos
      }
      throw erro;
    };
    const limpar = (html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      doc.querySelectorAll('.ws-noexport,.noprint,.headertemplate,#navigationHeader,#navigationNotes,.mw-editsection,.reference,.mw-references-wrap,.references,style,script,link,.metadata,.navbox,.licenseContainer,table.licenseContainer,.ws-summary').forEach((x) => x.remove());
      doc.querySelectorAll('[style]').forEach((x) => x.removeAttribute('style'));
      // ilustrações: endereço completo, na melhor resolução oferecida (srcset 2x)
      doc.querySelectorAll('img').forEach((im) => {
        let src = im.getAttribute('src') || '';
        if (src.startsWith('//')) src = 'https:' + src;
        if (!/^https:\/\/(upload|thumb)\.wikimedia\.org\//.test(src) || (+im.getAttribute('width') || 99) < 40) { im.remove(); return; }
        // versão de 640 px (nítida no celular sem pesar); se a original for menor, fica a miniatura da página
        const larga = (+im.getAttribute('data-file-width') || 0) > 640 && /\/\d+px-[^/]+$/.test(src) ? src.replace(/\/\d+px-([^/]+)$/, '/640px-$1') : '';
        im.setAttribute('src', larga || src);
        if (larga) im.setAttribute('data-reserva', src);
        im.removeAttribute('srcset'); im.removeAttribute('loading');
      });
      // tira o embrulho do MediaWiki: os blocos do texto ficam soltos (o leitor divide os capítulos pelos títulos)
      const emb = doc.body.querySelector(':scope > .mw-parser-output');
      if (emb) emb.replaceWith(...emb.childNodes);
      return doc;
    };
    /* baixa as ilustrações e embute no livro (funciona sem internet); a que falhar sai sem quebrar nada */
    const embutirImagens = async (html) => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const ims = Array.from(doc.querySelectorAll('img')).slice(0, 120);
      doc.querySelectorAll('img').forEach((im, k) => { if (k >= 120) im.remove(); });
      let i = 0;
      const vez = async () => {
        while (i < ims.length) {
          const im = ims[i++];
          try {
            let bl;
            try { bl = await buscar(im.getAttribute('src'), { tipo: 'blob', ms: 20000 }); } catch (e) {
              if (!im.getAttribute('data-reserva')) throw e;
              bl = await buscar(im.getAttribute('data-reserva'), { tipo: 'blob', ms: 20000 });
            }
            im.removeAttribute('data-reserva');
            if (!/^image\//.test(bl.type) || bl.size > 2500000) throw new Error('img');
            im.setAttribute('src', await new Promise((ok, erro) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.onerror = erro; fr.readAsDataURL(bl); }));
          } catch (e) { im.remove(); }
        }
      };
      await Promise.all([1, 2, 3, 4].map(vez));
      return doc.body.innerHTML;
    };
    const base = await pegar(titulo);
    const t = base.titulo;
    const docBase = limpar(base.html);
    // capítulos: links para subpáginas "Título/…", na ordem em que aparecem no índice
    const vistos = new Set(), subs = [];
    for (const a of new DOMParser().parseFromString(base.html, 'text/html').querySelectorAll('a[href^="/wiki/"]')) {
      let alvo = '';
      try { alvo = decodeURIComponent(a.getAttribute('href').slice(6).split('#')[0]).replace(/_/g, ' '); } catch (e) { continue; }
      if (alvo.startsWith(t + '/') && !vistos.has(alvo)) { vistos.add(alvo); subs.push(alvo); }
    }
    const partes = [];
    const textoBase = docBase.body.textContent.replace(/\s+/g, ' ').trim();
    if (!subs.length || textoBase.length > 3000) partes.push(`<h1>${esc(t.replace(/\s*\(.*\)$/, ''))}</h1>` + docBase.body.innerHTML);
    else partes.push(`<h1>${esc(t.replace(/\s*\(.*\)$/, ''))}</h1>`);
    const caps = new Array(subs.length);
    let feitos = 0, i = 0;
    const trabalhador = async () => {
      while (i < subs.length) {
        const k = i++;
        try {
          const p = await pegar(subs[k]);
          // nome do capítulo: o título que a própria página traz; senão o "ws-title"; senão o fim do endereço
          const wsT = new DOMParser().parseFromString(p.html, 'text/html').querySelector('#ws-title i, #ws-title');
          let nome = (wsT && wsT.textContent.split('—').pop().trim()) || subs[k].slice(t.length + 1).split('/').pop();
          const d = limpar(p.html);
          const h = d.body.querySelector('h1,h2,h3,h4');
          if (h && h.textContent.trim()) { nome = h.textContent.trim(); h.remove(); }
          caps[k] = `<h2>${esc(nome)}</h2>` + d.body.innerHTML;
        } catch (e) { caps[k] = null; }
        feitos++;
        if (progresso) progresso(Math.min(0.95, feitos / subs.length), 0);
      }
    };
    await Promise.all([1, 2, 3].map(trabalhador));
    // segunda rodada, um de cada vez e com calma, para os capítulos que o Wikisource recusou por excesso de pedidos
    let falhas = 0;
    for (let k = 0; k < subs.length; k++) {
      if (caps[k] !== null) continue;
      await new Promise((r) => setTimeout(r, 1200));
      try {
        const p = await pegar(subs[k]);
        const d = limpar(p.html);
        const h = d.body.querySelector('h1,h2,h3,h4');
        let nome = subs[k].slice(t.length + 1).split('/').pop();
        if (h && h.textContent.trim()) { nome = h.textContent.trim(); h.remove(); }
        caps[k] = `<h2>${esc(nome)}</h2>` + d.body.innerHTML;
      } catch (e) { caps[k] = ''; falhas++; }
    }
    // livro pela metade não serve: melhor avisar e tentar de novo depois
    if (falhas > Math.max(1, subs.length * 0.05)) throw new Error('ws_incompleto');
    partes.push(...caps.filter(Boolean));
    const corpo = await embutirImagens(partes.join('\n'));
    const texto = corpo.replace(/<img[^>]*>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    if (texto.length < 800 || ehBloqueio(texto.slice(0, 3000))) throw new Error('ws_vazio');
    const autor = (base.html.match(/header_author_text[^>]*>([^<]+)</) || base.html.match(/header&#95;author&#95;text[^>]*>([^<]+)</) || [])[1] || '';
    const html = `<!doctype html><html lang="pt"><head><meta charset="utf-8"><title>${esc(t.replace(/\s*\(.*\)$/, ''))}</title><meta name="author" content="${esc(autor)}"></head><body>${corpo}</body></html>`;
    return new Blob([html], { type: 'text/html' });
  }

  async function baixarUrl(u, progresso) {
    const r = await fetch(u);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const total = +(r.headers.get('Content-Length') || 0);
    let b;
    if (!r.body || !progresso) b = await r.blob();
    else {
      const leitor = r.body.getReader();
      const partes = [];
      let n = 0;
      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        partes.push(value); n += value.length;
        progresso(total ? Math.min(1, n / total) : 0, n);
      }
      b = new Blob(partes, { type: 'application/epub+zip' });
    }
    // só aceita um EPUB de verdade (começa com "PK"); página de bloqueio ou de erro não vira livro
    const cab = new Uint8Array(await b.slice(0, 4).arrayBuffer());
    if (!(cab[0] === 0x50 && cab[1] === 0x4b)) {
      const e = new Error(ehBloqueio(await b.slice(0, 6000).text()) ? 'bloqueado' : 'nao_e_epub'); e.bloqueio = true; throw e;
    }
    if (b.size < 1000) throw new Error('arquivo vazio');
    return b;
  }

  /* Baixa o arquivo de um livro gratuito e devolve um Blob (EPUB, ou HTML montado do Wikisource) */
  async function baixarLivro(src, progresso) {
    let ultimo;
    if (src.startsWith('ws:')) {
      const t = src.slice(3);
      // 1) EPUB pronto do ws-export (duas tentativas: o bloqueio anti-robô deles vai e volta)
      for (let k = 0; k < 2; k++) {
        try { return await baixarUrl(wikisource.epub(t) + (k ? '&_=' + Date.now() : ''), progresso); } catch (e) { ultimo = e; }
      }
      // 2) direto das páginas do Wikisource
      try { return await wikisourceHtml(t, progresso); } catch (e) { ultimo = e; }
      throw ultimo || new Error('sem_fonte');
    }
    const urls = src.startsWith('gb:') ? gutenberg.epubs(src.slice(3)) : [];
    for (const u of urls) {
      try { return await baixarUrl(u, progresso); } catch (e) { ultimo = e; }
    }
    throw ultimo || new Error('sem_fonte');
  }

  const compra = (t, a) => `https://www.amazon.com.br/s?k=${encodeURIComponent(t + ' ' + (a || ''))}&i=stripbooks`;
  const googleLivros = (t, a) => `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(t + ' ' + (a || ''))}`;

  return { gutenberg, wikisource, openlibrary, wikipedia, google, baixarLivro, compra, googleLivros, ehBloqueio, _wikisourceHtml: wikisourceHtml };
})();
