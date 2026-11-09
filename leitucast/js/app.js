/* LeituCast Ingrid: telas, contas, estante, leitor e narração. */
'use strict';
(() => {
  /* ================= Estado e contas ================= */
  const K_CONTAS = 'lc-contas', K_LISTA = 'lc-lista', K_ATUAL = 'lc-atual', kDados = (id) => 'lc-dados-' + id, kPrat = (id) => 'lc-prat-' + id;
  let contas = LS.get(K_CONTAS, {}) || {};
  let listaNuvem = LS.get(K_LISTA, []) || [];
  let contaId = null, S = null;
  const celular = () => innerWidth < 600;
  const LEITURA0 = () => ({ fonte: 'literata', tam: celular() ? 18 : 20, entre: 1.6, margem: celular() ? 'estreita' : 'media', alinha: 'justificado', tema: 'papel', textura: true, brilho: 100, quente: 0, virar: 'folha', duas: 'auto' });
  const novoEstado = (nome) => ({
    v: 1, nome, criadoEm: Date.now(),
    perfil: { generos: [], autores: [], livros: [], tipos: [], idiomas: ['pt'], livres: [], pronto: false, ts: Date.now() },
    estante: {}, marcas: {}, marcadores: {}, seguidos: {},
    cfg: { tema: 'auto', leitura: LEITURA0(), voz: { voz: '', estilo: 'natural', vel: 1 } },
    stats: { dias: {} }, pesos: { g: {}, a: {} }, descartados: [], ppm: 230,
  });
  const salvarContas = () => LS.set(K_CONTAS, contas);
  /* pede ao navegador para não apagar os dados do app quando faltar espaço (a sessão e os livros ficam) */
  const pedirArmazenamentoFixo = () => { try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then((ja) => ja || navigator.storage.persist()).catch(() => null); } catch (e) { /* sem suporte */ } };
  function completar(s) {
    const b = novoEstado(s.nome || '');
    const r = { ...b, ...s };
    r.perfil = { ...b.perfil, ...(s.perfil || {}) };
    r.cfg = { ...b.cfg, ...(s.cfg || {}) };
    r.cfg.leitura = { ...LEITURA0(), ...((s.cfg || {}).leitura || {}) };
    r.cfg.voz = { ...b.cfg.voz, ...((s.cfg || {}).voz || {}) };
    r.stats = { dias: {}, ...(s.stats || {}) };
    for (const k of ['estante', 'marcas', 'marcadores', 'seguidos']) r[k] = r[k] || {};
    return r;
  }
  let salvarT = 0, sincT = 0, sincronizando = false;
  function salvar(imediato) {
    if (!contaId || !S) return;
    LS.set(kDados(contaId), S);
    clearTimeout(sincT);
    sincT = setTimeout(sincronizar, imediato ? 50 : 2500);
  }
  function juntar(a, b) {
    const r = completar({ ...b, ...a });
    const est = { ...(b.estante || {}) };
    for (const [id, x] of Object.entries(a.estante || {})) {
      const y = est[id];
      if (!y) { est[id] = x; continue; }
      const novo = (x.ultimo || x.add || 0) >= (y.ultimo || y.add || 0) ? { ...y, ...x } : { ...x, ...y };
      const px = x.prog || {}, py = y.prog || {};
      novo.prog = (px.ts || 0) >= (py.ts || 0) ? px : py;
      est[id] = novo;
    }
    r.estante = est;
    for (const k of ['marcas', 'marcadores']) {
      const m = { ...(b[k] || {}) };
      for (const [id, lst] of Object.entries(a[k] || {})) {
        const vistos = new Map((m[id] || []).map((x) => [x.ts, x]));
        for (const x of lst) vistos.set(x.ts, x);
        m[id] = Array.from(vistos.values()).sort((x, y) => x.c - y.c || (x.i || x.o) - (y.i || y.o));
      }
      r[k] = m;
    }
    const dias = { ...((b.stats || {}).dias || {}) };
    for (const [d, s] of Object.entries((a.stats || {}).dias || {})) dias[d] = Math.max(dias[d] || 0, s);
    r.stats = { ...(b.stats || {}), ...(a.stats || {}), dias };
    r.perfil = ((a.perfil || {}).ts || 0) >= ((b.perfil || {}).ts || 0) ? a.perfil : b.perfil;
    r.descartados = Array.from(new Set([...(a.descartados || []), ...(b.descartados || [])]));
    return r;
  }
  async function sincronizar() {
    const c = contas[contaId];
    if (!c || !c.token || c.local || sincronizando) return;
    sincronizando = true;
    marcarSync('enviando');
    try {
      for (let t = 0; t < 3; t++) {
        const r = await Nuvem.salvar(c.token, S, c.versao);
        if (r && r.versao) { c.versao = r.versao; salvarContas(); marcarSync('ok'); break; }
        if (r && r.erro === 'conflito') { S = juntar(S, r.estado || {}); c.versao = r.versao; LS.set(kDados(contaId), S); continue; }
        if (r && r.erro === 'sessao') { c.token = null; salvarContas(); marcarSync('erro'); break; }
        break;
      }
    } catch (e) { marcarSync('offline'); }
    finally { sincronizando = false; }
  }
  function marcarSync(s) { const el = $('#syncEstado'); if (el) el.dataset.s = s; }
  addEventListener('online', () => salvar(true));
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S) { LS.set(kDados(contaId), S); sincronizar(); } });

  /* ================= utilidades de tela ================= */
  const tela = $('#tela');
  const REG = new Map();
  const reg = (l) => { REG.set(l.id, l); return l.id; };
  function toast(msg, ms = 2800) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { t.hidden = true; }, ms);
  }
  const ARTE = {
    almeida: 'img/arte/leitura-almeida-junior', fragonard: 'img/arte/jovem-lendo-fragonard', vangogh: 'img/arte/leitora-van-gogh',
    vermeer: 'img/arte/carta-vermeer', perugini: 'img/arte/moca-lendo-perugini', fantin: 'img/arte/leitura-fantin-latour', visconti: 'img/arte/leitura-visconti',
  };
  const arte = (k, grande) => `url('${ARTE[k]}${grande && !celular() ? '' : '-p'}.webp')`;
  const urlsCapa = new Map();
  function capaSrc(l) {
    if (!l) return '';
    if (l.capa && l.capa.startsWith('idb:')) return '';
    return l.capa || '';
  }
  function capaHTML(l, op = {}) {
    const ger = capaGerada(l.t, l.a);
    const src = capaSrc(l);
    const idb = l.capa && l.capa.startsWith('idb:') ? l.capa.slice(4) : '';
    const item = S && S.estante[l.id];
    const pct = op.prog !== false && item && item.prog ? Math.round((item.prog.pct || 0) * 100) : 0;
    let canto = '';
    if (op.canto !== false) {
      if (item && item.status === 'lido') canto = '<span class="canto feito">Lido</span>';
      else if (pct > 0) canto = `<span class="canto">${pct}%</span>`;
      else if (l.livre === false && !(item && item.imp)) canto = '<span class="canto direitos" title="Com direitos autorais: veja a amostra e onde encontrar">© Direitos autorais</span>';
      else if (l.livre) canto = '<span class="canto gratis">Grátis</span>';
    }
    return `<div class="capa" style="background-image:url('${ger}')">${idb ? `<img data-idb="${esc(idb)}" src="${ger}" alt="">` : `<img src="${esc(src || ger)}" alt="" loading="lazy" decoding="async" data-t="${esc(l.t)}" data-a="${esc(l.a || '')}">`}${canto}${pct > 0 && pct < 100 ? `<span class="faixa"><i style="width:${pct}%"></i></span>` : ''}</div>`;
  }
  document.addEventListener('error', (e) => {
    const im = e.target;
    if (im && im.tagName === 'IMG' && im.dataset.t !== undefined && !im.dataset.falhou) { im.dataset.falhou = '1'; im.src = capaGerada(im.dataset.t, im.dataset.a); }
    if (im && im.tagName === 'IMG' && im.dataset.foto !== undefined && !im.dataset.falhou) { im.dataset.falhou = '1'; const pai = im.parentElement; const ini = im.dataset.ini || ''; im.remove(); if (pai && ini && !pai.textContent.trim()) pai.textContent = ini; }
  }, true);
  async function hidratarCapas(raiz = document) {
    for (const im of $$('img[data-idb]', raiz)) {
      const id = im.dataset.idb;
      if (!urlsCapa.has(id)) {
        const b = await Banco.get('capas', id);
        urlsCapa.set(id, b ? URL.createObjectURL(b) : '');
      }
      if (urlsCapa.get(id)) im.src = urlsCapa.get(id);
      im.removeAttribute('data-idb');
    }
  }
  function livroCard(l, op = {}) {
    reg(l);
    return `<button class="livro-card" data-livro="${esc(l.id)}">${capaHTML(l, op)}<b>${esc(l.t)}</b><small>${esc(l.a || l.fonte || '')}${l.tpt ? ' · ' + esc(l.tpt) : ''}</small>${op.motivo && l.motivo ? `<span class="motivo">${esc(l.motivo)}</span>` : ''}</button>`;
  }
  const prateleira = (livros, op = {}) => `<div class="prateleira">${livros.map((l) => livroCard(l, op)).join('')}</div>`;
  function autorBola(a) {
    const nome = a.n;
    const foto = a.foto || fotosCache[(a.kb && a.kb.id) || norm(nome)] || '';
    return `<button class="autor-bola${S && S.perfil.autores.some((x) => norm(x.n) === norm(nome)) ? ' seguido' : ''}" data-autor="${esc(nome)}"><span class="foto" style="--h:${matiz(nome)}">${foto ? `<img src="${esc(foto)}" alt="" loading="lazy" data-foto data-ini="${esc(iniciais(nome))}">` : esc(iniciais(nome))}</span><span>${esc(nome)}</span></button>`;
  }
  const fotosCache = LS.get('lc-fotos', {});
  async function hidratarFotos(raiz = document) {
    for (const b of $$('.autor-bola', raiz)) {
      const f = b.querySelector('.foto');
      if (f.querySelector('img')) continue;
      Lia.fotoAutor(b.dataset.autor).then((url) => { if (url && !f.querySelector('img')) f.innerHTML = `<img src="${esc(url)}" alt="" data-foto data-ini="${esc(iniciais(b.dataset.autor))}">`; }).catch(() => null);
    }
  }
  function secao(titulo, sub, extra = '') { return `<div class="titulo-sec"><div><h2>${esc(titulo)}</h2>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${extra}</div>`; }

  /* ---------- folhas (diálogos) ---------- */
  const pilha = [];
  function abrirFolha(html, op = {}) {
    const id = uid();
    const veu = document.createElement('div');
    veu.className = 'veu';
    const f = document.createElement('div');
    f.className = 'folha' + (op.larga ? ' larga' : '');
    f.setAttribute('role', 'dialog');
    f.setAttribute('aria-modal', 'true');
    f.innerHTML = `<button class="icobtn fechar" data-fechar aria-label="Fechar">${ico('fechar')}</button>${html}`;
    $('#folhas').append(veu, f);
    const obj = { id, f, veu, aoFechar: op.aoFechar };
    pilha.push(obj);
    history.pushState({ lcFolha: id }, '');
    veu.addEventListener('click', () => fecharFolha(obj));
    f.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]')) fecharFolha(obj); });
    hidratarCapas(f); hidratarFotos(f);
    setTimeout(() => { const foco = f.querySelector('[autofocus]'); if (foco) foco.focus(); }, 80);
    return obj;
  }
  function removerFolha(obj) {
    const i = pilha.indexOf(obj);
    if (i < 0) return;
    pilha.splice(i, 1);
    obj.f.classList.add('saindo');
    obj.veu.style.opacity = '0';
    setTimeout(() => { obj.f.remove(); obj.veu.remove(); }, 230);
    obj.aoFechar && obj.aoFechar();
  }
  function fecharFolha(obj) {
    obj = obj || pilha[pilha.length - 1];
    if (!obj) return;
    if (history.state && history.state.lcFolha === obj.id) history.back();
    else removerFolha(obj);
  }
  /* fecha a folha e espera o "voltar" do histórico terminar (senão ele desfaz a troca de tela logo depois) */
  function fecharFolhaEsperando(obj) {
    return new Promise((res) => {
      const usaHist = obj && history.state && history.state.lcFolha === obj.id;
      if (!usaHist) { fecharFolha(obj); res(); return; }
      const fim = () => { removeEventListener('popstate', fim); clearTimeout(t); setTimeout(res, 0); };
      const t = setTimeout(fim, 600);
      addEventListener('popstate', fim);
      fecharFolha(obj);
    });
  }
  function confirmar(titulo, texto, sim = 'Sim', nao = 'Cancelar', perigo) {
    return new Promise((res) => {
      let resp = false;
      const f = abrirFolha(`<div class="confirmar"><h2>${esc(titulo)}</h2><p>${esc(texto)}</p><div class="bts"><button class="btn fant" data-r="0">${esc(nao)}</button><button class="btn ${perigo ? '' : 'pri'}" data-r="1" ${perigo ? 'style="background:var(--erro);color:#fff;border:0"' : ''}>${esc(sim)}</button></div></div>`, { aoFechar: () => res(resp) });
      f.f.addEventListener('click', (e) => { const b = e.target.closest('[data-r]'); if (b) { resp = b.dataset.r === '1'; fecharFolha(f); } });
    });
  }
  addEventListener('popstate', () => {
    const topo = pilha[pilha.length - 1];
    if (topo && (!history.state || history.state.lcFolha !== topo.id)) { removerFolha(topo); return; }
    if (leitorAberto && (!history.state || !history.state.lcLeitor) && !pilha.length) fecharLeitor(true);
  });

  /* ================= navegação ================= */
  const ABAS = [['inicio', 'casa', 'Início'], ['busca', 'busca', 'Buscar'], ['estante', 'estante', 'Estante'], ['infantil', 'infantil', 'Infantis'], ['lia', 'ia', 'Lia'], ['perfil', 'perfil', 'Perfil']];
  function montarNav() {
    const h = ABAS.map(([k, i, n]) => `<a href="#${k}" data-n="${k}">${ico(i)}<span>${n}</span></a>`).join('');
    $('#nav').innerHTML = h;
    $('.nav-lat').innerHTML = h;
  }
  function mostrarNav(sim) {
    $('#nav').hidden = !sim; $('#lateral').hidden = !sim;
    document.body.classList.toggle('sem-lateral', !sim);
  }
  function marcarNav(r) { $$('#nav a, .nav-lat a').forEach((a) => a.classList.toggle('ativo', a.dataset.n === r)); }
  const rolagens = {};
  let rotaAtual = '';
  function rota() {
    const h = decodeURIComponent(location.hash.slice(1));
    const [nome, ...resto] = h.split('/');
    const arg = resto.join('/');
    if (rotaAtual) rolagens[rotaAtual] = scrollY;
    rotaAtual = h;
    if (!S || !contaId) {
      if (nome === 'cadastro') return telaCadastro(0);
      mostrarNav(false);
      return telaEntrada();
    }
    if (!S.perfil.pronto && nome !== 'cadastro' && nome !== 'descobrindo') { location.hash = '#cadastro/1'; return; }
    const telas = { inicio: telaInicio, busca: telaBusca, estante: telaEstante, lia: telaLia, perfil: telaPerfil, autor: telaAutor, infantil: telaInfantil, historinha: (a) => { telaInfantil(); abrirHistorinha(a); }, cadastro: (a) => telaCadastro(+a || 1), descobrindo: telaDescobrindo };
    const fn = telas[nome] || telaInicio;
    mostrarNav(!['cadastro', 'descobrindo'].includes(nome));
    marcarNav(nome || 'inicio');
    fn(arg);
    requestAnimationFrame(() => scrollTo(0, rolagens[h] || 0));
  }
  addEventListener('hashchange', rota);
  const ir = (h) => { if (location.hash === h) rota(); else location.hash = h; };

  /* ================= ENTRADA ================= */
  /* só dois caminhos: criar conta nova ou fazer login (nome e senha). Ninguém vê o nome dos outros. */
  const chaveNome = (n) => String(n || '').trim().replace(/\s+/g, ' ').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  function telaEntrada() {
    tela.className = 'tela entrada';
    tela.onclick = null;
    tela.innerHTML = `
      <div class="entrada-hero"><div class="arte" style="background-image:${arte('almeida', true)}"></div>
        <div class="logo-grande"><img src="img/logo.svg" alt=""><h1><small>LeituCast</small>Ingrid</h1></div>
        <p class="lema">Leia e ouça livros como num livro de verdade. A Lia, sua IA de leitura, encontra os clássicos gratuitos do seu gosto.</p>
      </div>
      <div class="entrada-corpo">
        <div class="entrada-botoes">
          <a class="btn pri bloco" href="#cadastro">${ico('mais')} Criar conta nova</a>
          <button class="btn sec bloco" id="btLogin">${ico('sair')} Fazer login</button>
        </div>
        <p class="credito">Pintura: <i>Leitura</i> (1892), de Almeida Júnior. Domínio público.</p>
      </div>`;
    $('#btLogin').onclick = abrirLogin;
  }
  function abrirLogin() {
    const f = abrirFolha(`<h2>Fazer login</h2><p style="color:var(--tx2);margin:0 0 16px">Use o nome e a senha da sua conta. Este aparelho vai lembrar de você.</p>
      <form id="fLogin">
        <div class="campo"><label for="lNome">Nome e sobrenome</label><input id="lNome" name="username" autocomplete="username" placeholder="Ex.: Ingrid Souza" autofocus></div>
        <div class="campo"><label for="lSenha">Senha</label><input id="lSenha" name="password" type="password" autocomplete="current-password"></div>
        <p class="erro-msg" id="lErro"></p>
        <button class="btn pri bloco" type="submit">Entrar</button>
      </form>`);
    $('#fLogin', f.f).onsubmit = async (e) => {
      e.preventDefault();
      const nome = $('#lNome', f.f).value, senha = $('#lSenha', f.f).value;
      const erro = (m) => { $('#lErro', f.f).textContent = m; };
      const bt = $('button[type=submit]', f.f);
      if (chaveNome(nome).length < 2) return erro('Digite o nome da sua conta.');
      if (!senha) return erro('Digite a senha.');
      bt.disabled = true; bt.innerHTML = '<span class="spinner"></span>';
      const volta = (m) => { erro(m); bt.disabled = false; bt.textContent = 'Entrar'; };
      // conta só deste aparelho (criada sem internet)
      const loc = Object.entries(contas).find(([, c]) => c.local && chaveNome(c.nome) === chaveNome(nome));
      if (loc) {
        if (loc[1].senhaLocal && loc[1].senhaLocal !== senha) return volta('Senha errada. Tente de novo.');
        await fecharFolhaEsperando(f); return logar(loc[0]);
      }
      try {
        let lista = null;
        try { lista = await Nuvem.lista(); if (Array.isArray(lista)) { listaNuvem = lista; LS.set(K_LISTA, lista); } } catch (er) { lista = listaNuvem; }
        const achou = (lista || []).find((x) => chaveNome(x.nome) === chaveNome(nome));
        if (!achou) return volta('Não encontrei uma conta com esse nome. Confira como você escreveu ou crie uma conta nova.');
        const r = await Nuvem.entrar(achou.id, senha);
        if (r.erro) return volta(r.erro === 'senha_errada' ? 'Senha errada. Tente de novo.' : r.erro === 'bloqueado' ? 'Muitas tentativas. Espere 10 minutos.' : 'Não encontrei essa conta.');
        const id = achou.id;
        contas[id] = { nome: r.nome, token: r.token, versao: r.versao };
        salvarContas();
        const local = LS.get(kDados(id), null);
        S = completar(local ? juntar(local, r.estado || {}) : { ...(r.estado || {}), nome: r.nome });
        LS.set(kDados(id), S);
        await fecharFolhaEsperando(f);
        logar(id);
      } catch (er) {
        volta('Sem conexão com a nuvem. Verifique a internet.');
      }
    };
  }
  async function logar(id) {
    contaId = id;
    if (contas[id]) { contas[id].ultimo = Date.now(); delete contas[id].saiu; salvarContas(); }
    pedirArmazenamentoFixo();
    setTimeout(conferirArquivos, 5000); // depois da sincronização com a nuvem
    LS.set(K_ATUAL, id);
    S = completar(LS.get(kDados(id), null) || S || novoEstado(contas[id].nome));
    S.nome = contas[id].nome;
    aplicarTema();
    Narrador.configurar({ ...S.cfg.voz }, { texto: (c) => Leitor.textoCapitulo(c), ncaps: () => (Leitor.livro ? Leitor.livro.caps.length : 0) });
    if (!S.cfg.voz.voz) Narrador.vozPadrao('pt-BR').then((v) => { if (v && !S.cfg.voz.voz) { S.cfg.voz.voz = v; Narrador.ajustar({ voz: v }); salvar(); } });
    ir(S.perfil.pronto ? '#inicio' : '#cadastro/1');
    const c = contas[id];
    if (c.token && !c.local) {
      try {
        const r = await Nuvem.carregar(c.token);
        if (r && !r.erro && r.estado) {
          if ((r.versao || 0) !== c.versao) { S = completar(juntar(S, r.estado)); c.versao = r.versao; salvarContas(); LS.set(kDados(id), S); }
        } else if (r && r.erro === 'sessao') { c.token = null; salvarContas(); }
      } catch (e) { /* offline */ }
    }
  }
  function sair() {
    const c = contas[contaId];
    sincronizar();
    if (c && c.token && !c.local) Nuvem.sair(c.token).catch(() => null);
    if (c) { c.token = c.local ? c.token : null; c.saiu = true; salvarContas(); }
    LS.del(K_ATUAL);
    contaId = null; S = null;
    location.hash = '#entrar';
  }
  function aplicarTema() {
    const t = (S && S.cfg.tema) || 'auto';
    document.documentElement.dataset.tema = t === 'escuro' ? 'escuro' : t;
  }

  /* ================= CADASTRO ================= */
  let rascunho = null;
  function telaCadastro(passo) {
    if (passo === 0 && contaId && S) passo = 1;
    if (passo >= 1 && !S) { location.hash = '#cadastro'; return; }
    mostrarNav(false);
    tela.className = 'tela';
    const P = S ? S.perfil : null;
    const passos = 5;
    const topo = (n) => `<div class="assist-topo">${n > 0 || S ? `<button class="icobtn" data-voltar aria-label="Voltar">${ico('voltar')}</button>` : `<a class="icobtn" href="#entrar" aria-label="Voltar">${ico('voltar')}</a>`}<div class="passos">${Array.from({ length: passos }, (_, i) => `<i class="${i <= n ? 'ok' : ''}"></i>`).join('')}</div></div>`;
    const rodape = (txt, pular) => `<div class="rodape-fixo">${pular ? `<button class="btn fant" data-pular>Pular</button>` : ''}<button class="btn pri" data-seguir>${txt}</button></div>`;
    if (passo === 0) {
      rascunho = rascunho || { nome: '', senha: '' };
      tela.innerHTML = `<div class="assist">${topo(0)}
        <div class="assist-arte" style="background-image:${arte('fragonard')}"></div>
        <h1>Vamos criar sua conta</h1><p class="sub">Só o seu nome e uma senha simples. Nada de e-mail.</p>
        <form id="fConta">
          <div class="campo"><label for="cNome">Nome e sobrenome</label><input id="cNome" autocomplete="name" placeholder="Ex.: Ingrid Souza" value="${esc(rascunho.nome)}" autofocus></div>
          <div class="campo"><label for="cSenha">Senha (pode ser simples)</label><input id="cSenha" type="password" autocomplete="new-password" placeholder="Pelo menos 3 caracteres"></div>
          <div class="campo"><label for="cSenha2">Repita a senha</label><input id="cSenha2" type="password" autocomplete="new-password"></div>
          <p class="erro-msg" id="cErro"></p>
          <div class="rodape-fixo"><button class="btn pri" type="submit">Continuar</button></div>
        </form></div>`;
      $('#fConta').onsubmit = async (e) => {
        e.preventDefault();
        const nome = $('#cNome').value.trim().replace(/\s+/g, ' ');
        const senha = $('#cSenha').value, senha2 = $('#cSenha2').value;
        const erro = (m) => { $('#cErro').textContent = m; };
        if (nome.split(' ').length < 2 || nome.length < 4) return erro('Digite nome e sobrenome.');
        if (senha.length < 3) return erro('A senha precisa ter pelo menos 3 caracteres.');
        if (senha !== senha2) return erro('As senhas não são iguais.');
        rascunho = { nome, senha };
        const bt = $('#fConta button[type=submit]');
        bt.disabled = true; bt.innerHTML = '<span class="spinner"></span> Criando…';
        const est = novoEstado(nome);
        try {
          const r = await Nuvem.criar(nome, senha, est);
          if (r.erro) {
            bt.disabled = false; bt.textContent = 'Continuar';
            return erro(r.erro === 'nome_existe' ? 'Já existe uma conta com esse nome. Use outro nome, ou volte e toque em Fazer login.' : r.erro === 'senha_curta' ? 'Senha muito curta.' : 'Nome inválido.');
          }
          contas[r.id] = { nome: r.nome, token: r.token, versao: r.versao };
          salvarContas();
          S = completar({ ...est, nome: r.nome });
          contaId = r.id; LS.set(K_ATUAL, r.id); LS.set(kDados(r.id), S);
          listaNuvem = [...listaNuvem.filter((p) => p.id !== r.id), { id: r.id, nome: r.nome }]; LS.set(K_LISTA, listaNuvem);
        } catch (er) {
          bt.disabled = false; bt.textContent = 'Continuar';
          const ok = await confirmar('Sem conexão com a nuvem', er.semFuncoes ? 'O servidor ainda não foi configurado. Você pode começar agora só neste aparelho e salvar na nuvem depois, pelo Perfil.' : 'Não consegui falar com a nuvem. Você pode começar agora só neste aparelho e salvar na nuvem depois, pelo Perfil.', 'Começar neste aparelho', 'Tentar de novo');
          if (!ok) return;
          const id = 'local-' + uid();
          contas[id] = { nome, local: true, senhaLocal: senha };
          salvarContas();
          S = completar({ ...est }); contaId = id; LS.set(K_ATUAL, id); LS.set(kDados(id), S);
        }
        rascunho = null;
        aplicarTema();
        Narrador.configurar({ ...S.cfg.voz }, { texto: (c) => Leitor.textoCapitulo(c), ncaps: () => (Leitor.livro ? Leitor.livro.caps.length : 0) });
        Narrador.vozPadrao('pt-BR').then((v) => { if (v && !S.cfg.voz.voz) { S.cfg.voz.voz = v; Narrador.ajustar({ voz: v }); } });
        location.hash = '#cadastro/1';
      };
      return;
    }
    const seguir = (n) => { P.ts = Date.now(); salvar(); location.hash = '#cadastro/' + n; };
    tela.onclick = null;
    if (passo === 1) {
      tela.innerHTML = `<div class="assist">${topo(1)}
        <h1>Que tipo de leitura você quer fazer, ${esc(primeiroNome(S.nome))}?</h1><p class="sub">Escolha quantas quiser. Dá para mudar depois no Perfil.</p>
        <div class="chips" id="tipos">${KB.TIPOS.map((t) => `<button class="chip" data-v="${t.id}" aria-pressed="${P.tipos.includes(t.id)}" title="${esc(t.desc)}">${esc(t.nome)}</button>`).join('')}</div>
        <h2 style="font:600 19px var(--f-tit);margin:26px 0 10px">Em quais idiomas?</h2>
        <div class="chips" id="idiomas">${KB.IDIOMAS.map((i) => `<button class="chip" data-v="${i.id}" aria-pressed="${P.idiomas.includes(i.id)}">${esc(i.nome)}</button>`).join('')}</div>
        ${rodape('Continuar')}</div>`;
      chipsToggle('#tipos', P.tipos); chipsToggle('#idiomas', P.idiomas, true);
    } else if (passo === 2) {
      tela.innerHTML = `<div class="assist">${topo(2)}
        <h1>Quais temas você ama?</h1><p class="sub">A Lia usa isso para procurar os livros. Se não achar o tema, digite.</p>
        <div class="chips" id="generos">${KB.GENEROS.map((g) => `<button class="chip" data-v="${g.id}" style="--c:${g.cor}" aria-pressed="${P.generos.includes(g.id)}"><span class="pt"></span>${esc(g.nome)}</button>`).join('')}</div>
        <div class="sugest" style="margin-top:18px"><div class="busca" style="margin:0">${ico('busca')}<input id="temaLivre" placeholder="Digite um tema: viagem no tempo, vampiros, máfia…" autocomplete="off"></div></div>
        <div class="escolhidos" id="livresEsc"></div>
        ${rodape('Continuar')}</div>`;
      chipsToggle('#generos', P.generos);
      const pintaLivres = () => { $('#livresEsc').innerHTML = P.livres.map((t, i) => `<span class="escolhido">${esc(t)}<button data-tira="${i}" aria-label="Tirar">×</button></span>`).join(''); };
      pintaLivres();
      $('#temaLivre').addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        const v = e.target.value.trim();
        if (!v) return;
        const g = Lia.generoDaFrase(v);
        if (g && !P.generos.includes(g.id)) { P.generos.push(g.id); const b = $(`#generos [data-v="${g.id}"]`); if (b) b.setAttribute('aria-pressed', 'true'); toast(`Entendi: ${g.nome}`); }
        else if (!P.livres.includes(v)) P.livres.push(v);
        e.target.value = ''; pintaLivres();
      });
      $('#livresEsc').onclick = (e) => { const b = e.target.closest('[data-tira]'); if (b) { P.livres.splice(+b.dataset.tira, 1); pintaLivres(); } };
    } else if (passo === 3) {
      const pop = KB.AUTORES.filter((a) => a.popular);
      const ordem = ['freida-mcfadden', 'raphael-montes'];
      pop.sort((a, b) => (ordem.indexOf(b.id) + 1 || 0) - (ordem.indexOf(a.id) + 1 || 0) || 0);
      pop.sort((a, b) => (ordem.includes(b.id) ? 1 : 0) - (ordem.includes(a.id) ? 1 : 0));
      tela.innerHTML = `<div class="assist">${topo(3)}
        <h1>Seus autores favoritos</h1><p class="sub">Toque nos que você gosta ou digite qualquer nome. A Lia procura na web.</p>
        <div class="sugest"><div class="busca" style="margin:0">${ico('busca')}<input id="buscaAutor" placeholder="Digite o nome de um autor" autocomplete="off"></div><div class="sugest-lista" id="sugAutor" hidden></div></div>
        <div class="escolhidos" id="autEsc"></div>
        <div class="autores-pop" id="autPop">${pop.map((a) => `<button class="autor-bola" data-n="${esc(a.n)}" aria-pressed="${P.autores.some((x) => norm(x.n) === norm(a.n))}"><span class="foto" style="--h:${matiz(a.n)}">${fotosCache[a.id] ? `<img src="${esc(fotosCache[a.id])}" alt="" data-foto>` : esc(iniciais(a.n))}</span><span>${esc(a.n)}</span></button>`).join('')}</div>
        ${rodape('Continuar', !P.autores.length)}</div>`;
      $$('#autPop .autor-bola').forEach((b) => { if (!b.querySelector('img')) Lia.fotoAutor(b.dataset.n).then((u) => { if (u) b.querySelector('.foto').innerHTML = `<img src="${esc(u)}" alt="" data-foto>`; }); });
      const pinta = () => {
        $('#autEsc').innerHTML = P.autores.map((a, i) => `<span class="escolhido">${a.foto ? `<img src="${esc(a.foto)}" alt="">` : `<span class="mini">${esc(iniciais(a.n))}</span>`}${esc(a.n)}<button data-tira="${i}" aria-label="Tirar">×</button></span>`).join('');
        $$('#autPop .autor-bola').forEach((b) => b.setAttribute('aria-pressed', String(P.autores.some((x) => norm(x.n) === norm(b.dataset.n)))));
      };
      const add = async (n, extra = {}) => {
        if (P.autores.some((x) => norm(x.n) === norm(n))) return;
        const kb = Lia.acharAutorKB(n);
        const a = { n: kb ? kb.n : n, id: kb ? kb.id : '', ...extra };
        P.autores.push(a); pinta();
        if (!a.foto) Lia.fotoAutor(a.n).then((u) => { if (u) { a.foto = u; pinta(); } });
      };
      pinta();
      $('#autPop').onclick = (e) => {
        const b = e.target.closest('.autor-bola');
        if (!b) return;
        const i = P.autores.findIndex((x) => norm(x.n) === norm(b.dataset.n));
        if (i >= 0) { P.autores.splice(i, 1); pinta(); } else add(b.dataset.n);
      };
      $('#autEsc').onclick = (e) => { const b = e.target.closest('[data-tira]'); if (b) { P.autores.splice(+b.dataset.tira, 1); pinta(); } };
      autocompletar($('#buscaAutor'), $('#sugAutor'), async (q) => {
        await Lia.catalogo().catch(() => null);
        const locais = KB.AUTORES.filter((a) => Lia.casaTexto(q, a.n) >= 0.6 || (a.al || []).some((x) => Lia.casaTexto(q, x) >= 0.8)).slice(0, 5).map((a) => ({ n: a.n, sub: a.pais || '', foto: fotosCache[a.id] }));
        let web = [];
        try { web = (await Fontes.openlibrary.autores(q)).slice(0, 6).map((a) => ({ n: a.n, sub: `${a.obras} obras${a.top ? ' · ' + a.top : ''}`, foto: Fontes.openlibrary.foto(a.key.replace('/authors/', ''), 'S'), olk: a.key })); } catch (e) { /* offline */ }
        const vistos = new Set(locais.map((x) => norm(x.n)));
        return [...locais, ...web.filter((w) => !vistos.has(norm(w.n)))].slice(0, 8);
      }, (it) => add(it.n), (it) => `${it.foto ? `<img src="${esc(it.foto)}" alt="" data-foto>` : `<span class="mini">${esc(iniciais(it.n))}</span>`}<span><b>${esc(it.n)}</b><small>${esc(it.sub || '')}</small></span>`, (q) => add(q));
    } else if (passo === 4) {
      tela.innerHTML = `<div class="assist">${topo(4)}
        <h1>Livros que você amou</h1><p class="sub">Opcional. Digite o nome de um livro ou autor e escolha na lista. Ajuda a Lia a entender o seu gosto.</p>
        <div class="sugest"><div class="busca" style="margin:0">${ico('busca')}<input id="buscaLivro" placeholder="Ex.: A Empregada, Dom Casmurro, Dias Perfeitos…" autocomplete="off"></div><div class="sugest-lista" id="sugLivro" hidden></div></div>
        <div class="escolhidos" id="livEsc"></div>
        <div class="assist-arte" style="background-image:${arte('vangogh')};margin-top:26px;height:180px"></div>
        ${rodape('Pronto, buscar meus livros', true)}</div>`;
      const pinta = () => { $('#livEsc').innerHTML = P.livros.map((l, i) => `<span class="escolhido">${l.capa ? `<img src="${esc(l.capa)}" alt="" style="border-radius:4px;width:24px;height:34px">` : ''}${esc(l.t)}${l.a ? ' · ' + esc(l.a) : ''}<button data-tira="${i}" aria-label="Tirar">×</button></span>`).join(''); };
      pinta();
      $('#livEsc').onclick = (e) => { const b = e.target.closest('[data-tira]'); if (b) { P.livros.splice(+b.dataset.tira, 1); pinta(); } };
      autocompletar($('#buscaLivro'), $('#sugLivro'), async (q) => {
        const kb = [];
        for (const a of KB.AUTORES) (a.obras || []).forEach((o) => { if (Lia.casaTexto(q, o.t) >= 0.7 || (o.o && Lia.casaTexto(q, o.o) >= 0.75)) kb.push({ t: o.t, a: a.n, capa: o.capa ? Fontes.openlibrary.capa(o.capa, 'S') : '', g: a.gen.slice(0, 2), ano: o.ano }); });
        for (const c of KB.CLASSICOS) if (Lia.casaTexto(q, c.t) >= 0.7) kb.push({ t: c.t, a: (KB.A[c.a] || {}).n || '', g: c.g, ano: c.ano, capa: c.src.startsWith('gb:') ? Fontes.gutenberg.capa(c.src.slice(3)) : '' });
        let web = [];
        try { web = (await Fontes.openlibrary.buscar({ q }, 8)).map((d) => ({ t: d.t, a: d.a, capa: Fontes.openlibrary.capa(d.capa, 'S'), ano: d.ano, assuntos: d.assuntos })); } catch (e) { /* offline */ }
        const vistos = new Set(kb.map((x) => norm(x.t)));
        return [...kb, ...web.filter((w) => !vistos.has(norm(w.t)))].slice(0, 9);
      }, (it) => { if (!P.livros.some((x) => norm(x.t) === norm(it.t))) { P.livros.push({ t: it.t, a: it.a, capa: it.capa, g: it.g || [] }); pinta(); } }, (it) => `${it.capa ? `<img class="mini-capa" src="${esc(it.capa)}" alt="" data-t="${esc(it.t)}" data-a="${esc(it.a)}">` : '<span class="mini-capa"></span>'}<span><b>${esc(it.t)}</b><small>${esc(it.a || '')}${it.ano ? ' · ' + it.ano : ''}</small></span>`);
    }
    tela.querySelector('[data-voltar]') && (tela.querySelector('[data-voltar]').onclick = () => { history.length > 1 ? history.back() : (location.hash = '#cadastro/' + Math.max(1, passo - 1)); });
    const btSeguir = tela.querySelector('[data-seguir]');
    if (btSeguir) btSeguir.onclick = () => {
      if (passo === 1 && !P.idiomas.length) P.idiomas = ['pt'];
      if (passo === 2 && !P.generos.length && !P.livres.length) return toast('Escolha pelo menos um tema.');
      if (passo < 4) seguir(passo + 1); else { P.pronto = true; P.ts = Date.now(); salvar(true); location.hash = '#descobrindo'; }
    };
    const btPular = tela.querySelector('[data-pular]');
    if (btPular) btPular.onclick = () => { if (passo < 4) seguir(passo + 1); else { P.pronto = true; P.ts = Date.now(); salvar(true); location.hash = '#descobrindo'; } };
  }
  function chipsToggle(sel, lista, minimoUm) {
    $(sel).onclick = (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      const v = b.dataset.v, i = lista.indexOf(v);
      if (i >= 0) { if (minimoUm && lista.length === 1) return toast('Escolha pelo menos um.'); lista.splice(i, 1); } else lista.push(v);
      b.setAttribute('aria-pressed', String(i < 0));
    };
  }
  function autocompletar(input, caixa, buscarFn, escolher, desenhar, aoEnter) {
    let t = 0, n = 0, itens = [];
    const fechar = () => { caixa.hidden = true; };
    input.addEventListener('input', () => {
      clearTimeout(t);
      const q = input.value.trim();
      if (q.length < 2) return fechar();
      t = setTimeout(async () => {
        const meu = ++n;
        caixa.hidden = false;
        caixa.innerHTML = '<button disabled><span class="spinner"></span><span>Procurando na web…</span></button>';
        itens = await buscarFn(q).catch(() => []);
        if (meu !== n) return;
        caixa.innerHTML = itens.length ? itens.map((it, i) => `<button type="button" data-i="${i}">${desenhar(it)}</button>`).join('') : `<button type="button" data-livre>Usar "${esc(q)}"</button>`;
      }, 320);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); if (itens[0] && !caixa.hidden) { escolher(itens[0]); input.value = ''; fechar(); } else if (aoEnter && input.value.trim()) { aoEnter(input.value.trim()); input.value = ''; fechar(); } }
      if (e.key === 'Escape') fechar();
    });
    caixa.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.livre !== undefined) { aoEnter && aoEnter(input.value.trim()); }
      else if (b.dataset.i !== undefined) escolher(itens[+b.dataset.i]);
      input.value = ''; fechar(); input.focus();
    });
    document.addEventListener('click', (e) => { if (!caixa.contains(e.target) && e.target !== input) fechar(); });
  }

  /* ================= IA DESCOBRINDO ================= */
  async function telaDescobrindo() {
    mostrarNav(false);
    tela.className = 'tela descobrindo';
    tela.innerHTML = `<div class="fundo" style="background-image:${arte('vangogh')}"></div>
      <div class="orbe"><img src="img/logo.svg" alt=""></div>
      <h1>A Lia está montando sua estante</h1><p style="color:var(--tx2);margin:0">Procurando livros gratuitos, capas e autores pelo seu gosto.</p>
      <ul class="passos-ia" id="passosIa"></ul><div class="chuva-capas" id="chuva"></div>`;
    const lista = $('#passosIa'), chuva = $('#chuva');
    let ultimo = null;
    const aoPasso = (p) => {
      if (ultimo) ultimo.querySelector('.st').innerHTML = `<span class="ok">${ico('check')}</span>`;
      const li = document.createElement('li');
      li.innerHTML = `<span class="st">${p.fim ? `<span class="ok">${ico('check')}</span>` : '<span class="spinner"></span>'}</span>${p.foto ? `<img class="foto" src="${esc(p.foto)}" alt="">` : ''}<span>${esc(p.t)}</span>`;
      lista.appendChild(li);
      while (lista.children.length > 6) lista.firstChild.remove();
      ultimo = p.fim ? null : li;
      for (const c of (p.capas || []).slice(0, 6)) {
        const d = document.createElement('div');
        d.className = 'capa';
        d.innerHTML = `<img src="${esc(c)}" alt="" data-t="" data-a="">`;
        chuva.appendChild(d);
        while (chuva.children.length > 14) chuva.firstChild.remove();
      }
    };
    try {
      const r = await Lia.descobrir(S.perfil, S, aoPasso);
      LS.set(kPrat(contaId), { t: Date.now(), p: r.prateleiras, perfilTs: S.perfil.ts });
      for (const a of r.autores) if (a.foto) fotosCache[a.kb ? a.kb.id : norm(a.n)] = a.foto;
      LS.set('lc-fotos', fotosCache);
    } catch (e) {
      aoPasso({ t: 'Sem internet agora. Mostro o que já tenho e atualizo depois.', fim: true });
    }
    await sleep(1400);
    location.hash = '#inicio';
  }

  /* ================= INÍCIO ================= */
  const saudacao = () => { const h = new Date().getHours(); return h < 5 ? 'Boa madrugada' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'; };
  function itensEstante(filtro) { return Object.values(S.estante).filter(filtro).sort((a, b) => (b.ultimo || b.add || 0) - (a.ultimo || a.add || 0)); }
  async function telaInicio() {
    tela.className = 'tela';
    const lendo = itensEstante((x) => x.status === 'lendo');
    const atual = lendo[0];
    const nome = primeiroNome(S.nome);
    const p = atual && atual.prog;
    const falta = p && p.tot ? Math.max(0, (1 - (p.pct || 0)) * (atual.pal || 0) / (S.ppm || 230)) : 0;
    const importados = itensEstante((x) => x.imp);
    const cache = LS.get(kPrat(contaId), null);
    tela.innerHTML = `<div class="miolo">
      <div class="ola"><div><h1>${saudacao()}, ${esc(nome)}</h1><p>${atual ? 'Que tal continuar de onde parou?' : 'O que vamos ler hoje?'}</p></div><span class="avatar" style="--h:${matiz(S.nome)}" data-ir="#perfil">${esc(iniciais(S.nome))}</span></div>
      <form class="busca" id="buscaIni">${ico('busca')}<input name="q" placeholder="Buscar livro, autor ou tema" autocomplete="off" enterkeyhint="search"><a class="icobtn lia-btn" href="#lia" aria-label="Perguntar à Lia">${ico('ia')}</a></form>
      <div id="dicaInstalar"></div>
      <a class="kid-banner" href="#infantil"><div class="kid-banner-arte">${typeof Infantil !== 'undefined' ? Infantil.cena({ ceu: 'dia', chao: 'grama', itens: [['sol', 350, 60, 0.8, { rosto: 1 }], ['coelho', 110, 244, 1.3], ['tartaruga', 210, 248, 1.2], ['coruja', 300, 246, 1]] }) : ''}</div><div><b>Cantinho das Historinhas</b><small>Historinhas com desenhos para as crianças ouvirem e lerem junto</small></div></a>
      ${atual ? `<div class="heroi"><div class="fundo" style="background-image:url('${esc(capaSrc(atual) || '')}')"></div>${capaHTML(atual, { canto: false })}<div>
        <span class="rot">Continuar lendo</span><h2>${esc(atual.t)}</h2><div class="info">${esc(atual.a || '')}</div>
        <div class="barra-prog"><i style="width:${Math.round((p && p.pct || 0) * 100)}%"></i></div>
        <div class="info" style="margin-top:6px">${Math.round((p && p.pct || 0) * 100)}% lido${falta ? ' · faltam ' + fmtMin(falta) : ''}${p && p.pag ? ' · pág. ' + p.pag + (p.tot ? ' de ' + p.tot : '') : ''}</div>
        <div class="acoes"><button class="btn pri peq" data-abrir="${esc(atual.id)}">${ico('abrir')} Ler</button><button class="btn sec peq" data-ouvir="${esc(atual.id)}">${ico('fone')} Ouvir</button></div></div></div>`
        : `<div class="boas-vindas"><div class="arte" style="background-image:${arte('vermeer', true)}"></div><h2>Sua biblioteca está pronta</h2><p style="margin:0 0 12px;opacity:.9">A Lia separou livros gratuitos pelo seu gosto. Toque numa capa para ver e ler.</p><div><a class="btn pri peq" href="#lia">${ico('ia')} Pedir uma indicação</a></div></div>`}
      ${lendo.length > 1 ? secao('Lendo agora', '', '<a href="#estante/lendo">Ver tudo</a>') + prateleira(lendo.slice(1, 12)) : ''}
      <div id="autoresIni"></div>
      <div id="prats">${cache && cache.p ? '' : '<div class="titulo-sec"><div><h2>Preparando suas prateleiras…</h2></div><span class="spinner"></span></div>'}</div>
      ${importados.length ? secao('Meus ebooks', 'Os livros que você trouxe', '<a href="#estante/meus">Ver tudo</a>') + prateleira(importados.slice(0, 14)) : ''}
      ${secao('Explorar por tema', '')}
      <div class="chips">${KB.GENEROS.slice(0, 18).map((g) => `<a class="chip" style="--c:${g.cor};text-decoration:none" href="#busca/${encodeURIComponent(g.nome)}"><span class="pt"></span>${esc(g.nome)}</a>`).join('')}</div>
      <p class="credito" style="margin-top:34px">Livros gratuitos do Project Gutenberg e do Wikisource, em domínio público no Brasil.</p>
    </div>`;
    $('#buscaIni').onsubmit = (e) => { e.preventDefault(); const q = e.target.q.value.trim(); if (q) location.hash = '#busca/' + encodeURIComponent(q); else location.hash = '#busca'; };
    pintarAutoresInicio();
    dicaInstalar();
    const pintar = (prats) => {
      const el = $('#prats');
      if (!el) return;
      el.innerHTML = prats.map((pr) => secao(pr.titulo, pr.sub, pr.autor ? `<a href="#autor/${encodeURIComponent((KB.A[pr.autor] || {}).n || '')}">Ver autor</a>` : pr.genero ? `<a href="#busca/${encodeURIComponent(KB.G[pr.genero].nome)}">Ver mais</a>` : '') + prateleira(pr.livros, { motivo: pr.id === 'paravoce', gratis: !pr.pago })).join('');
      hidratarCapas(el);
    };
    if (cache && cache.p) pintar(cache.p);
    hidratarCapas(tela);
    const velho = !cache || Date.now() - cache.t > 6 * 3600e3 || cache.perfilTs !== S.perfil.ts;
    if (velho || !cache.p) {
      try {
        const prats = await Lia.recomendar(S.perfil, S);
        LS.set(kPrat(contaId), { t: Date.now(), p: prats, perfilTs: S.perfil.ts });
        if (rotaAtual.split('/')[0] === 'inicio' || rotaAtual === '') pintar(prats);
      } catch (e) { if (!cache) { const el = $('#prats'); if (el) el.innerHTML = '<div class="vazio">Sem internet para carregar o acervo agora. Seus livros baixados continuam na Estante.</div>'; } }
    }
  }
  function pintarAutoresInicio() {
    const el = $('#autoresIni');
    if (!el) return;
    const meus = S.perfil.autores.map((a) => ({ n: a.n, foto: a.foto, kb: Lia.acharAutorKB(a.n) }));
    const sim = [];
    for (const a of meus) for (const id of ((a.kb && a.kb.sim) || []).slice(0, 4)) { const k = KB.A[id]; if (k && !meus.some((m) => norm(m.n) === norm(k.n)) && !sim.some((s) => s.n === k.n)) sim.push({ n: k.n, kb: k }); }
    const lista = [...meus, ...sim.slice(0, 10)];
    if (!lista.length) { for (const a of KB.AUTORES.filter((x) => x.popular).slice(0, 10)) lista.push({ n: a.n, kb: a }); }
    el.innerHTML = secao(meus.length ? 'Seus autores e parecidos' : 'Autores para conhecer', 'Toque para ver todos os livros') + `<div class="autores-linha">${lista.map(autorBola).join('')}</div>`;
    hidratarFotos(el);
  }

  /* ================= BUSCA ================= */
  let buscaN = 0;
  function telaBusca(q0) {
    tela.className = 'tela';
    tela.innerHTML = `<div class="miolo"><div class="busca-topo">
      <form class="busca" id="fBusca" style="margin:0">${ico('busca')}<input name="q" value="${esc(q0 || '')}" placeholder="Livro, autor, tema ou o que você quiser ler" autocomplete="off" enterkeyhint="search" autofocus></form>
      <div class="atalhos">${['Freida McFadden', 'Raphael Montes', 'Machado de Assis', 'Suspense psicológico', 'Terror', 'Romance', 'Poesia', 'Contos', 'Sherlock Holmes', 'Clássicos brasileiros'].map((x) => `<button class="chip" data-q="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>
      <div id="resBusca">${q0 ? '' : `<div class="vazio"><img src="${ARTE.perugini}-p.webp" alt=""><p>Digite o nome de um livro, de um autor ou um tema. A Lia procura no acervo e na web, e você toca para baixar e guardar na estante.</p></div>`}</div></div>`;
    const form = $('#fBusca');
    form.onsubmit = (e) => { e.preventDefault(); const q = form.q.value.trim(); if (q) { history.replaceState(null, '', '#busca/' + encodeURIComponent(q)); rotaAtual = 'busca/' + q; buscarAgora(q); } };
    $('.atalhos').onclick = (e) => { const b = e.target.closest('[data-q]'); if (b) { form.q.value = b.dataset.q; form.requestSubmit(); } };
    let t = 0;
    form.q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const q = form.q.value.trim(); if (q.length >= 3) buscarAgora(q); }, 600); });
    if (q0) buscarAgora(q0);
  }
  async function buscarAgora(q) {
    const meu = ++buscaN;
    const el = $('#resBusca');
    if (!el) return;
    el.innerHTML = `<div class="titulo-sec"><div><h2>Procurando "${esc(q)}"</h2><p>No acervo livre, no Wikisource, na Open Library e no Gutenberg</p></div><span class="spinner"></span></div>`;
    const pintar = (r) => {
      if (meu !== buscaN || !$('#resBusca')) return;
      const html = [];
      if (r.autores.length) html.push(secao('Autores', 'Toque para ver os livros e seguir') + `<div class="autores-linha">${r.autores.slice(0, 8).map((a) => autorBola({ n: a.n, kb: a.kb })).join('')}</div>`);
      if (r.entendi && r.entendi.length) html.push(`<div class="motivo-ia">${ico('ia')} <span>Entendi: <b>${r.entendi.map(esc).join(' · ')}</b></span></div>`);
      if (r.melhor && r.melhor.tipo === 'livro') html.push(secao('Melhor resultado', r.melhor.livro.livre ? 'Grátis, toque para ler' : 'Com direitos autorais: amostra e onde encontrar') + `<div class="melhor-res">${livroCard(r.melhor.livro, { gratis: !!r.melhor.livro.livre })}<div><b>${esc(r.melhor.livro.tpt && r.melhor.livro.l !== 'pt' ? r.melhor.livro.tpt : r.melhor.livro.t)}</b><small>${esc([r.melhor.livro.a, r.melhor.livro.ano].filter(Boolean).join(' · '))}</small>${r.melhor.livro.sin ? `<p>${esc(r.melhor.livro.sin)}</p>` : ''}</div></div>`);
      const ehMelhor = (l) => r.melhor && r.melhor.tipo === 'livro' && (l.id === r.melhor.livro.id);
      r = { ...r, livres: r.livres.filter((l) => !ehMelhor(l)), pagos: r.pagos.filter((l) => !ehMelhor(l)) };
      if (r.livres.length) html.push(secao('Grátis para ler agora', `${plural(r.livres.length, '1 livro', '# livros')} em domínio público. Toque para baixar.`) + `<div class="grade">${r.livres.slice(0, 36).map((l) => livroCard(l, { gratis: true })).join('')}</div>`);
      if (r.pagos.length) html.push(secao('Outros livros', 'Com direitos autorais: veja a amostra, guarde em "Quero ler" ou importe o seu ebook') + `<div class="grade">${r.pagos.slice(0, 30).map((l) => livroCard(l, { gratis: false })).join('')}</div>`);
      if (!r.web) html.push('<div class="titulo-sec"><div><p>Ainda buscando na web…</p></div><span class="spinner"></span></div>');
      if (r.web && !r.autores.length && !r.livres.length && !r.pagos.length) html.push('<div class="vazio">Não encontrei nada com esse nome. Tente outra grafia ou só o sobrenome do autor.</div>');
      $('#resBusca').innerHTML = html.join('');
      hidratarFotos($('#resBusca')); hidratarCapas($('#resBusca'));
    };
    try { const r = await Lia.buscarTudo(q, S, pintar); pintar(r); } catch (e) { el.innerHTML = '<div class="vazio">Sem conexão para buscar agora.</div>'; }
  }

  /* ================= CANTINHO DAS HISTORINHAS (infantil) ================= */
  let tagInfantil = 'todas';
  async function telaInfantil() {
    tela.className = 'tela infantil';
    const cards = () => Infantil.HISTORIAS.filter((h) => Infantil.ehDe(h, tagInfantil)).map(cardHistorinha).join('');
    const pt = Infantil.ACERVO.filter((x) => x.l === 'pt').map(livroInfantil);
    const en = Infantil.ACERVO.filter((x) => x.l !== 'pt').map(livroInfantil);
    tela.innerHTML = `<div class="miolo"><div class="kid-topo"><div><h1>Cantinho das Historinhas</h1><p>Historinhas com desenhos, clássicos infantis grátis da web e uma busca só de livros para crianças.</p></div></div>
      <form class="busca kid-busca" id="kidBusca">${ico('busca')}<input name="q" placeholder="Procurar historinhas: Chapeuzinho, fábulas, Narizinho…" autocomplete="off" enterkeyhint="search"></form>
      <div id="kidRes"></div>
      <div class="titulo-sec"><div><h2>Historinhas ilustradas</h2><p>Para ler junto ou ouvir, uma página por vez</p></div></div>
      <div class="chips kid-tags">${Infantil.TAGS.map(([k, n]) => `<button class="chip" data-tag="${k}" aria-pressed="${k === tagInfantil}">${n}</button>`).join('')}</div>
      <div class="kid-grade" id="kidGrade">${cards()}</div>
      ${secao('Clássicos infantis em português', 'Monteiro Lobato, Beatrix Potter, Grimm e mais, grátis e com narração')}${prateleira(pt, { gratis: true })}
      ${secao('Livrinhos ilustrados em inglês', 'Com as ilustrações originais, ótimos para aprender inglês junto')}${prateleira(en, { gratis: true })}
      <div id="kidAcervo"></div></div>`;
    hidratarCapas(tela);
    tela.onclick = (e) => {
      const t = e.target.closest('[data-tag]');
      if (t) { tagInfantil = t.dataset.tag; $$('[data-tag]', tela).forEach((x) => x.setAttribute('aria-pressed', String(x === t))); $('#kidGrade').innerHTML = cards(); return; }
      const h = e.target.closest('[data-historinha]');
      if (h) abrirHistorinha(h.dataset.historinha);
    };
    const form = $('#kidBusca');
    form.onsubmit = (e) => { e.preventDefault(); const q = form.q.value.trim(); if (q) buscarInfantil(q); };
    // livrinhos do acervo livre (só infantis, nunca conteúdo adulto)
    try {
      await Lia.catalogo();
      const r = Lia.buscarLocal('livros infantis', { perfil: { idiomas: ['pt', 'en'], generos: ['infantil'] } });
      const ja = new Set(Infantil.ACERVO.map((x) => x.src));
      const lv = r.livres.filter((l) => ehInfantilSeguro(l) && !ja.has(l.src)).slice(0, 18);
      if (lv.length && $('#kidAcervo')) { $('#kidAcervo').innerHTML = secao('Mais do acervo livre', 'Contos de fadas e clássicos infantis em domínio público') + prateleira(lv, { gratis: true }); hidratarCapas($('#kidAcervo')); }
    } catch (e) { /* sem acervo agora */ }
  }
  const cardHistorinha = (h) => `<button class="kid-card" data-historinha="${esc(h.id)}" style="--cor:${h.cor}"><div class="kid-capa">${Infantil.cena(h.capa)}</div><b>${esc(h.t)}</b><small>${esc(h.tag)} · ${Infantil.minutos(h)} min</small></button>`;
  const livroInfantil = (x) => ({ id: x.src, src: x.src, t: x.t, a: x.a, l: x.l, g: ['infantil'], pal: 0, d: 0, livre: true, fonte: x.fonte, motivo: x.tag, sin: x.tag, capa: x.src.startsWith('gb:') ? Fontes.gutenberg.capa(x.src.slice(3)) : '' });
  const ehInfantilSeguro = (l) => !(l.g || []).includes('erotico') && !Infantil.PROIBIDO.test(`${l.t} ${(l.s || []).join(' ')}`);
  /* busca de historinhas: as nossas, o acervo infantil curado, o acervo livre (só infantis) e a web (Wikisource e Gutenberg) */
  let buscaKid = 0;
  async function buscarInfantil(q) {
    const meu = ++buscaKid;
    const el = $('#kidRes');
    if (!el) return;
    el.innerHTML = `<div class="titulo-sec"><div><h2>Procurando "${esc(q)}"</h2><p>Nas historinhas, no acervo infantil e na web</p></div><span class="spinner"></span></div>`;
    const nq = norm(q), toks = nq.split(' ').filter((w) => w.length > 2);
    const bate = (s) => { const n = norm(s); return toks.length ? toks.some((w) => n.includes(w)) : n.includes(nq); };
    // historinha: qualquer palavra no título, ou todas as palavras no texto
    const todas = (s) => { const n = norm(s); return toks.length > 0 && toks.every((w) => n.includes(w)); };
    const historias = Infantil.HISTORIAS.filter((h) => bate(h.t + ' ' + h.tag) || todas(h.paginas.map((p) => p.t).join(' ')));
    const curados = Infantil.ACERVO.filter((x) => bate(`${x.t} ${x.a} ${x.tag}`)).map(livroInfantil);
    const pintar = (web) => {
      if (meu !== buscaKid || !$('#kidRes')) return;
      const vistos = new Set();
      const livros = [...curados, ...web].filter((l) => !vistos.has(l.src || l.id) && vistos.add(l.src || l.id));
      const partes = [];
      if (historias.length) partes.push(secao('Historinhas ilustradas', '') + `<div class="kid-grade">${historias.map(cardHistorinha).join('')}</div>`);
      if (livros.length) partes.push(secao('Livros e contos infantis grátis', `${plural(livros.length, '1 livro', '# livros')} em domínio público. Toque para baixar e ler ou ouvir.`) + `<div class="grade">${livros.slice(0, 30).map((l) => livroCard(l, { gratis: true })).join('')}</div>`);
      if (!partes.length) partes.push(`<div class="vazio">Não achei historinhas com "${esc(q)}". Tente outra palavra, como "fábula", "fadas" ou o nome do personagem.</div>`);
      $('#kidRes').innerHTML = partes.join('');
      hidratarCapas($('#kidRes'));
    };
    pintar([]);
    const web = [];
    try {
      await Lia.catalogo();
      // acervo livre: só o que é infantil
      const r = Lia.buscarLocal(q, { perfil: { idiomas: ['pt', 'en', 'es', 'fr'], generos: ['infantil'] } });
      for (const l of [...(r.melhor && r.melhor.livro ? [r.melhor.livro] : []), ...r.livres]) if ((l.g || []).includes('infantil') && ehInfantilSeguro(l)) web.push(l);
      const r2 = Lia.buscarLocal(q + ' infantil', { perfil: { idiomas: ['pt', 'en'], generos: ['infantil'] } });
      for (const l of r2.livres.slice(0, 12)) if (ehInfantilSeguro(l) && bate(l.t + ' ' + (l.a || ''))) web.push(l);
      pintar(web);
    } catch (e) { /* sem acervo */ }
    // web: Wikisource em português e Gutenberg (pedindo livros infantis)
    const tarefas = [
      Fontes.wikisource.buscar(q).then((lst) => {
        for (const x of lst.slice(0, 8)) if (bate(x.titulo) && !Infantil.PROIBIDO.test(x.titulo + ' ' + x.trecho)) web.push({ id: 'ws:' + x.titulo, src: 'ws:' + x.titulo, t: x.titulo, a: '', l: 'pt', g: ['infantil'], pal: x.palavras, d: 0, livre: true, fonte: 'Wikisource', sin: x.trecho, capa: '' });
      }).catch(() => null),
      Fontes.gutenberg.buscar(q + ' children').then((lst) => {
        for (const x of lst.slice(0, 12)) if (!Infantil.PROIBIDO.test(x.t + ' ' + x.a)) web.push({ id: 'gb:' + x.id, src: 'gb:' + x.id, t: x.t, a: x.a, l: x.l || 'en', g: ['infantil'], pal: 0, d: 0, livre: true, conferir: true, fonte: 'Project Gutenberg', capa: Fontes.gutenberg.capa(x.id) });
      }).catch(() => null),
    ];
    await Promise.all(tarefas.map((t) => t.then(() => pintar(web))));
  }
  function abrirHistorinha(id) {
    const h = Infantil.porId(id);
    if (!h) return;
    let i = 0, lendoJunto = false;
    const v = document.createElement('div');
    v.className = 'kid-leitor';
    v.style.setProperty('--cor', h.cor);
    document.body.appendChild(v);
    history.pushState({ lcFolha: 'historinha' }, '');
    const palavras = (t) => { let k = 0; return esc(t).replace(/([\p{L}\p{N}][\p{L}\p{N}'’\-]*)/gu, (w) => `<span data-p="${k++}">${w}</span>`); };
    const fimTela = () => `<div class="kid-fim"><div class="kid-ilustra">${Infantil.cena({ ceu: 'noite', chao: 'grama', itens: [['estrela', 120, 120, 1], ['estrela', 280, 90, 0.8], ['coracao', 200, 170, 2.4], ['flor', 90, 250, 1.2], ['flor', 310, 250, 1.2, { cor: '#FFD54F' }]] })}</div><h2>Fim! Que linda historinha.</h2><div class="kid-botoes"><button class="btn pri" data-k="denovo">Ler de novo</button><button class="btn" data-k="outra">Escolher outra</button></div></div>`;
    const pintar = () => {
      const fim = i >= h.paginas.length;
      v.innerHTML = `<div class="kid-barra"><button class="icobtn" data-k="fechar" aria-label="Fechar">${ico('fechar')}</button><b>${esc(h.t)}</b><span>${fim ? '' : `${i + 1}/${h.paginas.length}`}</span></div>
        ${fim ? fimTela() : `<div class="kid-pagina"><div class="kid-ilustra">${Infantil.cena(h.paginas[i].cena)}</div><p class="kid-texto" id="kidTexto">${palavras(h.paginas[i].t)}</p></div>
        <div class="kid-controles"><button class="kid-seta" data-k="ant" aria-label="Página anterior" ${i === 0 ? 'disabled' : ''}>${ico('voltar')}</button>
          <button class="kid-ouvir ${lendoJunto ? 'ativo' : ''}" data-k="ouvir">${lendoJunto ? '<span class="quadrado-parar"></span> Parar' : ico('fone') + ' Ler para mim'}</button>
          <button class="kid-seta prox" data-k="prox" aria-label="Próxima página">${ico('voltar')}</button></div>
        <div class="kid-pontos">${h.paginas.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>`}`;
    };
    const acender = (k) => { const t = $('#kidTexto', v); if (!t) return; const a = t.querySelector('.acesa'); if (a) a.classList.remove('acesa'); const s = t.querySelector(`[data-p="${k}"]`); if (s) s.classList.add('acesa'); };
    const narrar = async () => {
      while (lendoJunto && i < h.paginas.length && v.isConnected) {
        const ok = await Narrador.falarTexto(h.paginas[i].t, acender);
        if (!ok || !lendoJunto || !v.isConnected) break;
        await sleep(900);
        if (!lendoJunto || !v.isConnected) break;
        i++; pintar();
      }
      if (i >= h.paginas.length) { lendoJunto = false; pintar(); }
    };
    const ir2 = (d) => { Narrador.pararAmostra(); i = clamp(i + d, 0, h.paginas.length); pintar(); if (lendoJunto && i < h.paginas.length) narrar(); };
    const fechar = () => { lendoJunto = false; Narrador.pararAmostra(); v.remove(); removeEventListener('popstate', aoVoltar); if (location.hash.startsWith('#historinha')) history.replaceState(null, '', '#infantil'); };
    const aoVoltar = () => fechar();
    addEventListener('popstate', aoVoltar);
    v.onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (!b) return;
      const k = b.dataset.k;
      if (k === 'fechar' || k === 'outra') { history.back(); }
      else if (k === 'ant') ir2(-1);
      else if (k === 'prox') ir2(1);
      else if (k === 'denovo') { i = 0; pintar(); }
      else if (k === 'ouvir') { lendoJunto = !lendoJunto; if (lendoJunto) { pintar(); narrar(); } else { Narrador.pararAmostra(); pintar(); } }
    };
    // arrastar para virar a página
    let x0 = null;
    v.addEventListener('pointerdown', (e) => { x0 = e.clientX; });
    v.addEventListener('pointerup', (e) => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 60 && !e.target.closest('button')) ir2(dx < 0 ? 1 : -1); });
    v.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') ir2(1); else if (e.key === 'ArrowLeft') ir2(-1); });
    v.tabIndex = -1; v.focus();
    pintar();
  }

  /* ================= AUTOR ================= */
  async function telaAutor(nome) {
    tela.className = 'tela';
    const kb = Lia.acharAutorKB(nome);
    const n = kb ? kb.n : nome;
    const seguindo = () => S.perfil.autores.some((a) => norm(a.n) === norm(n));
    tela.innerHTML = `<div class="miolo"><button class="icobtn voltar-topo" data-voltar aria-label="Voltar">${ico('voltar')}</button>
      <div class="autor-topo"><div class="fundo" id="autFundo"></div><span class="foto" id="autFoto" style="--h:${matiz(n)}">${esc(iniciais(n))}</span>
      <div><h1>${esc(n)}</h1><div class="meta">${esc([kb && kb.pais, kb && kb.anos].filter(Boolean).join(' · '))}</div>
      <button class="btn ${seguindo() ? 'sec' : 'pri'} peq" id="btSeguir">${seguindo() ? ico('check') + ' Seguindo' : ico('mais') + ' Seguir autor'}</button></div></div>
      <div id="autCorpo"><div class="titulo-sec"><div><h2>Buscando os livros…</h2></div><span class="spinner"></span></div></div></div>`;
    $('[data-voltar]').onclick = () => (history.length > 1 ? history.back() : ir('#inicio'));
    $('#btSeguir').onclick = () => {
      const i = S.perfil.autores.findIndex((a) => norm(a.n) === norm(n));
      if (i >= 0) S.perfil.autores.splice(i, 1); else S.perfil.autores.push({ n, id: kb ? kb.id : '' });
      S.perfil.ts = Date.now(); salvar();
      const b = $('#btSeguir');
      b.className = 'btn ' + (seguindo() ? 'sec' : 'pri') + ' peq';
      b.innerHTML = seguindo() ? ico('check') + ' Seguindo' : ico('mais') + ' Seguir autor';
      toast(seguindo() ? `${n} vai aparecer na sua página inicial.` : `Você deixou de seguir ${n}.`);
    };
    try {
      const info = await Lia.infoAutor(n);
      if (!$('#autCorpo')) return;
      if (info.foto) { $('#autFoto').innerHTML = `<img src="${esc(info.foto)}" alt="">`; $('#autFundo').style.backgroundImage = `url('${info.foto}')`; }
      const partes = [];
      if (info.bio) partes.push(`<p class="bio curta" id="bio">${esc(info.bio)}</p><button class="btn fant peq" id="bioMais" style="padding:0">Ler mais</button>`);
      if (info.estilo) partes.push(`<div class="motivo-ia">${ico('pena')}<span>Estilo: ${esc(info.estilo)}</span></div>`);
      if (kb && kb.nota) partes.push(`<p class="aviso-direitos">${esc(kb.nota)}</p>`);
      if (info.livres.length) partes.push(secao('Grátis para ler agora', plural(info.livres.length, '1 livro em domínio público', '# livros em domínio público')) + `<div class="grade">${info.livres.map((l) => livroCard(l, { gratis: true })).join('')}</div>`);
      // autor com direitos: primeiro os clássicos grátis na mesma pegada, depois os livros dele com o aviso vermelho
      if (!info.dp && kb && kb.livres && kb.livres.length && !info.livres.length) {
        const alt = (await Promise.all(kb.livres.map((s) => Lia.porSrc(s)))).filter(Boolean);
        if (alt.length) partes.push(secao(`Grátis para ler agora, na pegada de ${n}`, 'Clássicos em domínio público com o mesmo clima') + prateleira(alt, { gratis: true }));
      }
      if (info.obras.length) {
        const pagas = info.obras.filter((l) => l.livre === false).length;
        partes.push(secao(info.dp ? 'Outras obras' : `Livros de ${n}`, '') + (pagas ? `<div class="aviso-vermelho">© ${pagas === info.obras.length ? 'Todos estes livros têm' : plural(pagas, '1 destes livros tem', '# destes livros têm')} direitos autorais: não são gratuitos. Toque para ver a amostra oficial, guardar em "Quero ler" ou saber onde comprar. Se você tiver o ebook sem DRM, pode importar.</div>` : '') + `<div class="grade">${info.obras.map((l) => livroCard(l)).join('')}</div>`);
      }
      if (info.sim.length) partes.push(secao('Autores parecidos', '') + `<div class="autores-linha">${info.sim.map((a) => autorBola({ n: a.n, kb: a })).join('')}</div>`);
      if (!info.livres.length && !info.obras.length) partes.push('<div class="vazio">Não encontrei livros deste autor. Tente buscar pelo nome completo.</div>');
      $('#autCorpo').innerHTML = partes.join('');
      const bm = $('#bioMais');
      if (bm) bm.onclick = () => { $('#bio').classList.toggle('curta'); bm.textContent = $('#bio').classList.contains('curta') ? 'Ler mais' : 'Ler menos'; };
      hidratarFotos($('#autCorpo')); hidratarCapas($('#autCorpo'));
    } catch (e) { $('#autCorpo').innerHTML = '<div class="vazio">Sem conexão para buscar este autor agora.</div>'; }
  }

  /* ================= DETALHE DO LIVRO ================= */
  async function abrirDetalhe(l) {
    if (!l) return;
    const item = S.estante[l.id];
    const livre = l.livre || (item && (item.imp || item.baixado));
    const tempo = l.pal ? fmtMin(tempoLeitura(l.pal)) : '';
    const selos = [
      livre ? `<span class="selo gratis">${item && item.imp ? 'Seu ebook' : 'Grátis · domínio público'}</span>` : '<span class="selo pago">Com direitos autorais</span>',
      l.l ? `<span class="selo">${esc((KB.IDIOMAS.find((x) => x.id === l.l) || { nome: l.l.toUpperCase() }).nome)}</span>` : '',
      tempo ? `<span class="selo">${ico('relogio')} ${tempo} de leitura</span>` : '',
      l.ano ? `<span class="selo">${l.ano > 0 ? l.ano : Math.abs(l.ano) + ' a.C.'}</span>` : '',
      l.serie ? `<span class="selo ouro">${esc(l.serie)}</span>` : '',
    ].join('');
    const f = abrirFolha(`<div class="detalhe">${capaHTML(l, { canto: false })}<div>
      <h2>${esc(l.t)}</h2>${l.tpt ? `<div style="color:var(--tx3);font-size:13px;margin-bottom:4px">${esc(l.tpt)}</div>` : ''}
      ${l.a ? `<button class="autor-link" data-autor="${esc(l.a)}">${esc(l.a)}</button>` : ''}${l.com ? `<div style="color:var(--tx3);font-size:12.5px">com ${esc(l.com)}</div>` : ''}
      <div class="selos">${selos}</div>
      ${item && item.prog && item.prog.pct ? `<div class="barra-prog"><i style="width:${Math.round(item.prog.pct * 100)}%"></i></div><div style="font-size:12.5px;color:var(--tx2);margin-top:5px">${Math.round(item.prog.pct * 100)}% lido</div>` : ''}
      </div></div>
      ${l.motivo ? `<div class="motivo-ia">${ico('ia')}<span>${esc(l.motivo)}</span></div>` : ''}
      <p class="sinopse" id="detSin">${l.sin ? esc(l.sin) : '<span class="spinner"></span>'}</p>
      <div id="detBaixa"></div>
      <div class="acoes-det" id="detAcoes"></div>
      <div id="detMais"></div>`, { larga: true });
    const acoes = $('#detAcoes', f.f);
    const pintarAcoes = () => {
      const it = S.estante[l.id];
      const b = [];
      if (livre) {
        b.push(`<button class="btn pri" data-a="ler">${ico('abrir')} ${it && it.prog && it.prog.pct > 0.001 ? 'Continuar lendo' : 'Ler agora'}</button>`);
        b.push(`<button class="btn sec" data-a="ouvir">${ico('fone')} Ouvir narrado</button>`);
        if (!it) b.push(`<button class="btn" data-a="guardar">${ico('baixar')} Baixar para a estante</button>`);
        else b.push(`<button class="btn" data-a="tirar">${ico('lixo')} Tirar da estante</button>`);
      } else {
        b.push(`<button class="btn pri" data-a="quero">${it ? ico('check') + ' Na lista Quero ler' : ico('marcador') + ' Quero ler'}</button>`);
        b.push(`<button class="btn sec" data-a="amostra">${ico('olho')} Amostra oficial</button>`);
        b.push(`<a class="btn" href="${esc(Fontes.compra(l.tpt && l.l !== 'pt' ? l.tpt : l.t, l.a))}" target="_blank" rel="noopener">${ico('link')} Onde comprar</a>`);
        b.push(`<button class="btn" data-a="importar">${ico('upload')} Já tenho o ebook</button>`);
      }
      if (!it || it.status !== 'lido') b.push(`<button class="btn fant" data-a="descartar">Não tenho interesse</button>`);
      acoes.innerHTML = b.join('');
    };
    pintarAcoes();
    if (!livre) $('#detBaixa', f.f).innerHTML = `<p class="aviso-direitos">${esc(KB.DIREITOS.regra)} Para ler este livro, compre o ebook (sem DRM, em EPUB) e importe na sua Estante.</p>`;
    acoes.onclick = async (e) => {
      const b = e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'ler' || a === 'ouvir') { fecharFolha(f); await sleep(240); abrirLivro(l, { ouvir: a === 'ouvir' }); }
      else if (a === 'guardar') { await baixarParaEstante(l, f); pintarAcoes(); }
      else if (a === 'tirar') { if (await confirmar('Tirar da estante?', `"${l.t}" sai da sua estante e o arquivo é apagado deste aparelho. O progresso é perdido.`, 'Tirar', 'Cancelar', true)) { delete S.estante[l.id]; Banco.del('arquivos', l.id); salvar(); pintarAcoes(); toast('Livro removido.'); } }
      else if (a === 'quero') {
        if (S.estante[l.id]) delete S.estante[l.id];
        else S.estante[l.id] = { id: l.id, t: l.t, a: l.a, aid: l.aid, l: l.l, g: l.g, capa: l.capa, fonte: l.fonte, add: Date.now(), status: 'quero', ol: l.ol, sin: l.sin, ano: l.ano, tpt: l.tpt };
        salvar(); pintarAcoes(); toast(S.estante[l.id] ? 'Guardado em "Quero ler".' : 'Removido de "Quero ler".');
      } else if (a === 'amostra') abrirAmostra(l);
      else if (a === 'importar') { fecharFolha(f); $('#arquivos').click(); }
      else if (a === 'descartar') { Lia.aprender(S, 'descartou', l); salvar(); fecharFolha(f); toast('Entendido. A Lia vai mostrar menos livros assim.'); LS.del(kPrat(contaId)); }
    };
    // sinopse da web
    if (!l.sin) {
      let sin = '';
      try {
        if (l.ol) sin = await Fontes.openlibrary.descricao(l.ol);
        if (!sin && !l.livre) { const g = await Fontes.google.buscar(`intitle:${l.tpt && l.l !== 'pt' ? l.tpt : l.t} inauthor:${l.a || ''}`, 3); sin = (g.find((x) => x.sin) || {}).sin || ''; }
        if (!sin) { const ps = await Fontes.wikipedia.procurar(`${l.t} ${l.a || ''} livro`); const p = ps.find((x) => /livro|romance|obra|conto|novel|poema|peça/i.test(x.desc)); if (p) { const w = await Fontes.wikipedia.resumo(p.titulo); sin = w && w.texto || ''; } }
      } catch (er) { /* offline */ }
      const el = $('#detSin', f.f);
      if (el) el.textContent = sin ? sin.replace(/\s+/g, ' ').slice(0, 900) + (sin.length > 900 ? '…' : '') : (l.livre ? 'Clássico em domínio público. Toque em Ler agora para começar.' : 'Sem sinopse disponível.');
    }
    // parecidos
    if (l.livre && l.src) {
      Lia.parecidos(l, S, 10).then((ps) => { const el = $('#detMais', f.f); if (el && ps.length) { el.innerHTML = secao('Parecidos', 'Também gratuitos') + prateleira(ps, { gratis: true }); hidratarCapas(el); } }).catch(() => null);
    } else if (!l.livre) {
      const kb = Lia.acharAutorKB(l.a || '');
      if (kb && kb.livres) Promise.all(kb.livres.slice(0, 8).map((s) => Lia.porSrc(s))).then((ps) => { const el = $('#detMais', f.f); ps = ps.filter(Boolean); if (el && ps.length) { el.innerHTML = secao('Grátis com a mesma pegada', 'Clássicos em domínio público') + prateleira(ps, { gratis: true }); hidratarCapas(el); } });
    }
  }
  async function abrirAmostra(l) {
    const tt = l.tpt && l.l !== 'pt' ? l.tpt : l.t;
    let url = '';
    try { const g = await Fontes.google.buscar(`intitle:${tt} inauthor:${l.a || ''}`, 5); const x = g.find((v) => v.previa); url = x ? x.previa : ''; } catch (e) { /* offline */ }
    window.open(url || Fontes.googleLivros(tt, l.a), '_blank', 'noopener');
  }

  /* ================= ESTANTE: baixar, importar, abrir ================= */
  /* fonte de um livro do acervo livre (mesmo em itens antigos sem o campo src) */
  const memArquivos = new Map();
  const fonteDe = (x) => (x && (x.src || (/^(gb|ws):/.test(x.id || '') ? x.id : ''))) || '';
  async function baixarParaEstante(l, folha, forcar, aoProgresso) {
    if (!forcar && S.estante[l.id] && S.estante[l.id].baixado) return true;
    if (l.conferir && l.src.startsWith('gb:')) {
      const ok = await Lia.conferirDominio(l.src.slice(3));
      if (!ok) { toast('Este livro é livre nos EUA, mas no Brasil ainda tem direitos autorais.', 4500); return false; }
    }
    const box = folha ? $('#detBaixa', folha.f) : null;
    if (box) box.innerHTML = `<div class="baixando"><span class="spinner"></span><div class="barra-prog"><i id="barBaixa" style="width:3%"></i></div><small id="txtBaixa">Baixando…</small></div>`;
    try {
      const blob = await Fontes.baixarLivro(l.src, (p, n) => { if (aoProgresso) aoProgresso(p, n); const b = box && $('#barBaixa', box); if (b) b.style.width = Math.max(3, Math.round(p * 100)) + '%'; const t = box && $('#txtBaixa', box); if (t) t.textContent = (n / 1048576).toFixed(1) + ' MB'; });
      memArquivos.set(l.id, blob); // se o navegador recusar guardar (Safari privado, pouco espaço), o livro abre da memória
      await Banco.set('arquivos', l.id, blob);
      const ant = S.estante[l.id];
      S.estante[l.id] = { ...(ant || {}), id: l.id, src: l.src, t: l.t, a: l.a, aid: l.aid, l: l.l, g: l.g, capa: l.capa, fonte: l.fonte, pal: l.pal, sin: l.sin, ano: l.ano, tpt: l.tpt, add: (ant && ant.add) || Date.now(), status: ant && ant.status !== 'quero' ? ant.status : 'novo', baixado: true, livre: true };
      salvar();
      if (box) box.innerHTML = `<div class="motivo-ia">${ico('check')}<span>Baixado. Está na sua estante e funciona sem internet.</span></div>`;
      return true;
    } catch (e) {
      if (box) box.innerHTML = '<p class="erro-msg">Não consegui baixar agora. Confira a internet e tente de novo.</p>';
      else toast('Não consegui baixar agora. Confira a internet.');
      return false;
    }
  }
  $('#arquivos').addEventListener('change', (e) => { const fs = Array.from(e.target.files || []); e.target.value = ''; if (fs.length) importar(fs); });
  /* confere quais livros da estante estão mesmo neste aparelho e baixa de novo os que a pessoa está lendo */
  async function conferirArquivos() {
    if (!S || !S.estante) return;
    const tem = new Set(await Banco.chaves('arquivos'));
    const faltam = Object.values(S.estante).filter((x) => x.baixado && !tem.has(x.id));
    if (!faltam.length) return;
    for (const x of faltam) if (!fonteDe(x)) x.baixado = false;
    salvar();
    if (navigator.onLine === false) return;
    const lendo = faltam.filter((x) => fonteDe(x) && x.status === 'lendo').sort((a, b) => (b.ultimo || 0) - (a.ultimo || 0)).slice(0, 3);
    for (const x of lendo) { await baixarParaEstante({ ...x, src: fonteDe(x), livre: true }, null, true).catch(() => false); await sleep(400); }
  }
  async function importar(arquivos) {
    const f = abrirFolha(`<h2>Adicionando ${plural(arquivos.length, '1 ebook', '# ebooks')}</h2><p style="color:var(--tx2);margin:0 0 14px">A Lia lê cada arquivo, descobre qual é o livro e organiza na sua estante.</p><div class="importando" id="impLista">${arquivos.map((a, i) => `<div class="imp-item" id="imp${i}"><div class="capa"><img src="${capaGerada(a.name.replace(/\.[^.]+$/, ''), '')}" alt=""></div><div><b>${esc(a.name)}</b><small class="passo"><span class="spinner" style="width:14px;height:14px;vertical-align:-2px"></span> Na fila</small></div></div>`).join('')}</div><div style="margin-top:16px"><button class="btn pri bloco" data-fechar hidden id="impOk">Ver na estante</button></div>`);
    let ok = 0;
    for (let i = 0; i < arquivos.length; i++) {
      const arq = arquivos[i];
      const el = $('#imp' + i, f.f);
      const passo = (t) => { if (el) el.querySelector('.passo').innerHTML = esc(t); };
      try {
        passo('Lendo o arquivo…');
        const id = 'imp:' + await impressao(arq);
        const L = await Formatos.abrir(arq, arq.name, (p) => passo(`Lendo o PDF… ${Math.round(p * 100)}%`));
        passo('Identificando com a Lia…');
        const r = await Lia.identificar({ titulo: L.meta.titulo, autor: L.meta.autor, idioma: L.meta.idioma, texto: L.amostra, arquivo: arq.name, assuntos: L.meta.assuntos });
        let capa = '';
        let capaBlob = L.capa;
        if (!capaBlob && r.capaRemota) { try { capaBlob = await buscar(r.capaRemota, { tipo: 'blob', ms: 12000 }); if (capaBlob.size < 1500) capaBlob = null; } catch (er) { capa = r.capaRemota; } }
        if (capaBlob) { await Banco.set('capas', id, await reduzirImagem(capaBlob, 600)); capa = 'idb:' + id; urlsCapa.delete(id); }
        await Banco.set('arquivos', id, arq);
        const ja = S.estante[id];
        S.estante[id] = { ...(ja || {}), id, t: r.titulo, a: r.autor, aid: r.aid || '', l: r.idioma || 'pt', g: r.generos, capa, fonte: 'Importado', pal: L.palavras, add: (ja && ja.add) || Date.now(), status: (ja && ja.status) || 'novo', imp: true, livre: true, baixado: true, sin: r.sinopse || L.meta.descricao || '', ano: r.ano, arquivo: arq.name, bytes: arq.size };
        salvar();
        if (el) {
          el.querySelector('.capa').innerHTML = capa.startsWith('idb:') ? `<img data-idb="${esc(id)}" src="${capaGerada(r.titulo, r.autor)}" alt="">` : `<img src="${esc(capa || capaGerada(r.titulo, r.autor))}" alt="">`;
          el.querySelector('b').textContent = r.titulo;
          el.querySelector('.passo').innerHTML = `${esc(r.autor || 'Autor não identificado')}${r.passos.length ? ' · ' + esc(r.passos[r.passos.length - 1]) : ''} ${ja ? '· já estava na estante' : ''} <button class="btn fant peq" data-editar="${esc(id)}" style="min-height:26px;padding:0 6px">Editar</button>`;
          hidratarCapas(el);
        }
        ok++;
      } catch (er) {
        passo(er.amigavel || 'Não consegui abrir este arquivo.');
        if (el) el.querySelector('.passo').style.color = 'var(--erro)';
      }
    }
    $('#impOk', f.f).hidden = false;
    f.f.addEventListener('click', (e) => { const b = e.target.closest('[data-editar]'); if (b) editarLivro(b.dataset.editar); });
    f.aoFechar = () => { if (rotaAtual.startsWith('estante')) telaEstante('meus'); else ir('#estante/meus'); };
    if (ok) toast(`${plural(ok, '1 ebook adicionado', '# ebooks adicionados')} à estante.`);
  }
  async function reduzirImagem(blob, alt) {
    try {
      const bmp = await createImageBitmap(blob);
      if (bmp.height <= alt) return blob;
      const esc_ = alt / bmp.height;
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * esc_); cv.height = alt;
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      return await new Promise((r) => cv.toBlob((b) => r(b || blob), 'image/jpeg', 0.86));
    } catch (e) { return blob; }
  }
  function editarLivro(id) {
    const it = S.estante[id];
    if (!it) return;
    const f = abrirFolha(`<h2>Editar livro</h2><form id="fEd"><div class="campo"><label>Título</label><input name="t" value="${esc(it.t)}"></div><div class="campo"><label>Autor</label><input name="a" value="${esc(it.a || '')}"></div><button class="btn pri bloco">Salvar</button></form>`);
    $('#fEd', f.f).onsubmit = (e) => { e.preventDefault(); it.t = e.target.t.value.trim() || it.t; it.a = e.target.a.value.trim(); const kb = Lia.acharAutorKB(it.a); if (kb) { it.aid = kb.id; it.a = kb.n; } salvar(); fecharFolha(f); toast('Salvo.'); if (rotaAtual.startsWith('estante')) telaEstante(rotaAtual.split('/')[1]); };
  }

  function telaEstante(aba) {
    tela.className = 'tela';
    const todos = Object.values(S.estante);
    const grupos = {
      lendo: ['Lendo', (x) => x.status === 'lendo'], novos: ['Para ler', (x) => x.status === 'novo'], quero: ['Quero ler', (x) => x.status === 'quero'],
      lidos: ['Lidos', (x) => x.status === 'lido'], meus: ['Meus ebooks', (x) => x.imp], marcas: ['Marcadores e destaques', () => false],
    };
    aba = grupos[aba] ? aba : (todos.some((x) => x.status === 'lendo') ? 'lendo' : todos.some((x) => x.status === 'novo') ? 'novos' : 'meus');
    const cont = (k) => (k === 'marcas' ? Object.values(S.marcadores).reduce((s, l) => s + l.length, 0) + Object.values(S.marcas).reduce((s, l) => s + l.length, 0) : todos.filter(grupos[k][1]).length);
    const lista = itensEstante(grupos[aba][1]);
    const item = (x) => {
      reg({ ...x, livre: x.livre !== false && x.status !== 'quero' });
      const p = x.prog || {};
      const pct = Math.round((p.pct || 0) * 100);
      const falta = x.pal ? (1 - (p.pct || 0)) * x.pal / (S.ppm || 230) : 0;
      return `<button class="item-estante" data-livro="${esc(x.id)}">${capaHTML(x, { canto: false })}<div><b>${esc(x.t)}</b><small>${esc(x.a || '')}</small>
        ${x.status === 'quero' ? '<div class="selos" style="margin-top:8px"><span class="selo pago">Quero ler</span></div>' : `<div class="barra-prog"><i style="width:${pct}%"></i></div><div class="linha-info"><span>${x.status === 'lido' ? 'Lido ✓' : pct ? pct + '% lido' : 'Não começado'}${p.pag ? ' · pág. ' + p.pag + (p.tot ? '/' + p.tot : '') : ''}</span><span>${x.status !== 'lido' && falta ? 'faltam ' + fmtMin(falta) : ''}</span></div>`}
        </div></button>`;
    };
    let corpo = '';
    if (aba === 'marcas') {
      const blocos = [];
      for (const [id, ms] of Object.entries(S.marcadores)) for (const m of ms) blocos.push({ id, tipo: 'marcador', ...m });
      for (const [id, ms] of Object.entries(S.marcas)) for (const m of ms) blocos.push({ id, tipo: 'destaque', ...m });
      blocos.sort((a, b) => b.ts - a.ts);
      corpo = blocos.length ? blocos.map((b) => { const it = S.estante[b.id] || { t: '?' }; return `<button class="item-marca" data-irmarca="${esc(b.id)}" data-c="${b.c}" data-o="${b.o != null ? b.o : b.i}" style="--c:${b.tipo === 'marcador' ? '#C2424E' : b.cor === 'verde' ? '#5BBF85' : b.cor === 'rosa' ? '#E58399' : b.cor === 'azul' ? '#6FA8F0' : '#E9B24E'}"><small>${b.tipo === 'marcador' ? 'Marcador' : 'Destaque'} · ${esc(it.t)}${b.pag ? ' · pág. ' + b.pag : ''}</small><q>${esc((b.txt || '').slice(0, 220))}</q>${b.nota ? `<small>Nota: ${esc(b.nota)}</small>` : ''}</button>`; }).join('') : '<div class="vazio">Use o marcador de página e os destaques durante a leitura. Eles aparecem aqui.</div>';
    } else corpo = lista.length ? `<div class="lista-estante">${lista.map(item).join('')}</div>` : `<div class="vazio"><img src="${ARTE.fantin}-p.webp" alt=""><p>${aba === 'meus' ? 'Traga seus próprios ebooks (EPUB, PDF, TXT, FB2, DOCX). A Lia identifica e organiza cada um.' : aba === 'quero' ? 'Guarde aqui os livros que você quer ler depois.' : 'Nada aqui ainda. Explore a página inicial ou a busca.'}</p></div>`;
    tela.innerHTML = `<div class="miolo"><div class="ola"><div><h1>Minha estante</h1><p>${plural(todos.length, '1 livro', '# livros')} · <span id="espaco"></span></p></div></div>
      <div class="abas" role="tablist">${Object.entries(grupos).map(([k, [n]]) => `<a class="aba" role="tab" aria-selected="${k === aba}" href="#estante/${k}" style="text-decoration:none;display:inline-flex;align-items:center">${n}<span>${cont(k)}</span></a>`).join('')}</div>
      ${corpo}</div>
      <button class="fab" id="fabImp">${ico('upload')} Adicionar ebooks</button>`;
    $('#fabImp').onclick = () => $('#arquivos').click();
    hidratarCapas(tela);
    tela.onclick = (e) => {
      const m = e.target.closest('[data-irmarca]');
      if (m) { const it = S.estante[m.dataset.irmarca]; if (it) abrirLivro(it, { posicao: { c: +m.dataset.c, o: +m.dataset.o } }); }
    };
    if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { const el = $('#espaco'); if (el) el.textContent = `${(e.usage / 1048576).toFixed(0)} MB usados neste aparelho`; });
  }

  /* ================= CHAT DA LIA ================= */
  let historicoChat = [];
  function telaLia() {
    tela.className = 'tela';
    tela.innerHTML = `<div class="miolo"><div class="chat">
      <div class="chat-topo"><span class="orbe-mini"><img src="img/logo.svg" alt=""></span><div><h1>Lia</h1><p>Sua IA de leitura. Pergunte do seu jeito.</p></div></div>
      <div class="msgs" id="msgs"></div></div></div>
      <div class="chat-entrada"><form id="fChat"><input name="m" placeholder="Ex.: me indica um suspense curto" autocomplete="off" enterkeyhint="send"><button aria-label="Enviar">${ico('enviar')}</button></form></div>`;
    const msgs = $('#msgs');
    if (!historicoChat.length) historicoChat.push({ de: 'lia', r: { texto: `Oi, ${primeiroNome(S.nome)}! Eu sou a Lia. Posso indicar livros pelo seu humor, achar autores, explicar se um livro é gratuito e resumir o capítulo que você está lendo.`, sugestoes: ['Me indica um suspense curto', 'Parecidos com A Empregada', 'Quem é Raphael Montes?', 'O que tem de terror grátis?'] } });
    const desenhar = () => {
      msgs.innerHTML = historicoChat.map((m) => (m.de === 'eu' ? `<div class="msg eu">${esc(m.t)}</div>` : msgLia(m.r))).join('');
      hidratarCapas(msgs); hidratarFotos(msgs);
      scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    };
    desenhar();
    const enviar = async (txt) => {
      historicoChat.push({ de: 'eu', t: txt });
      desenhar();
      msgs.insertAdjacentHTML('beforeend', '<div class="msg lia" id="digit"><span class="digitando"><i></i><i></i><i></i></span></div>');
      scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      let r;
      try { r = await Cerebro.responder(txt, apiChat()); } catch (e) { console.error(e); r = { texto: 'Tive um problema para responder agora. Tente de novo em instantes.' }; }
      historicoChat.push({ de: 'lia', r });
      historicoChat = historicoChat.slice(-40);
      if ($('#msgs')) desenhar();
    };
    $('#fChat').onsubmit = (e) => { e.preventDefault(); const t = e.target.m.value.trim(); if (!t) return; e.target.m.value = ''; enviar(t); };
    msgs.onclick = (e) => {
      const s = e.target.closest('[data-sug]');
      if (s) return enviar(s.dataset.sug);
      const a = e.target.closest('[data-acao]');
      if (!a) return;
      const ac = a.dataset.acao;
      if (ac === 'estante') ir('#estante');
      else if (ac === 'autor') ir('#autor/' + encodeURIComponent(a.dataset.nome));
      else if (ac === 'abrir' || ac === 'ouvir') { const l = REG.get(a.dataset.id) || S.estante[a.dataset.id]; if (l) abrirLivro(l, { ouvir: ac === 'ouvir' }); }
      else if (ac === 'detalhe') abrirDetalhe(REG.get(a.dataset.id));
      else if (ac === 'ir') ir(a.dataset.nome);
    };
  }
  function msgLia(r) {
    const partes = [`<div>${esc(r.texto || '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div>`];
    if (r.lista) partes.push(`<ul>${r.lista.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`);
    if (r.autores && r.autores.length) partes.push(`<div class="autores-linha" style="margin:10px -15px 0;padding:4px 15px">${r.autores.map((a) => autorBola({ n: a.n, kb: a.kb, foto: a.foto })).join('')}</div>`);
    if (r.livros && r.livros.length) partes.push(prateleira(r.livros, { gratis: true }));
    if (r.nota) partes.push(`<div class="nota">${esc(r.nota)}</div>`);
    if (r.fonte) partes.push(`<div class="nota">Fonte: ${esc(r.fonte)}</div>`);
    if (r.acoes && r.acoes.length) partes.push(`<div class="acoes-msg">${r.acoes.map((a) => { const id = a.livro ? reg(a.livro) : a.id || ''; return `<button class="btn peq ${a.acao === 'abrir' || a.acao === 'ouvir' ? 'pri' : ''}" data-acao="${esc(a.acao)}" data-id="${esc(id)}" data-nome="${esc(a.nome || '')}">${esc(a.rotulo)}</button>`; }).join('')}</div>`);
    if (r.sugestoes && r.sugestoes.length) partes.push(`<div class="sugestoes">${r.sugestoes.map((s) => `<button class="chip" data-sug="${esc(s)}">${esc(s)}</button>`).join('')}</div>`);
    return `<div class="msg lia">${partes.join('')}</div>`;
  }
  function estatisticas() {
    const dias = S.stats.dias || {};
    const hoje = hojeISO();
    let semana = 0, seq = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) { const x = new Date(d); x.setDate(d.getDate() - i); semana += dias[hojeIsoDe(x)] || 0; }
    for (let i = 0; i < 400; i++) { const x = new Date(d); x.setDate(d.getDate() - i); if ((dias[hojeIsoDe(x)] || 0) > 60) seq++; else if (i > 0) break; }
    const todos = Object.values(S.estante);
    return { minHoje: (dias[hoje] || 0) / 60, minSemana: semana / 60, lidos: todos.filter((x) => x.status === 'lido').length, lendo: todos.filter((x) => x.status === 'lendo').length, sequencia: seq };
  }
  const hojeIsoDe = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const apiChat = () => ({
    estado: () => S, nome: () => S.nome, estatisticas, salvar,
    livroAberto: () => (Leitor.aberto ? Leitor : null),
    idAberto: () => (Leitor.aberto && leitorAberto ? leitorAberto.item.id : null),
    // texto de um livro da estante que não está aberto (para o resumo do livro)
    textoLivro: async (item) => {
      const blob = await Banco.get('arquivos', item.id);
      if (!blob) return null;
      const L = await Formatos.abrir(blob, item.arquivo || (item.id.replace(/[^a-z0-9]/gi, '_') + '.epub'));
      return {
        caps: L.caps.map((c) => ({ titulo: c.titulo })),
        texto: async (i) => {
          const d = new DOMParser().parseFromString(L.caps[i].html, 'text/html');
          let txt = ''; const blocos = [];
          for (const el of d.body.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,blockquote,pre')) { if (el.querySelector('p,li')) continue; blocos.push(txt.length); txt += el.textContent.replace(/\s+/g, ' ').trim() + '\n'; }
          return { txt, blocos };
        },
      };
    },
    ultimoLido: () => itensEstante((x) => x.status === 'lendo')[0] || null,
  });

  /* ================= PERFIL ================= */
  async function telaPerfil() {
    tela.className = 'tela';
    const st = estatisticas();
    const dias = S.stats.dias || {};
    const semanaBarras = Array.from({ length: 7 }, (_, i) => { const x = new Date(); x.setDate(x.getDate() - (6 - i)); return { d: 'DSTQQSS'[x.getDay()], m: (dias[hojeIsoDe(x)] || 0) / 60 }; });
    const maxM = Math.max(10, ...semanaBarras.map((b) => b.m));
    const c = contas[contaId] || {};
    const P = S.perfil;
    tela.innerHTML = `<div class="miolo">
      <div class="perfil-topo"><span class="avatar" style="--h:${matiz(S.nome)}">${esc(iniciais(S.nome))}</span><div><h1>${esc(S.nome)}</h1><div style="color:var(--tx3);font-size:13px">${c.local ? 'Conta só neste aparelho' : `${ico('nuvem')} Salvo na nuvem`}</div></div></div>
      <div class="stats"><div class="stat"><b>${fmtMin(st.minHoje)}</b><span>lidos hoje</span></div><div class="stat"><b>${fmtMin(st.minSemana)}</b><span>nos últimos 7 dias</span></div><div class="stat"><b>${st.lidos}</b><span>${st.lidos === 1 ? 'livro terminado' : 'livros terminados'}</span></div><div class="stat"><b>${st.sequencia}</b><span>${st.sequencia === 1 ? 'dia seguido' : 'dias seguidos'}</span></div></div>
      <div class="semana">${semanaBarras.map((b) => `<div><i style="height:${Math.max(3, (b.m / maxM) * 100)}%"></i>${b.d}</div>`).join('')}</div>

      ${secao('Seu gosto de leitura', 'A Lia usa isso para escolher os livros')}
      <div class="cartao"><div class="linha-op"><span>Temas<small>${esc(P.generos.map((g) => (KB.G[g] || {}).nome).filter(Boolean).join(', ') || 'Nenhum')}</small></span><button class="btn peq" data-ed="generos">Editar</button></div>
      <div class="linha-op"><span>Autores<small>${esc(P.autores.map((a) => a.n).join(', ') || 'Nenhum')}</small></span><button class="btn peq" data-ed="autores">Editar</button></div>
      <div class="linha-op"><span>Tipos de leitura<small>${esc(P.tipos.map((t) => (KB.TIPOS.find((x) => x.id === t) || {}).nome).filter(Boolean).join(', ') || 'Nenhum')}</small></span><button class="btn peq" data-ed="tipos">Editar</button></div>
      <div class="linha-op"><span>Idiomas<small>${esc(P.idiomas.map((i) => (KB.IDIOMAS.find((x) => x.id === i) || {}).nome).join(', '))}</small></span><button class="btn peq" data-ed="idiomas">Editar</button></div>
      <div class="linha-op"><span>Nova busca da Lia<small>Refaz as prateleiras com o seu gosto atual</small></span><a class="btn sec peq" href="#descobrindo">${ico('ia')} Buscar</a></div></div>

      ${secao('Voz da narração', 'Toque em Ouvir para escutar uma amostra antes de escolher')}
      <div class="cartao" id="cartaoVozes"><div class="titulo-sec" style="margin:0"><p>Carregando vozes…</p><span class="spinner"></span></div></div>

      ${secao('Fonte da leitura', 'A padrão já vem marcada')}
      <div class="cartao" id="cartaoFontes"></div>

      ${secao('Aparência', '')}
      <div class="cartao">
        <div class="linha-op"><span>Tema do app</span><div class="seg" id="segTema">${[['auto', 'Automático'], ['escuro', 'Escuro'], ['claro', 'Claro']].map(([v, n]) => `<button data-v="${v}" aria-pressed="${S.cfg.tema === v}">${n}</button>`).join('')}</div></div>
        <div class="linha-op"><span>Textura de papel<small>Fundo de folha de livro em vez de branco puro</small></span><label class="interruptor"><input type="checkbox" id="optTextura" ${S.cfg.leitura.textura ? 'checked' : ''}><span></span></label></div>
        <div class="linha-op"><span>Virar página</span><div class="seg" id="segVirar">${[['folha', 'Folha 3D'], ['deslizar', 'Deslizar'], ['nenhum', 'Direto']].map(([v, n]) => `<button data-v="${v}" aria-pressed="${S.cfg.leitura.virar === v}">${n}</button>`).join('')}</div></div>
      </div>

      ${secao('Aplicativo', '')}
      <div class="cartao">
        <div class="linha-op"><span>Instalar o LeituCast<small>No celular e no computador, como um app de verdade</small></span><button class="btn sec peq" id="btInstalar">${ico('instalar')} Instalar</button></div>
        ${c.local ? `<div class="linha-op"><span>Salvar na nuvem<small>Para entrar em outros aparelhos</small></span><button class="btn pri peq" id="btNuvem">${ico('nuvem')} Salvar</button></div>` : `<div class="linha-op"><span>Trocar senha</span><button class="btn peq" id="btSenha">Trocar</button></div>`}
        <div class="linha-op"><span>Excluir conta<small>Apaga tudo da nuvem</small></span><button class="btn fant peq" id="btExcluir" style="color:var(--erro)">Excluir</button></div>
      </div>
      <button class="btn bloco sair-conta" id="btSair">${ico('sair')} Sair da conta</button>
      <p class="credito">Pinturas em domínio público: Almeida Júnior, Fragonard, Van Gogh, Vermeer, Perugini, Fantin-Latour e Eliseu Visconti (Wikimedia Commons). Livros: Project Gutenberg e Wikisource. Capas: Open Library. Vozes abertas: Piper (Rhasspy) e OpenVoiceOS. Fontes: Fraunces, Manrope, Literata, Lora e Atkinson Hyperlegible (OFL).</p>
    </div>`;
    tela.onclick = (e) => { const b = e.target.closest('[data-ed]'); if (b) editarGosto(b.dataset.ed); };
    $('#segTema').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.cfg.tema = b.dataset.v; aplicarTema(); salvar(); $$('#segTema button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    $('#segVirar').onclick = (e) => { const b = e.target.closest('[data-v]'); if (!b) return; S.cfg.leitura.virar = b.dataset.v; salvar(); $$('#segVirar button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); };
    $('#optTextura').onchange = (e) => { S.cfg.leitura.textura = e.target.checked; salvar(); };
    $('#btInstalar').onclick = instalar;
    $('#btSair').onclick = async () => { if (await confirmar('Sair da conta?', 'Seus livros baixados continuam neste aparelho.', 'Sair')) sair(); };
    $('#btExcluir').onclick = excluirConta;
    if ($('#btSenha')) $('#btSenha').onclick = trocarSenha;
    if ($('#btNuvem')) $('#btNuvem').onclick = salvarNaNuvem;
    pintarFontes();
    pintarVozes();
  }
  const AMOSTRA_TXT = 'A noite estava fria quando ela abriu o livro. Na primeira página, uma frase sublinhada a lápis: alguém já tinha lido aquela história antes.';
  function pintarFontes() {
    const el = $('#cartaoFontes');
    if (!el) return;
    const F = [['literata', 'Literata', 'Padrão. Feita para leitura longa em tela'], ['lora', 'Lora', 'Serifada elegante, clima de romance'], ['georgia', 'Georgia', 'Clássica, como livro impresso'], ['fraunces', 'Fraunces', 'Serifada com personalidade'], ['atkinson', 'Atkinson Hyperlegible', 'Máxima legibilidade, boa para baixa visão'], ['manrope', 'Manrope', 'Sem serifa, moderna']];
    const fam = { literata: "'Literata'", lora: "'Lora'", georgia: 'Georgia', fraunces: "'Fraunces'", atkinson: "'Atkinson Hyperlegible'", manrope: "'Manrope'" };
    el.innerHTML = F.map(([id, n, d]) => `<button class="fonte-item ${S.cfg.leitura.fonte === id ? 'sel' : ''}" data-fonte="${id}"><small>${esc(n)}${id === 'literata' ? ' · padrão' : ''}${S.cfg.leitura.fonte === id ? ' · em uso ✓' : ''} — ${esc(d)}</small><span class="amostra-txt" style="font-family:${fam[id]}">${AMOSTRA_TXT}</span></button>`).join('') +
      `<div class="ajuste"><label>Tamanho da letra <span id="tamV">${S.cfg.leitura.tam}px</span></label><input type="range" id="tamR" min="14" max="30" value="${S.cfg.leitura.tam}"></div>`;
    el.onclick = (e) => { const b = e.target.closest('[data-fonte]'); if (b) { S.cfg.leitura.fonte = b.dataset.fonte; salvar(); pintarFontes(); } };
    const r = $('#tamR');
    const atual = () => { r.style.setProperty('--v', ((r.value - 14) / 16) * 100 + '%'); $('#tamV').textContent = r.value + 'px'; $$('.amostra-txt', el).forEach((x) => { x.style.fontSize = r.value + 'px'; }); };
    atual();
    r.oninput = atual;
    r.onchange = () => { S.cfg.leitura.tam = +r.value; salvar(); };
  }
  async function pintarVozes(alvo = '#cartaoVozes', lang = 'pt-BR', aoEscolher) {
    const el = typeof alvo === 'string' ? $(alvo) : alvo;
    if (!el) return;
    const { sistema, abertas } = await Narrador.listarVozes(lang);
    const atual = S.cfg.voz.voz;
    const padrao = await Narrador.vozPadrao(lang);
    const baixadas = {};
    await Promise.all(abertas.map(async (v) => { baixadas[v.id] = await Narrador.vozBaixada(v); }));
    const item = (v) => {
      const sel = v.id === atual;
      const g = v.genero || 'x';
      const desc = v.motor === 'sistema' ? [v.edge ? 'Neural do Microsoft Edge' : v.natural ? 'Neural' : v.local ? 'Do aparelho' : 'Online', v.lang].join(' · ') : v.desc;
      const extra = v.motor === 'piper' ? (baixadas[v.id] ? '<span class="selo gratis">Baixada · offline</span>' : `<span class="selo">${v.mb} MB</span>`) : '';
      return `<div class="voz-item ${sel ? 'sel' : ''}"><span class="gen ${g}">${g === 'f' ? 'F' : g === 'm' ? 'M' : '•'}</span><div><b>${esc(v.motor === 'sistema' && /android/i.test(navigator.userAgent) && !/google|microsoft/i.test(v.nome) ? 'Voz do Google · ' + v.nome : v.nome)}${v.id === padrao ? ' <span class="selo ouro">Recomendada</span>' : v.recomendada ? ` <span class="selo ouro">${v.genero === 'f' ? 'Feminina neural' : 'Melhor aberta'}</span>` : ''}</b><small>${esc(desc)} ${extra}</small>${v.lic && v.lic.includes('NC') ? `<small>Licença ${esc(v.lic)}</small>` : ''}</div>
        <div class="bts"><button class="btn peq" data-ouvir-voz="${esc(v.id)}">${ico('play')} Ouvir</button>${v.motor === 'piper' && !baixadas[v.id] ? `<button class="btn sec peq" data-baixar-voz="${esc(v.id)}">${ico('baixar')}</button>` : `<button class="btn ${sel ? 'pri' : ''} peq" data-usar-voz="${esc(v.id)}">${sel ? ico('check') : 'Usar'}</button>`}</div></div>`;
    };
    const est = S.cfg.voz;
    const android = /android/i.test(navigator.userAgent);
    const dicaSistema = android ? 'No Android, a voz do aparelho é a do Google (uma por idioma). Para trocar entre vozes femininas e masculinas: Configurações do celular > Sistema > Idiomas > Saída de texto para fala > Mecanismo do Google > Português (Brasil), e escolha a voz. Para uma voz feminina neural, baixe a Dii abaixo.' : sistema.some((v) => v.edge) ? 'Você está no Microsoft Edge: as vozes neurais dele estão disponíveis.' : 'Para as vozes neurais do Microsoft Edge (Francisca, Antônio, Thalita), abra o LeituCast no Edge.';
    el.innerHTML = `${sistema.length ? `<h3>Vozes do aparelho</h3><p>${dicaSistema}</p>${sistema.slice(0, 12).map(item).join('')}` : '<p>Este navegador não tem vozes do sistema para este idioma. Use uma voz aberta abaixo.</p>'}
      <h3 style="margin-top:16px">Vozes neurais abertas (funcionam offline)</h3><p>Baixadas uma vez e guardadas no aparelho. A primeira também baixa o motor de voz (cerca de 32 MB).</p>${abertas.map(item).join('') || '<p>Nenhuma voz aberta para este idioma.</p>'}
      <div class="ajuste"><div class="rot">Tipo de voz</div><div class="chips" id="estilos">${Narrador.ESTILOS.map((s) => `<button class="chip" data-estilo="${s.id}" aria-pressed="${est.estilo === s.id}">${s.nome}</button>`).join('')}</div></div>
      <div class="ajuste"><label>Velocidade <span id="velV">${est.vel.toFixed(2).replace('.', ',')}x</span></label><input type="range" id="velR" min="0.6" max="2" step="0.05" value="${est.vel}"></div>`;
    const velR = $('#velR', el);
    const pintaVel = () => { velR.style.setProperty('--v', ((velR.value - 0.6) / 1.4) * 100 + '%'); $('#velV', el).textContent = (+velR.value).toFixed(2).replace('.', ',') + 'x'; };
    pintaVel();
    velR.oninput = pintaVel;
    velR.onchange = () => { S.cfg.voz.vel = +velR.value; Narrador.ajustar({ vel: S.cfg.voz.vel }); salvar(); };
    el.onclick = async (e) => {
      const ou = e.target.closest('[data-ouvir-voz]');
      const us = e.target.closest('[data-usar-voz]');
      const ba = e.target.closest('[data-baixar-voz]');
      const es = e.target.closest('[data-estilo]');
      if (ou) {
        // tocar de novo no botão para a amostra na hora
        if (ou.dataset.tocando) { Narrador.pararAmostra(); return; }
        for (const x of $$('[data-ouvir-voz][data-tocando]', el)) { x.removeAttribute('data-tocando'); x.innerHTML = ico('play') + ' Ouvir'; }
        const v = await Narrador.acharVoz(ou.dataset.ouvirVoz);
        ou.dataset.tocando = '1';
        ou.innerHTML = '<span class="quadrado-parar"></span> Parar';
        const nome = v ? v.nome : 'eu';
        const r = await Narrador.amostra(ou.dataset.ouvirVoz, `Olá, ${primeiroNome(S.nome)}! Eu sou ${v && v.genero === 'm' ? 'o' : 'a'} ${nome}. ${AMOSTRA_TXT}`).catch(() => { toast('Não consegui tocar a amostra.'); return false; });
        if (r === 'baixar') toast(`Baixe a voz ${nome} para ouvir a amostra (ela é gerada no aparelho).`);
        ou.removeAttribute('data-tocando');
        ou.innerHTML = ico('play') + ' Ouvir';
      } else if (us) {
        S.cfg.voz.voz = us.dataset.usarVoz; Narrador.ajustar({ voz: S.cfg.voz.voz }); salvar();
        toast('Voz escolhida.'); pintarVozes(el, lang, aoEscolher); aoEscolher && aoEscolher();
      } else if (ba) {
        const v = Narrador.VOZES_ABERTAS.find((x) => x.id === ba.dataset.baixarVoz);
        if (!v) return;
        if (v.lic.includes('NC') && !(await confirmar('Voz de uso pessoal', `A voz ${v.nome} tem licença ${v.lic}: pode usar para ler os seus livros, mas não comercialmente.`, 'Baixar', 'Cancelar'))) return;
        ba.disabled = true;
        const linha = ba.closest('.voz-item');
        const info = document.createElement('small');
        linha.querySelector('div').appendChild(info);
        try {
          await Narrador.baixarVoz(v, (p) => { info.textContent = `Baixando ${p.parte === 'voz' ? 'a voz' : p.parte === 'motor' ? 'o motor' : 'os fonemas'}… ${p.t ? Math.round((p.n / p.t) * 100) + '%' : (p.n / 1048576).toFixed(0) + ' MB'}`; });
          S.cfg.voz.voz = v.id; Narrador.ajustar({ voz: v.id }); salvar();
          toast(`Voz ${v.nome} pronta. Funciona sem internet.`);
          pintarVozes(el, lang, aoEscolher);
        } catch (er) { info.textContent = `Não consegui baixar (${er.message}). Toque em Baixar de novo: continua de onde parou.`; ba.disabled = false; }
      } else if (es) {
        S.cfg.voz.estilo = es.dataset.estilo; Narrador.ajustar({ estilo: es.dataset.estilo }); salvar();
        $$('[data-estilo]', el).forEach((x) => x.setAttribute('aria-pressed', String(x === es)));
      }
    };
  }
  function editarGosto(tipo) {
    const P = S.perfil;
    let html = '';
    if (tipo === 'generos') html = `<h2>Temas</h2><div class="chips" id="edChips">${KB.GENEROS.map((g) => `<button class="chip" data-v="${g.id}" style="--c:${g.cor}" aria-pressed="${P.generos.includes(g.id)}"><span class="pt"></span>${esc(g.nome)}</button>`).join('')}</div>`;
    if (tipo === 'tipos') html = `<h2>Tipos de leitura</h2><div class="chips" id="edChips">${KB.TIPOS.map((t) => `<button class="chip" data-v="${t.id}" aria-pressed="${P.tipos.includes(t.id)}">${esc(t.nome)}</button>`).join('')}</div>`;
    if (tipo === 'idiomas') html = `<h2>Idiomas</h2><div class="chips" id="edChips">${KB.IDIOMAS.map((i) => `<button class="chip" data-v="${i.id}" aria-pressed="${P.idiomas.includes(i.id)}">${esc(i.nome)}</button>`).join('')}</div>`;
    if (tipo === 'autores') html = `<h2>Autores favoritos</h2><div class="sugest"><div class="busca" style="margin:0">${ico('busca')}<input id="edAut" placeholder="Adicionar autor" autocomplete="off"></div><div class="sugest-lista" id="edSug" hidden></div></div><div class="escolhidos" id="edEsc"></div>`;
    const f = abrirFolha(html + '<div style="margin-top:18px"><button class="btn pri bloco" data-fechar>Pronto</button></div>', { aoFechar: () => { P.ts = Date.now(); salvar(); LS.del(kPrat(contaId)); if (rotaAtual === 'perfil') telaPerfil(); } });
    if (tipo !== 'autores') { $('#edChips', f.f).id = 'edChips' + f.id; chipsToggle('#edChips' + f.id, P[tipo], tipo === 'idiomas'); return; }
    const pinta = () => { $('#edEsc', f.f).innerHTML = P.autores.map((a, i) => `<span class="escolhido">${esc(a.n)}<button data-tira="${i}">×</button></span>`).join(''); };
    pinta();
    $('#edEsc', f.f).onclick = (e) => { const b = e.target.closest('[data-tira]'); if (b) { P.autores.splice(+b.dataset.tira, 1); pinta(); } };
    const add = (n) => { const kb = Lia.acharAutorKB(n); const nn = kb ? kb.n : n; if (!P.autores.some((x) => norm(x.n) === norm(nn))) P.autores.push({ n: nn, id: kb ? kb.id : '' }); pinta(); };
    autocompletar($('#edAut', f.f), $('#edSug', f.f), async (q) => {
      const loc = KB.AUTORES.filter((a) => Lia.casaTexto(q, a.n) >= 0.6).slice(0, 5).map((a) => ({ n: a.n, sub: a.pais }));
      let web = [];
      try { web = (await Fontes.openlibrary.autores(q)).slice(0, 5).map((a) => ({ n: a.n, sub: a.obras + ' obras' })); } catch (e) { /* offline */ }
      return [...loc, ...web.filter((w) => !loc.some((l) => norm(l.n) === norm(w.n)))];
    }, (it) => add(it.n), (it) => `<span class="mini">${esc(iniciais(it.n))}</span><span><b>${esc(it.n)}</b><small>${esc(it.sub || '')}</small></span>`, add);
  }
  async function trocarSenha() {
    const f = abrirFolha(`<h2>Trocar senha</h2><form id="fTs"><div class="campo"><label>Senha atual</label><input name="a" type="password" autocomplete="current-password"></div><div class="campo"><label>Nova senha</label><input name="n" type="password" autocomplete="new-password"></div><p class="erro-msg" id="tsErro"></p><button class="btn pri bloco">Trocar</button></form>`);
    $('#fTs', f.f).onsubmit = async (e) => {
      e.preventDefault();
      try {
        const r = await Nuvem.trocarSenha(contas[contaId].token, e.target.a.value, e.target.n.value);
        if (r.erro) { $('#tsErro', f.f).textContent = r.erro === 'senha_errada' ? 'Senha atual errada.' : r.erro === 'senha_curta' ? 'A nova senha precisa de 3 caracteres.' : 'Entre de novo e tente.'; return; }
        fecharFolha(f); toast('Senha trocada.');
      } catch (er) { $('#tsErro', f.f).textContent = 'Sem conexão.'; }
    };
  }
  async function excluirConta() {
    if (!(await confirmar('Excluir sua conta?', 'Isso apaga seu perfil, estante e progresso da nuvem. Não dá para desfazer.', 'Continuar', 'Cancelar', true))) return;
    const c = contas[contaId];
    if (c.local) { delete contas[contaId]; salvarContas(); LS.del(kDados(contaId)); contaId = null; S = null; location.hash = '#entrar'; return; }
    const f = abrirFolha(`<h2>Confirme com a senha</h2><form id="fEx"><div class="campo"><input name="s" type="password" autofocus></div><p class="erro-msg" id="exErro"></p><button class="btn bloco" style="background:var(--erro);color:#fff;border:0">Excluir de vez</button></form>`);
    $('#fEx', f.f).onsubmit = async (e) => {
      e.preventDefault();
      try {
        const r = await Nuvem.excluir(c.token, e.target.s.value);
        if (r.erro) { $('#exErro', f.f).textContent = 'Senha errada.'; return; }
        listaNuvem = listaNuvem.filter((p) => p.id !== contaId); LS.set(K_LISTA, listaNuvem);
        delete contas[contaId]; salvarContas(); LS.del(kDados(contaId)); contaId = null; S = null;
        fecharFolha(f); location.hash = '#entrar';
      } catch (er) { $('#exErro', f.f).textContent = 'Sem conexão.'; }
    };
  }
  async function salvarNaNuvem() {
    const c = contas[contaId];
    try {
      const r = await Nuvem.criar(c.nome, c.senhaLocal || prompt('Escolha uma senha para a nuvem') || '', S);
      if (r.erro) return toast(r.erro === 'nome_existe' ? 'Já existe uma conta com esse nome na nuvem.' : 'Não deu para salvar.');
      const velho = contaId;
      contas[r.id] = { nome: r.nome, token: r.token, versao: r.versao };
      delete contas[velho]; salvarContas();
      LS.set(kDados(r.id), S); LS.del(kDados(velho));
      contaId = r.id; LS.set(K_ATUAL, r.id);
      toast('Conta salva na nuvem.'); telaPerfil();
    } catch (e) { toast(e.semFuncoes ? 'O servidor ainda não foi configurado.' : 'Sem conexão com a nuvem.'); }
  }

  /* ================= LEITOR ================= */
  let leitorAberto = null;
  const secLeitor = $('#leitor');
  // marca no <body> quando o leitor está na tela: a tela de trás para de desenhar (só muda ao abrir/fechar,
  // diferente de um seletor :has, que o navegador reavaliava a cada virada de página)
  new MutationObserver(() => document.body.classList.toggle('lendo', !secLeitor.hidden)).observe(secLeitor, { attributes: true, attributeFilter: ['hidden'] });
  /* tela cheia "baixando o livro" com barra: o livro só abre depois de baixado e conferido */
  function telaBaixandoLivro(t) {
    secLeitor.hidden = false;
    secLeitor.innerHTML = `<div class="carregando baixa-livro" style="color:#EDE6DA"><img src="img/logo.svg" alt="" width="56"><span id="blTit">Baixando "${esc(t)}"…</span><div class="barra-prog"><i id="blBarra" style="width:3%"></i></div><small id="blTxt">Preparando o livro para ler e ouvir, mesmo sem internet</small></div>`;
    let falso = 3, tm = setInterval(() => { falso = Math.min(88, falso + (90 - falso) * 0.04); const b = $('#blBarra'); if (b && !b.dataset.real) b.style.width = falso + '%'; }, 250);
    return {
      prog: (p, n) => { const b = $('#blBarra'); if (b && p > 0) { b.dataset.real = 1; b.style.width = Math.max(3, Math.round(p * 100)) + '%'; } const x = $('#blTxt'); if (x && n) x.textContent = (n / 1048576).toFixed(1) + ' MB'; },
      texto: (s) => { const x = $('#blTit'); if (x) x.textContent = s; },
      fim: () => { clearInterval(tm); const b = $('#blBarra'); if (b) b.style.width = '100%'; },
      fechar: () => { clearInterval(tm); secLeitor.hidden = true; secLeitor.innerHTML = ''; },
    };
  }
  /* o arquivo salvo é uma página de bloqueio/erro e não o livro? (downloads antigos, antes da conferência) */
  const livroInvalido = (L) => {
    const txt = (L.amostra || '').slice(0, 4000) + ' ' + ((L.meta && L.meta.titulo) || '');
    return Fontes.ehBloqueio(txt) || ((L.palavras || 0) < 20 && !L.caps.some((c) => /<img/.test(c.html)));
  };
  async function abrirLivro(l, op = {}) {
    let item = S.estante[l.id];
    const src = fonteDe(item) || fonteDe(l);
    let tela = null;
    const baixar = async (forcar, msg) => {
      tela = tela || telaBaixandoLivro((item || l).t);
      if (msg) tela.texto(msg);
      const ok = await baixarParaEstante({ ...(item || {}), ...l, src, livre: true }, null, forcar, tela.prog);
      if (!ok) { tela.fechar(); tela = null; return false; }
      item = S.estante[l.id];
      return true;
    };
    if (!item || !item.baixado) {
      if (!src && !(item && item.imp)) return abrirDetalhe(l);
      if (!await baixar(false)) return;
    }
    let blob = (await Banco.get('arquivos', l.id)) || memArquivos.get(l.id);
    // livro do acervo livre sem o arquivo neste aparelho (estante veio da nuvem, ou o celular limpou o espaço): baixa de novo sozinho
    if (!blob && src) {
      if (!await baixar(true, `Baixando "${item.t}" neste aparelho…`)) return;
      blob = (await Banco.get('arquivos', l.id)) || memArquivos.get(l.id);
      if (!blob) { if (tela) tela.fechar(); toast('Não consegui baixar o livro agora. Confira a internet e tente de novo.', 4500); return; }
    }
    if (!blob) { item.baixado = false; salvar(); toast('Este é um ebook que você importou em outro aparelho. Importe o arquivo aqui também para ler.', 5000); return; }
    if (tela) tela.fim();
    secLeitor.hidden = false;
    if (!tela) secLeitor.innerHTML = `<div class="carregando" style="color:#EDE6DA"><img src="img/logo.svg" alt="" width="56"><span>Abrindo "${esc(item.t)}"…</span></div>`;
    else tela.texto(`Abrindo "${item.t}"…`);
    const nomeArq = () => item.arquivo || (l.id.replace(/[^a-z0-9]/gi, '_') + '.epub');
    let L;
    try {
      L = await Formatos.abrir(blob, nomeArq());
      // veio uma página de bloqueio no lugar do livro: apaga e baixa de novo (com a conferência nova), sem mostrar o erro
      if (src && livroInvalido(L)) {
        memArquivos.delete(l.id);
        try { await Banco.del('arquivos', l.id); } catch (er) { /* já não estava */ }
        if (!await baixar(true, `Baixando "${item.t}" de novo…`)) return;
        blob = (await Banco.get('arquivos', l.id)) || memArquivos.get(l.id);
        tela.fim(); tela.texto(`Abrindo "${item.t}"…`);
        L = await Formatos.abrir(blob, nomeArq());
        // só recusa se ainda for página de bloqueio; livro curto ou com pouco texto abre normalmente
        if (Fontes.ehBloqueio((L.amostra || '').slice(0, 4000) + ' ' + ((L.meta && L.meta.titulo) || ''))) throw Object.assign(new Error('invalido'), { amigavel: 'A biblioteca deste livro está fora do ar agora. Tente de novo daqui a pouco.' });
      }
    } catch (e) {
      if (tela) tela.fechar();
      secLeitor.hidden = true; secLeitor.innerHTML = '';
      toast(e.amigavel || 'Não consegui abrir este livro.', 4500); return;
    }
    toast.t && clearTimeout(toast.t); $('#toast').hidden = true;
    // completa dados do livro com o que veio do arquivo
    if (!item.pal) item.pal = L.palavras;
    if (!item.a && L.meta.autor) { const kb = Lia.acharAutorKB(L.meta.autor); item.a = kb ? kb.n : L.meta.autor; item.aid = kb ? kb.id : ''; }
    if ((!item.capa || item.src && item.src.startsWith('ws:')) && L.capa && !item.capa) { await Banco.set('capas', l.id, await reduzirImagem(L.capa, 600)); item.capa = 'idb:' + l.id; }
    if (item.status === 'novo' || item.status === 'quero' || !item.status) item.status = 'lendo';
    item.ultimo = Date.now();
    Lia.aprender(S, 'abriu', item);
    salvar();
    leitorAberto = { item, L, limpo: false };
    history.pushState({ lcLeitor: 1 }, '');
    montarLeitor(item);
    const corpo = $('#ltCorpo');
    await Leitor.abrir(L, item, corpo, {
      cfg: S.cfg.leitura, posicao: op.posicao || item.prog || null, marcas: S.marcas[item.id] || [], marcadores: S.marcadores[item.id] || [], ppm: S.ppm,
      aoMudar: atualizarRodapeLeitor,
      aoSalvar: (p) => { item.prog = { ...p, ts: Date.now() }; item.ultimo = Date.now(); if (p.ppm) S.ppm = p.ppm; if (p.pct > 0.1 && !item._l10) { item._l10 = 1; Lia.aprender(S, 'leu10', item); } salvar(); },
      aoTempo: (seg) => { const d = hojeISO(); S.stats.dias[d] = (S.stats.dias[d] || 0) + seg; item.tempo = (item.tempo || 0) + seg; },
      aoMarcadores: (m) => { S.marcadores[item.id] = m; salvar(); },
      aoMarcas: (m) => { S.marcas[item.id] = m; salvar(); },
      aoMeio: () => alternarLimpo(),
      aoFim: () => mostrarFim(item),
      aoTocarTexto: (e) => {
        if (!Narrador.estado.ativo) return false;
        const p = Leitor.offsetNoPonto(e.clientX, e.clientY);
        if (!p) return false;
        Narrador.tocar(p.c, p.o);
        return true;
      },
    });
    Narrador.definirMidia({ titulo: item.t, autor: item.a, capa: capaSrc(item) });
    Narrador.configurar({ ...S.cfg.voz, lang: idiomaVoz(item.l), livro: item.id }, { texto: (c) => Leitor.textoCapitulo(c), ncaps: () => (Leitor.livro ? Leitor.livro.caps.length : 0) });
    prepararPular(item);
    $('#ltPular').onclick = pularIntroducao;
    if (op.ouvir) setTimeout(iniciarNarracao, 300);
    else if (!LS.get('lc-dica-virar')) { LS.set('lc-dica-virar', 1); toast('Toque nas bordas ou arraste para virar a página. Toque no meio para esconder os botões.', 5000); }
  }
  const idiomaVoz = (l) => ({ pt: 'pt-BR', en: 'en-US', es: 'es-ES', fr: 'fr-FR', it: 'it-IT', de: 'de-DE' }[l || 'pt'] || 'pt-BR');
  function montarLeitor(item) {
    secLeitor.className = 'leitor';
    secLeitor.innerHTML = `
      <header class="lt-topo"><button class="icobtn" data-lt="fechar" aria-label="Voltar">${ico('voltar')}</button>
        <div class="titulo"><b>${esc(item.t)}</b><small id="ltCap"></small></div>
        <button class="icobtn" data-lt="sumario" aria-label="Sumário e marcadores">${ico('sumario')}</button>
        <button class="icobtn" data-lt="ajustes" aria-label="Letra, papel e brilho">${ico('aa')}</button>
        <button class="icobtn" data-lt="narrar" aria-label="Ouvir narração">${ico('fone')}</button>
        <button class="icobtn" data-lt="marcador" id="ltMarc" aria-label="Marcar página">${ico('marcador')}</button></header>
      <div class="lt-corpo" id="ltCorpo"></div>
      <button class="lt-pular" id="ltPular" hidden>${ico('frente')} Pular introdução</button>
      <div class="lt-narra" id="ltNarra" hidden>
        <span class="ondas" id="ltOndas"><i></i><i></i><i></i><i></i></span>
        <div class="voz-nome"><b id="ltVoz">Narração</b><small id="ltVozSub"></small></div>
        <button class="icobtn" data-lt="tras" aria-label="Frase anterior">${ico('tras')}</button>
        <button class="icobtn play" data-lt="play" id="ltPlay" aria-label="Pausar">${ico('pausa')}</button>
        <button class="icobtn" data-lt="frente" aria-label="Próxima frase">${ico('frente')}</button>
        <button class="vel" data-lt="vel" id="ltVel">1x</button>
        <button class="icobtn" data-lt="vozmenu" aria-label="Voz, timer e recomeçar">${ico('menu')}</button>
        <button class="icobtn" data-lt="parar" aria-label="Parar narração">${ico('fechar')}</button>
      </div>
      <footer class="lt-rodape"><input type="range" id="ltProg" min="0" max="1000" value="0" aria-label="Progresso do livro"><div class="info"><span id="ltPag"></span><span id="ltFalta"></span></div></footer>`;
    secLeitor.onclick = (e) => {
      const b = e.target.closest('[data-lt]');
      if (!b) return;
      const a = b.dataset.lt;
      if (a === 'fechar') fecharLeitor();
      else if (a === 'sumario') painelSumario();
      else if (a === 'ajustes') painelAjustes();
      else if (a === 'narrar') { if (Narrador.estado.ativo) painelNarracao(); else iniciarNarracao(); }
      else if (a === 'marcador') { const marcou = Leitor.alternarMarcador(); toast(marcou ? 'Página marcada.' : 'Marcador removido.'); }
      else if (a === 'play') { const e2 = Narrador.estado; if (e2.tocando) Narrador.pausar(); else Narrador.continuar(); }
      else if (a === 'tras') Narrador.pular(-1);
      else if (a === 'frente') Narrador.pular(1);
      else if (a === 'parar') Narrador.parar();
      else if (a === 'vozmenu') painelNarracao();
      else if (a === 'vel') { const vs = [0.75, 0.9, 1, 1.15, 1.3, 1.5, 1.75, 2]; const i = vs.findIndex((v) => v >= S.cfg.voz.vel - 0.01); S.cfg.voz.vel = vs[(i + 1) % vs.length]; Narrador.ajustar({ vel: S.cfg.voz.vel }); salvar(); atualizarBarraNarracao(); }
    };
    const prog = $('#ltProg');
    prog.oninput = () => { prog.style.setProperty('--v', prog.value / 10 + '%'); $('#ltPag').textContent = Math.round(prog.value / 10) + '%'; };
    prog.onchange = () => Leitor.irParaPct(prog.value / 1000);
  }
  /* "Pular introdução": aparece enquanto a página está antes do início da história */
  let inicioHist = null;
  async function conferirPular() {
    const bt = $('#ltPular');
    if (!bt || !Leitor.aberto || !Leitor.livro) return;
    const ini = inicioHist && inicioHist.id === (leitorAberto && leitorAberto.item.id) ? inicioHist.r : null;
    if (!ini || inicioHist.feito) { bt.hidden = true; return; }
    const p = Leitor.pos;
    const antes = p.c < ini.c || (p.c === ini.c && Leitor.posicaoAtual().o + 40 < ini.o);
    bt.hidden = !antes;
  }
  async function prepararPular(item) {
    inicioHist = null;
    const r = await Leitor.inicioDaHistoria().catch(() => null);
    // só vale a pena se houver uma introdução de verdade para pular
    if (r && (r.c > 0 || r.o > 100)) inicioHist = { id: item.id, r, feito: false };
    conferirPular();
  }
  async function pularIntroducao() {
    if (!inicioHist) return;
    const { c, o } = inicioHist.r;
    const narrando = Narrador.estado.ativo && Narrador.estado.tocando;
    await Leitor.irPara(c, o);
    inicioHist.feito = true;
    if (narrando) Narrador.tocar(c, o);
    $('#ltPular').hidden = true;
    toast('Pronto: começo da história.', 2000);
  }
  function atualizarRodapeLeitor(r) {
    if (!leitorAberto) return;
    conferirPular();
    const prog = $('#ltProg');
    if (prog && document.activeElement !== prog) { prog.value = Math.round(r.pct * 1000); prog.style.setProperty('--v', r.pct * 100 + '%'); }
    const pag = $('#ltPag');
    if (pag) pag.textContent = `Pág. ${r.pag} de ${r.medindoTudo ? '~' : ''}${r.tot} · ${Math.round(r.pct * 100)}%`;
    const fa = $('#ltFalta');
    if (fa) fa.textContent = r.pct >= 0.999 ? 'Fim' : `Faltam ${fmtMin(r.minLivro)} · ${fmtMin(r.minCap)} no capítulo`;
    const cap = $('#ltCap');
    if (cap) cap.textContent = r.cap || '';
    const m = $('#ltMarc');
    if (m) { m.innerHTML = ico(r.marcado ? 'marcadorCheio' : 'marcador'); m.classList.toggle('ativo', r.marcado); }
  }
  function alternarLimpo(forcar) {
    if (!leitorAberto) return;
    leitorAberto.limpo = forcar !== undefined ? forcar : !leitorAberto.limpo;
    secLeitor.classList.toggle('limpo', leitorAberto.limpo);
  }
  function fecharLeitor(peloVoltar) {
    if (!leitorAberto) return;
    Narrador.parar();
    Leitor.fechar();
    fecharMenuSel();
    const item = leitorAberto.item;
    leitorAberto = null;
    secLeitor.hidden = true; secLeitor.innerHTML = '';
    salvar(true);
    if (!peloVoltar && history.state && history.state.lcLeitor) history.back();
    if (rotaAtual.split('/')[0] === 'inicio' || rotaAtual === '') telaInicio();
    else if (rotaAtual.startsWith('estante')) telaEstante(rotaAtual.split('/')[1]);
    void item;
  }
  function mostrarFim(item) {
    const corpo = $('#ltCorpo');
    if (!corpo || corpo.querySelector('.fim-livro')) return;
    if (item.status !== 'lido') { item.status = 'lido'; item.fim = Date.now(); Lia.aprender(S, 'terminou', item); salvar(); }
    const d = document.createElement('div');
    d.className = 'fim-livro';
    d.innerHTML = `<div style="font-size:42px">📖</div><h2>Você terminou!</h2><p style="opacity:.85;margin:0 0 18px">"${esc(item.t)}"${item.a ? ', de ' + esc(item.a) : ''}. Gostou?</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><button class="btn pri" data-fim="curtiu">${ico('coracao')} Amei</button><button class="btn" data-fim="descurtiu">Não muito</button><button class="btn fant" data-fim="fechar" style="color:#fff">Voltar ao livro</button></div><div id="fimSug" style="margin-top:22px;text-align:left;max-width:640px"></div>`;
    corpo.appendChild(d);
    d.onclick = (e) => {
      const b = e.target.closest('[data-fim]');
      if (b) {
        if (b.dataset.fim === 'fechar') return d.remove();
        item.gostou = b.dataset.fim === 'curtiu';
        Lia.aprender(S, b.dataset.fim, item); salvar(); LS.del(kPrat(contaId));
        toast(b.dataset.fim === 'curtiu' ? 'Anotado! Vou indicar mais livros assim.' : 'Anotado. Vou ajustar as indicações.');
      }
      const lv = e.target.closest('[data-livro]');
      if (lv) { fecharLeitor(); setTimeout(() => abrirDetalhe(REG.get(lv.dataset.livro)), 300); }
    };
    Lia.parecidos(item, S, 8).then((ps) => { const el = $('#fimSug', d); if (el && ps.length) { el.innerHTML = '<h3 style="font:600 18px var(--f-tit);margin:0 0 8px">Próxima leitura</h3>' + prateleira(ps, { gratis: true }); } }).catch(() => null);
  }

  /* ---------- painéis do leitor ---------- */
  function painelSumario(aba = 'caps') {
    const L = Leitor.livro;
    if (!L) return;
    const pos = Leitor.pos;
    const mks = Leitor.marcadores, dts = Leitor.marcas;
    const abas = `<div class="abas" style="margin:4px 0 10px;padding:0">${[['caps', 'Capítulos'], ['marc', `Marcadores (${mks.length})`], ['dest', `Destaques (${dts.length})`], ['busca', 'Buscar']].map(([k, n]) => `<button class="aba" data-aba="${k}" aria-selected="${k === aba}">${n}</button>`).join('')}</div>`;
    let corpo = '';
    if (aba === 'caps') corpo = `<div class="toc-lista">${L.toc.map((t) => `<button data-ircap="${t.cap}" data-anc="${esc(t.ancora)}" class="${t.cap === pos.c ? 'atual' : ''}" style="padding-left:${10 + t.nivel * 16}px"><span>${esc(t.titulo)}</span></button>`).join('')}</div>`;
    if (aba === 'marc') corpo = mks.length ? mks.map((m) => `<button class="item-marca" data-irc="${m.c}" data-iro="${m.o}" style="--c:#C2424E"><small>Pág. ${m.pag} · ${esc(m.cap || '')} · ${m.pct}%</small><q>${esc(m.txt)}</q></button>`).join('') : '<div class="vazio">Toque no ícone de marcador no topo para marcar a página.</div>';
    if (aba === 'dest') corpo = dts.length ? dts.map((m, i) => `<div style="position:relative"><button class="item-marca" data-irc="${m.c}" data-iro="${m.i}" style="--c:${{ amarelo: '#E9B24E', verde: '#5BBF85', rosa: '#E58399', azul: '#6FA8F0' }[m.cor] || '#E9B24E'}"><small>${esc(m.cap || '')}</small><q>${esc(m.txt)}</q>${m.nota ? `<small>Nota: ${esc(m.nota)}</small>` : ''}</button><button class="icobtn" data-tirar="${i}" style="position:absolute;right:4px;top:4px" aria-label="Apagar destaque">${ico('lixo')}</button></div>`).join('') : '<div class="vazio">Selecione um trecho do texto para destacar com cores.</div>';
    if (aba === 'busca') corpo = `<form id="fBl" class="busca" style="margin:0 0 12px">${ico('busca')}<input name="q" placeholder="Palavra ou frase" autofocus autocomplete="off"></form><div id="resBl"></div>`;
    const f = abrirFolha(`<h2>${esc(L.meta.titulo || leitorAberto.item.t)}</h2>${abas}${corpo}`);
    f.f.onclick = async (e) => {
      const ab = e.target.closest('[data-aba]');
      if (ab) { removerFolha(f); history.back(); setTimeout(() => painelSumario(ab.dataset.aba), 60); return; }
      const c = e.target.closest('[data-ircap]');
      if (c) { fecharFolha(f); const anc = c.dataset.anc; if (anc) Leitor.irParaAlvo(L.caps[+c.dataset.ircap].path + '#' + anc); else Leitor.irPara(+c.dataset.ircap, 0); return; }
      const m = e.target.closest('[data-irc]');
      if (m) { fecharFolha(f); Leitor.irPara(+m.dataset.irc, +m.dataset.iro); return; }
      const t = e.target.closest('[data-tirar]');
      if (t) { Leitor.removerMarca(+t.dataset.tirar); removerFolha(f); history.back(); setTimeout(() => painelSumario('dest'), 60); }
    };
    if (aba === 'caps') setTimeout(() => { const a = f.f.querySelector('.atual'); if (a) a.scrollIntoView({ block: 'center' }); }, 120);
    if (aba === 'busca') {
      $('#fBl', f.f).onsubmit = async (e) => {
        e.preventDefault();
        const q = e.target.q.value.trim();
        const el = $('#resBl', f.f);
        el.innerHTML = '<span class="spinner"></span>';
        const r = await Leitor.buscarNoLivro(q);
        el.innerHTML = r.length ? `<p style="color:var(--tx3);font-size:13px">${plural(r.length, '1 resultado', '# resultados')}</p>` + r.map((x) => `<button class="item-marca" data-irc="${x.c}" data-iro="${x.o}"><small>${esc(x.cap)}</small><span>${esc(x.trecho).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), (m) => `<b style="color:var(--ouro)">${m}</b>`)}</span></button>`).join('') : '<div class="vazio">Nada encontrado.</div>';
      };
    }
  }
  function painelAjustes() {
    const c = S.cfg.leitura;
    const FONTES = [['literata', 'Literata', "'Literata'"], ['lora', 'Lora', "'Lora'"], ['georgia', 'Georgia', 'Georgia'], ['atkinson', 'Atkinson', "'Atkinson Hyperlegible'"], ['fraunces', 'Fraunces', "'Fraunces'"], ['manrope', 'Manrope', "'Manrope'"]];
    const TEMAS = [['papel', 'Papel', '#F5EDDF', '#2B241D'], ['branco', 'Branco', '#FBF9F4', '#1F1B17'], ['sepia', 'Sépia', '#EBDAB9', '#3A2C1B'], ['cinza', 'Cinza', '#DCD9D2', '#26241F'], ['noite', 'Noite', '#1D1B21', '#D8D0C3'], ['preto', 'Preto', '#000', '#C9C2B6']];
    const seg = (id, ops, v) => `<div class="seg" data-seg="${id}">${ops.map(([k, n]) => `<button data-v="${k}" aria-pressed="${v === k}">${n}</button>`).join('')}</div>`;
    const f = abrirFolha(`<h2>Leitura</h2>
      <div class="ajuste"><div class="rot">Fonte</div><div class="fontes-op">${FONTES.map(([k, n, fam]) => `<button data-fonte="${k}" aria-pressed="${c.fonte === k}" style="font-family:${fam}">Aa<small>${n}</small></button>`).join('')}</div></div>
      <div class="ajuste"><label>Tamanho <span id="ajTamV">${c.tam}px</span></label><input type="range" data-aj="tam" min="14" max="32" step="1" value="${c.tam}"></div>
      <div class="ajuste"><label>Espaço entre linhas <span id="ajEntreV">${c.entre}</span></label><input type="range" data-aj="entre" min="1.25" max="2.1" step="0.05" value="${c.entre}"></div>
      <div class="ajuste"><div class="rot">Papel</div><div class="temas-papel">${TEMAS.map(([k, n, bg, tx]) => `<button data-tema="${k}" aria-pressed="${c.tema === k}" style="background:${bg};color:${tx}" title="${n}">Aa</button>`).join('')}</div></div>
      <div class="linha-op"><span>Textura de papel</span><label class="interruptor"><input type="checkbox" id="ajTex" ${c.textura ? 'checked' : ''}><span></span></label></div>
      <div class="ajuste"><label>${ico('sol')} Brilho <span id="ajBrilhoV">${c.brilho}%</span></label><input type="range" data-aj="brilho" min="30" max="100" step="1" value="${c.brilho}"></div>
      <div class="ajuste"><label>${ico('lua')} Luz quente (descanso dos olhos) <span id="ajQuenteV">${c.quente}%</span></label><input type="range" data-aj="quente" min="0" max="100" step="1" value="${c.quente}"></div>
      <div class="linha-op"><span>Margens</span>${seg('margem', [['estreita', 'Estreita'], ['media', 'Média'], ['larga', 'Larga']], c.margem)}</div>
      <div class="linha-op"><span>Alinhamento</span>${seg('alinha', [['justificado', 'Justificado'], ['esquerda', 'À esquerda']], c.alinha)}</div>
      <div class="linha-op"><span>Virar página</span>${seg('virar', [['folha', 'Folha 3D'], ['deslizar', 'Deslizar'], ['nenhum', 'Direto']], c.virar)}</div>
      <div class="linha-op"><span>Páginas na tela</span>${seg('duas', [['auto', 'Auto'], ['uma', 'Uma'], ['duas', 'Duas']], c.duas)}</div>`);
    const aplicar = (novo) => { Object.assign(S.cfg.leitura, novo); Leitor.ajustar(novo); salvar(); };
    $$('input[type=range]', f.f).forEach((r) => {
      const pinta = () => { r.style.setProperty('--v', ((r.value - r.min) / (r.max - r.min)) * 100 + '%'); const k = r.dataset.aj; const el = $('#aj' + k[0].toUpperCase() + k.slice(1) + 'V', f.f); if (el) el.textContent = r.value + (k === 'tam' ? 'px' : k === 'entre' ? '' : '%'); };
      pinta();
      r.oninput = () => { pinta(); if (r.dataset.aj === 'brilho' || r.dataset.aj === 'quente') aplicar({ [r.dataset.aj]: +r.value }); };
      r.onchange = () => { if (r.dataset.aj !== 'brilho' && r.dataset.aj !== 'quente') aplicar({ [r.dataset.aj]: +r.value }); };
    });
    $('#ajTex', f.f).onchange = (e) => aplicar({ textura: e.target.checked });
    f.f.addEventListener('click', (e) => {
      const fo = e.target.closest('[data-fonte]');
      if (fo) { aplicar({ fonte: fo.dataset.fonte }); $$('[data-fonte]', f.f).forEach((x) => x.setAttribute('aria-pressed', String(x === fo))); }
      const te = e.target.closest('[data-tema]');
      if (te) { aplicar({ tema: te.dataset.tema }); $$('[data-tema]', f.f).forEach((x) => x.setAttribute('aria-pressed', String(x === te))); }
      const sb = e.target.closest('[data-seg] button');
      if (sb) { const k = sb.parentElement.dataset.seg; aplicar({ [k]: sb.dataset.v }); $$('button', sb.parentElement).forEach((x) => x.setAttribute('aria-pressed', String(x === sb))); }
    });
  }

  /* ---------- narração ---------- */
  Narrador.on('palavra', (d) => { if (leitorAberto) Leitor.mostrarDestaque(d.c, d.i, d.f, d.frase); });
  Narrador.on('parou', () => { if (leitorAberto) Leitor.limparDestaque(); atualizarBarraNarracao(); });
  Narrador.on('estado', () => atualizarBarraNarracao());
  Narrador.on('erro', (m) => toast(m, 4500));
  Narrador.on('baixandoVoz', (d) => toast(
    d.falhou ? `Não consegui baixar a voz ${d.nome} (${d.motivo}). Toque em Ouvir de novo para tentar outra vez; o download continua de onde parou.`
      : d.fim ? `Voz ${d.nome} pronta. A narração começa agora, e a voz fica guardada para usar offline.`
        : `Baixando a voz ${d.nome} (só na primeira vez): ${Math.round(d.pct * 100)}%. A narração começa quando terminar.`,
    d.falhou ? 6000 : d.fim ? 3500 : 60000));
  Narrador.on('dormiu', () => toast('Timer de dormir: narração pausada. Boa noite!', 4000));
  Narrador.on('fim', () => { if (leitorAberto) mostrarFim(leitorAberto.item); });
  async function iniciarNarracao() {
    if (!leitorAberto) return;
    const lang = idiomaVoz(leitorAberto.item.l);
    let v = await Narrador.acharVoz(S.cfg.voz.voz);
    if (!v || (v.lang || '').slice(0, 2) !== lang.slice(0, 2)) {
      const p = await Narrador.vozPadrao(lang);
      if (p) { Narrador.ajustar({ voz: p, lang }); if (!S.cfg.voz.voz || lang.startsWith('pt')) { S.cfg.voz.voz = p; salvar(); } }
    }
    let pos = Leitor.posicaoAtual();
    // depois de "Pular introdução", a narração começa no início da história mesmo que ele esteja no meio da página
    if (inicioHist && inicioHist.feito && inicioHist.id === leitorAberto.item.id && pos.c === inicioHist.r.c && pos.o <= inicioHist.r.o) pos = { ...inicioHist.r };
    alternarLimpo(false);
    await Narrador.tocar(pos.c, pos.o);
    if (!LS.get('lc-dica-narra')) { LS.set('lc-dica-narra', 1); toast('Toque numa palavra para a narração continuar dali.', 4500); }
  }
  async function atualizarBarraNarracao() {
    const bar = $('#ltNarra');
    if (!bar) return;
    const e = Narrador.estado;
    bar.hidden = !e.ativo;
    if (!e.ativo) return;
    $('#ltPlay').innerHTML = ico(e.tocando ? 'pausa' : 'play');
    $('#ltPlay').setAttribute('aria-label', e.tocando ? 'Pausar' : 'Continuar');
    $('#ltOndas').classList.toggle('parado', !e.tocando);
    $('#ltVel').textContent = String(S.cfg.voz.vel).replace('.', ',') + 'x';
    const v = await Narrador.acharVoz(Narrador.cfg.voz);
    $('#ltVoz').textContent = v ? v.nome : 'Narração';
    const est = Narrador.ESTILOS.find((s) => s.id === S.cfg.voz.estilo);
    $('#ltVozSub').textContent = [est && est.id !== 'natural' ? est.nome : '', e.dormirAte ? `dorme em ${fmtMin((e.dormirAte - Date.now()) / 60000)}` : e.dormirFimCap ? 'dorme no fim do capítulo' : ''].filter(Boolean).join(' · ') || (v && v.motor === 'piper' ? 'voz aberta, offline' : 'voz do aparelho');
  }
  function painelNarracao() {
    if (!leitorAberto) return;
    const e = Narrador.estado;
    const f = abrirFolha(`<h2>Narração</h2>
      <div class="ajuste"><div class="rot">Recomeçar</div><div class="chips"><button class="chip" data-n="daqui">${ico('play')} Desta página</button><button class="chip" data-n="cap">${ico('reiniciar')} Começo do capítulo</button><button class="chip" data-n="livro">${ico('reiniciar')} Começo do livro</button></div></div>
      <div class="ajuste"><div class="rot">Timer para dormir</div><div class="chips">${[[0, 'Desligado'], [10, '10 min'], [20, '20 min'], [30, '30 min'], [45, '45 min'], [60, '1 hora'], ['cap', 'Fim do capítulo']].map(([v, n]) => `<button class="chip" data-dormir="${v}" aria-pressed="${(v === 'cap' && e.dormirFimCap) || (v === 0 && !e.dormirAte && !e.dormirFimCap)}">${n}</button>`).join('')}</div></div>
      <div id="vozesLeitor"><span class="spinner"></span></div>`, { larga: true });
    pintarVozes($('#vozesLeitor', f.f), idiomaVoz(leitorAberto.item.l), () => atualizarBarraNarracao());
    f.f.addEventListener('click', async (ev) => {
      const n = ev.target.closest('[data-n]');
      if (n) {
        const k = n.dataset.n;
        if (k === 'daqui') { fecharFolha(f); iniciarNarracao(); }
        if (k === 'cap') { if (await confirmar('Recomeçar o capítulo?', 'A narração e a página voltam para o começo deste capítulo.', 'Recomeçar')) { fecharFolha(f); const c = Leitor.pos.c; await Leitor.irPara(c, 0); Narrador.tocar(c, 0); } }
        if (k === 'livro') { if (await confirmar('Tem certeza que quer recomeçar o livro?', 'Você volta para a primeira página e a narração começa do início. Seu progresso atual é substituído.', 'Sim, recomeçar')) { fecharFolha(f); await Leitor.irPara(0, 0); Narrador.tocar(0, 0); } }
      }
      const d = ev.target.closest('[data-dormir]');
      if (d) { const v = d.dataset.dormir; Narrador.dormir(v === 'cap' ? 'cap' : +v); $$('[data-dormir]', f.f).forEach((x) => x.setAttribute('aria-pressed', String(x === d))); toast(v === '0' ? 'Timer desligado.' : 'Timer ligado.'); }
    });
  }

  /* ---------- menu de seleção (destacar, ouvir, significado) ---------- */
  let menuSel = null, selT = 0;
  function fecharMenuSel() { if (menuSel) { menuSel.remove(); menuSel = null; } }
  document.addEventListener('selectionchange', () => {
    if (!leitorAberto) return;
    clearTimeout(selT);
    selT = setTimeout(() => {
      const sel = Leitor.selecaoAtual();
      fecharMenuSel();
      if (!sel || !sel.txt) return;
      menuSel = document.createElement('div');
      menuSel.className = 'lt-menu-sel';
      menuSel.innerHTML = `${['amarelo', 'verde', 'rosa', 'azul'].map((c) => `<button data-cor="${c}" aria-label="Destacar"><span class="cor mk-${c}"></span>Destacar</button>`).slice(0, 1).join('')}
        <button data-cores>${'<span class="cor" style="background:conic-gradient(#FFD65A 0 25%,#78D296 0 50%,#FF96AF 0 75%,#78B4FF 0)"></span>'}Cores</button>
        <button data-s="nota">${ico('pena')}Nota</button><button data-s="ouvir">${ico('fone')}Ouvir</button>${sel.txt.split(/\s+/).length <= 3 ? `<button data-s="sig">${ico('dicionario')}Significado</button>` : ''}<button data-s="copiar">${ico('copiar')}Copiar</button>`;
      const x = clamp(sel.rect.left + sel.rect.width / 2, 120, innerWidth - 120);
      menuSel.style.left = x + 'px';
      menuSel.style.top = Math.max(70, sel.rect.top - 10) + 'px';
      document.body.appendChild(menuSel);
      menuSel.onpointerdown = (e) => e.preventDefault();
      menuSel.onclick = async (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        const s = Leitor.selecaoAtual() || sel;
        if (b.dataset.cor) { Leitor.destacar(s, b.dataset.cor); fecharMenuSel(); toast('Trecho destacado.'); }
        else if (b.dataset.cores !== undefined) { menuSel.innerHTML = ['amarelo', 'verde', 'rosa', 'azul'].map((c) => `<button data-cor="${c}"><span class="cor mk-${c}"></span>${c[0].toUpperCase() + c.slice(1)}</button>`).join(''); }
        else if (b.dataset.s === 'ouvir') { fecharMenuSel(); getSelection().removeAllRanges(); Narrador.tocar(s.c, s.i); }
        else if (b.dataset.s === 'copiar') { try { await navigator.clipboard.writeText(s.txt); toast('Copiado.'); } catch (er) { toast('Não consegui copiar.'); } fecharMenuSel(); }
        else if (b.dataset.s === 'nota') { fecharMenuSel(); const nota = prompt('Sua nota sobre este trecho:'); if (nota !== null) { Leitor.destacar(s, 'amarelo', nota.trim()); toast('Nota salva.'); } }
        else if (b.dataset.s === 'sig') {
          fecharMenuSel();
          const palavra = s.txt.replace(/[^\p{L}\s-]/gu, '').trim().split(/\s+/)[0];
          const f = abrirFolha(`<h2>${esc(palavra)}</h2><div id="sigDef"><span class="spinner"></span></div>`);
          const defs = await Cerebro.significado(palavra);
          const el = $('#sigDef', f.f);
          if (el) el.innerHTML = defs.length ? `<ul style="line-height:1.6;color:var(--tx2)">${defs.map((d) => `<li>${esc(d)}</li>`).join('')}</ul><p class="aviso-direitos">Fonte: Wikcionário</p>` : '<p style="color:var(--tx2)">Não encontrei no Wikcionário.</p>';
        }
      };
    }, 260);
  });

  /* ================= cliques globais ================= */
  document.addEventListener('click', (e) => {
    const l = e.target.closest('[data-livro]');
    if (l && !e.target.closest('.lt-palco')) { e.preventDefault(); const obj = REG.get(l.dataset.livro) || S.estante[l.dataset.livro]; if (obj) abrirDetalhe(obj); return; }
    const a = e.target.closest('[data-autor]');
    if (a) { e.preventDefault(); const top = pilha[pilha.length - 1]; const nome = a.dataset.autor; if (top) { removerFolha(top); history.back(); setTimeout(() => ir('#autor/' + encodeURIComponent(nome)), 80); } else ir('#autor/' + encodeURIComponent(nome)); return; }
    const ab = e.target.closest('[data-abrir]');
    if (ab) { const it = S.estante[ab.dataset.abrir]; if (it) abrirLivro(it); return; }
    const ou = e.target.closest('[data-ouvir]');
    if (ou) { const it = S.estante[ou.dataset.ouvir]; if (it) abrirLivro(it, { ouvir: true }); return; }
    const irb = e.target.closest('[data-ir]');
    if (irb) ir(irb.dataset.ir);
  });

  /* ================= PWA ================= */
  let pedidoInstalar = null;
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); pedidoInstalar = e; dicaInstalar(); });
  const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ehIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function dicaInstalar() {
    const el = $('#dicaInstalar');
    if (!el || instalado() || LS.get('lc-dica-inst-off')) return;
    if (!pedidoInstalar && !ehIOS()) return;
    el.innerHTML = `<div class="dica-instalar">${ico('instalar')}<p>Instale o LeituCast para abrir como app, em tela cheia e offline.</p><button class="btn sec peq" id="diInst">Instalar</button><button class="icobtn" id="diFechar" aria-label="Fechar">${ico('fechar')}</button></div>`;
    $('#diInst').onclick = instalar;
    $('#diFechar').onclick = () => { LS.set('lc-dica-inst-off', 1); el.innerHTML = ''; };
  }
  addEventListener('appinstalled', () => toast('LeituCast instalado! Procure o ícone na tela inicial ou na lista de apps.', 5000));
  async function instalar() {
    if (instalado()) return toast('O LeituCast já está instalado neste aparelho.');
    if (pedidoInstalar) { pedidoInstalar.prompt(); const r = await pedidoInstalar.userChoice.catch(() => null); if (r && r.outcome === 'accepted') toast('Instalando… o ícone do LeituCast aparece na tela inicial em alguns segundos.', 5000); pedidoInstalar = null; return; }
    if (/android/i.test(navigator.userAgent)) return abrirFolha(`<h2>Instalar no Android</h2><ol style="line-height:1.8;color:var(--tx2);padding-left:20px">
      <li>No <b>Chrome</b>, toque no menu <b>⋮</b> e escolha <b>Instalar app</b> (ou <b>Adicionar à tela inicial</b> e depois <b>Instalar</b>).</li>
      <li>Se aparecer <b>“já instalado”</b> sem ícone, ou <b>“não foi possível instalar”</b>: no Chrome, toque em <b>⋮ › Configurações › Configurações do site › Todos os sites › rykesistemas.com.br › Limpar e redefinir</b>. Feche o Chrome, abra o site de novo e instale.</li>
      <li>Se ainda assim o Android recusar, use <b>⋮ › Adicionar à tela inicial › Criar atalho</b>: o ícone abre o LeituCast do mesmo jeito.</li></ol>
      <p style="color:var(--tx2);font-size:13px">Atenção: limpar os dados do site apaga deste aparelho os livros baixados e os ebooks que você importou. Perfil, estante e progresso voltam quando você entra de novo, se a conta estiver salva na nuvem (Perfil › Salvar na nuvem).</p>`);
    if (ehIOS()) return abrirFolha(`<h2>Instalar no iPhone ou iPad</h2><ol style="line-height:1.9;color:var(--tx2)"><li>Abra este site no <b>Safari</b>.</li><li>Toque em <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b>.</li><li>Toque em <b>Adicionar</b>. Pronto!</li></ol>`);
    abrirFolha(`<h2>Instalar o app</h2><p style="color:var(--tx2);line-height:1.7">No Chrome ou no Edge, abra o menu (⋮ ou …) e escolha <b>Instalar LeituCast</b> ou <b>Adicionar à tela inicial</b>. No computador também aparece um ícone de instalar na barra de endereço.</p>`);
  }
  /* atualização sozinha: o app instalado pode ficar dias aberto em segundo plano com o código antigo.
     Ao voltar para a tela ele confere se há versão nova; quando a nova assume, recarrega (fora do leitor) */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const tinhaControle = !!navigator.serviceWorker.controller;
    let recarregar = false;
    const recarregarSePuder = () => { if (recarregar && !leitorAberto && !document.querySelector('.kid-leitor')) location.reload(); };
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinhaControle && !recarregar) { recarregar = true; recarregarSePuder(); } });
    addEventListener('hashchange', recarregarSePuder);
    addEventListener('load', () => navigator.serviceWorker.register('sw.js').then((reg) => {
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { reg.update().catch(() => null); recarregarSePuder(); } });
      setInterval(() => reg.update().catch(() => null), 30 * 60 * 1000);
    }).catch(() => null));
  }

  /* ================= início ================= */
  montarNav();
  let atual = LS.get(K_ATUAL, null);
  if (!(atual && contas[atual] && (contas[atual].token || contas[atual].local))) {
    const ult = Object.entries(contas).filter(([, c]) => (c.token || c.local) && !c.saiu).sort((a, b) => (b[1].ultimo || 0) - (a[1].ultimo || 0))[0];
    if (ult) { atual = ult[0]; LS.set(K_ATUAL, atual); }
  }
  if (atual && contas[atual] && (contas[atual].token || contas[atual].local)) {
    contaId = atual;
    S = completar(LS.get(kDados(atual), null) || novoEstado(contas[atual].nome));
    logar(atual);
    if (location.hash && location.hash !== '#entrar') setTimeout(rota, 0);
  } else rota();
  window.LC = { get S() { return S; }, get contaId() { return contaId; }, abrirLivro, abrirDetalhe, importar, Leitor, Narrador, Lia, salvar };
})();
