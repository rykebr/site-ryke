/* Lia: a IA de leitura do LeituCast Ingrid.
   Roda no aparelho: entende o perfil, cruza com o acervo livre (Gutenberg + Wikisource), com a base de
   conhecimento (autores, parecidos, clássicos) e com a web (Open Library, Wikipédia, Google Livros).
   Monta as prateleiras, faz a busca, identifica ebooks importados, confere domínio público no Brasil
   e aprende com o que a pessoa lê, curte ou descarta. */
'use strict';
const Lia = (() => {
  let CAT = null, carregando = null;
  const LIMITE_DP = KB.DIREITOS.anoLimite;

  /* ================= Acervo local ================= */
  function tituloLimpo(t) {
    let s = String(t || '').replace(/\s*\$b\s*/g, ': ').replace(/\s+/g, ' ').trim();
    const p = s.split(/\s*[:;]\s+/);
    if (p[0].length >= 3 && p.length > 1 && s.length > 34) s = p[0];
    return s.replace(/\s*[,.]$/, '');
  }
  async function catalogo() {
    if (CAT) return CAT;
    if (!carregando) {
      carregando = (async () => {
        const d = await buscar('dados/catalogo.json?v=2', { ms: 40000 });
        const autores = d.autores.map(([n, b, m, w], i) => ({ i, n, b, m, w, k: norm(n) }));
        const porAutor = new Map(), porGb = new Map();
        for (const l of d.livros) {
          // literatura erótica ganha gênero próprio (fica fora das prateleiras de quem não pediu e do módulo infantil)
          if ((l.s || []).some((x) => /erotic|pornograph|sadomasoch/i.test(x)) && !(l.g || []).includes('erotico')) l.g = [...(l.g || []), 'erotico'];
          porGb.set(l.i, l);
          for (const ai of l.a) { const k = autores[ai].k; if (!porAutor.has(k)) porAutor.set(k, []); porAutor.get(k).push(l); }
        }
        CAT = { autores, livros: d.livros, porAutor, porGb };
        return CAT;
      })().catch((e) => { carregando = null; throw e; });
    }
    return carregando;
  }
  const dominioPublicoBR = (l) => {
    if (!CAT || !l.a || !l.a.length) return true;
    return l.a.every((ai) => {
      const a = CAT.autores[ai];
      if (a.m != null) return a.m <= LIMITE_DP;
      if (a.b != null) return a.b <= 1860;
      return true;
    });
  };
  const CLASS_SRC = new Map(KB.CLASSICOS.map((c) => [c.src, c]));

  function deCatalogo(l) {
    const cl = CLASS_SRC.get('gb:' + l.i);
    const autores = l.a.map((ai) => CAT.autores[ai].n);
    const kb = autores.length ? acharAutorKB(autores[0]) : null;
    return {
      id: 'gb:' + l.i, src: 'gb:' + l.i, t: tituloLimpo(l.t), tpt: cl && cl.l !== 'pt' ? cl.t : '',
      a: kb ? kb.n : (autores[0] || 'Anônimo'), aid: kb ? kb.id : '', l: l.l, g: l.g || [], pal: l.p || 0,
      d: l.d || 0, f: l.f, s: l.s || [], ano: cl ? cl.ano : null, sin: cl ? cl.sin : '',
      capa: l.c === 0 ? '' : Fontes.gutenberg.capa(l.i), livre: dominioPublicoBR(l), fonte: 'Project Gutenberg',
    };
  }
  function deClassico(c) {
    if (c.src.startsWith('gb:') && CAT && CAT.porGb.has(+c.src.slice(3))) {
      const o = deCatalogo(CAT.porGb.get(+c.src.slice(3)));
      return { ...o, t: c.l === 'pt' ? c.t : o.t, tpt: c.l !== 'pt' ? c.t : '', sin: c.sin, g: Array.from(new Set([...(c.g || []), ...o.g])), ano: c.ano };
    }
    const kb = KB.A[c.a];
    return {
      id: c.src, src: c.src, t: c.t, tpt: '', a: kb ? kb.n : '', aid: c.a, l: c.l || 'pt', g: c.g || [], pal: c.pal || 0,
      d: 2500, ano: c.ano, sin: c.sin, capa: c.src.startsWith('gb:') ? Fontes.gutenberg.capa(c.src.slice(3)) : '', livre: true,
      fonte: c.src.startsWith('ws:') ? 'Wikisource' : 'Project Gutenberg',
    };
  }
  async function porSrc(src) {
    if (CLASS_SRC.has(src)) { await catalogo().catch(() => null); return deClassico(CLASS_SRC.get(src)); }
    if (src.startsWith('gb:')) { await catalogo(); const l = CAT.porGb.get(+src.slice(3)); return l ? deCatalogo(l) : null; }
    if (src.startsWith('ws:')) return { id: src, src, t: src.slice(3).replace(/\s*\(.*\)$/, ''), a: '', l: 'pt', g: [], pal: 0, d: 0, capa: '', livre: true, fonte: 'Wikisource' };
    return null;
  }

  /* ================= Autores ================= */
  const IDX_AUTOR = KB.AUTORES.map((a) => {
    const nomes = [a.n, ...(a.al || []), ...(a.gb || [])].map(norm);
    // sobrenomes que sozinhos já identificam o autor ("zola", "lovecraft", "camoes")
    const sobrenomes = new Set(nomes.map((x) => x.split(' ').pop()).filter((x) => x.length >= 4));
    return { a, nomes, sobrenomes, toks: new Set(nomes.join(' ').split(' ')) };
  });
  const memoAutor = new Map();
  const PREP = new Set(['de', 'da', 'do', 'dos', 'das', 'e']);
  function acharAutorKB(nome) {
    const n = norm(nome);
    if (!n) return null;
    if (memoAutor.has(n)) return memoAutor.get(n);
    let melhor = null, nota = 0;
    for (const { a, nomes, sobrenomes } of IDX_AUTOR) {
      for (const x of nomes) {
        let s = 0;
        if (x === n) s = 1;
        else if (n.length >= 5 && x.length >= 5 && (x.includes(n) || n.includes(x)) && Math.min(n.length, x.length) / Math.max(n.length, x.length) > 0.45) s = 0.85;
        else if (n.length >= 6) { const d = distancia(x, n, 2); if (d <= 2) s = 0.9 - d * 0.1; }
        if (s > nota) { nota = s; melhor = a; }
      }
      if (nota < 0.8 && !n.includes(' ') && sobrenomes.has(n)) { nota = 0.8; melhor = a; }
      // nome sem as preposições ("alvares azevedo" → Álvares de Azevedo)
      if (nota < 0.85 && n.includes(' ')) {
        const nt = n.split(' ').filter((w) => !PREP.has(w));
        if (nt.length >= 2 && nomes.some((x) => { const xt = x.split(' ').filter((w) => !PREP.has(w)); return nt.length >= Math.min(2, xt.length) && nt.every((w) => xt.includes(w)); })) { nota = 0.85; melhor = a; }
      }
    }
    const r = nota >= 0.7 ? melhor : null;
    if (memoAutor.size > 5000) memoAutor.clear();
    memoAutor.set(n, r);
    return r;
  }
  const aliasExato = (kb, txt) => { const ix = IDX_AUTOR.find((x) => x.a === kb); return !!ix && ix.nomes.includes(norm(txt)); };
  /* todas as palavras de um trecho pertencem ao nome do autor? (evita que "cartomante machado de assis" vire só autor) */
  function trechoEhDoAutor(kb, palavras) {
    const ix = IDX_AUTOR.find((x) => x.a === kb);
    if (!ix) return false;
    return palavras.every((w) => w.length <= 2 || ix.toks.has(w) || (w.length >= 4 && [...ix.toks].some((t) => Math.abs(t.length - w.length) <= 2 && distancia(t, w, w.length >= 8 ? 2 : 1) <= (w.length >= 8 ? 2 : 1))));
  }
  function autoresDoCatalogo(nome) {
    if (!CAT) return [];
    const kb = acharAutorKB(nome);
    const nomes = kb ? [kb.n, ...(kb.al || []), ...(kb.gb || [])].map(norm) : [norm(nome)];
    const out = new Map();
    for (const n of nomes) {
      if (CAT.porAutor.has(n)) for (const l of CAT.porAutor.get(n)) out.set(l.i, l);
    }
    if (!out.size) {
      const toks = norm(nome).split(' ').filter((t) => t.length > 2);
      if (toks.length >= 2) {
        for (const [k, ls] of CAT.porAutor) if (toks.every((t) => k.includes(t))) for (const l of ls) out.set(l.i, l);
      }
    }
    return Array.from(out.values()).sort((a, b) => b.d - a.d);
  }
  const fotos = LS.get('lc-fotos', {});
  async function fotoAutor(nome) {
    const kb = acharAutorKB(nome);
    const k = kb ? kb.id : norm(nome);
    if (fotos[k] !== undefined) return fotos[k];
    let foto = '';
    try {
      if (kb && kb.wiki) { const r = await Fontes.wikipedia.resumo(kb.wiki); foto = r && r.foto || ''; }
      if (!foto && kb && kb.wiki && !kb.wiki.startsWith('en:')) { const r = await Fontes.wikipedia.resumo('en:' + kb.wiki); foto = r && r.foto || ''; }
      for (const lang of ['pt', 'en']) {
        if (foto) break;
        const ps = await Fontes.wikipedia.procurar(nome, lang);
        const p = ps.find((x) => norm(x.nome).includes(norm(nome).split(' ').pop()) && /escrit|autor|poet|romanc|novel|writer|jornal|author|dramat/i.test(x.desc)) || null;
        foto = p && p.foto ? p.foto.replace(/\/\d+px-/, '/320px-') : '';
      }
      if (!foto && kb && kb.ol) foto = Fontes.openlibrary.foto(kb.ol);
    } catch (e) { return ''; }
    fotos[k] = foto;
    LS.set('lc-fotos', fotos);
    return foto;
  }
  function obraKB(kb, o, i) {
    return {
      id: `kb:${kb.id}:${i}`, src: '', t: o.t, tpt: o.o || '', a: kb.n, aid: kb.id, l: 'pt', g: kb.gen, ano: o.ano, sin: o.sin || '',
      capa: o.capa ? Fontes.openlibrary.capa(o.capa, 'M') : '', livre: false, serie: o.serie || '', ol: o.ol || '', com: o.com || '',
      fonte: 'Editora', d: 5000 - i * 50,
    };
  }
  /* Tudo sobre um autor: foto, biografia, livros gratuitos e os demais (com prévia e onde comprar) */
  async function infoAutor(nome) {
    await catalogo().catch(() => null);
    const kb = acharAutorKB(nome);
    const n = kb ? kb.n : nome;
    const r = { id: kb ? kb.id : 'w:' + norm(nome), n, kb, pais: kb && kb.pais, anos: kb && kb.anos, dp: kb ? !!kb.dp : null, bio: kb && kb.bio || '', foto: '', estilo: kb && kb.estilo || '', livres: [], obras: [], sim: [] };
    const tarefas = [];
    tarefas.push(fotoAutor(n).then((f) => { r.foto = f; }));
    tarefas.push((async () => {
      const w = kb && kb.wiki ? await Fontes.wikipedia.resumo(kb.wiki) : null;
      if (w && w.texto && !r.bio) r.bio = w.texto;
      if (!r.bio) {
        const ps = await Fontes.wikipedia.procurar(n).catch(() => []);
        const p = ps.find((x) => /escrit|autor|poet|romanc|novel|writer/i.test(x.desc));
        if (p) { const w2 = await Fontes.wikipedia.resumo(p.titulo); if (w2) r.bio = w2.texto; }
      }
    })().catch(() => null));
    // livres do acervo local e clássicos curados
    const vistos = new Set();
    for (const l of autoresDoCatalogo(n)) {
      if (l.g.includes('referencia')) continue;
      const o = deCatalogo(l);
      if (!o.livre) continue;
      vistos.add(norm(o.t)); r.livres.push(o);
    }
    for (const c of KB.CLASSICOS) if (kb && c.a === kb.id && !vistos.has(norm(c.t)) && !r.livres.some((x) => x.src === c.src)) { r.livres.push(deClassico(c)); vistos.add(norm(c.t)); }
    // obras não gratuitas: base de conhecimento ou Open Library
    if (kb && kb.obras) r.obras = kb.obras.map((o, i) => obraKB(kb, o, i));
    else if (!kb || !kb.dp) {
      tarefas.push(Fontes.openlibrary.buscar({ author: n, sort: 'editions' }, 40).then((docs) => {
        const ja = new Set(r.livres.map((x) => norm(x.t)));
        for (const d of docs) {
          if (!d.capa && d.edicoes < 2) continue;
          const tn = norm(d.t);
          if (ja.has(tn) || /box|set|collection|bestsellers|\/ /i.test(d.t)) continue;
          ja.add(tn);
          r.obras.push({ id: 'ol:' + d.ol.split('/').pop(), src: '', t: d.t, a: n, l: d.langs.includes('por') ? 'pt' : (d.langs[0] || '').slice(0, 2), g: generosDeAssuntos(d.assuntos), ano: d.ano, capa: Fontes.openlibrary.capa(d.capa), livre: false, ol: d.ol, fonte: 'Open Library', d: d.edicoes });
        }
      }).catch(() => null));
    }
    if (kb) r.sim = (kb.sim || []).map((id) => KB.A[id]).filter(Boolean);
    await Promise.all(tarefas);
    r.livres.sort((a, b) => (b.l === 'pt') - (a.l === 'pt') || b.d - a.d);
    return r;
  }

  /* ================= Gêneros a partir de assuntos e do texto ================= */
  const REGRAS_ASSUNTO = [
    [/thriller|suspense/i, 'suspense'], [/psycholog|domestic fiction|unreliable|obsess|psicol/i, 'psicologico'],
    [/detective|mystery|crime|murder|police|policial|misterio/i, 'policial'], [/horror|ghost|supernatural|vampire|terror|haunted/i, 'terror'],
    [/love stor|romance|romantic|amor/i, 'romance'], [/fantasy|magic|fantasia|dragon/i, 'fantasia'], [/science fiction|ficcao cientifica|space/i, 'scifi'],
    [/dystop/i, 'distopia'], [/adventure|aventura/i, 'aventura'], [/historical fiction|historico/i, 'historico'], [/short stor|contos/i, 'contos'],
    [/poetry|poesia|poems/i, 'poesia'], [/juvenile|children|young adult|infantil/i, 'infantil'], [/humor|comedy|satire/i, 'humor'],
    [/philosoph|filosofia/i, 'filosofia'], [/biograph|memoir/i, 'biografias'], [/self-help|personal development|success|autoajuda/i, 'desenvolvimento'],
    [/brazil/i, 'brasileira'], [/portug/i, 'portuguesa'], [/psychology|psicologia/i, 'psicologia'], [/spiritual|religio|christian/i, 'espiritualidade'],
  ];
  function generosDeAssuntos(lista) {
    const g = new Set();
    for (const s of lista || []) for (const [rx, id] of REGRAS_ASSUNTO) if (rx.test(s)) g.add(id);
    return Array.from(g).slice(0, 4);
  }
  const LEXICO = {
    policial: ['detetive', 'delegado', 'investigac', 'assassin', 'policia', 'cadaver', 'suspeit', 'inspetor', 'detective', 'murder', 'police', 'killer', 'corpse', 'suspect', 'homicid'],
    suspense: ['segredo', 'desaparec', 'perigo', 'ameaca', 'trancad', 'escondid', 'secret', 'missing', 'danger', 'threat', 'locked', 'hidden'],
    psicologico: ['terapeut', 'psiquiatr', 'obsess', 'mentir', 'manipul', 'loucura', 'remedio', 'therapist', 'psychiatr', 'lying', 'madness', 'paranoi'],
    terror: ['fantasma', 'demonio', 'sangue', 'grito', 'sombra', 'maldic', 'monstro', 'ghost', 'demon', 'blood', 'scream', 'shadow', 'curse', 'monster', 'cripta'],
    romance: ['beijo', 'apaixon', 'coracao', 'casament', 'namor', 'kiss', 'love', 'heart', 'marry', 'wedding', 'darling', 'paixao'],
    fantasia: ['magia', 'mago', 'dragao', 'feitico', 'reino', 'espada', 'bruxa', 'elfo', 'magic', 'wizard', 'dragon', 'spell', 'kingdom', 'sword', 'witch'],
    scifi: ['nave', 'planeta', 'robo', 'galaxia', 'laser', 'espacial', 'spaceship', 'planet', 'robot', 'galaxy', 'alien', 'android'],
    aventura: ['navio', 'ilha', 'tesouro', 'pirata', 'expedic', 'selva', 'ship', 'island', 'treasure', 'pirate', 'jungle'],
    poesia: ['soneto', 'verso', 'estrofe', 'sonnet', 'stanza'],
  };
  function generosDoTexto(txt) {
    const p = norm(txt).split(' ');
    if (p.length < 300) return [];
    const conta = {};
    for (const w of p) for (const g in LEXICO) for (const r of LEXICO[g]) if (w.startsWith(r)) { conta[g] = (conta[g] || 0) + 1; break; }
    const por10k = Object.entries(conta).map(([g, c]) => [g, (c * 10000) / p.length]).sort((a, b) => b[1] - a[1]);
    return por10k.filter(([, v]) => v >= 6).slice(0, 2).map(([g]) => g);
  }

  /* ================= Perfil e pontuação ================= */
  const TIPO_GENERO = {
    classicos: { classicos: 0.8 }, adrenalina: { suspense: 0.6, policial: 0.4, psicologico: 0.3 }, emocionar: { romance: 0.35, literaria: 0.35 },
    leve: { humor: 0.35, romance: 0.2, infantil: 0.15, aventura: 0.2 }, dormir: { poesia: 0.2, contos: 0.25 }, aprender: { filosofia: 0.35, historia: 0.35, biografias: 0.3, ensaios: 0.2 },
  };
  function vetor(perfil, pesos = {}) {
    const g = {};
    const soma = (id, v) => { g[id] = (g[id] || 0) + v; };
    for (const id of perfil.generos || []) soma(id, 1);
    for (const t of perfil.tipos || []) for (const [id, v] of Object.entries(TIPO_GENERO[t] || {})) soma(id, v);
    const autoresKB = new Set(), nomes = new Set(), sim = new Map(), livres = new Map();
    for (const au of perfil.autores || []) {
      nomes.add(norm(au.n));
      const kb = acharAutorKB(au.n);
      if (!kb) continue;
      autoresKB.add(kb.id);
      kb.gen.forEach((id, i) => soma(id, 0.55 - i * 0.08));
      (kb.sim || []).forEach((s, i) => sim.set(s, Math.max(sim.get(s) || 0, 1 - i * 0.07)));
      (kb.livres || []).forEach((src, i) => livres.set(src, Math.max(livres.get(src) || 0, 1 - i * 0.05)));
    }
    for (const lv of perfil.livros || []) for (const id of lv.g || []) soma(id, 0.4);
    for (const [id, v] of Object.entries(pesos.g || {})) soma(id, v);
    const idiomas = (perfil.idiomas && perfil.idiomas.length) ? perfil.idiomas : ['pt'];
    if ((perfil.tipos || []).includes('idioma') && idiomas.length === 1) idiomas.push('en');
    return { g, autoresKB, nomes, sim, livres, idiomas, tipos: new Set(perfil.tipos || []), pa: pesos.a || {} };
  }
  function pontuar(o, V, est) {
    if (!o.livre) return { s: -Infinity };
    if ((o.g || []).includes('referencia')) return { s: -Infinity };
    if ((o.g || []).includes('erotico') && !((V.g.erotico || 0) > 0.3)) return { s: -Infinity }; // só para quem pediu
    if (est && est.descartados && est.descartados.includes(o.id)) return { s: -Infinity };
    const li = V.idiomas.indexOf(o.l);
    if (li < 0) return { s: -Infinity };
    let s = li === 0 ? 1.2 : 0.55;
    const motivos = [];
    const gs = (o.g || []).map((id) => [id, V.g[id] || 0]).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const gsom = gs.reduce((t, [, v]) => t + v, 0);
    s += gsom * 1.15;
    // quem escolheu gêneros vê primeiro livros desses gêneros (não "qualquer coisa popular")
    if (Object.values(V.g).some((v) => v > 0.5) && gsom <= 0.05) s -= 1.6;
    if (gs[0] && gs[0][1] > 0.5) motivos.push([gs[0][1] * 1.15, 'Porque você curte ' + (KB.G[gs[0][0]] ? KB.G[gs[0][0]].nome.toLowerCase() : gs[0][0])]);
    if (o.aid && V.autoresKB.has(o.aid)) { s += 4; motivos.push([4, 'Do seu autor favorito']); }
    else if (V.nomes.has(norm(o.a))) { s += 4; motivos.push([4, 'Do seu autor favorito']); }
    if (o.aid && V.sim.has(o.aid)) { const v = V.sim.get(o.aid) * 1.8; s += v; motivos.push([v, 'Autor parecido com os seus favoritos']); }
    if (V.livres.has(o.src)) {
      const v = V.livres.get(o.src) * 3.2; s += v;
      const quem = (KB.AUTORES.find((a) => V.autoresKB.has(a.id) && (a.livres || []).includes(o.src)) || {}).n;
      motivos.push([v, quem ? `Para quem gosta de ${quem}` : 'Combina com seus autores']);
    }
    s += Math.log10((o.d || 0) + 10) * 0.55;
    const pal = o.pal || 0;
    if (V.tipos.has('curtas') && pal) { if (pal < 25000) { s += 1.3; motivos.push([1.3, 'Leitura curta']); } else if (pal > 90000) s -= 0.9; }
    if (V.tipos.has('longas') && pal > 90000) s += 0.7;
    if (V.tipos.has('leve') && o.f >= 65) s += 0.5;
    if (V.tipos.has('classicos') && (o.g || []).includes('classicos')) s += 0.6;
    const pa = V.pa[norm(o.a)];
    if (pa) s += pa;
    if (est && est.estante && est.estante[o.id]) s -= 2.5;
    motivos.sort((a, b) => b[0] - a[0]);
    return { s, motivo: motivos[0] ? motivos[0][1] : (li === 0 ? 'Muito lido em ' + (KB.IDIOMAS.find((x) => x.id === o.l) || {}).nome.toLowerCase() : 'Popular no acervo livre') };
  }
  function diversificar(lista, n, porAutor = 2) {
    const out = [], conta = {};
    for (const o of lista) {
      const k = norm(o.a);
      if ((conta[k] || 0) >= porAutor) continue;
      conta[k] = (conta[k] || 0) + 1;
      out.push(o);
      if (out.length >= n) break;
    }
    return out;
  }
  function candidatos(V) {
    const out = new Map();
    for (const l of CAT.livros) {
      if (!V.idiomas.includes(l.l)) continue;
      const o = deCatalogo(l);
      out.set(o.id, o);
    }
    for (const c of KB.CLASSICOS) {
      if (!V.idiomas.includes(c.l || 'pt')) continue;
      const o = deClassico(c);
      out.set(o.id, { ...(out.get(o.id) || {}), ...o });
    }
    return Array.from(out.values());
  }

  /* ================= Prateleiras da página inicial ================= */
  async function recomendar(perfil, est = {}) {
    await catalogo();
    const V = vetor(perfil, est.pesos);
    const todos = candidatos(V).map((o) => { const p = pontuar(o, V, est); return { ...o, nota: p.s, motivo: p.motivo }; }).filter((o) => o.nota > -Infinity);
    todos.sort((a, b) => b.nota - a.nota);
    const prateleiras = [];
    const usados = new Set();
    const pega = (lista, n, porAutor, repetir) => { const r = diversificar(repetir ? lista : lista.filter((o) => !usados.has(o.id)), n, porAutor); r.forEach((o) => usados.add(o.id)); return r; };

    prateleiras.push({ id: 'paravoce', titulo: 'Para você', sub: 'A Lia escolheu pelo seu gosto', livros: pega(todos, 14, 2) });

    for (const au of (perfil.autores || []).slice(0, 4)) {
      const kb = acharAutorKB(au.n);
      if (!kb) continue;
      if (kb.dp) {
        const lv = todos.filter((o) => o.aid === kb.id);
        if (lv.length) prateleiras.push({ id: 'autor-' + kb.id, titulo: kb.n, sub: 'Grátis, para ler agora', autor: kb.id, livros: pega(lv, 12, 12) });
      } else {
        if (kb.obras) prateleiras.push({ id: 'obras-' + kb.id, titulo: kb.n, sub: 'Todos os livros, com prévia e onde encontrar', autor: kb.id, livros: kb.obras.map((o, i) => obraKB(kb, o, i)), pago: true });
        const lv = (kb.livres || []).map((src) => todos.find((o) => o.src === src)).filter(Boolean).map((o) => ({ ...o, motivo: `Para quem gosta de ${kb.n}` }));
        if (lv.length) prateleiras.push({ id: 'como-' + kb.id, titulo: `Se você gosta de ${kb.n}`, sub: 'Clássicos gratuitos com a mesma pegada', livros: pega(lv, 12, 3, true) });
      }
    }
    const topG = Object.entries(V.g).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([id]) => id).filter((id) => KB.G[id]);
    for (const gid of topG) {
      const lv = todos.filter((o) => (o.g || []).includes(gid));
      const r = pega(lv, 12, 2);
      if (r.length >= 4) prateleiras.push({ id: 'g-' + gid, titulo: KB.G[gid].nome, sub: 'Do acervo livre', genero: gid, livros: r });
    }
    if (V.idiomas.includes('pt')) {
      const br = todos.filter((o) => o.l === 'pt' && (o.g || []).includes('brasileira'));
      const r = pega(br, 14, 2);
      if (r.length >= 4) prateleiras.push({ id: 'br', titulo: 'Clássicos brasileiros grátis', sub: 'Machado, Alencar, Álvares de Azevedo e mais', livros: r });
    }
    const curtas = todos.filter((o) => o.pal && o.pal < 22000);
    const rc = pega(curtas, 12, 2);
    if (rc.length >= 4) prateleiras.push({ id: 'curtas', titulo: 'Leituras rápidas', sub: 'Para terminar em até uma hora e meia', livros: rc });
    const LIT = ['literaria', 'classicos', 'contos', 'poesia', 'romance', 'suspense', 'policial', 'terror', 'aventura', 'fantasia', 'scifi', 'infantil', 'humor', 'teatro'];
    const alta = todos.filter((o) => (o.g || []).some((g) => LIT.includes(g) || V.g[g] > 0.5)).sort((a, b) => b.d - a.d);
    prateleiras.push({ id: 'alta', titulo: 'Os mais lidos do acervo livre', sub: 'Os favoritos de leitores do mundo todo', livros: pega(alta, 14, 1) });
    return prateleiras.filter((p) => p.livros.length);
  }

  /* ================= A busca inicial depois do cadastro ================= */
  async function descobrir(perfil, est, aoPasso = () => {}) {
    const diga = (t, extra = {}) => aoPasso({ t, ...extra });
    diga('Lendo o seu perfil de leitura');
    await sleep(350);
    const cat = await catalogo();
    diga(`Conferi ${fmtNum(cat.livros.length)} livros livres no acervo`, { n: cat.livros.length });
    const autores = [];
    for (const au of (perfil.autores || []).slice(0, 8)) {
      diga(`Procurando ${au.n} na web`);
      try {
        const info = await Promise.race([infoAutor(au.n), sleep(14000).then(() => null)]);
        if (info) {
          autores.push(info);
          const total = info.obras.length + info.livres.length;
          const capas = [...info.obras, ...info.livres].map((o) => o.capa).filter(Boolean).slice(0, 6);
          diga(`${info.n}: ${plural(total, '1 livro encontrado', '# livros encontrados')}${info.dp === false && info.obras.length ? ', com prévia e onde encontrar' : ''}`, { capas, foto: info.foto, autor: info.n });
        }
      } catch (e) { diga(`Não consegui falar com a web sobre ${au.n}. Uso o que já sei.`); }
    }
    for (const lv of (perfil.livros || []).slice(0, 5)) {
      if (lv.g && lv.g.length) continue;
      diga(`Entendendo por que você gostou de "${lv.t}"`);
      try {
        const r = await Fontes.openlibrary.buscar(lv.a ? { title: lv.t, author: lv.a } : { q: lv.t }, 3);
        if (r[0]) lv.g = generosDeAssuntos(r[0].assuntos);
      } catch (e) { /* segue sem */ }
    }
    diga('Conferindo domínio público no Brasil (70 anos após a morte do autor)');
    await sleep(300);
    diga('Separando clássicos do Wikisource em português');
    await sleep(250);
    const prateleiras = await recomendar(perfil, est);
    const nLivres = new Set(prateleiras.filter((p) => !p.pago).flatMap((p) => p.livros.map((l) => l.id))).size;
    diga(`Pronto! ${plural(nLivres, '1 livro gratuito separado', '# livros gratuitos separados')} para você`, { fim: true, capas: prateleiras[0] ? prateleiras[0].livros.slice(0, 8).map((l) => l.capa).filter(Boolean) : [] });
    return { prateleiras, autores };
  }

  /* ================= Busca inteligente (acervo + base + web) =================
     1. Entende o pedido: autor, título, personagem, gênero, tamanho, idioma e "grátis".
     2. Pontua cada livro como no BM25F: o título pesa mais que o autor, palavras raras pesam mais que comuns,
        e erros de digitação são tolerados como no Algolia (1 erro a partir de 4 letras, 2 a partir de 8).
     3. Soma popularidade, idioma, se é livre e o tamanho pedido. Os pesos vêm de ia-pesos.js,
        ajustados pelo treino em ferramentas/treinar-busca.js. */
  const PB = Object.assign({ titulo: 3, exato: 1.2, frase: 0.4, autor: 2.4, chave: 2.6, genero: 1.1, pop: 0.45, idioma: 0.6, pt: 0.25, livre: 0.35, falta: 1.4, curto: 1.2, cobreT: 0.35, minimo: 1.2, melhor: 3.2 },
    (typeof LIA_PESOS !== 'undefined' && LIA_PESOS.busca) || {});
  const VAZIAS = new Set(('quero queria gostaria ler leia lendo livro livros obra obras ebook ebooks pdf epub do da de dos das o a os as um uma uns umas me mostra mostre procura procure procurando ' +
    'busca buscar busque achar acha ache encontrar encontra baixar baixe tem ter algum alguma aquele aquela aquilo esse essa este esta sobre com que pra para por favor pf escrito escrita ' +
    'autor autora escritor escritora historia e em no na nos nas the of and le la les el los del di il des du lia oi ola outro outra mais algo coisa ' +
    'dar fazer faz indica indique recomenda recomende sugere sugira gosto gosta gostaria parecido parecidos parecida parecidas estilo tipo autores escritores contar conta ' +
    'tenha tenham seja sejam procuro preciso envolva envolvendo contenha fale falem mostre traga quais qual onde muito muita bem bom boa legal').split(' '));
  const raizB = (w) => (w.length > 4 ? w.replace(/(oes|aes|ais|eis|ns|s)$/, '') : w);
  const toksB = (s) => norm(s).replace(/[-']/g, ' ').split(' ').filter((w) => w && !VAZIAS.has(w) && !VAZIAS.has(raizB(w)));
  const FILTROS = [
    ['idioma', /\b(?:em|no|livros? em) (ingles|espanhol|frances|italiano|alemao|portugues)\b|\b(english)\b/],
    ['curto', /\b(curt[oa]s?|curtinh[oa]s?|rapidinh[oa]s?|poucas paginas|de uma sentada|ler rapido)\b/],
    ['longo', /\b(livros? longos?|algo longo|bem longos?|longos|calhamacos?)\b/],
    ['gratis', /\b(gratis|gratuit[oa]s?|de graca|dominio publico|livres?)\b/],
  ];
  const IDIOMA_DE = { ingles: 'en', english: 'en', espanhol: 'es', frances: 'fr', italiano: 'it', alemao: 'de', portugues: 'pt' };
  const HUMOR = [
    { rx: /\b(chorar|emocionante|emocionar|tocante|triste|sensivel)\b/, g: ['romance', 'literaria'], t: 'emocionar', frase: 'para se emocionar' },
    { rx: /\b(rir|engracad[oa]s?|divertid[oa]s?|leve|leves|relaxar|descontrair|comedia)\b/, g: ['humor', 'aventura'], t: 'leve', frase: 'leve e divertido' },
    { rx: /\b(medo|assustador(es)?|arrepiar|arrepiante|macabr[oa]s?|terror|horror)\b/, g: ['terror', 'gotico'], frase: 'para dar medo' },
    { rx: /\b(tenso|tensos|reviravoltas?|plot twist|nao largar|viciante|adrenalina|suspense)\b/, g: ['suspense', 'psicologico'], t: 'adrenalina', frase: 'cheio de reviravoltas' },
    { rx: /\b(classicos?|vestibular|enem)\b/, g: ['classicos'], t: 'classicos', frase: 'clássico' },
    { rx: /\b(antes de dormir|pra dormir|para dormir)\b/, t: 'dormir', g: ['contos', 'poesia'], frase: 'para antes de dormir' },
    { rx: /\b(romantic[oa]s?|amor|apaixonante)\b/, g: ['romance'], frase: 'romântico' },
  ];
  const nomeG = (id) => (KB.G[id] ? KB.G[id].nome : id);

  /* ---------- índice: um documento por livro, com os tokens de título e autor ---------- */
  let IDX = null;
  const normT = (s) => norm(s).replace(/[-']/g, ' ').replace(/\s+/g, ' ').trim();
  const VOLUME = /^ (tome|vol|volume|part|book|livre|band)\b/;
  function chavesTitulo(t) { return toksB(t).map(raizB); }
  /* um alvo vindo de personagem ou apelido aponta para este livro? */
  function bateAlvo(d, a) {
    if (a === d.src) return true;
    if (a.startsWith('autor:')) return d.aid === a.slice(6);
    if (a.startsWith('tit:')) return !!d.titKey && d.titKey === a.slice(4);
    if (a.startsWith('obra:')) return d.tipo === 'obra' && a === `obra:${d.aid}:${d.t}`;
    return false;
  }
  function indexar() {
    if (IDX && IDX.cat === CAT) return IDX;
    const docs = [], porSrc = new Map();
    const TIT = (typeof Saber !== 'undefined' ? Saber.TITULOS : []).map(([o, pt]) => [normT(o), pt]).sort((a, b) => b[0].length - a[0].length);
    const add = (d) => { d.tt = [d.t, d.tpt, d.o].filter(Boolean).map(chavesTitulo); d.ta = toksB(d.a).map(raizB); d.an = norm(d.a); docs.push(d); if (d.src) porSrc.set(d.src, d); return d; };
    if (CAT) {
      for (const l of CAT.livros) {
        if ((l.g || []).includes('referencia')) continue;
        const autor = l.a.length ? CAT.autores[l.a[0]].n : '';
        const kb = autor ? acharAutorKB(autor) : null;
        const cl = CLASS_SRC.get('gb:' + l.i);
        // o título traduzido vale para o título exato, para o título antes da primeira vírgula ("Les misérables, Tome I") ou para volumes
        const tl = tituloLimpo(l.t), tn = normT(tl), tc = normT(tl.replace(/\s*[,;:(].*$/, ''));
        let tpt = cl && (cl.l || 'pt') !== 'pt' ? cl.t : '', titKey = '';
        if (l.l !== 'pt') for (const [o, pt] of TIT) if (tn === o || tc === o || (tn.startsWith(o + ' ') && (VOLUME.test(tn.slice(o.length)) || o.length >= 12)) || (o.length >= 12 && tn.endsWith(' ' + o))) { titKey = o; if (!tpt) tpt = pt; break; }
        add({ src: 'gb:' + l.i, t: cl && (cl.l || 'pt') === 'pt' ? cl.t : tituloLimpo(l.t), tpt, a: kb ? kb.n : autor, aid: kb ? kb.id : '', l: l.l, g: Array.from(new Set([...(cl && cl.g || []), ...(l.g || [])])), pal: l.p || 0, d: l.d || 0, livre: dominioPublicoBR(l), titKey, tipo: 'gb', ref: l });
      }
    }
    for (const c of KB.CLASSICOS) {
      if (porSrc.has(c.src)) continue;
      const kb = KB.A[c.a];
      add({ src: c.src, t: c.t, tpt: '', a: kb ? kb.n : '', aid: c.a, l: c.l || 'pt', g: c.g || [], pal: c.pal || 0, d: 2500, livre: true, tipo: 'cl', ref: c });
    }
    for (const a of KB.AUTORES) (a.obras || []).forEach((o, i) => add({ src: '', id: `kb:${a.id}:${i}`, t: o.t, o: o.o || '', a: a.n, aid: a.id, l: 'pt', g: a.gen || [], pal: 0, d: Math.max(400, 30000 / (a.popular || 3) - i * 600), livre: false, tipo: 'obra', ref: [a, o, i] }));
    const df = new Map();
    for (const d of docs) for (const w of new Set(d.tt.flat())) df.set(w, (df.get(w) || 0) + 1);
    const N = docs.length;
    // índice invertido por prefixo de 3 letras, para não comparar a busca com todos os livros
    const pref = new Map();
    docs.forEach((d, k) => { for (const w of new Set([...d.tt.flat(), ...d.ta])) { const p = w.slice(0, 3); if (!pref.has(p)) pref.set(p, new Set()); pref.get(p).add(k); } });
    // autores do acervo por token de sobrenome
    const autoresTok = new Map();
    if (CAT) CAT.autores.forEach((a) => { const ts = toksB(a.n.split(',')[0]); const u = ts[ts.length - 1]; if (u && u.length >= 4) { if (!autoresTok.has(u)) autoresTok.set(u, []); autoresTok.get(u).push(a); } });
    const exonimos = new Map((typeof Saber !== 'undefined' && Saber.NOMES || []).map(([pt, orig]) => [norm(pt), orig]));
    IDX = { cat: CAT, docs, porSrc, idf: (w) => Math.log(1 + N / (df.get(w) || 0.5)), temTitulo: (w) => df.has(w), pref, autoresTok, exonimos, N };
    return IDX;
  }

  /* ---------- entender o pedido ---------- */
  function acharAutorAcervo(janela) {
    if (!CAT) return null;
    const I = indexar();
    const ex = I.exonimos.get(norm(janela));
    const ts = toksB(ex || janela);
    if (!ts.length) return null;
    const cands = I.autoresTok.get(ts[ts.length - 1]) || [];
    let melhor = null, nota = 0;
    for (const a of cands) {
      const an = toksB(a.n.split(',')[0]);
      const casa = ts.filter((t) => an.includes(t)).length;
      if (casa < ts.length) continue;
      const s = casa / an.length + (CAT.porAutor.get(a.k) || []).length / 1000;
      if ((ex || ts.length >= 2 || an.length <= 2 || ts[0].length >= 6) && s > nota) { nota = s; melhor = a; }
    }
    return melhor ? { n: melhor.n, kb: null, nn: norm(melhor.n) } : null;
  }
  function entenderBusca(q) {
    const n = norm(q);
    const Q = { q, n, filtros: {}, generos: [], humor: [], autor: null, alvos: [], chaves: [], toks: [], moles: new Set(), molesG: new Set(), entendi: [] };
    let resto = ' ' + n + ' ';
    for (const [id, rx] of FILTROS) {
      const m = n.match(rx);
      if (!m) continue;
      Q.filtros[id] = id === 'idioma' ? IDIOMA_DE[m[1] || m[2]] : true;
      resto = resto.replace(m[0], ' ');
    }
    // personagens, lugares e apelidos (frases mais longas primeiro)
    if (typeof Saber !== 'undefined') {
      const lista = [];
      for (const [ks, alvo] of Saber.CHAVES) for (const k of ks) lista.push([norm(k), alvo]);
      lista.sort((a, b) => b[0].length - a[0].length);
      const parecida = (a, b) => a === b || (a.length >= 5 && Math.abs(a.length - b.length) <= 1 && distancia(a, b, 1) <= 1);
      for (const [k, alvo] of lista) {
        const kt = k.split(' ');
        const rt = resto.trim().split(' ');
        let achou = -1;
        for (let i = 0; i + kt.length <= rt.length && achou < 0; i++) if (kt.every((w, j) => parecida(rt[i + j], w))) achou = i;
        if (achou < 0) continue;
        Q.alvos.push(alvo.startsWith('tit:') ? 'tit:' + normT(alvo.slice(4)) : alvo);
        Q.chaves.push(k);
        rt.slice(achou, achou + kt.length).forEach((w) => Q.moles.add(w));
        resto = ' ' + [...rt.slice(0, achou), ...rt.slice(achou + kt.length)].join(' ') + ' ';
      }
    }
    // gêneros e humor: entram como filtro "macio" (contam se o título também tiver a palavra)
    const achados = [];
    for (const g of KB.GENEROS) {
      let tam = 0;
      for (const s of [norm(g.nome), ...g.sin]) if (s.length > 2 && (' ' + n + ' ').includes(' ' + s + ' ')) { tam = Math.max(tam, s.length); s.split(' ').forEach((w) => { Q.moles.add(w); Q.molesG.add(w); }); }
      if (tam) achados.push([g.id, tam]);
    }
    // o nome de gênero mais longo citado é o mais específico ("suspense psicológico" antes de "suspense")
    achados.sort((a, b) => b[1] - a[1]).forEach(([id]) => Q.generos.push(id));
    // temas livres ("com corridas", "piratas", "vingança"): viram assuntos do catálogo
    Q.assuntos = [];
    if (typeof Saber !== 'undefined' && Saber.ASSUNTOS) {
      for (const [ps, rx, gs, frase] of Saber.ASSUNTOS) {
        const p = ps.map(norm).filter((x) => (' ' + n + ' ').includes(' ' + x + ' ')).sort((a, b) => b.length - a.length)[0];
        if (!p) continue;
        Q.assuntos.push({ rx: new RegExp(rx, 'i'), g: gs, frase });
        p.split(' ').forEach((w) => Q.moles.add(w));
      }
    }
    for (const h of HUMOR) if (h.rx.test(n)) { Q.humor.push(h); (h.g || []).forEach((g) => { if (!Q.generos.includes(g)) Q.generos.push(g); }); (n.match(h.rx) || [''])[0].split(' ').forEach((w) => Q.moles.add(w)); }
    // autor: janelas de 4 a 1 palavras, primeiro na base, depois no acervo
    const ts = resto.trim().split(' ').filter(Boolean);
    for (let tam = Math.min(4, ts.length); tam >= 1 && !Q.autor; tam--) {
      for (let i = 0; i + tam <= ts.length; i++) {
        const pedaco = ts.slice(i, i + tam);
        if (VAZIAS.has(pedaco[0]) || VAZIAS.has(pedaco[pedaco.length - 1])) continue;
        const txt = pedaco.join(' ');
        if (txt.length < 3) continue;
        let kb = acharAutorKB(txt);
        if (kb && !trechoEhDoAutor(kb, pedaco)) kb = null;
        // sobrenome sozinho que também é palavra de título ("a mulher de branco") só vale se for a busca inteira
        if (kb && tam === 1 && ts.length > 1 && !aliasExato(kb, txt) && indexar().temTitulo(raizB(txt))) kb = null;
        // um sobrenome sozinho do acervo só vira autor se não for palavra de título (ex.: "faust", "holmes")
        const ac = kb ? null : (tam >= 2 || indexar().exonimos.has(txt) || (txt.length >= 5 && !Q.alvos.length && !indexar().temTitulo(raizB(txt))) ? acharAutorAcervo(txt) : null);
        if (kb || ac) {
          Q.autor = kb ? { n: kb.n, kb, id: kb.id, nn: norm(kb.n) } : ac;
          Q.autorToks = new Set(pedaco.map(raizB));
          pedaco.forEach((w) => Q.moles.add(w));
          break;
        }
      }
    }
    const I = indexar();
    // as palavras do nome do autor ficam fora do título: já contam na nota de autor (sem contar em dobro)
    Q.toks = toksB(resto).map((w) => ({ w: raizB(w), mole: Q.moles.has(w) || !!(Q.autorToks && Q.autorToks.has(raizB(w))), autor: !!(Q.autorToks && Q.autorToks.has(raizB(w))), genero: Q.molesG.has(w), idf: I.idf(raizB(w)) }));
    Q.duros = Q.toks.filter((t) => !t.mole);
    if (Q.autor) Q.entendi.push('Autor: ' + Q.autor.n);
    if (Q.chaves.length) Q.entendi.push('Personagem ou tema: ' + Q.chaves.join(', '));
    if (Q.assuntos.length) Q.entendi.push('Tema: ' + Q.assuntos.map((a) => a.frase).join(', '));
    if (Q.generos.length) Q.entendi.push(Q.generos.slice(0, 3).map(nomeG).join(' · '));
    if (Q.filtros.curto) Q.entendi.push('Leituras curtas');
    if (Q.filtros.longo) Q.entendi.push('Livros longos');
    if (Q.filtros.idioma) Q.entendi.push('Em ' + ((KB.IDIOMAS.find((x) => x.id === Q.filtros.idioma) || {}).nome || Q.filtros.idioma).toLowerCase());
    if (Q.filtros.gratis) Q.entendi.push('Só gratuitos');
    return Q;
  }

  /* ---------- pontuação ---------- */
  function casaToken(w, alvo) {
    let m = 0;
    for (const t of alvo) {
      if (t === w) return 1;
      if (w.length >= 3 && t.startsWith(w)) m = Math.max(m, 0.82);
      else if (w.length >= 4 && Math.abs(t.length - w.length) <= 2) {
        const max = w.length >= 8 ? 2 : 1;
        const d = distancia(w, t, max);
        if (d <= max) m = Math.max(m, d === 1 ? 0.72 : 0.55);
      }
    }
    return m;
  }
  function notaTitulo(Q, tt) {
    if (!Q.toks.length || !tt.length) return { s: 0, cob: 0 };
    let soma = 0, peso = 0, casados = 0;
    const usadas = new Set();
    for (const t of Q.toks) {
      if (t.autor) continue;
      const m = casaToken(t.w, tt);
      if (t.mole && !m) continue;
      peso += t.idf; soma += t.idf * m;
      if (m) { casados++; usadas.add(t.w); }
    }
    if (!peso) return { s: 0, cob: 0, usadas };
    const cob = soma / peso;
    const cobT = Math.min(1, casados / tt.length);
    let s = cob * (1 - PB.cobreT + PB.cobreT * cobT);
    const qj = Q.toks.filter((t) => !t.autor && (!t.mole || tt.includes(t.w))).map((t) => t.w).join(' ');
    const tj = tt.join(' ');
    if (qj && qj === tj) s += PB.exato / PB.titulo;
    else if (qj.length >= 6 && tj.includes(qj)) s += PB.frase / PB.titulo;
    return { s, cob, usadas };
  }
  function relevancia(d, Q, idiomas) {
    let tit = { s: 0, cob: 0, usadas: new Set() };
    for (const tt of d.tt) { const r = notaTitulo(Q, tt); if (r.s > tit.s) tit = r; }
    let s = PB.titulo * tit.s;
    let sa = 0;
    if (Q.autor) sa = (Q.autor.id && d.aid === Q.autor.id) || d.an === Q.autor.nn ? 1 : 0;
    else if (Q.duros.length && d.ta.length) { const c = Q.duros.filter((t) => !(tit.usadas && tit.usadas.has(t.w)) && casaToken(t.w, d.ta) >= 0.72).length; if (c) sa = 0.8 * Math.min(1, c / Math.min(2, d.ta.length)); }
    s += PB.autor * sa;
    const ch = Q.alvos.some((a) => bateAlvo(d, a)) ? 1 : 0;
    s += PB.chave * ch;
    const g = d.g || [];
    if (Q.generos.length) s += PB.genero * Q.generos.filter((x) => g.includes(x)).length / Math.min(2, Q.generos.length);
    s += PB.pop * Math.log10((d.d || 0) + 10) / 5;
    if (idiomas.includes(d.l)) s += PB.idioma * (idiomas[0] === d.l ? 1 : 0.6);
    if (d.l === 'pt') s += PB.pt;
    if (d.livre) s += PB.livre;
    if (Q.duros.length && !ch && sa < 1) s -= PB.falta * (1 - tit.cob);
    if (Q.filtros.curto && d.pal) s += d.pal < 25000 ? PB.curto : d.pal > 60000 ? -PB.curto : 0;
    if (Q.filtros.longo && d.pal) s += d.pal > 90000 ? PB.curto * 0.6 : -PB.curto * 0.4;
    if (Q.filtros.idioma && d.l !== Q.filtros.idioma) s -= 2.5;
    if (Q.filtros.gratis && !d.livre) s -= 3;
    return { s, tit: tit.cob, sa, ch };
  }
  function candidatosDe(Q, amplo) {
    const I = indexar();
    const ks = new Set();
    for (const t of Q.toks) {
      const p = t.w.slice(0, 3);
      if (I.pref.has(p)) for (const k of I.pref.get(p)) ks.add(k);
      // segunda tentativa: erro nas primeiras letras ("frankestein" → "frankenstein", "chakespeare")
      if (amplo && t.w.length >= 5) for (const [pp, set] of I.pref) if (pp !== p && ((pp[1] === p[1] && pp[2] === p[2]) || (pp[0] === p[0] && (pp[1] === p[2] || pp[2] === p[1])))) for (const k of set) ks.add(k);
    }
    if (Q.autor || Q.alvos.length || Q.generos.length) I.docs.forEach((d, k) => {
      if ((Q.autor && (d.aid === (Q.autor.id || '-') || d.an === Q.autor.nn)) || Q.alvos.some((a) => bateAlvo(d, a)) || (Q.generos.length && (d.g || []).some((g) => Q.generos.includes(g)))) ks.add(k);
    });
    return Array.from(ks, (k) => I.docs[k]);
  }
  function docParaLivro(d) {
    if (d.tipo === 'gb') { const o = deCatalogo(d.ref); return d.tpt && !o.tpt ? { ...o, tpt: d.tpt } : o; }
    if (d.tipo === 'cl') return deClassico(d.ref);
    if (d.tipo === 'obra') return obraKB(...d.ref);
    return d.ref;
  }
  /* Busca só no que está no aparelho (acervo + base). Usada também pelo treino. */
  function buscarLocal(q, est = {}) {
    const Q = entenderBusca(q);
    const perfil = est.perfil || {};
    const idiomas = Q.filtros.idioma ? [Q.filtros.idioma] : (perfil.idiomas && perfil.idiomas.length ? perfil.idiomas : ['pt', 'en']);
    const res = { q, Q, entendi: Q.entendi, autores: [], livres: [], pagos: [], genero: Q.generos.length ? KB.G[Q.generos[0]] || null : null, melhor: null, web: false };
    if (Q.autor) res.autores.push(Q.autor.kb ? { id: Q.autor.kb.id, n: Q.autor.kb.n, kb: Q.autor.kb, pais: Q.autor.kb.pais, dp: Q.autor.kb.dp } : { id: 'w:' + norm(Q.autor.n), n: Q.autor.n });
    for (const a of Q.alvos) if (a.startsWith('autor:') && KB.A[a.slice(6)] && !res.autores.some((x) => x.id === a.slice(6))) { const kb = KB.A[a.slice(6)]; res.autores.push({ id: kb.id, n: kb.n, kb, pais: kb.pais, dp: kb.dp }); }
    // gênero puro ("terror", "suspense curto"): ranking pelo gosto da pessoa dentro do gênero
    // gênero ou filtro puro ("terror", "suspense curto", "livros curtos"): ranking pelo gosto da pessoa
    // se as palavras "macias" formam um título de verdade ("a ilha do tesouro", "um conto de natal"), vale o título
    const tituloForte = () => {
      const ts = Q.toks.filter((t) => !t.autor);
      if (!ts.length) return false;
      for (const d of candidatosDe(Q, false)) for (const tt of d.tt) {
        const casam = ts.filter((t) => casaToken(t.w, tt) >= 0.82).length;
        if ((casam >= 2 && casam >= ts.length - 1) || (casam === ts.length && ts.map((t) => t.w).join(' ') === tt.join(' '))) return true;
      }
      return false;
    };
    const soGenero = !Q.duros.length && !Q.autor && !Q.alvos.length && (Q.generos.length || Q.assuntos.length || Object.keys(Q.filtros).length) && !tituloForte();
    if (!soGenero && !Q.duros.length && !Q.autor && !Q.alvos.length) { Q.duros = Q.toks.filter((t) => !t.genero); Q.duros.forEach((t) => { t.mole = false; }); }
    const pontuados = [];
    if (soGenero && CAT) {
      const gensA = Q.assuntos.flatMap((a) => a.g);
      const gens = Q.generos.length ? Q.generos : gensA.length ? gensA : (perfil.generos || []);
      const V = vetor({ ...perfil, generos: gens, idiomas, tipos: [...(perfil.tipos || []).filter((t) => t !== 'curtas' && t !== 'longas'), ...(Q.filtros.curto ? ['curtas'] : []), ...(Q.filtros.longo ? ['longas'] : []), ...Q.humor.map((h) => h.t).filter(Boolean)] }, est.pesos);
      if (Q.generos[0]) V.g[Q.generos[0]] = (V.g[Q.generos[0]] || 0) + PB.genero * 0.6; // o gênero mais específico citado pesa mais
      const temAssunto = (o) => Q.assuntos.filter((a) => (o.s || []).some((x) => a.rx.test(x))).length;
      const lista = candidatos(V).filter((o) => Q.assuntos.length ? temAssunto(o) || (!Q.generos.length && false) : !Q.generos.length || (o.g || []).some((g) => Q.generos.includes(g)))
        .filter((o) => !Q.generos.length || !Q.assuntos.length || (o.g || []).some((g) => Q.generos.includes(g)) || temAssunto(o))
        .map((o) => ({ ...o, nota: pontuar(o, V, est).s + temAssunto(o) * (PB.assunto || 2.5) + (Q.filtros.curto && o.pal ? (o.pal < 25000 ? PB.curto : o.pal > 60000 ? -PB.curto * 2 : 0) : 0) }))
        .filter((o) => o.nota > -Infinity).sort((a, b) => b.nota - a.nota);
      // nada no idioma do perfil: tenta os outros idiomas (avisando em "entendi")
      if (!lista.length && !Q.filtros.idioma && !est._amplo && idiomas.length < 4) {
        const r2 = buscarLocal(q, { ...est, _amplo: true, perfil: { ...perfil, idiomas: ['pt', 'en', 'es', 'fr', 'it'] } });
        if (r2.livres.length) r2.entendi = [...r2.entendi, 'Em outros idiomas (não há em português)'];
        return r2;
      }
      res.livres = diversificar(lista, 36, 2).map((o) => ({ ...o, motivo: Q.assuntos.length ? 'Tem ' + Q.assuntos.map((a) => a.frase).join(' e ') : o.motivo || (Q.generos[0] ? nomeG(Q.generos[0]) : '') }));
      return res;
    }
    const pontuar1 = (amplo) => {
      for (const d of candidatosDe(Q, amplo)) {
        const r = relevancia(d, Q, idiomas);
        const casou = r.tit >= 0.5 || r.sa >= 0.8 || r.ch;
        if (r.s >= PB.minimo && (casou || (!Q.duros.length && Q.generos.length && (d.g || []).some((g) => Q.generos.includes(g))))) pontuados.push([r.s, d, r]);
      }
    };
    pontuar1(false);
    if (Q.duros.length && !pontuados.some(([, , r]) => r.tit >= 0.7 || r.ch)) { pontuados.length = 0; pontuar1(true); }
    pontuados.sort((a, b) => b[0] - a[0]);
    const vistos = new Set();
    for (const [s, d, r] of pontuados.slice(0, 80)) {
      const o = { ...docParaLivro(d), rel: s };
      const k = norm(o.t) + '|' + norm(o.a).split(' ').pop();
      if (vistos.has(k)) continue;
      vistos.add(k);
      (o.livre ? res.livres : res.pagos).push(o);
      if (!res.melhor && s >= PB.melhor && (r.tit >= 0.75 || r.ch)) res.melhor = { tipo: 'livro', livro: o };
    }
    // o autor vence quando a busca é só o nome dele
    if (Q.autor && Q.toks.every((t) => t.autor || t.genero) && !Q.alvos.length) res.melhor = { tipo: 'autor', autor: res.autores[0] };
    else if (!res.melhor && res.autores.length && !Q.duros.length) res.melhor = { tipo: 'autor', autor: res.autores[0] };
    return res;
  }
  function casaTexto(q, alvo) {
    const nq = norm(q), na = norm(alvo);
    if (!nq || !na) return 0;
    if (na === nq) return 1;
    if (na.startsWith(nq) && nq.length >= 3) return 0.92;
    if (na.includes(nq) && nq.length >= 4) return 0.85;
    const toks = nq.split(' ').filter((t) => t.length > 2);
    if (toks.length && toks.every((t) => na.includes(t))) return 0.8;
    const p = parecido(nq, na);
    return p > 0.55 ? p * 0.9 : 0;
  }
  function generoDaFrase(q) {
    const n = ' ' + norm(q) + ' ';
    let melhor = null, tam = 0;
    for (const g of KB.GENEROS) for (const s of [norm(g.nome), ...g.sin]) if (n.includes(' ' + s + ' ') && s.length > tam) { melhor = g; tam = s.length; }
    return melhor;
  }
  /* Busca completa: começa pelo aparelho (resposta na hora) e completa com a web, reordenando tudo pela mesma nota. */
  async function buscarTudo(q, est = {}, aoParcial = () => {}) {
    q = String(q || '').trim();
    if (!q) return { q, autores: [], livres: [], pagos: [], genero: null, web: true, entendi: [] };
    await catalogo().catch(() => null);
    const res = buscarLocal(q, est);
    const Q = res.Q;
    aoParcial({ ...res });
    const perfil = est.perfil || {};
    const idiomas = Q.filtros.idioma ? [Q.filtros.idioma] : (perfil.idiomas && perfil.idiomas.length ? perfil.idiomas : ['pt', 'en']);
    const extras = [];
    const ja = new Set([...res.livres, ...res.pagos].map((o) => o.src || o.id));
    const jaT = new Set([...res.livres, ...res.pagos].map((o) => norm(o.t) + '|' + norm(o.a).split(' ').pop()));
    const doWeb = (o) => { const tt = [o.t, o.tpt].filter(Boolean).map(chavesTitulo); return { ...o, tt: tt.length ? tt : [[]], ta: toksB(o.a).map(raizB), an: norm(o.a), tipo: 'web', ref: o }; };
    const termo = [Q.autor ? Q.autor.n : '', ...Q.toks.filter((t) => !Q.autorToks || !Q.autorToks.has(t.w)).map((t) => t.w)].join(' ').trim() || q;
    const pedidos = [];
    if (!(Q.toks.length === 0 && Q.generos.length && !Q.autor)) {
      pedidos.push(Fontes.gutenberg.buscar(termo).then((lst) => {
        for (const x of lst.slice(0, 20)) {
          if (ja.has('gb:' + x.id)) continue;
          ja.add('gb:' + x.id);
          const l = CAT && CAT.porGb.get(x.id);
          const o = l ? deCatalogo(l) : { id: 'gb:' + x.id, src: 'gb:' + x.id, t: tituloLimpo(x.t), a: x.a, l: x.l || '', g: [], pal: 0, d: 0, capa: Fontes.gutenberg.capa(x.id), livre: true, conferir: true, fonte: 'Project Gutenberg' };
          extras.push(doWeb(o));
        }
      }).catch(() => null));
      if (!Q.filtros.idioma || Q.filtros.idioma === 'pt') pedidos.push(Fontes.wikisource.buscar(termo).then((lst) => {
        for (const x of lst.slice(0, 8)) {
          const src = 'ws:' + x.titulo;
          if (ja.has(src)) continue;
          ja.add(src);
          const cl = CLASS_SRC.get(src);
          extras.push(doWeb(cl ? deClassico(cl) : { id: src, src, t: x.titulo, a: '', l: 'pt', g: [], pal: x.palavras, d: 0, capa: '', livre: true, fonte: 'Wikisource', sin: x.trecho }));
        }
      }).catch(() => null));
      pedidos.push(Fontes.openlibrary.buscar(Q.autor && !Q.duros.length ? { author: Q.autor.n, sort: 'editions' } : { q: termo }, 24).then((lst) => {
        for (const d of lst) {
          const k = norm(d.t) + '|' + norm(d.a).split(' ').pop();
          if (jaT.has(k)) continue;
          if (d.gb && CAT && CAT.porGb.has(+d.gb)) { if (ja.has('gb:' + d.gb)) continue; ja.add('gb:' + d.gb); extras.push(doWeb(deCatalogo(CAT.porGb.get(+d.gb)))); continue; }
          jaT.add(k);
          if (!d.capa && d.edicoes < 2) continue;
          extras.push(doWeb({ id: 'ol:' + d.ol.split('/').pop(), src: '', t: d.t, a: d.a, l: d.langs.includes('por') ? 'pt' : (d.langs[0] || '').slice(0, 2), g: generosDeAssuntos(d.assuntos), ano: d.ano, capa: Fontes.openlibrary.capa(d.capa), livre: false, ol: d.ol, fonte: 'Open Library', d: d.edicoes * 40 }));
          if (d.a && !res.autores.some((x) => norm(x.n) === norm(d.a)) && Q.duros.length && casaTexto(Q.duros.map((t) => t.w).join(' '), d.a) >= 0.8) res.autores.push({ id: 'w:' + norm(d.a), n: d.a, ol: d.ak });
        }
      }).catch(() => null));
    }
    const juntar = () => {
      for (const e of extras.splice(0)) {
        const r = relevancia(e, Q, idiomas);
        const casou = r.tit >= 0.5 || r.sa >= 0.8 || r.ch || e.tipo === 'web' && e.fonte === 'Project Gutenberg' && Q.toks.length;
        if (r.s < PB.minimo - 0.6 && !casou) continue;
        const o = { ...e.ref, rel: r.s };
        (o.livre ? res.livres : res.pagos).push(o);
      }
      const ord = (a, b) => (b.rel || 0) - (a.rel || 0);
      if (!res.Q.generos.length || res.Q.duros.length || res.Q.autor) { res.livres.sort(ord); res.pagos.sort(ord); }
    };
    await Promise.all(pedidos.map((p) => p.then(() => { juntar(); aoParcial({ ...res, web: true }); })));
    juntar();
    res.web = true;
    return res;
  }

  /* ================= Identificar ebook importado ================= */
  const LIXO_TITULO = /^(unknown|untitled|sem t[ií]tulo|microsoft word.*|document\d*|documento\d*|livro\d*|ebook\d*|book\d*|\d+|[a-f0-9-]{16,})$/i;
  const LIXO_AUTOR = /^(unknown|desconhecid[oa]|anonymous|an[oô]nimo|calibre|admin|user|usu[aá]rio|autor|author|.*@.*)$/i;
  function doNomeDoArquivo(nome) {
    let s = String(nome || '').replace(/\.[a-z0-9]{2,5}$/i, '');
    s = s.replace(/[\[(][^\])]*(z-lib|libgen|epub|pdf|mobi|ebook|pt-br|ptbr|\d{4}|isbn|www\.)[^\])]*[\])]/gi, ' ');
    s = s.replace(/\b(97[89][\d-]{10,})\b/g, ' ').replace(/[_.]+/g, ' ').replace(/\b(epub|pdf|mobi|azw3|ebook|pt-br|ptbr|portugues)\b/gi, ' ').replace(/\s+/g, ' ').trim();
    let partes = s.split(/\s+[-–—]\s+|\s+by\s+|\s+por\s+/i).map((x) => x.trim()).filter(Boolean);
    if (partes.length < 2 && /\s-\s?|-\s/.test(s)) partes = s.split(/\s*-\s*/).filter(Boolean);
    if (partes.length >= 2) {
      const [x, y] = partes;
      const ax = acharAutorKB(x), ay = acharAutorKB(y);
      const pareceAutor = (t) => t.split(' ').length <= 4 && t.split(' ').every((w) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇ]/.test(w) || /^(de|da|do|dos|das|e)$/.test(w));
      if (ax && !ay) return { titulo: partes.slice(1).join(' - '), autor: ax.n };
      if (ay && !ax) return { titulo: x, autor: ay.n };
      if (CAT) {
        if (CAT.porAutor.has(norm(x)) && !CAT.porAutor.has(norm(y))) return { titulo: y, autor: x };
        if (CAT.porAutor.has(norm(y))) return { titulo: x, autor: y };
      }
      if (pareceAutor(x) && !pareceAutor(y)) return { titulo: y, autor: x };
      return { titulo: x, autor: y };
    }
    return { titulo: s, autor: '' };
  }
  async function identificar({ titulo, autor, idioma, texto, arquivo, assuntos }) {
    await catalogo().catch(() => null);
    let t = (titulo || '').trim(), a = (autor || '').trim();
    const pelaPasta = doNomeDoArquivo(arquivo);
    if (!t || LIXO_TITULO.test(t) || t.length < 2) t = pelaPasta.titulo;
    if (!a || LIXO_AUTOR.test(a)) a = pelaPasta.autor;
    const r = { titulo: t || 'Sem título', autor: a || '', idioma: idioma ? idioma.slice(0, 2).toLowerCase() : '', generos: [], ano: null, capa: '', sinopse: '', ol: '', confianca: 0.4, passos: [] };
    if (!r.idioma && texto) r.idioma = detectarIdioma(texto);
    const kb = a ? acharAutorKB(a) : null;
    if (kb) { r.autor = kb.n; r.aid = kb.id; r.generos.push(...kb.gen.slice(0, 2)); r.confianca += 0.2; r.passos.push(`Reconheci ${kb.n}`); }
    // obra conhecida da base?
    if (kb && kb.obras) {
      const o = kb.obras.find((x) => casaTexto(t, x.t) >= 0.75 || (x.o && casaTexto(t, x.o) >= 0.8));
      if (o) { r.titulo = o.t; r.ano = o.ano; r.sinopse = o.sin || ''; r.capaRemota = o.capa ? Fontes.openlibrary.capa(o.capa, 'L') : ''; r.confianca = 0.95; r.passos.push(`É "${o.t}" (${o.ano})`); }
    }
    // Open Library
    if (r.confianca < 0.9 && t) {
      try {
        const docs = await Fontes.openlibrary.buscar(a ? { title: t, author: a } : { title: t }, 8);
        let melhor = null, nota = 0;
        for (const d of docs) {
          const s = casaTexto(t, d.t) * 0.7 + (a ? casaTexto(a, d.a) * 0.3 : 0.15) + Math.min(d.edicoes, 30) / 300;
          if (s > nota) { nota = s; melhor = d; }
        }
        if (melhor && nota >= 0.62) {
          if (!a) r.autor = melhor.a;
          r.ano = r.ano || melhor.ano;
          r.ol = melhor.ol;
          if (melhor.capa) r.capaRemota = r.capaRemota || Fontes.openlibrary.capa(melhor.capa, 'L');
          r.generos.push(...generosDeAssuntos(melhor.assuntos));
          r.confianca = Math.max(r.confianca, Math.min(0.92, nota));
          r.passos.push(`Encontrei na Open Library: ${melhor.t}${melhor.a ? ' (' + melhor.a + ')' : ''}`);
          if (!r.sinopse) r.sinopse = await Fontes.openlibrary.descricao(melhor.ol).catch(() => '');
        }
      } catch (e) { r.passos.push('Sem internet para conferir na web'); }
    }
    if (assuntos && assuntos.length) r.generos.push(...generosDeAssuntos(assuntos));
    if (r.generos.length < 2 && texto) { const g = generosDoTexto(texto); if (g.length) { r.generos.push(...g); r.passos.push('Li o começo e percebi: ' + g.map((x) => KB.G[x].nome.toLowerCase()).join(', ')); } }
    r.generos = Array.from(new Set(r.generos)).slice(0, 4);
    if (!r.aid && r.autor) { const k2 = acharAutorKB(r.autor); if (k2) r.aid = k2.id; }
    return r;
  }

  /* ================= Aprendizado ================= */
  const PESO_EVENTO = { abriu: 0.04, leu10: 0.08, terminou: 0.35, curtiu: 0.45, descurtiu: -0.45, descartou: -0.35, abandonou: -0.12 };
  function aprender(est, evento, livro) {
    const v = PESO_EVENTO[evento];
    if (!v || !livro) return;
    est.pesos = est.pesos || { g: {}, a: {} };
    est.pesos.g = est.pesos.g || {}; est.pesos.a = est.pesos.a || {};
    for (const g of (livro.g || []).slice(0, 3)) est.pesos.g[g] = clamp((est.pesos.g[g] || 0) + v, -2, 2);
    if (livro.a) { const k = norm(livro.a); est.pesos.a[k] = clamp((est.pesos.a[k] || 0) + v * 1.5, -3, 3); }
    if (evento === 'descartou') { est.descartados = est.descartados || []; if (!est.descartados.includes(livro.id)) est.descartados.push(livro.id); }
  }

  /* Livros parecidos com um livro (mesmo autor, gêneros e assuntos) */
  async function parecidos(livro, est = {}, n = 12) {
    await catalogo().catch(() => null);
    if (!CAT) return [];
    const perfil = est.perfil || {};
    const V = vetor({ ...perfil, generos: livro.g || [] }, est.pesos);
    const assuntos = new Set((livro.s || []).map(norm));
    const lista = candidatos(V).filter((o) => o.id !== livro.id).map((o) => {
      let s = pontuar(o, V, est).s;
      if (s === -Infinity) return null;
      for (const x of o.s || []) if (assuntos.has(norm(x))) s += 1.2;
      if (norm(o.a) === norm(livro.a)) s += 1.5;
      return { ...o, nota: s };
    }).filter(Boolean).sort((a, b) => b.nota - a.nota);
    return diversificar(lista, n, 2);
  }

  /* confere no RDF do Gutenberg se o autor morreu até 1955 (para livros fora do acervo local) */
  async function conferirDominio(gid) {
    try {
      const xml = await buscar(new URL(`gutenberg/cache/epub/${gid}/pg${gid}.rdf`, location.href).href, { tipo: 'text', ms: 12000 });
      const mortes = Array.from(xml.matchAll(/<pgterms:deathdate[^>]*>(-?\d+)<\/pgterms:deathdate>/g)).map((m) => +m[1]);
      const nasc = Array.from(xml.matchAll(/<pgterms:birthdate[^>]*>(-?\d+)<\/pgterms:birthdate>/g)).map((m) => +m[1]);
      if (mortes.length) return mortes.every((m) => m <= LIMITE_DP);
      if (nasc.length) return nasc.every((b) => b <= 1860);
      return true;
    } catch (e) { return true; }
  }

  /* o treino (ferramentas/treinar-busca.js) troca os pesos para testar combinações */
  const pesosBusca = (novos) => { if (novos) { Object.assign(PB, novos); } return { ...PB }; };

  return { catalogo, acharAutorKB, infoAutor, fotoAutor, recomendar, descobrir, buscarTudo, buscarLocal, entenderBusca, pesosBusca, HUMOR, identificar, aprender, parecidos, porSrc, deClassico, generoDaFrase, generosDoTexto, conferirDominio, vetor, casaTexto, tituloLimpo, doNomeDoArquivo };
})();
