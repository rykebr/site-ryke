/* Cérebro do chat do Ryke Treinos: entende a mensagem, lembra o contexto da conversa e responde sobre treino e dieta.
   Tudo local, sem internet. Valores dos alimentos aproximados da Tabela Brasileira de Composição de Alimentos (TACO) e rótulos comuns. */
const Cerebro=(()=>{
  /* ---------------- alimentos: por 100 g ---------------- */
  // k kcal, p proteína, c carboidrato, g gordura; por: porção típica em g; un: nome da unidade (quando faz sentido contar)
  // cat: proteina, carbo, fruta, gordura, laticinio, vegetal, extra; t: etiquetas
  const A=(n,k,p,c,g,cat,por,un,t,sin)=>({n,k,p,c,g,cat,por,un,t:t||[],sin:sin||[]});
  const ALIM={
    ovo:A('Ovo',146,13.3,.6,9.5,'proteina',50,'ovo',['ovo','vegetariano','cafe','jantar'],['ovos','ovo cozido','ovo mexido','omelete']),
    clara:A('Clara de ovo',52,11,.7,.2,'proteina',33,'clara',['ovo','vegetariano'],['claras']),
    frango:A('Peito de frango grelhado',159,32,0,2.5,'proteina',120,null,['carne','almoco','jantar'],['frango','peito de frango','file de frango','frango grelhado','frango desfiado']),
    patinho:A('Carne moída (patinho)',219,35.9,0,7.3,'proteina',100,null,['carne','almoco','jantar'],['carne moida','patinho','carne']),
    alcatra:A('Bife de alcatra',241,31.9,0,11.6,'proteina',120,null,['carne','almoco','jantar'],['bife','alcatra','carne vermelha','contrafile']),
    tilapia:A('Tilápia grelhada',128,26,0,2.7,'proteina',120,null,['peixe','almoco','jantar'],['tilapia','peixe','file de peixe']),
    atum:A('Atum em lata (em água)',116,26,0,1,'proteina',80,null,['peixe','lanche','jantar'],['atum']),
    sardinha:A('Sardinha em lata',208,24,0,12,'proteina',84,null,['peixe'],['sardinha']),
    peru:A('Peito de peru fatiado',98,17,2,2.6,'proteina',40,null,['carne','cafe','lanche'],['peito de peru','peru','presunto']),
    tofu:A('Tofu',76,8,1.9,4.8,'proteina',120,null,['vegano','vegetariano','almoco','jantar','cafe'],['tofu']),
    soja:A('Proteína de soja hidratada',110,17,10,.5,'proteina',100,null,['vegano','vegetariano','almoco','jantar'],['proteina de soja','pts','soja','carne de soja']),
    whey:A('Whey protein',400,78,8,6,'proteina',30,'dose',['lactose','vegetariano','lanche','cafe','pos'],['whey','proteina em po','shake']),
    leite:A('Leite desnatado',35,3.4,4.9,.2,'laticinio',200,'copo',['lactose','vegetariano','cafe','lanche'],['leite']),
    iogurte:A('Iogurte natural',51,4.1,1.9,3,'laticinio',170,'pote',['lactose','vegetariano','cafe','lanche'],['iogurte','iogurte natural']),
    iogurtepro:A('Iogurte proteico',63,9.4,5.6,.3,'laticinio',160,'pote',['lactose','vegetariano','cafe','lanche','pos'],['iogurte proteico','iogurte grego','yopro']),
    queijo:A('Queijo minas frescal',264,17.4,3.2,20.2,'laticinio',30,'fatia',['lactose','vegetariano','cafe','lanche'],['queijo','queijo minas','queijo branco']),
    cottage:A('Queijo cottage',98,11,3.4,4.3,'laticinio',50,null,['lactose','vegetariano','cafe','lanche'],['cottage']),
    arroz:A('Arroz branco cozido',128,2.5,28.1,.2,'carbo',150,null,['vegano','vegetariano','almoco','jantar'],['arroz','arroz branco']),
    arrozint:A('Arroz integral cozido',124,2.6,25.8,1,'carbo',150,null,['vegano','vegetariano','almoco','jantar'],['arroz integral']),
    feijao:A('Feijão cozido',76,4.8,13.6,.5,'carbo',100,'concha',['vegano','vegetariano','almoco','jantar'],['feijao','feijao preto','feijao carioca']),
    lentilha:A('Lentilha cozida',93,6.3,16.3,.5,'carbo',100,'concha',['vegano','vegetariano','almoco','jantar'],['lentilha']),
    graobico:A('Grão-de-bico cozido',164,8.9,27,2.6,'carbo',100,null,['vegano','vegetariano','almoco','jantar'],['grao de bico','grao-de-bico']),
    batata:A('Batata cozida',52,1.2,11.9,0,'carbo',150,null,['vegano','vegetariano','almoco','jantar'],['batata','batata inglesa','pure']),
    batatadoce:A('Batata-doce cozida',77,.6,18.4,.1,'carbo',150,null,['vegano','vegetariano','almoco','jantar','pre'],['batata doce','batata-doce']),
    mandioca:A('Mandioca cozida',125,.6,30.1,.3,'carbo',120,null,['vegano','vegetariano','almoco','jantar'],['mandioca','aipim','macaxeira']),
    macarrao:A('Macarrão cozido',158,5.8,31,.9,'carbo',150,null,['vegetariano','almoco','jantar'],['macarrao','espaguete','massa de macarrao']),
    pao:A('Pão francês',300,8,58.6,3.1,'carbo',50,'pão',['vegetariano','cafe','lanche'],['pao','pao frances','pao de sal','paozinho']),
    paoint:A('Pão integral',253,9.4,49.9,3.7,'carbo',25,'fatia',['vegano','vegetariano','cafe','lanche'],['pao integral','pao de forma']),
    tapioca:A('Tapioca',240,0,59,0,'carbo',60,null,['vegano','vegetariano','cafe','lanche'],['tapioca','goma de tapioca']),
    cuscuz:A('Cuscuz de milho',113,2.2,25.3,.7,'carbo',150,null,['vegano','vegetariano','cafe','jantar'],['cuscuz','cuscuz de milho']),
    aveia:A('Aveia em flocos',394,13.9,66.6,8.5,'carbo',30,null,['vegano','vegetariano','cafe','lanche','pre'],['aveia','farelo de aveia']),
    granola:A('Granola',420,10,70,12,'carbo',30,null,['vegetariano','cafe','lanche'],['granola']),
    banana:A('Banana',98,1.3,26,.1,'fruta',70,'banana',['vegano','vegetariano','cafe','lanche','pre'],['banana','banana prata']),
    maca:A('Maçã',56,.3,15.2,0,'fruta',130,'maçã',['vegano','vegetariano','lanche'],['maca']),
    mamao:A('Mamão',40,.5,10.4,.1,'fruta',150,'fatia',['vegano','vegetariano','cafe'],['mamao','papaia']),
    morango:A('Morango',30,.9,6.8,.3,'fruta',150,null,['vegano','vegetariano','lanche'],['morango','morangos']),
    laranja:A('Laranja',37,1,8.9,.1,'fruta',140,'laranja',['vegano','vegetariano','lanche'],['laranja']),
    abacate:A('Abacate',96,1.2,6,8.4,'gordura',100,null,['vegano','vegetariano','lanche'],['abacate']),
    pastaamendoim:A('Pasta de amendoim',600,25,20,50,'gordura',15,'colher',['vegano','vegetariano','lanche','cafe'],['pasta de amendoim','manteiga de amendoim']),
    castanha:A('Castanha de caju',570,18.5,29,46,'gordura',20,null,['vegano','vegetariano','lanche'],['castanha','castanhas','castanha de caju','castanha do para','nozes','oleaginosas']),
    azeite:A('Azeite',884,0,0,100,'gordura',10,'colher',['vegano','vegetariano','almoco','jantar'],['azeite','oleo']),
    salada:A('Salada de folhas e tomate',15,1,3,.2,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['salada','alface','tomate','folhas']),
    brocolis:A('Brócolis cozido',25,2.1,4.4,.5,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['brocolis','legumes','verduras']),
    chocolate:A('Chocolate 70%',540,8,37,41,'extra',20,null,['vegetariano'],['chocolate','chocolate amargo']),
    mel:A('Mel',309,0,84,0,'extra',15,'colher',['vegetariano','cafe'],['mel'])
  };
  const AIDS=Object.keys(ALIM);

  /* ---------------- texto ---------------- */
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9.,%\- ]+/g,' ').replace(/\s+/g,' ').trim();
  const fmt=n=>(Math.round(n*10)/10).toLocaleString('pt-BR');
  const fint=n=>Math.round(n).toLocaleString('pt-BR');
  /* distância de edição para tolerar erros de digitação */
  function dist(a,b,max){
    if(Math.abs(a.length-b.length)>max)return max+1;
    const m=a.length,n=b.length;let ant=Array.from({length:n+1},(_,j)=>j);
    for(let i=1;i<=m;i++){const cur=[i];let melhor=i;for(let j=1;j<=n;j++){const c=a[i-1]===b[j-1]?0:1;cur[j]=Math.min(ant[j]+1,cur[j-1]+1,ant[j-1]+c);if(cur[j]<melhor)melhor=cur[j];}if(melhor>max)return max+1;ant=cur;}
    return ant[n];
  }
  /* palavras comuns que nunca devem ser "corrigidas" */
  const COMUNS=new Set(('minha minhas meu meus sua seu nossa quero queria preciso posso pode devo tenho estou esta estava fazer faco faz fiz como quanto quanta quantos quantas qual quais quando onde porque para pra pro pelo pela '+
    'tudo todo toda todos todas bem mal muito muita pouco pouca mais menos outra outro outras outros alguma algum nenhum nada sempre nunca ainda agora hoje amanha ontem semana mes dias tempo hora horas minutos '+
    'alimentar alimentacao alimento alimentos comida comidas comer janta jantar almocar lanchar lanche tarde noite manha cafe almoco antes depois durante treinar treino treinos academia focar foco ficar ganhar perder '+
    'aumentar diminuir reduzir bater chegar atingir completar engordar emagrecer secar definir crescer melhor melhorar pior opcao opcoes sugestao sugestoes ideia ideias plano planos receita receitas prato pratos '+
    'gluteo gluteos perna pernas braco bracos ombro ombros costas peito barriga abdomen joelho lombar punho cotovelo dor doendo dolorido musculo musculos massa forca saude corpo peso altura idade '+
    'obrigado obrigada valeu beleza certo entendi legal show sabe saber falar fala voce ola bom boa dia '+
    'sem com mas porem tambem entao assim isso essa esse este aqui ali sim nao talvez vez vezes rapido rapida leve pesado pesada facil dificil normal '+
    'segunda terca quarta quinta sexta sabado domingo somente apenas define definir defina coloca colocar coloque adiciona adicionar adicione tira tirar tire remove remover troca trocar troque passa passar muda mudar inverte deixa deixar folga descanso descansar biceps triceps trapezio antebraco panturrilha quadriceps posterior posteriores exercicio exercicios superiores inferiores seja sejam sera fica fique vira virar inverte inverter substitui substituir substitua').split(' '));
  let VOCAB=null;
  function vocab(){
    if(VOCAB)return VOCAB;const v=new Set();
    const add=t=>norm(t).split(' ').forEach(w=>{if(w.length>=4)v.add(w);});
    AIDS.forEach(id=>{add(ALIM[id].n);ALIM[id].sin.forEach(add);});
    if(typeof EXS!=='undefined')Object.values(EXS).forEach(e=>add(e.n));
    (window.CONHECIMENTO||[]).forEach(k=>k.k.forEach(add));
    'cafe manha almoco jantar lanche cardapio dieta refeicao proteina caloria calorias carboidrato gordura emagrecer engordar treino exercicio vegano vegetariano lactose substituir trocar substituto quanto quantas quantos gramas porcao receita sugestao opcoes ideias musculo massa definir hipertrofia suplemento creatina whey descanso serie series repeticoes'.split(' ').forEach(w=>v.add(w));
    return VOCAB=v;
  }
  /* corrige palavras com erro de digitação para a palavra conhecida mais próxima */
  function corrige(txt){
    const V=vocab();
    return norm(txt).split(' ').map(w=>{
      if(w.length<4||V.has(w)||COMUNS.has(w)||/\d/.test(w))return w;
      const max=w.length>=8?2:1;let best=null,bd=max+1;
      for(const x of V){if(x[0]!==w[0]&&w.length<6)continue;const d=dist(w,x,max);if(d<bd){bd=d;best=x;if(d===1&&w.length<8)break;}}
      return best&&bd<=max?best:w;
    }).join(' ');
  }
  const tem=(t,re)=>re.test(t);

  /* ---------------- alimentos citados ---------------- */
  const SIN=[];AIDS.forEach(id=>[ALIM[id].n,...ALIM[id].sin].forEach(s=>SIN.push({s:norm(s),id})));SIN.sort((a,b)=>b.s.length-a.s.length);
  function alimentosNo(t){
    const achados=[];let resto=' '+t+' ';
    for(const {s,id} of SIN){const re=new RegExp('(?:^|\\s)'+s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'s?(?=\\s|$)');const m=resto.match(re);
      if(m){
        const antes=resto.slice(0,m.index+1).trim().split(' ').slice(-3).join(' ');
        const mq=antes.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|gramas|ml)?\s*(de)?$/)||antes.match(/(\d+(?:[.,]\d+)?)\s*(unidades?|fatias?|colher(?:es)?|potes?|copos?|conchas?|doses?)?\s*(de)?$/);
        let qtd=null;if(m&&mq){const v=parseFloat(mq[1].replace(',','.'));qtd=mq[2]&&/^(g|gr|gramas|ml)$/.test(mq[2])?{g:v}:{un:v};}
        achados.push({id,qtd});resto=resto.slice(0,m.index)+' '+resto.slice(m.index+m[0].length);}
    }
    return achados.filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
  }
  const gramasDe=(id,q)=>{const a=ALIM[id];if(!q)return a.por;if(q.g)return q.g;if(q.un)return q.un*a.por;return a.por;};
  const macros=(id,g)=>{const a=ALIM[id],f=g/100;return{k:a.k*f,p:a.p*f,c:a.c*f,g:a.g*f};};
  function medida(id,g){
    const a=ALIM[id];
    if(a.un){const n=Math.round(g/a.por*2)/2;if(n>=.5){const pl=n>1?(a.un.endsWith('ão')?a.un.slice(0,-2)+'ães':a.un.endsWith('l')?a.un.slice(0,-1)+'is':a.un+'s'):a.un;return `${fmt(n)} ${pl} (${fint(g)} g)`;}}
    return `${fint(g)} g`;
  }

  /* ---------------- preferências da dieta ---------------- */
  const pref=S=>{S.ia=S.ia||{};const d=S.ia.dieta=S.ia.dieta||{tipo:null,semLactose:false,naoCome:[]};d.naoCome=d.naoCome||[];return d;};
  function permitido(id,S){
    const a=ALIM[id],d=pref(S);
    if(d.naoCome.includes(id))return false;
    if(d.tipo==='vegano'&&!a.t.includes('vegano'))return false;
    if(d.tipo==='vegetariano'&&!a.t.includes('vegetariano'))return false;
    if(d.semLactose&&a.t.includes('lactose'))return false;
    return true;
  }

  /* ---------------- montador de refeições ---------------- */
  const MODELOS={
    cafe:[['ovo','tofu','iogurtepro','cottage'],['paoint','pao','tapioca','cuscuz','aveia'],['mamao','banana','morango'],['leite','iogurte','whey']],
    lanche:[['iogurtepro','whey','cottage','tofu','iogurte'],['aveia','granola','paoint'],['banana','maca','morango'],['pastaamendoim','castanha']],
    almoco:[['frango','patinho','tilapia','alcatra','soja','tofu','ovo'],['arroz','arrozint','batatadoce','macarrao','mandioca'],['feijao','lentilha','graobico'],['salada'],['azeite']],
    jantar:[['frango','tilapia','ovo','patinho','atum','tofu','soja'],['arroz','batatadoce','cuscuz','macarrao','batata'],['brocolis','salada'],['azeite']],
    pre:[['banana'],['aveia','paoint','tapioca'],['iogurtepro','whey','pastaamendoim','iogurte']],
    pos:[['whey','iogurtepro','ovo','frango','tofu'],['banana','batatadoce','paoint','arroz'],['laranja','morango','maca']]
  };
  const NOME_REF={cafe:'Café da manhã',lanche:'Lanche',almoco:'Almoço',jantar:'Jantar',pre:'Pré-treino',pos:'Pós-treino'};
  const DIST={cafe:.25,almoco:.35,lanche:.15,jantar:.25,pre:.12,pos:.15};
  function escolheItem(opcoes,S,semente){const ok=opcoes.filter(id=>permitido(id,S));if(!ok.length)return null;return ok[semente%ok.length];}
  function montarRefeicao(tipo,metaK,metaP,S,semente=0){
    const grupos=MODELOS[tipo]||MODELOS.lanche;
    /* um item de cada grupo, sem repetir alimento nem colocar dois laticínios */
    let itens=[];
    grupos.forEach(g=>{const id=escolheItem(g.filter(x=>!itens.some(y=>y.id===x||(ALIM[y.id].cat==='laticinio'&&ALIM[x].cat==='laticinio'))),S,semente);if(id)itens.push({id,g:ALIM[id].por});});
    const soma=()=>itens.reduce((t,x)=>{const m=macros(x.id,x.g);t.k+=m.k;t.p+=m.p;t.c+=m.c;t.g+=m.g;return t;},{k:0,p:0,c:0,g:0});
    const lim=(x,min,max)=>Math.max(min,Math.min(max,x));
    const prot=itens.find(x=>ALIM[x.id].cat==='proteina'||(ALIM[x.id].cat==='laticinio'&&grupos[0].includes(x.id)));
    const carbo=itens.find(x=>ALIM[x.id].cat==='carbo');
    for(let volta=0;volta<4;volta++){
      if(prot){const outros=soma().p-macros(prot.id,prot.g).p,falta=metaP-outros,pp=ALIM[prot.id].p;if(pp>0)prot.g=lim(falta/pp*100,ALIM[prot.id].por*.75,ALIM[prot.id].por*(prot.id==='ovo'?3:2));}
      if(carbo){const outros=soma().k-macros(carbo.id,carbo.g).k,falta=metaK-outros,kc=ALIM[carbo.id].k;if(kc>0)carbo.g=lim(falta/kc*100,ALIM[carbo.id].por*.5,ALIM[carbo.id].por*(ALIM[carbo.id].un?3:2));}
    }
    /* arredonda para medidas fáceis */
    itens.forEach(x=>{const a=ALIM[x.id];if(a.un){const meio=a.un==='colher'||a.un==='concha';x.g=(meio?Math.max(.5,Math.round(x.g/a.por*2)/2):Math.max(1,Math.round(x.g/a.por)))*a.por;}else{const passo=x.g>=100?10:5;x.g=Math.max(passo,Math.round(x.g/passo)*passo);}});
    return{tipo,nome:NOME_REF[tipo],itens:itens.map(x=>({id:x.id,n:ALIM[x.id].n,g:x.g,med:medida(x.id,x.g),...macros(x.id,x.g)})),tot:soma(),meta:{k:metaK,p:metaP}};
  }
  function metas(S){const c=IA.calc(S.perfil,S.ia&&S.ia.ajKcal);return{k:c.kcal,p:c.prot};}
  function cardapio(S,semente=0){
    const m=metas(S),ref=['cafe','almoco','lanche','jantar'];
    const refs=ref.map((t,i)=>montarRefeicao(t,m.k*DIST[t],m.p*DIST[t],S,semente+i));
    const tot=refs.reduce((t,r)=>({k:t.k+r.tot.k,p:t.p+r.tot.p,c:t.c+r.tot.c,g:t.g+r.tot.g}),{k:0,p:0,c:0,g:0});
    return{refs,tot,meta:m};
  }

  /* ---------------- reconhecimento de intenção ---------------- */
  const REFEICAO_RE=[['cafe',/\b(cafe da manha|cafe|desjejum|manha)\b/],['almoco',/\balmoco\b/],['jantar',/\b(jantar|janta|noite)\b/],['pre',/\b(pre treino|pre-treino|antes do treino|antes de treinar)\b/],['pos',/\b(pos treino|pos-treino|depois do treino|apos o treino|depois de treinar)\b/],['lanche',/\b(lanche|lanchinho|merenda|tarde)\b/]];
  const refeicaoNo=t=>{for(const [k,re] of REFEICAO_RE)if(re.test(t))return k;return null;};
  const PEDE_COMIDA=/\b(o que (eu )?(posso|devo|vou|da pra|como)|comer|comida|refeic|sugest|suger|ideia|opc|monta|monte|cardapio|dieta|plano alimentar|receita|prato|janta|almocar|lanchar)/;

  function responder(texto,S,ctx){
    ctx=ctx||{};
    const bruto=String(texto||'').trim();if(!bruto)return null;
    const t=corrige(bruto),p=S.perfil||{},nome=(p.nome||'').split(' ')[0];
    const d=pref(S);
    const r=(o)=>{ctx.ultimo=o.ctx||ctx.ultimo;delete o.ctx;return o;};

    /* conversa */
    if(/^(obrigad[oa]|valeu|vlw|brigad[oa]|show|top|perfeito|otimo|massa|beleza|blz|ok|certo|entendi)\b/.test(t)&&t.split(' ').length<=4)return r({int:'social:obrigado',txt:'Por nada! Se precisar de mais alguma coisa sobre treino ou alimentação, é só chamar.'});
    if(/\b(quem e voce|o que voce faz|o que voce sabe|voce e uma ia|como voce funciona)\b/.test(t)||/^(ajuda|help|me ajuda|socorro)\??$/.test(t))return r({int:'social:ajuda',txt:`Sou o Coach IA do Ryke Treinos e rodo direto no seu aparelho, sem internet. Posso montar cardápios com as suas metas, dizer quanto de proteína e calorias tem cada alimento, sugerir trocas, explicar exercícios e mexer no seu plano de treino.`,sugs:['Monte meu cardápio de hoje','Quanta proteína tem 3 ovos?','O que comer antes do treino?','Não gosto de leg press']});
    if(/\b(tudo bem|como vai|como voce esta|blz\?)\b/.test(t))return r({int:'social:oi',txt:`Tudo ótimo por aqui${nome?', '+nome:''}! E o treino, como está?`});

    /* preferências da dieta */
    if(/\b(sou|virei|agora sou)\s+(vegan[oa])\b|\bnao como nada de origem animal\b/.test(t)){d.tipo='vegano';return r({int:'pref:vegano',txt:'Anotado: sou vegano(a) nas suas sugestões. Vou usar tofu, soja, leguminosas, aveia e oleaginosas como fontes de proteína.',salvar:1});}
    if(/\b(sou|virei)\s+vegetarian[oa]\b|\bnao como carne\b/.test(t)){d.tipo='vegetariano';return r({int:'pref:vegetariano',txt:'Anotado: sem carne e sem peixe nas suas sugestões. Ovos, laticínios, tofu e leguminosas entram como proteína.',salvar:1});}
    if(/\b(intolerante|intolerancia|alergi[ac]a?|nao tomo|nao posso tomar|sem)\b.*\b(lactose|leite)\b/.test(t)&&!PEDE_COMIDA.test(t)){d.semLactose=true;return r({int:'pref:lactose',txt:'Anotado: sem lactose. Tiro leite, iogurte, queijo e whey concentrado das sugestões. Whey isolado e versões zero lactose costumam ser bem toleradas.',salvar:1});}
    if(/\b(como carne|nao sou mais vegan|nao sou vegetarian|voltei a comer carne|pode carne)\b/.test(t)){d.tipo=null;return r({int:'pref:onivoro',txt:'Combinado, voltei a incluir carnes e peixes nas sugestões.',salvar:1});}
    const naoGosto=t.match(/\b(nao gosto de|nao como|odeio|tirar|sem)\s+(.+)$/);
    if(naoGosto){const al=alimentosNo(naoGosto[2]);if(al.length&&(/\b(nao gosto|nao como|odeio)\b/.test(t)||ctx.ultimo&&ctx.ultimo.tipo==='comida')){
      al.forEach(x=>{if(!d.naoCome.includes(x.id))d.naoCome.push(x.id);});
      const lista=al.map(x=>ALIM[x.id].n.toLowerCase()).join(', ');
      if(ctx.ultimo&&ctx.ultimo.tipo==='comida'){const o=refazerComida(ctx.ultimo,S,(ctx.ultimo.semente||0)+1);o.txt=`Tirei ${lista}. `+o.txt;o.int='comida:refazer';o.salvar=1;return r(o);}
      return r({int:'pref:naocome',txt:`Anotado: sem ${lista} nas suas sugestões.`,salvar:1});}}

    /* continuação da conversa */
    if(ctx.ultimo&&ctx.ultimo.tipo==='comida'&&/\b(outra|outro|mais opc|mais uma|outra opc|diferente|trocar|muda|mudar)/.test(t)&&t.split(' ').length<=6){const o=refazerComida(ctx.ultimo,S,(ctx.ultimo.semente||0)+1);o.int='comida:outra';return r(o);}
    const so_ref=refeicaoNo(t);
    if(so_ref&&ctx.ultimo&&ctx.ultimo.tipo==='comida'&&/^(e\s+)?(no|na|o|a|pro|pra|para o|para a)?\s*\w+(\s\w+){0,3}\??$/.test(t)&&t.split(' ').length<=5){
      const m=metas(S),o=refeicaoResp(so_ref,m,S,0);o.int='refeicao:'+so_ref;return r(o);}

    /* ações no plano de treino (trocar exercício, dias, tempo, foco, dor, registrar peso...) */
    const cmd=IA.comando(t,S);
    if(cmd&&!alimentosNo(t).length&&!refeicaoNo(t)){cmd.int='cmd'+(cmd.fazer?':'+cmd.fazer.tipo:'');return r({...cmd,ctx:{tipo:'cmd'}});}

    /* comida */
    const als=alimentosNo(t);
    const querTroca=/\b(substitu|trocar|troca|no lugar|em vez|alternativa|equivalente)/.test(t);
    const suplemento=/\b(preciso|vale a pena|funciona|devo tomar|tomar|serve)\b/.test(t)&&als.some(x=>x.id==='whey');
    if(als.length&&querTroca){const id=als[0].id,a=ALIM[id];
      const eq=AIDS.filter(x=>x!==id&&ALIM[x].cat===a.cat&&permitido(x,S)).slice(0,6).map(x=>{const g=Math.round(macros(id,gramasDe(id,als[0].qtd)).k/ALIM[x].k*100/5)*5;return `${ALIM[x].n}: ${medida(x,g)}`;});
      return r({int:'alimento:troca',txt:`No lugar de ${medida(id,gramasDe(id,als[0].qtd))} de ${a.n.toLowerCase()}, com as mesmas calorias:\n• ${eq.join('\n• ')}`,ctx:{tipo:'alimento',id}});}
    if(!suplemento&&(als.length&&!PEDE_COMIDA.test(t)||als.length&&/\b(quanto|quanta|quantas|quantos|tem|calorias|caloria|kcal|proteina|carbo|gordura|macro|engorda|faz bem|e bom|saudavel)\b/.test(t)&&!refeicaoNo(t))){
      const linhas=als.map(x=>{const g=gramasDe(x.id,x.qtd),m=macros(x.id,g);return{n:ALIM[x.id].n,med:medida(x.id,g),...m};});
      const tot=linhas.reduce((s,l)=>({k:s.k+l.k,p:s.p+l.p,c:s.c+l.c,g:s.g+l.g}),{k:0,p:0,c:0,g:0});
      let txt=linhas.length===1?`${linhas[0].med} de ${linhas[0].n.toLowerCase()}: ${fint(linhas[0].k)} kcal, ${fmt(linhas[0].p)} g de proteína, ${fmt(linhas[0].c)} g de carboidrato e ${fmt(linhas[0].g)} g de gordura.`:`Somando tudo: ${fint(tot.k)} kcal e ${fmt(tot.p)} g de proteína.`;
      if(/\bengorda\b/.test(t))txt+=' Nenhum alimento sozinho engorda: o que conta é o total de calorias do dia.';
      if(p.peso){const m=metas(S);txt+=` Isso é ${Math.round(tot.p/m.p*100)}% da sua proteína e ${Math.round(tot.k/m.k*100)}% das calorias do dia.`;}
      return r({int:'alimento:info',txt,tabela:linhas.length>1?{linhas,tot}:null,ctx:{tipo:'alimento',id:als[0].id}});}
    const ref=refeicaoNo(t);
    if(/\b(cardapio|dieta|plano alimentar|o que comer (hoje|no dia|durante o dia|o dia (todo|inteiro))|refeicoes do dia|dia inteiro|minha alimentacao|alimentacao do dia)\b/.test(t)&&(!ref||/\b(dia|hoje|completo)\b/.test(t))){
      const o=cardapioResp(S,0);o.int='cardapio';return r(o);}
    if(ref&&(PEDE_COMIDA.test(t)||/\b(proteina|proteico|leve|rapido|pratico|saudavel|bom)\b/.test(t)||t.split(' ').length<=3)){const m=metas(S),o=refeicaoResp(ref,m,S,0);o.int='refeicao:'+ref;return r(o);}
    if(/\b(bater|chegar|atingir|completar|aumentar)\b.*\bproteina\b|\bfontes? de proteina\b|\bricos? em proteina\b|\b(onde|quais|que) (alimentos? )?(encontro|tem|acho|achar|tenho)\b.*\bproteina\b|\bproteina (na|da) comida\b/.test(t)){
      const m=metas(S),top=['frango','ovo','tilapia','patinho','atum','iogurtepro','whey','tofu','soja','lentilha','cottage'].filter(id=>permitido(id,S)).slice(0,7);
      return r({int:'proteina:dicas',txt:`Sua meta é ${m.p} g de proteína por dia, umas ${Math.round(m.p/4)} g em cada uma de 4 refeições. Boas fontes, por porção:\n• ${top.map(id=>`${ALIM[id].n}: ${medida(id,ALIM[id].por)} = ${fmt(macros(id,ALIM[id].por).p)} g`).join('\n• ')}`,sugs:['Monte meu cardápio de hoje','Café da manhã com proteína']});}

    /* treino, números e base de conhecimento (motor da IA) */
    const base=IA.responder(t,S);
    if(base&&!base.nada){base.int=base.ex?'exercicio':base.tema?'kb:'+base.tema:'numeros';return r({...base,ctx:{tipo:'treino'}});}
    return r({int:'nada',txt:'Não entendi bem. Posso ajudar com treino, alimentação e o seu plano. Tente uma destas:',sugs:['Monte meu cardápio de hoje','O que comer antes do treino?','Quanta proteína tem 100 g de frango?','Como fazer o supino?','Quero treinar 4 dias','Creatina funciona?']});
  }
  function refeicaoResp(tipo,m,S,semente){
    const rf=montarRefeicao(tipo,m.k*DIST[tipo],m.p*DIST[tipo],S,semente);
    const extra=tipo==='pre'?' Coma de 30 a 90 minutos antes de treinar.':tipo==='pos'?' Pode ser até 2 horas depois do treino.':'';
    return{txt:`${rf.nome} para a sua meta: ${fint(rf.tot.k)} kcal e ${fmt(rf.tot.p)} g de proteína.${extra}`,refeicoes:[rf],sugs:['Outra opção','Monte o cardápio do dia completo'],ctx:{tipo:'comida',ref:tipo,semente}};
  }
  function cardapioResp(S,semente){
    const c=cardapio(S,semente);
    return{txt:`Cardápio para ${fint(c.meta.k)} kcal e ${c.meta.p} g de proteína. Deu ${fint(c.tot.k)} kcal e ${fmt(c.tot.p)} g de proteína.`,refeicoes:c.refs,tot:c.tot,sugs:['Outra opção','Quero sem ovo','Sou vegetariano'],ctx:{tipo:'comida',ref:'dia',semente}};
  }
  function refazerComida(u,S,semente){return u.ref==='dia'?cardapioResp(S,semente):refeicaoResp(u.ref,metas(S),S,semente);}

  return{responder,ALIM,cardapio,montarRefeicao,corrige,alimentosNo,norm};
})();
