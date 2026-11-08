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

  /* Baixa o arquivo de um livro gratuito (EPUB) e devolve um Blob */
  async function baixarLivro(src, progresso) {
    const urls = src.startsWith('gb:') ? gutenberg.epubs(src.slice(3)) : src.startsWith('ws:') ? [wikisource.epub(src.slice(3))] : [];
    let ultimo;
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const total = +(r.headers.get('Content-Length') || 0);
        if (!r.body || !progresso) return await r.blob();
        const leitor = r.body.getReader();
        const partes = [];
        let n = 0;
        for (;;) {
          const { done, value } = await leitor.read();
          if (done) break;
          partes.push(value); n += value.length;
          progresso(total ? n / total : 0, n);
        }
        const b = new Blob(partes, { type: 'application/epub+zip' });
        if (b.size < 1000) throw new Error('arquivo vazio');
        return b;
      } catch (e) { ultimo = e; }
    }
    throw ultimo || new Error('sem_fonte');
  }

  const compra = (t, a) => `https://www.amazon.com.br/s?k=${encodeURIComponent(t + ' ' + (a || ''))}&i=stripbooks`;
  const googleLivros = (t, a) => `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(t + ' ' + (a || ''))}`;

  return { gutenberg, wikisource, openlibrary, wikipedia, google, baixarLivro, compra, googleLivros };
})();
