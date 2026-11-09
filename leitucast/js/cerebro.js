/* Chat da Lia: conversa sobre livros, autores, literatura e leitura, do jeito que as pessoas escrevem
   (sem acento, com gíria e erro de digitação), e responde com texto, livros e ações.
   Como funciona:
   1. corrige(): troca palavras com erro de digitação pela palavra conhecida mais próxima.
   2. classificar(): decide a intenção sem usar a rede (testável no treino): conversa, leitura atual,
      tema da base (Saber.TEMAS, pontuado pela raridade das palavras e por frases-chave), livro, autor,
      indicação ou busca. Usa o contexto da conversa ("e dele?", "outra", "sim").
   3. responder(): executa a intenção com a base, o acervo, a web e o livro aberto.
   Os limites vêm de ia-pesos.js, ajustados por ferramentas/treinar-chat.js. */
'use strict';
const Cerebro = (() => {
  const PC = Object.assign({ kbMin: 2.4, kbForte: 4.2, frase: 3, fraseTam: 0.4, parcial: 1.2, kbVsLivro: 1.2, livroMin: 3.2 }, (typeof LIA_PESOS !== 'undefined' && LIA_PESOS.chat) || {});
  const PARADAS = new Set('a o e os as um uma uns umas de do da dos das em no na nos nas por pelo pela pelos pelas para pra pro com sem sobre que se ele ela eles elas eu tu voce vc voces me te nos lhe lhes meu minha seu sua isso isto aquilo esse essa este esta aquele aquela muito mais menos ja nao sim tambem como quando onde qual quais quem ou mas entao foi era ser ter tinha havia ha sao estava esta estao vai vou the of and to in is was he she it his her you that with for on as at by from'.split(' '));
  /* palavras que aparecem em perguntas de qualquer tema e não dizem qual é o assunto */
  const GENERICO = new Set('livro livros ler leitura lendo li quero queria gostaria posso pode consigo da tem ter faz fazer funciona serve vale pena bom boa melhor ruim certo errado app aplicativo lia voce dica dicas sobre fala falar diz dizer explica explicar saber sabe conta contar mim gente coisa algo tipo jeito forma ai aqui agora hoje dia vez'.split(' '));
  const raiz = (w) => (w.length > 4 ? w.replace(/(oes|aes|ais|eis|ns|s)$/, '') : w);
  const toks = (s) => norm(s).split(' ').filter((w) => w && !PARADAS.has(w)).map(raiz);
  const toksKB = (s) => toks(s).filter((w) => !GENERICO.has(w));

  /* ---------------- vocabulário e correção de digitação ---------------- */
  let VOCAB = null;
  const COMUNS = new Set(('quero queria gostaria preciso posso pode devo tenho estou esta estava fazer faco faz fiz como quanto quanta quantos quantas qual quais quando onde porque para pra pro pelo pela tudo todo toda todos todas bem mal ' +
    'muito muita pouco pouca mais menos outra outro outras outros alguma algum nenhum nada sempre nunca ainda agora hoje amanha ontem semana tempo hora horas minutos livro livros leitura ler lendo lido lida lidos ' +
    'obrigado obrigada valeu beleza certo entendi legal show sabe saber falar fala voce ola bom boa dia noite tarde sem com mas porem tambem entao assim isso essa esse este aqui sim nao talvez vez vezes rapido leve ' +
    'facil dificil normal gosto gosta gostei curti adorei amei odiei achei acho seria sendo sou somos sao foi fosse tinha teria quer quis bora vamos cara tipo coisa coisas gente certeza consigo consegue ' +
    'autor autora autores escritor escritora pagina paginas capitulo capitulos final comeco meio historia historias personagem personagens melhor pior favorito favorita ' +
    'acha achou acham pensa pensou falta faltam leio leia terminei comecei parei lendo indica indique tenha tenham sobre').split(' '));
  function vocab() {
    if (VOCAB) return VOCAB;
    const v = new Set();
    const add = (t) => norm(t).split(' ').forEach((w) => { if (w.length >= 4) v.add(w); });
    for (const e of Saber.TEMAS) { e.k.forEach(add); (e.frase || []).forEach(add); add(e.q); }
    for (const a of KB.AUTORES) { add(a.n); (a.al || []).forEach(add); (a.obras || []).forEach((o) => add(o.t)); }
    for (const g of KB.GENEROS) { add(g.nome); g.sin.forEach(add); }
    for (const c of KB.CLASSICOS) add(c.t);
    for (const [, pt] of Saber.TITULOS) add(pt);
    for (const [ks] of Saber.CHAVES) ks.forEach(add);
    'recomenda recomende indica indique sugere sugira sugestao parecido parecidos significa significado resumo resume resumir personagens narrar narracao biografia gratis gratuito curiosidade piada frase citacao terminar progresso continuar marcador destaque brilho'.split(' ').forEach((w) => v.add(w));
    return (VOCAB = v);
  }
  let PROTEGIDAS = null;
  function corrige(txt) {
    const V = vocab();
    // palavras usadas pelas regras de intenção nunca são "corrigidas" (ex.: "aparece", "conversar")
    if (!PROTEGIDAS) PROTEGIDAS = new Set([...Object.values(RX), POSITIVO, NEGATIVO, PERGUNTA].map((r) => r.source).join(' ').match(/[a-z]{4,}/g));
    return norm(txt).split(' ').map((w) => {
      if (w.length < 4 || V.has(w) || COMUNS.has(w) || PROTEGIDAS.has(w) || /\d/.test(w)) return w;
      const max = w.length >= 8 ? 2 : 1;
      let best = null, bd = max + 1;
      for (const x of V) {
        if (Math.abs(x.length - w.length) > max) continue;
        if (x[0] !== w[0] && w.length < 6) continue;
        const d = distancia(w, x, max);
        if (d < bd) { bd = d; best = x; if (d === 1 && w.length < 8) break; }
      }
      return best && bd <= max ? best : w;
    }).join(' ');
  }

  /* ---------------- base de temas ---------------- */
  let IDX = null;
  function indexar() {
    IDX = Saber.TEMAS.map((e) => ({ e, t: new Set([...e.k.flatMap(toksKB), ...toksKB(e.q)]), frases: (e.frase || []).map(norm) }));
    const df = {};
    IDX.forEach((x) => x.t.forEach((w) => { df[w] = (df[w] || 0) + 1; }));
    IDX.forEach((x) => { x.idf = (w) => Math.log(1 + IDX.length / (df[w] || 1)); });
  }
  function buscaSaber(n) {
    if (!IDX) indexar();
    const qt = [...new Set(toksKB(n))];
    const nn = ' ' + n + ' ';
    let best = null, seg = null;
    for (const x of IDX) {
      let s = 0;
      for (const w of qt) if (x.t.has(w)) s += x.idf(w);
      // palavra-chave de várias palavras inteira na frase ("dominio publico", "luz quente")
      for (const k of x.e.k) { const kn = norm(k); if (kn.includes(' ') && nn.includes(' ' + kn + ' ')) s += 0.8 * kn.split(' ').length; }
      const fl = x.frases.filter((f) => nn.includes(' ' + f + ' ')).reduce((m, f) => Math.max(m, f.split(' ').length), 0);
      if (fl) s += PC.frase + PC.fraseTam * fl;
      else {
        // frase-chave quase inteira (2 de 3 palavras) desempata temas parecidos
        let parcial = 0;
        for (const f of x.frases) { const ft = toksKB(f); if (ft.length >= 2) { const q = ft.filter((w) => qt.includes(w)).length / ft.length; if (q >= 0.5 && q > parcial) parcial = q; } }
        s += PC.parcial * parcial;
      }
      const o = { e: x.e, s, frase: fl > 0 };
      if (!best || s > best.s) { seg = best; best = o; } else if (!seg || s > seg.s) seg = o;
    }
    return { best, seg };
  }

  /* ---------------- intenções por padrão ---------------- */
  const RX = {
    saudacao: /^(oi+e?|ola|e ai|eai|bom dia|boa tarde|boa noite|hey|opa|salve|lia)\b/,
    agradece: /\b(obrigad[oa]|valeu|vlw|brigad[oa]|thanks|muito bom|perfeito|adorei a dica|amei a dica|otima dica)\b/,
    tchau: /^(tchau|ate mais|ate logo|ate amanha|falou|fui|bye)\b/,
    ajuda: /\b(o que (voce|vc) (faz|sabe fazer)|o que (eu )?posso (te )?(pedir|perguntar)|o que da pra (te )?(pedir|perguntar|fazer)|o que (eu )?(te )?pergunto|comandos|me ajuda|ajuda|como (voce|vc) pode me ajudar)\b/,
    significado: /\b(o que (significa|quer dizer)|significado d[aeo]|definicao d[aeo]|o que e a palavra|o que e o termo|sentido da palavra)\b/,
    resumo: /\b(resum[eoi]|resumir|resumao|sintese|o que aconteceu|o que (eu )?li ate)\b/,
    personagens: /\b(personage(m|ns)|quem aparece|quem sao os|protagonista)\b/,
    agoraLendo: /\b(capitulo|cap|ate aqui|ate agora|onde (eu )?parei|que (eu )?estou lendo|deste livro|desse livro|neste livro|nesse livro|livro aberto)\b/,
    progresso: /\b(quanto falta|quanto (eu )?li|meu progresso|minhas estatisticas|estatistica|minha sequencia|quanto tempo (eu )?li|li hoje|li essa semana|li esta semana)\b/,
    narrar: /\b(le pra mim|ler pra mim|leia pra mim|leia para mim|narra (o|a|pra)|narrar agora|quero ouvir|ouvir o livro|ouvir agora|comeca a narrar|liga a narracao)\b/,
    continuar: /\b(continuar (lendo|o livro|a leitura)|continua (o|a|meu)|voltar (ao|pro|para o) livro|abre (o|meu) livro|onde parei)\b/,
    gratis: /\b(gratis|gratuito|gratuita|de graca|tem pdf|baixar de graca|e livre|esta livre|dominio publico)\b/,
    parecido: /\b(parecid[oa]s? com|parecid[oa]s? (ao|a|o)|igual a|iguais a|tipo o|tipo a|na pegada d[eoa]|no estilo d[eoa]|similar(es)? a|semelhantes? a|que nem)\b/,
    autorInfo: /\b(quem (e|foi|eh)|biografia|me fala (sobre|de|da|do)|me conta (sobre|de|da|do)|conhece (o|a)|vida d[eoa]|onde nasceu|quando morreu|ainda (esta )?vivo)\b/,
    obras: /\b(livros d[aeo]|obras d[aeo]|o que (ele|ela) escreveu|o que \w+ escreveu|escritos d[aeo]|bibliografia|livros dele|livros dela|outros livros)\b/,
    perguntaLivro: /\b(do que (fala|se trata|trata)|sobre o que (e|fala)|qual a historia|historia d[eoa]|sinopse|resumo d[aeo] livro|resumo de|vale a pena|e bom|e boa|e legal|recomenda o|recomenda a|quem escreveu|de quem e|quem e o autor|autor de|quantas paginas|tamanho d[eoa]|quanto tempo (leva|demora)|e longo|e curto|de que ano|quando foi (escrito|publicado)|tem filme|e dificil)\b/,
    recomendar: /\b(indica|indique|recomenda|recomende|sugere|sugira|sugestao|sugestoes|quero ler|quero um|quero uma|quero algo|algo pra ler|algo para ler|o que (eu )?leio|o que ler|me da um|me de um|tem algum|tem alguma|procuro|estou a fim|to a fim|afim de|bom livro|livro bom|me surpreenda|escolhe (um|pra mim)|qual livro|(pra|para) (eu )?ler)\b/,
    outra: /^(e )?(outra|outro|outras|outros|mais (uma|um|opcoes|livros|sugestoes)|proxim[oa]|tem mais|mais)\b/,
    sim: /^(sim|claro|quero|pode ser|pode|bora|ok|okay|beleza|manda|isso|com certeza|uhum|aham|s)$/,
    contexto: /\b(dele|dela|desse autor|dessa autora|esse autor|essa autora|mais dele|mais dela|ele escreveu|ela escreveu|desse livro|esse livro|nele)\b/,
    estanteFalta: /\b(falta(m)? (eu )?ler|ainda (nao )?(li|terminei)|nao terminei|estou lendo|to lendo|tou lendo|comecei a ler|livros? (que )?(comecei|parei)|minha fila|na fila|lista de leitura|livros? guardados|qual (livro )?(eu )?(leio|continuo|termino) (agora|primeiro)|o que (eu )?(leio|continuo) agora|qual livro continuar|em andamento)\b/,
    estanteLidos: /\b((quais|quantos) (livros )?(eu )?(ja )?(li|terminei|lidos)|que livros (eu )?(ja )?(li|terminei)|livros (que )?(eu )?(ja )?(li|terminei)|ja terminei|meus lidos|livros lidos|historico de leitura|o que (eu )?ja li)\b/,
    estanteGostei: /\b((qual|quais|que) (livro|livros|deles)? ?(eu )?(mais )?(gostei|curti|amei|adorei)|(livro|livros) (que )?(eu )?(mais )?(gostei|curti|amei)|meus? (livros? )?(favoritos?|preferidos?)|qual (meu|o meu) (livro )?(favorito|preferido)|o que (eu )?mais gostei)\b/,
    estanteGeral: /\b(minha estante|meus livros|minha biblioteca|minha colecao|o que tem na (minha )?estante)\b/,
    livroTodo: /\b(livro todo|livro inteiro|livro completo|resumo completo|com spoiler|com spoilers|do comeco ao fim|ate o final)\b/,
    debate: /\b(o que (voce|vc) (acha|achou|pensa) d|qual (a )?sua opiniao|sua opiniao sobre|vamos (conversar|falar|bater papo) sobre|bora (conversar|falar) sobre|quero (conversar|falar) sobre|voce (gosta|gostou) d|o que achou d|me fala o que (voce )?acha)/,
    opina: /\b(eu acho que|acho que|pra mim|para mim|na minha opiniao|eu achei|achei que|eu sinto que|tenho certeza que|concordo|discordo)\b/,
  };
  const POSITIVO = /\b(amei|adorei|gostei|curti|amo|adoro|maravilhos[oa]|incrivel|incriveis|perfeit[oa]|lind[oa]|otim[oa]|sensacional|viciante|emocionante|top|(bom|boa|lindo|linda|gostei|amei) demais|favorit[oa]|obra prima|me prendeu|nao consegui largar|chorei|genial|fantastic[oa]|excelente|muito bom|muito boa)\b/;
  const NEGATIVO = /\b(odiei|detestei|nao gostei|nao curti|chat[oa]|cansativ[oa]|entediante|arrastad[oa]|parad[oa] demais|ruim|horrivel|pessim[oa]|decepcion\w*|fraco|fraca|confus[oa]|dificil demais|nao entendi nada|desisti|abandonei|me arrependi|sem graca|previsivel)\b/;
  const IDIOMA_FRASE = [[/\bem ingles\b|\benglish\b/, 'en'], [/\bem espanhol\b/, 'es'], [/\bem frances\b/, 'fr'], [/\bem italiano\b/, 'it'], [/\bem portugues\b|\bnacional\b|\bbrasileir/, 'pt']];

  let ctx = { autor: null, livro: null, genero: null, ultimos: [], ultimo: null, sug: null, giro: {} };

  /* tira as palavras de pergunta para sobrar o título ("do que fala dom casmurro" → "dom casmurro") */
  const PERGUNTA = /\b(do que (fala|se trata|trata)|sobre o que (e|fala)|qual a historia d[eoa]|historia d[eoa]|sinopse d[eoa]|resumo d[aeo] livro|resumo d[aeo]|vale a pena (ler)?|e bom|e boa|e legal|recomenda (o|a)|quem escreveu|de quem e|quem e o autor d[eoa]|autor d[eoa]|quantas paginas tem|quantas paginas|tamanho d[eoa]|quanto tempo (leva|demora) (pra|para) ler|e longo|e curto|de que ano e|quando foi (escrito|publicado)|tem filme d[eoa]|tem filme|e dificil|e gratis|e de graca|tem de graca|e gratuito|esta livre|e livre|posso ler|quero ler|me fala (sobre|de|do|da)|me conta (sobre|de|do|da)|o livro|livro|lia|voce conhece|conhece)\b/g;
  const OPINIAO_PALAVRAS = /\b(amei|adorei|gostei|curti|odiei|detestei|achei|acho|eu|muito|demais|nao|chato|chata|cansativo|cansativa|lindo|linda|incrivel|perfeito|perfeita|horrivel|ruim|bom|boa|otimo|otima|o final|final|terminei|li|lendo|estou|to|resume|resumo|resumir|faz um|faca um|me da um|completo|inteiro|todo|com spoiler|sem spoiler|voce|vc|acha|achou|opiniao|sua|qual|conversar|falar|vamos|bora|quero|pensa|sobre)\b/g;
  /* o título achado precisa cobrir as palavras do pedido: "senhor dos aneis" não é "Senhora" só porque
     "senhor" parece "senhora" (sobrou "aneis" sem par). Apelidos e personagens (CHAVES) também contam. */
  let chavesPorSrc = null;
  function cobre(resto, l) {
    const pal = resto.split(' ').filter((w) => w.length >= 3 && !PARADAS.has(w) && !GENERICO.has(w));
    if (pal.length < 2) return true;
    if (!chavesPorSrc && typeof Saber !== 'undefined') { chavesPorSrc = new Map(); for (const [ks, src] of Saber.CHAVES || []) chavesPorSrc.set(src, [...(chavesPorSrc.get(src) || []), ...ks.map(norm)]); }
    const alvo = new Set(norm([l.t, l.tpt, l.o, l.a, ...((chavesPorSrc && chavesPorSrc.get(l.src)) || [])].filter(Boolean).join(' ')).split(' ').filter(Boolean));
    const casa = (w) => [...alvo].some((x) => x === w || (w.length >= 4 && x.startsWith(w)) || (w.length >= 5 && distancia(x, w, 1) <= 1));
    return pal.filter(casa).length / pal.length >= 0.67;
  }

  /* obras famosas fora do acervo (Saber.OBRAS): reconhece pelo título, com um erro de digitação por palavra */
  let obrasIdx = null;
  function acharObra(n, nucleo) {
    if (typeof Saber === 'undefined' || !Saber.OBRAS) return null;
    if (!obrasIdx) obrasIdx = Saber.OBRAS.flatMap((o) => o.al.map((al) => ({ o, estrito: al.startsWith('!'), p: norm(al.replace(/^!/, '')).split(' ') })));
    const nt = n.split(' ');
    const igual = (x, y) => x === y || (y.length >= 5 && x.length >= 4 && distancia(x, y, 1) <= 1);
    let melhor = null;
    for (const it of obrasIdx) {
      if (it.estrito) { if (nucleo !== it.p.join(' ')) continue; }
      else {
        let ok = false;
        for (let i = 0; i + it.p.length <= nt.length && !ok; i++) ok = it.p.every((w, j) => igual(nt[i + j], w));
        if (!ok) continue;
      }
      const tam = it.p.join(' ').length;
      if (!melhor || tam > melhor.tam) melhor = { o: it.o, tam };
    }
    return melhor ? melhor.o : null;
  }
  function detectarLivro(n) {
    if (typeof Lia === 'undefined' || !Lia.buscarLocal) return null;
    const resto = n.replace(PERGUNTA, ' ').replace(new RegExp(NEGATIVO.source, 'g'), ' ').replace(new RegExp(POSITIVO.source, 'g'), ' ').replace(OPINIAO_PALAVRAS, ' ').replace(/[?!.]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!resto || resto.split(' ').length > 9) return null;
    try {
      const r = Lia.buscarLocal(resto, {});
      if (r.melhor && r.melhor.tipo === 'livro' && (r.melhor.livro.rel || 0) >= PC.livroMin && cobre(resto, r.melhor.livro)) return r.melhor.livro;
    } catch (e) { /* sem acervo ainda */ }
    return null;
  }
  function detectarAutor(n) {
    if (typeof Lia === 'undefined') return null;
    const toks0 = n.split(' ');
    for (let tam = Math.min(4, toks0.length); tam >= 1; tam--) {
      for (let i = 0; i + tam <= toks0.length; i++) {
        const p = toks0.slice(i, i + tam);
        if (PARADAS.has(p[0]) || PARADAS.has(p[p.length - 1])) continue;
        const txt = p.join(' ');
        if (txt.length < 4 || GENERICO.has(txt) || COMUNS.has(txt)) continue;
        const a = Lia.acharAutorKB(txt);
        if (a && (tam > 1 || norm(a.n).split(' ').pop() === txt || (a.al || []).map(norm).includes(txt))) return a;
      }
    }
    return null;
  }

  /* ---------------- classificar (sem rede) ---------------- */
  function classificar(frase, c = ctx) {
    const n0 = norm(frase);
    const n = corrige(n0);
    const pal = n.split(' ').filter(Boolean).length;
    const R = (tipo, extra = {}) => ({ tipo, n, ...extra });
    const tem = (k) => RX[k].test(n);
    if (!n) return R('vazio');
    if (tem('sim') && c.sug) return R('segue', { frase: c.sug });
    if (tem('saudacao') && pal <= 4 && !/\b(livro|indica|recomenda)\b/.test(n)) return R('saudacao');
    if (tem('tchau') && pal <= 4) return R('tchau');
    if (/\b(adorei a dica|amei a dica|otima dica|boa dica)\b/.test(n) || (tem('agradece') && pal <= 4 && !tem('recomendar') && !detectarLivro(n))) return R('agradece');
    if (tem('outra') && pal <= 3 && c.ultimo) return R('outra');
    const { best, seg } = buscaSaber(n);
    const kbS = best ? best.s : 0;
    const kbForte = best && (best.frase || kbS >= PC.kbForte) && kbS >= PC.kbMin;
    // ações sobre o livro aberto
    if (tem('significado')) {
      const m = n.match(/(?:significa|quer dizer|significado d[aeo]|definicao d[aeo]|palavra|termo)\s+["“]?([\p{L}-]+)/u);
      return R('significado', { palavra: m ? m[1] : '' });
    }
    // obra famosa que não está no acervo (O Senhor dos Anéis, Harry Potter, 1984...)
    const nucleoDe = (x) => x.replace(PERGUNTA, ' ').replace(new RegExp(RX.recomendar.source, 'g'), ' ').replace(new RegExp(RX.parecido.source, 'g'), ' ').replace(/\b(um|uma|uns|umas|o|a|os|as|de|do|da|dos|das|livro|livros|me|pra|para|mim|sobre|algo|tipo|como)\b/g, ' ').replace(/[?!.]/g, ' ').replace(/\s+/g, ' ').trim();
    const nucleo = nucleoDe(n);
    // procura no texto como a pessoa escreveu (o corretor mexe em títulos em inglês, como "lord of the rings")
    const nucleo0 = nucleoDe(n0);
    const obra = acharObra(n0, nucleo0) || acharObra(n, nucleo);
    if (obra) {
      const modo = tem('parecido') || /\b(tipo|igual|estilo|parecid\w*|pegada|semelhante)\b/.test(n) || tem('recomendar') || /\blivros? (de|do|da|como)\b/.test(n) ? 'parecido' : tem('gratis') ? 'gratis' : 'info';
      return R('obra', { obra, modo });
    }
    const livro = detectarLivro(n) || (tem('contexto') && c.livro) || null;
    const autor = detectarAutor(n) || (tem('contexto') && c.autor) || null;
    // resumo: do capítulo (padrão no livro aberto) ou do livro inteiro
    if (tem('resumo') && (livro || /\b(do livro|o livro|desse livro|deste livro|livro que (eu )?(estou|to) lendo)\b/.test(n) || tem('livroTodo')) && !/\bcapitulo\b/.test(n)) return R('resumo_livro', { livro, todo: tem('livroTodo') });
    // a estante da pessoa
    if (tem('estanteGostei')) return R('estante', { qual: 'gostei' });
    if (tem('estanteLidos')) return R('estante', { qual: 'lidos' });
    if (tem('estanteFalta')) return R('estante', { qual: 'falta' });
    if (tem('estanteGeral') && !tem('ajuda') && !/\bcomo\b/.test(n) && !(best && best.frase)) return R('estante', { qual: 'geral' });
    if ((tem('resumo') || tem('personagens')) && (tem('agoraLendo') || !livro) && !(kbForte && best.e.cat !== 'conversa' && !tem('agoraLendo'))) return R(tem('personagens') && !tem('resumo') ? 'personagens' : 'resumo');
    // opinião e conversa sobre um livro ou autor
    const pol = NEGATIVO.test(n) ? -1 : POSITIVO.test(n) ? 1 : 0;
    const sobre = livro || (autor ? null : (pal <= 8 && /\b(o final|final|livro|personagem|protagonista|narrador|historia)\b/.test(n) ? c.livro : null));
    if (pol && (sobre || autor) && !/\b(seu|sua|voce|vc)\b/.test(n) && !tem('recomendar') && !tem('parecido') && !/\?\s*$/.test(frase)) return R('opiniao', { livro: sobre, autor, pol });
    if (tem('debate') && (livro || autor || c.livro)) return R('debate', { livro: livro || (!autor ? c.livro : null), autor, e: kbForte ? best.e : null });
    const humor = Lia.HUMOR ? Lia.HUMOR.filter((h) => h.rx.test(n)) : [];
    const genero = Lia.generoDaFrase(n);
    const temaLivre = Lia.entenderBusca ? Lia.entenderBusca(n).assuntos.length > 0 : false;
    // "livro de detetive", "algo engraçado": também é pedido de indicação
    const pedeLivroDe = /^(um |uns |algum |alguns )?(livro|livros|historia|historias|algo|leitura) (de|com|sobre|que|pra|para|bem)\b/.test(n) && (genero || temaLivre || humor.length);
    // pedido de indicação vence os temas, menos quando o tema é exatamente sobre isso (hábitos, obras, app)
    const pedeIndicacao = (tem('recomendar') || pedeLivroDe) && !tem('ajuda') && !(best && best.frase && ['habitos', 'obras', 'app'].includes(best.e.cat));
    // nome de autor sozinho ("dostoievski", "obras do machado") vai para o autor
    const nomeAutor = autor ? new Set([norm(autor.n), ...(autor.al || []).map(norm)].join(' ').split(' ')) : null;
    const soAutor = autor && pal <= 5 && !livro && n.split(' ').every((w) => PARADAS.has(w) || nomeAutor.has(w) || /^(obras?|livros?|autor|autora)$/.test(w) || (w.length >= 5 && [...nomeAutor].some((x) => distancia(x, w, 2) <= 2)));
    if (autor && tem('autorInfo') && !(best && best.frase && best.e.cat !== 'obras')) return R('autor_info', { autor });
    if (soAutor) return R('obras', { autor });
    // "quem escreveu X", "quanto tempo leva para ler X": a resposta é sobre o livro
    if (livro && /\b(quem escreveu|de quem e|quem e o autor|autor d[eoa]|quantas paginas|tamanho d[eoa]|quanto tempo (leva|demora)|e longo|e curto|de que ano|quando foi (escrito|publicado))\b/.test(n)) return R('livro', { livro });
    if (tem('progresso')) return R('progresso');
    if (tem('narrar') && !/\bcomo\b/.test(n)) return R('narrar');
    if (tem('continuar') && !/\bcomo\b/.test(n)) return R('continuar');
    if (tem('ajuda') && !kbForte) return R('ajuda');
    // perguntas sobre gratuidade de um livro ou autor específico
    if (tem('gratis') && (livro || autor) && !/^(por que|porque|pq|como)\b/.test(n) && !(kbForte && best.e.cat === 'direitos' && !livro)) return R('gratis', { livro, autor });
    if (tem('parecido')) return R('parecido', { livro, autor: autor || (tem('contexto') ? c.autor : null) });
    // tema da base com frase-chave ou nota alta vence (ex.: "capitu traiu bentinho?", "como trocar a voz")
    if (kbForte && !pedeIndicacao && !(livro && tem('perguntaLivro') && best.e.cat === 'obras' && !(best.e.livros || []).includes(livro.src) && kbS < PC.kbForte + PC.kbVsLivro)) return R('kb', { e: best.e, s: kbS, opina: tem('opina') });
    if (livro && tem('perguntaLivro')) return R('livro', { livro });
    if (autor && tem('autorInfo')) return R('autor_info', { autor });
    if (autor && tem('obras')) return R('obras', { autor });
    if (best && !pedeIndicacao && kbS >= PC.kbMin && (!seg || kbS > seg.s * 1.05 || best.frase)) return R('kb', { e: best.e, s: kbS });
    if (pedeIndicacao || tem('recomendar') || humor.length || (genero && pal <= 6) || (temaLivre && /\b(livro|livros|algo|historia|historias|ler)\b/.test(n))) {
      if (autor && !genero && !humor.length && !/\b(parecid|tipo|estilo)\b/.test(n)) return R('obras', { autor });
      return R('recomendar', { humor, genero, idioma: (IDIOMA_FRASE.find(([rx]) => rx.test(n)) || [])[1], autor });
    }
    if (livro) return R('livro', { livro });
    if (autor) return R('obras', { autor });
    if (tem('outra') && c.ultimo) return R('outra');
    if (/\b(mais curto|algo curto|mais leve)\b/.test(n) && c.ultimo) return R('outra', { curto: true });
    if (/\b(em ingles|em portugues|em espanhol)\b/.test(n) && c.ultimo) return R('outra', { idioma: (IDIOMA_FRASE.find(([rx]) => rx.test(n)) || [])[1] });
    if (pal <= 1 && n.length < 4) return R('naoentendi');
    return R('busca');
  }

  const cartao = (texto, extra = {}) => ({ texto, ...extra });
  const fim = (r, sug) => { ctx.sug = sug || null; return r; };

  /* ---------- resumo e personagens do capítulo atual ---------- */
  function resumir(txt, blocos, n = 5) {
    const fr = Narrador.segmentar(txt, blocos).map((f) => txt.slice(f.ini, f.fim)).filter((s) => s.length > 40 && s.length < 400);
    if (fr.length <= n) return fr;
    const freq = {};
    for (const s of fr) for (const w of norm(s).split(' ')) if (w.length > 3 && !PARADAS.has(w)) freq[w] = (freq[w] || 0) + 1;
    const nota = fr.map((s, i) => {
      const ws = norm(s).split(' ').filter((w) => w.length > 3 && !PARADAS.has(w));
      const soma = ws.reduce((t, w) => t + (freq[w] || 0), 0);
      const pos = i < 3 ? 1.25 : i > fr.length - 3 ? 1.1 : 1;
      return { s, i, v: (soma / Math.pow(ws.length + 1, 0.55)) * pos };
    });
    return nota.sort((a, b) => b.v - a.v).slice(0, n).sort((a, b) => a.i - b.i).map((x) => x.s);
  }
  const NAO_NOMES = new Set('Eu Ele Ela Nós Eles Elas Você Mas Quando Então Depois Não Sim Senhor Senhora Deus Capítulo Era Foi Ali Aqui Isso Aquele Aquela Este Esta Esse Essa Um Uma Os As Se De Do Da Em No Na Por Que Como Onde Mais Ainda Já Tudo Nada Lá Assim Agora Hoje Ontem Amanhã Segunda Terça Quarta Quinta Sexta Sábado Domingo Janeiro Fevereiro Março Abril Maio Junho Julho Agosto Setembro Outubro Novembro Dezembro The He She It They But When Then Mr Mrs Miss Sir Lady Chapter I O A E Ó Oh Ah'.split(' '));
  function personagens(txt) {
    const conta = {};
    const rx = /(?<=[^.!?…\n]\s)(\p{Lu}[\p{Ll}]{2,}(?:\s(?:de|da|do|dos|das)?\s?\p{Lu}[\p{Ll}]{2,})?)/gu;
    let m;
    while ((m = rx.exec(txt))) {
      const nome = m[1].trim();
      if (NAO_NOMES.has(nome.split(' ')[0])) continue;
      conta[nome] = (conta[nome] || 0) + 1;
    }
    return Object.entries(conta).filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 10);
  }
  async function significado(palavra) {
    const p = palavra.trim().toLowerCase();
    const k = 'dic:' + p;
    const c = await CacheWeb.get(k, 90);
    if (c !== undefined) return c;
    const d = await buscar(`https://pt.wiktionary.org/w/api.php?action=parse&format=json&origin=*&prop=wikitext&redirects=1&page=${encodeURIComponent(p)}`, { ms: 10000 }).catch(() => null);
    let defs = [];
    if (d && d.parse) {
      const w = d.parse.wikitext['*'] || '';
      const sec = w.split(/=\s*\{\{-pt-\}\}\s*=/)[1] || w;
      const ate = sec.split(/\n=\s*\{\{-[a-z]{2,3}-\}\}\s*=/)[0];
      defs = ate.split('\n').filter((l) => /^#[^:*#]/.test(l)).map((l) => l.replace(/^#\s*/, '').replace(/\{\{[^{}]*\}\}/g, '').replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1').replace(/'{2,}/g, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()).filter((l) => l.length > 2).slice(0, 3);
    }
    CacheWeb.set(k, defs);
    return defs;
  }

  /* ---------------- respostas ---------------- */
  const livrosDe = async (srcs) => (await Promise.all((srcs || []).map((s) => Lia.porSrc(s).catch(() => null)))).filter(Boolean);
  const autoresDe = (ids) => (ids || []).map((id) => KB.A[id]).filter(Boolean).map((a) => ({ n: a.n, id: a.id, kb: a }));
  function girar(e) {
    if (!Array.isArray(e.r)) return e.r;
    const i = ctx.giro[e.q] = ((ctx.giro[e.q] ?? Math.floor(Math.random() * e.r.length)) + 1) % e.r.length;
    return e.r[i];
  }
  async function respostaKB(e) {
    const livros = await livrosDe(e.livros);
    if (e.autores && e.autores[0]) ctx.autor = KB.A[e.autores[0]] || ctx.autor;
    const extra = { livros, autores: autoresDe(e.autores), acoes: e.acoes || [], sugestoes: e.sug || (Array.isArray(e.r) ? [e.q.startsWith('Me conta') ? 'Outra curiosidade' : e.q.startsWith('Me diz') ? 'Outra frase' : 'Outra'] : []) };
    return cartao(girar(e), extra);
  }
  const fmtHoras = (min) => (min < 60 ? `${Math.max(5, Math.round(min / 5) * 5)} minutos` : `${(Math.round(min / 30) / 2).toString().replace('.', ',')} ${min < 90 ? 'hora' : 'horas'}`);
  async function respostaLivro(l, n, A) {
    ctx.livro = l;
    if (l.aid && KB.A[l.aid]) ctx.autor = KB.A[l.aid];
    const ppm = (A && A.estado && A.estado().ppm) || 230;
    const tema = Saber.TEMAS.find((e) => e.cat === 'obras' && (e.livros || [])[0] === l.src);
    const partes = [];
    const quem = /\b(quem escreveu|de quem e|quem e o autor|autor d)/.test(n);
    const tempo = /\b(quantas paginas|tamanho|quanto tempo|e longo|e curto)\b/.test(n);
    const nomeT = l.tpt && l.l !== 'pt' ? `${l.tpt} (${l.t})` : l.t;
    if (quem) partes.push(`${nomeT} foi escrito por ${l.a || 'autor desconhecido'}${l.ano ? ', em ' + l.ano : ''}.`);
    if (tempo && l.pal) partes.push(`Tem cerca de ${fmtNum(Math.round(l.pal / 1000) * 1000)} palavras (umas ${fmtNum(Math.round(l.pal / 280))} páginas): leva em torno de ${fmtHoras(l.pal / ppm)} no seu ritmo de leitura.`);
    if (!quem && !tempo || partes.length === 0) {
      if (tema) partes.push(girar(tema));
      else {
        let sin = l.sin || '';
        if (!sin && !l.livre && l.ol) sin = await Fontes.openlibrary.descricao(l.ol).catch(() => '');
        if (!sin) { const ps = await Fontes.wikipedia.procurar(`${l.tpt || l.t} ${l.a || ''}`).catch(() => []); const p = ps.find((x) => /livro|romance|obra|conto|novel|poema|peça/i.test(x.desc)); if (p) { const w = await Fontes.wikipedia.resumo(p.titulo); sin = w && w.texto || ''; } }
        partes.push(sin ? sin.split(/(?<=\.)\s/).slice(0, 3).join(' ') : `${nomeT}${l.a ? ', de ' + l.a : ''}${l.ano ? ' (' + l.ano + ')' : ''}.`);
      }
      if (l.pal && !tempo) partes.push(`Leitura de uns ${fmtHoras(l.pal / ppm)}.`);
    }
    partes.push(l.livre ? 'Está em domínio público: dá para ler e ouvir aqui, de graça.' : 'Ainda tem direitos autorais: veja a amostra oficial e onde encontrar.');
    const acoes = l.livre ? [{ rotulo: 'Ler agora', acao: 'abrir', livro: l }, { rotulo: 'Ouvir', acao: 'ouvir', livro: l }] : [{ rotulo: 'Ver amostra e onde comprar', acao: 'detalhe', livro: l }];
    return cartao(partes.join(' '), { livros: [l], acoes, sugestoes: [`Parecidos com ${l.tpt || l.t}`, l.a ? `Mais de ${l.a}` : 'Me indica outro'] });
  }

  /* ---------- estante: o que falta, o que já leu, o que mais gostou ---------- */
  const pctDe = (x) => Math.round(((x.prog && x.prog.pct) || 0) * 100);
  async function respostaEstante(qual, est, A) {
    const todos = Object.values(est.estante || {});
    const ppm = est.ppm || 230;
    const falta = (x) => (x.pal ? fmtHoras(((1 - ((x.prog && x.prog.pct) || 0)) * x.pal) / ppm) : '');
    const lendo = todos.filter((x) => x.status === 'lendo').sort((a, b) => (b.ultimo || 0) - (a.ultimo || 0));
    const lidos = todos.filter((x) => x.status === 'lido').sort((a, b) => (b.fim || 0) - (a.fim || 0));
    const quero = todos.filter((x) => x.status === 'quero' || x.status === 'novo');
    if (!todos.length) return fim(cartao('Sua estante ainda está vazia. Quer que eu escolha um livro para começar?', { sugestoes: ['Me indica um livro', 'Me indica um suspense curto'] }), 'me indica um livro');
    if (qual === 'falta') {
      if (!lendo.length && !quero.length) return cartao(`Você não tem nenhum livro pela metade. ${lidos.length ? `Já terminou ${plural(lidos.length, '1 livro', '# livros')}!` : ''} Quer uma indicação nova?`, { sugestoes: ['Me indica um livro'] });
      const lista = [...lendo.map((x) => `${x.t}: ${pctDe(x)}% lido${falta(x) ? ', faltam ' + falta(x) : ''}`), ...quero.slice(0, 8).map((x) => `${x.t}: ${x.status === 'quero' ? 'na lista Quero ler' : 'baixado, ainda não começado'}`)];
      const prox = lendo.slice().sort((a, b) => pctDe(b) - pctDe(a))[0] || quero[0];
      const dica = prox ? ` Minha sugestão: ${lendo.includes(prox) ? `termine "${prox.t}", você já está em ${pctDe(prox)}%` : `comece "${prox.t}"`}.` : '';
      return cartao(`Você tem ${plural(lendo.length, '1 livro em andamento', '# livros em andamento')}${quero.length ? ` e ${plural(quero.length, '1 esperando', '# esperando')}` : ''}.${dica}`, { lista, acoes: prox ? [{ rotulo: lendo.includes(prox) ? 'Continuar ' + prox.t : 'Começar ' + prox.t, acao: 'abrir', id: prox.id }] : [] });
    }
    if (qual === 'lidos') {
      if (!lidos.length) return cartao(`Você ainda não terminou nenhum livro aqui${lendo.length ? `, mas está lendo ${plural(lendo.length, '1', '#')}: ${lendo.slice(0, 3).map((x) => x.t).join(', ')}` : ''}.`, { sugestoes: ['O que falta eu ler?'] });
      return cartao(`Você já terminou ${plural(lidos.length, '1 livro', '# livros')}:`, { lista: lidos.slice(0, 15).map((x) => `${x.t}${x.a ? ' (' + x.a + ')' : ''}${x.gostou === true ? ' ♥' : ''}${x.fim ? ', em ' + new Date(x.fim).toLocaleDateString('pt-BR') : ''}`), sugestoes: ['Qual eu mais gostei?', 'Me indica algo parecido'] });
    }
    if (qual === 'gostei') {
      const amados = todos.filter((x) => x.gostou === true);
      if (amados.length) {
        const top = amados.sort((a, b) => (b.fim || b.ultimo || 0) - (a.fim || a.ultimo || 0));
        ctx.livro = top[0];
        return cartao(`Pelo que você me contou, ${amados.length === 1 ? 'o seu favorito é' : 'os que você mais gostou são'}: ${top.slice(0, 5).map((x) => '"' + x.t + '"').join(', ')}.`, { sugestoes: [`Parecidos com ${top[0].t}`, 'Me indica algo novo'] });
      }
      // sem curtidas: usa o que a Lia aprendeu (autores e gêneros com mais peso) e os livros terminados
      const pa = (est.pesos && est.pesos.a) || {};
      const cand = [...lidos, ...lendo].sort((a, b) => (pa[norm(b.a)] || 0) - (pa[norm(a.a)] || 0) || pctDe(b) - pctDe(a));
      if (!cand.length) return cartao('Ainda não sei. Quando terminar um livro, toque em Amei ou me diga "amei tal livro", que eu guardo.');
      ctx.livro = cand[0];
      return fim(cartao(`Você ainda não marcou nenhum como favorito, mas pelo que leu até o fim e pelo tempo que passou em cada um, aposto em "${cand[0].t}". Acertei? Me diga "amei ${cand[0].t}" que eu guardo.`, { sugestoes: [`Amei ${cand[0].t}`, `Parecidos com ${cand[0].t}`] }));
    }
    const s = A.estatisticas();
    return cartao(`Na sua estante: ${plural(lendo.length, '1 em andamento', '# em andamento')}, ${plural(lidos.length, '1 lido', '# lidos')} e ${plural(quero.length, '1 esperando', '# esperando')}. Você leu ${fmtMin(s.minSemana)} nos últimos 7 dias.`, { acoes: [{ rotulo: 'Abrir a estante', acao: 'estante' }], sugestoes: ['O que falta eu ler?', 'Quais eu já li?', 'Qual eu mais gostei?'] });
  }

  /* ---------- resumo de um livro inteiro (até onde a pessoa leu, sem spoiler) ---------- */
  async function respostaResumoLivro(C, A) {
    const est = A.estado();
    const aberto = A.livroAberto();
    const idAberto = A.idAberto && A.idAberto();
    let item = null;
    if (C.livro) item = est.estante[C.livro.id] || Object.values(est.estante).find((x) => x.src && x.src === C.livro.src) || null;
    else if (idAberto) item = est.estante[idAberto];
    else item = A.ultimoLido();
    let fonte = null, ate = 0;
    if (item && aberto && idAberto === item.id) { fonte = { caps: aberto.livro.caps, texto: (i) => aberto.textoCapitulo(i) }; ate = aberto.pos.c; }
    else if (item && item.baixado && A.textoLivro) { try { fonte = await A.textoLivro(item); ate = (item.prog && item.prog.c) || 0; } catch (e) { fonte = null; } }
    const lido = item && item.status === 'lido';
    const todo = C.todo || lido;
    if (fonte) {
      const ultimo = todo ? fonte.caps.length - 1 : ate;
      const lista = await resumoDeCapitulos(fonte, ultimo);
      if (lista.length) {
        ctx.livro = item;
        const aviso = todo ? (lido ? 'Você já terminou, então resumi o livro todo.' : 'Resumo do livro todo, com o final. Você pediu spoiler!') : `Resumi até o capítulo em que você está (${fonte.caps[ultimo] ? fonte.caps[ultimo].titulo : ''}), sem contar o que vem depois.`;
        return cartao(`Resumo de "${item.t}", com as frases mais importantes de cada parte:`, { lista, nota: aviso + ' Feito com o próprio texto do livro.', sugestoes: todo ? ['Quem são os personagens?', 'O que você achou do final?'] : ['Resume o capítulo', 'Resumo do livro todo, com spoiler'] });
      }
    }
    if (C.livro || item) return respostaLivro(C.livro || item, 'sinopse', A);
    return cartao('De qual livro? Ex.: "resume Dom Casmurro". Se for um livro da sua estante, eu resumo com o próprio texto até onde você leu.');
  }
  async function resumoDeCapitulos(fonte, ultimo) {
    const total = Math.max(0, Math.min(fonte.caps.length - 1, ultimo));
    const idx = [];
    const max = 10;
    if (total + 1 <= max) for (let i = 0; i <= total; i++) idx.push(i);
    else for (let k = 0; k < max; k++) idx.push(Math.round((k * total) / (max - 1)));
    const out = [];
    for (const i of Array.from(new Set(idx))) {
      const { txt, blocos } = await fonte.texto(i);
      if (!txt || txt.length < 600) continue;
      const s = resumir(txt, blocos, 1)[0];
      if (s) out.push(`${fonte.caps[i].titulo || 'Parte ' + (i + 1)}: ${s.replace(/\s+/g, ' ').slice(0, 320)}`);
    }
    return out;
  }

  /* ---------- opinião e conversa ---------- */
  const PERGUNTAS_GENERO = {
    suspense: ['Você desconfiou do final antes de chegar lá?', 'Qual reviravolta mais te pegou?'],
    psicologico: ['Você confiou em quem estava narrando?', 'Que personagem te pareceu mais perigoso?'],
    policial: ['Você descobriu o culpado antes do detetive?', 'Qual pista te fez desconfiar?'],
    terror: ['Que cena mais te deu medo?', 'Leu à noite ou de dia?'],
    gotico: ['O clima sombrio te prendeu ou cansou?'],
    romance: ['Você torceu pelo casal desde o começo?', 'O final te deixou satisfeita?'],
    classicos: ['Qual personagem mais te marcou?', 'Achou a linguagem difícil ou se acostumou rápido?'],
    poesia: ['Teve algum verso que ficou na sua cabeça?'],
    erotico: ['As cenas te pareceram ousadas para a época?'],
    _: ['Qual parte mais te marcou?', 'Recomendaria para alguém?'],
  };
  function perguntaDe(l) { const g = ((l && l.g) || []).find((x) => PERGUNTAS_GENERO[x]); const ps = PERGUNTAS_GENERO[g || '_']; return ps[Math.floor(Math.random() * ps.length)]; }
  function comentarioDe(l) {
    const tema = l && Saber.TEMAS.find((e) => e.cat === 'obras' && (e.livros || [])[0] === l.src);
    if (tema) { const t = girar(tema); return t.split(/(?<=\.)\s/).slice(0, 2).join(' '); }
    return l && l.sin ? l.sin : '';
  }
  async function respostaOpiniao(C, est, A) {
    const l = C.livro;
    if (l) {
      ctx.livro = l;
      const it = est.estante[l.id];
      if (it) { it.gostou = C.pol > 0; A.salvar && A.salvar(); }
      Lia.aprender(est, C.pol > 0 ? 'curtiu' : 'descurtiu', it || l); A.salvar && A.salvar();
      const nomeL = l.tpt || l.t;
      if (C.pol > 0) {
        const c = comentarioDe(l);
        return fim(cartao(`${['Que bom!', 'Amo quando isso acontece!', 'Também acho!'][Math.floor(Math.random() * 3)]} ${nomeL} tem muito para conversar.${c ? ' ' + c : ''} ${perguntaDe(l)}`, { sugestoes: [`Parecidos com ${nomeL}`, l.a ? `Mais de ${l.a}` : 'Me indica outro'], nota: 'Anotei que você gostou: vou indicar mais livros nessa linha.' }), `parecidos com ${nomeL}`);
      }
      const g = (l.g || [])[0];
      return fim(cartao(`Faz parte! Nem todo livro funciona para todo mundo${(l.g || []).includes('classicos') ? ', e clássico às vezes pede outro momento' : ''}. O que pegou mais: o ritmo, a linguagem ou a história? Se quiser, eu indico algo ${g === 'classicos' || g === 'literaria' ? 'mais leve e com mais ritmo' : 'bem diferente'}.`, { sugestoes: ['Me indica algo leve e curto', 'Me indica um suspense'], nota: 'Anotei: vou evitar livros muito parecidos com esse.' }), 'me indica algo leve e curto');
    }
    if (C.autor) {
      ctx.autor = C.autor;
      Lia.aprender(est, C.pol > 0 ? 'curtiu' : 'descurtiu', { a: C.autor.n, g: C.autor.gen || [] }); A.salvar && A.salvar();
      return cartao(C.pol > 0 ? `${C.autor.n} é ótimo mesmo${C.autor.estilo ? ': ' + C.autor.estilo : ''}. Qual livro dele você mais curtiu?` : `Entendi, ${C.autor.n} não é para você. Vou dar menos peso a esse estilo nas indicações.`, { sugestoes: C.pol > 0 ? [`Parecidos com ${C.autor.n}`] : ['Me indica outra coisa'] });
    }
    return cartao('Me conta de qual livro você está falando?');
  }
  async function respostaDebate(C, est, A) {
    const l = C.livro;
    if (l) {
      ctx.livro = l;
      const tema = C.e && C.e.cat === 'obras' ? C.e : Saber.TEMAS.find((e) => e.cat === 'obras' && (e.livros || [])[0] === l.src);
      const nomeL = l.tpt || l.t;
      const minha = tema ? girar(tema) : (l.sin ? `${l.sin}` : `${nomeL}${l.a ? ', de ' + l.a : ''}, é um livro que divide opiniões.`);
      return fim(cartao(`Eu gosto muito de conversar sobre ${nomeL}. ${minha} E você, ${perguntaDe(l).replace(/^./, (x) => x.toLowerCase())}`, { livros: [l], sugestoes: ['Amei esse livro', 'Achei chato', 'Resume esse livro'] }));
    }
    if (C.autor) return responder('quem foi ' + C.autor.n, A);
    return cartao('Sobre qual livro ou autor você quer conversar?');
  }

  /* clássicos grátis do acervo com a mesma pegada de uma obra famosa */
  async function similaresObra(o, est) {
    try { await Lia.catalogo(); } catch (e) { return []; }
    const perfil = { ...((est && est.perfil) || {}), idiomas: ['pt', 'en', 'es', 'fr', 'it', 'de'], generos: [] };
    const out = [], vistos = new Set();
    const titulo = (l) => norm(l.tpt || l.t).replace(/[:;(].*$/, '').trim();
    const add = (l) => { if (!l || !l.livre || ((l.g || []).includes('erotico') && !(o.g || []).includes('erotico'))) return; const k = titulo(l); if (vistos.has(k)) return; vistos.add(k); out.push(l); };
    for (const q of o.sim || []) {
      try {
        const r = Lia.buscarLocal(q, { perfil });
        const l = r.melhor && r.melhor.tipo === 'livro' ? r.melhor.livro : r.livres[0];
        const qw = q.split(' ').filter((w) => w.length >= 4);
        if (l && qw.some((w) => norm(l.t + ' ' + (l.tpt || '')).includes(w))) add(l);
      } catch (e) { /* segue */ }
      if (out.length >= 8) break;
    }
    if (out.length < 4) {
      const G = (KB.GENEROS || []).find((g) => g.id === (o.g || [])[0]);
      if (G) { try { for (const l of Lia.buscarLocal(G.nome, { perfil: { ...perfil, generos: [G.id] } }).livres) { add(l); if (out.length >= 8) break; } } catch (e) { /* segue */ } }
    }
    return out;
  }
  async function respostaObra(C, est) {
    const o = C.obra;
    const ano = new Date().getFullYear();
    const livre = o.morte && ano >= o.morte + 71;
    const dir = livre ? `Já está em domínio público no Brasil (${o.a} morreu em ${o.morte}), mas ainda não tenho uma edição grátis dele no acervo.`
      : o.morte ? `Ainda tem direitos autorais no Brasil: ${o.a} morreu em ${o.morte}, e a obra só fica livre em ${o.morte + 71}. Por isso não está grátis aqui, mas dá para ver a amostra oficial e onde comprar.`
        : `É um livro com direitos autorais (${o.a} ainda está vivo), então não está grátis aqui, mas dá para ver a amostra oficial e onde comprar.`;
    const sims = await similaresObra(o, est);
    const G = (KB.GENEROS || []).find((g) => g.id === (o.g || [])[0]) || null;
    ctx.ultimo = { humor: [], genero: G, idioma: null, curto: false, q: G ? G.nome.toLowerCase() : '' };
    ctx.ultimos = [...ctx.ultimos, ...sims.map((l) => l.id)].slice(-60);
    const acoes = [{ rotulo: 'Ver amostra', acao: 'link', nome: Fontes.googleLivros(o.t, o.a) }, { rotulo: 'Onde comprar', acao: 'link', nome: Fontes.compra(o.t, o.a) }];
    let texto, nota = '';
    if (C.modo === 'parecido') { texto = `Quer algo como **${o.t}**, de ${o.a}? ${o.porque}${sims.length ? ' Estes são grátis e você pode ler e ouvir agora:' : ''}`; nota = dir; }
    else if (C.modo === 'gratis') texto = `**${o.t}**: ${dir} ${sims.length ? o.porque : ''}`.trim();
    else texto = `**${o.t}**, de ${o.a} (${o.ano}). ${o.sin} ${dir}${sims.length ? ' Na mesma pegada, estes são grátis:' : ''}`;
    const sug = C.modo === 'parecido' ? ['Outra opção', `Do que fala ${o.t}?`] : [`Parecidos com ${o.t}`, 'Outra opção'];
    return fim(cartao(texto, { livros: sims, nota, acoes, sugestoes: sug }), 'outra opção');
  }
  async function responder(frase, A) {
    const C = classificar(frase);
    const est = A.estado();
    const perfil = est.perfil || {};
    const nome = primeiroNome(A.nome());
    ctx.sug = null;
    switch (C.tipo) {
      case 'vazio': return cartao('Pode perguntar o que quiser sobre livros.');
      case 'segue': return responder(C.frase, A);
      case 'saudacao': return fim(cartao(`Oi, ${nome}! Eu sou a Lia. Posso indicar livros pelo seu humor, conversar sobre autores e clássicos, tirar dúvidas de literatura e do app, e resumir o capítulo que você está lendo.`, { sugestoes: ['Me indica um suspense curto', 'Capitu traiu Bentinho?', 'Quem é Raphael Montes?', 'Me conta uma curiosidade'] }));
      case 'tchau': return cartao(['Até mais! Boa leitura.', 'Tchau! Volte quando quiser outra indicação.', 'Até logo, e bons livros!'][Math.floor(Math.random() * 3)]);
      case 'agradece': return cartao(['Imagina! Boa leitura.', 'Por nada! Estou aqui quando quiser outra indicação.', 'Que bom que ajudei. Boa leitura!'][Math.floor(Math.random() * 3)]);
      case 'naoentendi': return cartao('Não entendi. Pode escrever com outras palavras?', { sugestoes: ['Me indica um livro', 'Ajuda'] });
      case 'ajuda':
        return cartao('Eu entendo pedidos assim:', { lista: ['"Me indica um romance leve em português"', '"Livros parecidos com Dom Casmurro"', '"Quem foi Álvares de Azevedo?"', '"Do que fala O Alienista?" ou "quanto tempo leva para ler Drácula?"', '"Capitu traiu Bentinho?" ou "o que foi o Realismo?"', '"A Empregada é de graça?"', '"Resume o capítulo" e "quem são os personagens" (no livro aberto)', '"O que significa soturno?"', '"Como trocar a voz?" e outras dúvidas do app', '"Quanto falta para terminar?"'], sugestoes: ['Me indica um suspense', 'O que é domínio público?', 'Me conta uma curiosidade'] });
      case 'significado': {
        const palavra = C.palavra || C.n.split(' ').pop();
        if (!palavra) return cartao('Qual palavra você quer que eu procure?');
        const defs = await significado(palavra);
        if (!defs.length) return cartao(`Não achei "${palavra}" no Wikcionário. Confere se está escrita certinho?`);
        return cartao(`**${palavra}**`, { lista: defs, fonte: 'Wikcionário' });
      }
      case 'resumo': case 'personagens': {
        const aberto = A.livroAberto();
        if (!aberto) return cartao('Abra um livro primeiro, e eu resumo o capítulo em que você está, sem contar o que vem depois.', { acoes: [{ rotulo: 'Ver minha estante', acao: 'estante' }] });
        const { txt, blocos } = await aberto.textoCapitulo(aberto.pos.c);
        const titulo = aberto.livro.caps[aberto.pos.c].titulo;
        if (C.tipo === 'personagens') {
          const tudo = (await Promise.all(Array.from({ length: Math.min(aberto.livro.caps.length, aberto.pos.c + 1) }, (_, i) => aberto.textoCapitulo(i).then((r) => r.txt)))).join('\n');
          const ps = personagens(tudo);
          if (!ps.length) return cartao('Ainda não apareceu nenhum nome com frequência até aqui.');
          return cartao('Quem mais aparece até onde você leu:', { lista: ps.map(([n, c]) => `${n} (${c} vezes)`) });
        }
        const r = resumir(txt, blocos, 5);
        if (!r.length) return cartao('Este capítulo é curto demais para resumir.');
        return cartao(`Os trechos principais de "${titulo}":`, { lista: r.map((s) => s.replace(/\s+/g, ' ')), nota: 'Resumo feito com frases do próprio livro, sem revelar o que vem depois.' });
      }
      case 'progresso': {
        const s = A.estatisticas();
        const aberto = A.livroAberto();
        const linhas = [];
        if (aberto) { const p = aberto.progresso(); linhas.push(`Neste livro você está em ${Math.round(p.pct * 100)}%. Faltam ${fmtMin(p.minLivro)} para terminar (${fmtMin(p.minCap)} neste capítulo).`); }
        linhas.push(`Você leu ${fmtMin(s.minHoje)} hoje e ${fmtMin(s.minSemana)} nos últimos 7 dias.`);
        linhas.push(`${plural(s.lidos, '1 livro terminado', '# livros terminados')} e ${plural(s.lendo, '1 em andamento', '# em andamento')}.`);
        if (s.sequencia > 1) linhas.push(`Sequência: ${s.sequencia} dias seguidos lendo.`);
        return cartao(linhas.join(' '));
      }
      case 'continuar': case 'narrar': {
        const ult = A.ultimoLido();
        if (!ult) return fim(cartao('Você ainda não começou nenhum livro. Quer uma indicação?', { sugestoes: ['Me indica um livro'] }), 'me indica um livro');
        return cartao(`Vamos lá: "${ult.t}"${ult.prog ? `, em ${Math.round((ult.prog.pct || 0) * 100)}%` : ''}.`, { acoes: [{ rotulo: C.tipo === 'narrar' ? 'Ouvir agora' : 'Continuar lendo', acao: C.tipo === 'narrar' ? 'ouvir' : 'abrir', id: ult.id }] });
      }
      case 'kb': {
        const r = await respostaKB(C.e);
        if (C.opina) r.texto = ['Boa reflexão! ', 'Faz sentido pensar assim. ', 'Muita gente concorda com você. '][Math.floor(Math.random() * 3)] + r.texto;
        return fim(r, C.e.sug ? C.e.sug[0] : null);
      }
      case 'estante': return respostaEstante(C.qual, est, A);
      case 'resumo_livro': return respostaResumoLivro(C, A);
      case 'opiniao': return respostaOpiniao(C, est, A);
      case 'debate': return respostaDebate(C, est, A);
      case 'livro': return respostaLivro(C.livro, C.n, A);
      case 'obra': return respostaObra(C, est);
      case 'gratis': {
        if (C.livro) {
          const l = C.livro;
          if (l.livre) return cartao(`Sim! "${l.tpt || l.t}"${l.a ? ', de ' + l.a : ''}, está em domínio público e você pode ler e ouvir agora mesmo, aqui no app.`, { livros: [l], acoes: [{ rotulo: 'Ler agora', acao: 'abrir', livro: l }] });
          const kb = l.aid ? KB.A[l.aid] : null;
          const alt = kb && kb.livres ? await livrosDe(kb.livres.slice(0, 6)) : [];
          return cartao(`"${l.t}" ainda tem direitos autorais, então não é gratuito. ${KB.DIREITOS.regra} Você pode ler a amostra oficial, comprar o ebook e importar aqui, ou ler um clássico com a mesma pegada:`, { livros: [l, ...alt.slice(0, 5)], acoes: [{ rotulo: 'Ver amostra e onde comprar', acao: 'detalhe', livro: l }] });
        }
        const info = await Lia.infoAutor(C.autor.n);
        ctx.autor = C.autor;
        if (info.livres.length) return cartao(`De ${info.n}, ${plural(info.livres.length, '1 livro é gratuito', '# livros são gratuitos')}:`, { livros: info.livres.slice(0, 12), acoes: [{ rotulo: 'Página do autor', acao: 'autor', nome: info.n }] });
        const alt = C.autor.livres ? await livrosDe(C.autor.livres.slice(0, 8)) : [];
        return cartao(`${info.n} ainda tem direitos autorais, então os livros não são gratuitos. ${KB.DIREITOS.regra}${alt.length ? ' Clássicos livres na mesma pegada:' : ''}`, { livros: alt, acoes: [{ rotulo: 'Ver os livros, a amostra e onde comprar', acao: 'autor', nome: info.n }] });
      }
      case 'autor_info': {
        const info = await Lia.infoAutor(C.autor.n);
        ctx.autor = C.autor;
        const txt = (info.bio || `${info.n} é ${info.pais ? 'de ' + info.pais : 'um autor'}.`).split(/(?<=\.)\s/).slice(0, 4).join(' ');
        const livros = [...info.livres, ...info.obras].slice(0, 8);
        return cartao(txt, { autores: [info], livros, acoes: [{ rotulo: 'Ver todos os livros de ' + info.n, acao: 'autor', nome: info.n }], sugestoes: ['Parecidos com ' + info.n, info.dp ? 'Por onde começar?' : 'Algum livro dele é grátis?'] });
      }
      case 'obras': {
        const info = await Lia.infoAutor(C.autor.n);
        ctx.autor = C.autor;
        if (info.livres.length) return cartao(`${info.n}: ${plural(info.livres.length, '1 livro gratuito', '# livros gratuitos')} para ler agora${info.obras.length ? ' e ' + plural(info.obras.length, 'mais 1 com prévia', 'mais # com prévia') : ''}.`, { livros: [...info.livres, ...info.obras].slice(0, 12), acoes: [{ rotulo: 'Abrir página do autor', acao: 'autor', nome: info.n }], sugestoes: ['Quem foi ' + info.n + '?', 'Parecidos com ' + info.n] });
        return cartao(`${info.n} tem ${plural(info.obras.length, '1 livro', '# livros')}, todos com direitos autorais. Mostro as capas, a prévia oficial e onde encontrar:`, { livros: info.obras.slice(0, 12), acoes: [{ rotulo: 'Abrir página do autor', acao: 'autor', nome: info.n }], sugestoes: ['Parecidos com ' + info.n, 'Quem é ' + info.n + '?'] });
      }
      case 'parecido': {
        let alvoAutor = C.autor && C.autor.livres ? C.autor : null;
        if (!alvoAutor && C.livro) {
          alvoAutor = C.livro.aid ? KB.A[C.livro.aid] : null;
          if (!alvoAutor || !alvoAutor.livres) { const ps = await Lia.parecidos(C.livro, est, 10); return cartao(`Parecidos com "${C.livro.tpt || C.livro.t}":`, { livros: ps }); }
        }
        if (!alvoAutor) {
          const r = await Lia.buscarTudo(C.n.replace(RX.parecido, ' '), est);
          const lv = r.melhor && r.melhor.livro || r.pagos[0] || r.livres[0];
          if (lv) { alvoAutor = lv.aid ? KB.A[lv.aid] : Lia.acharAutorKB(lv.a); if (!alvoAutor || !alvoAutor.livres) { const ps = await Lia.parecidos(lv, est, 10); return cartao(`Parecidos com "${lv.t}":`, { livros: ps }); } }
        }
        if (alvoAutor) {
          ctx.autor = alvoAutor;
          const livres = await livrosDe(alvoAutor.livres);
          const sim = (alvoAutor.sim || []).map((id) => KB.A[id]).filter(Boolean).slice(0, 6);
          return cartao(`Na pegada de ${alvoAutor.n}${alvoAutor.estilo ? ' (' + alvoAutor.estilo + ')' : ''}, estes clássicos são gratuitos:`, { livros: livres.slice(0, 10), autores: sim.map((a) => ({ n: a.n, id: a.id, kb: a })), nota: sim.length ? 'Autores parecidos: ' + sim.map((a) => a.n).join(', ') + '.' : '' });
        }
        return cartao('Parecido com qual livro ou autor? Ex.: "parecidos com A Empregada".');
      }
      case 'recomendar': case 'outra': {
        const ant = C.tipo === 'outra' ? (ctx.ultimo || {}) : {};
        const humor = C.humor || ant.humor || [];
        const genero = C.genero || ant.genero || null;
        const idioma = C.idioma || ant.idioma;
        const curto = C.curto || ant.curto || humor.some((h) => h.t === 'curtas') || /\b(curt[oa]s?|curtinh|rapid[oa]|pequen[oa]|uma sentada|poucas paginas)\b/.test(C.n);
        const q = C.tipo === 'outra' ? (ant.q || '') : C.n.replace(RX.recomendar, ' ').replace(/\s+/g, ' ').trim();
        ctx.ultimo = { humor, genero, idioma, curto, q };
        // tema livre, gênero ou filtro: usa o motor da busca (assuntos do catálogo + gosto da pessoa)
        const Qb = q && Lia.entenderBusca ? Lia.entenderBusca(q) : null;
        if (Qb && (Qb.assuntos.length || Qb.generos.length) && !Qb.duros.length) {
          const rb = Lia.buscarLocal(q + (curto && !Qb.filtros.curto ? ' curtos' : '') + (idioma && !Qb.filtros.idioma ? ' em ' + ({ en: 'ingles', es: 'espanhol', fr: 'frances', it: 'italiano', pt: 'portugues' }[idioma] || '') : ''), est);
          let lv = rb.livres.filter((l) => !ctx.ultimos.includes(l.id)).slice(0, 8);
          let nota = '';
          // nada no idioma do perfil: procura nos outros idiomas e avisa
          if (!lv.length && !idioma) {
            const rb2 = Lia.buscarLocal(q, { ...est, perfil: { ...perfil, idiomas: ['pt', 'en', 'es', 'fr', 'it'] } });
            lv = rb2.livres.filter((l) => !ctx.ultimos.includes(l.id)).slice(0, 8);
            if (lv.length) nota = 'No acervo livre em português não há livros com esse tema, então trouxe em outros idiomas.';
          }
          if (lv.length) {
            ctx.ultimos = [...ctx.ultimos, ...lv.map((l) => l.id)].slice(-60);
            const d = (rb.entendi || []).join(' · ').toLowerCase();
            return fim(cartao(`${C.tipo === 'outra' ? 'Mais opções' : 'Separei'}${d ? ' (' + d + ')' : ''}:`, { livros: lv, nota, sugestoes: ['Outra opção', 'Algo mais curto', 'Em inglês'] }), 'outra opção');
          }
        }
        if (genero) ctx.genero = genero;
        const p2 = { ...perfil };
        p2.generos = Array.from(new Set([...(genero ? [genero.id] : []), ...humor.flatMap((h) => h.g || [])]));
        if (!p2.generos.length) p2.generos = perfil.generos || [];
        p2.tipos = Array.from(new Set([...(perfil.tipos || []).filter((t) => t !== 'curtas' && t !== 'longas'), ...humor.map((h) => h.t).filter(Boolean), ...(curto ? ['curtas'] : [])]));
        if (idioma) p2.idiomas = [idioma];
        const pr = await Lia.recomendar(p2, est);
        let livros = pr.filter((p) => !p.pago).flatMap((p) => p.livros);
        const vistos = new Set();
        livros = livros.filter((l) => !vistos.has(l.id) && vistos.add(l.id) && !ctx.ultimos.includes(l.id));
        if (genero) livros.sort((a, b) => ((b.g || []).includes(genero.id) - (a.g || []).includes(genero.id)));
        if (curto) livros = livros.filter((l) => !l.pal || l.pal < 30000);
        livros = livros.slice(0, 8);
        ctx.ultimos = [...ctx.ultimos, ...livros.map((l) => l.id)].slice(-60);
        const desc = [genero && genero.nome.toLowerCase(), ...humor.map((h) => h.frase), curto && !humor.some((h) => h.t === 'curtas') ? 'curto' : ''].filter(Boolean).join(', ');
        if (!livros.length) return cartao('Já te mostrei tudo o que combina com esse pedido no acervo livre. Quer tentar outro gênero ou idioma?', { sugestoes: ['Me indica um terror', 'Algo em inglês', 'Me indica um romance'] });
        return fim(cartao(`${C.tipo === 'outra' ? 'Mais opções' : desc ? 'Para algo ' + desc : 'Pensando no seu gosto'}${C.tipo === 'outra' && desc ? ' (' + desc + ')' : ''}, eu leria:`, { livros, sugestoes: ['Outra opção', 'Algo mais curto', 'Em inglês'] }), 'outra opção');
      }
      default: {
        const r = await Lia.buscarTudo(frase, est);
        const livros = [...(r.melhor && r.melhor.livro ? [r.melhor.livro] : []), ...r.livres.slice(0, 6), ...r.pagos.slice(0, 4)].filter((l, i, a) => a.findIndex((x) => x.id === l.id) === i);
        if (r.autores.length || livros.length) {
          if (r.autores[0] && r.autores[0].kb) ctx.autor = r.autores[0].kb;
          return cartao(r.entendi && r.entendi.length ? `Achei isto (${r.entendi.join(' · ').toLowerCase()}):` : 'Achei isto:', { autores: r.autores.slice(0, 3), livros });
        }
        return cartao('Não encontrei nada sobre isso. Você pode pedir uma indicação, perguntar sobre um autor, um livro ou um tema de literatura.', { sugestoes: ['Me indica um livro', 'O que foi o Romantismo?', 'Ajuda'] });
      }
    }
  }

  const entender = (frase) => classificar(frase);
  const pesos = (novos) => { if (novos) Object.assign(PC, novos); return { ...PC }; };
  return { responder, classificar, entender, corrige, buscaSaber, resumir, personagens, significado, pesos, contexto: () => ctx, limpar: () => { ctx = { autor: null, livro: null, genero: null, ultimos: [], ultimo: null, sug: null, giro: {} }; } };
})();
