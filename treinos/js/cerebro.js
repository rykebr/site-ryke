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
    castanha:A('Castanha de caju',570,18.5,29,46,'gordura',20,null,['vegano','vegetariano','lanche'],['castanha','castanhas','castanha de caju','oleaginosas']),
    azeite:A('Azeite',884,0,0,100,'gordura',10,'colher',['vegano','vegetariano','almoco','jantar'],['azeite','oleo']),
    salada:A('Salada de folhas e tomate',15,1,3,.2,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['salada','alface','tomate','folhas']),
    brocolis:A('Brócolis cozido',25,2.1,4.4,.5,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['brocolis','legumes','verduras']),
    chocolate:A('Chocolate 70%',540,8,37,41,'extra',20,null,['vegetariano'],['chocolate','chocolate amargo']),
    mel:A('Mel',309,0,84,0,'extra',15,'colher',['vegetariano','cafe'],['mel']),
    /* proteínas */
    coxa:A('Coxa de frango sem pele',167,26.9,0,5.8,'proteina',120,null,['carne','almoco','jantar'],['coxa de frango','sobrecoxa','frango assado']),
    lombo:A('Lombo de porco assado',210,35.7,0,6.4,'proteina',120,null,['carne','almoco','jantar'],['lombo','carne de porco','porco','bisteca']),
    salmao:A('Salmão grelhado',208,25.4,0,12,'proteina',120,null,['peixe','almoco','jantar'],['salmao']),
    camarao:A('Camarão cozido',90,19,0,1,'proteina',100,null,['peixe','almoco','jantar'],['camarao','camaroes']),
    figado:A('Fígado bovino grelhado',225,29.9,4.2,9,'proteina',100,null,['carne'],['figado','bife de figado']),
    hamburguer:A('Hambúrguer de carne grelhado',210,13.2,11.3,12.4,'proteina',90,'hambúrguer',['carne'],['hamburguer de carne','carne de hamburguer','hamburguer caseiro']),
    linguica:A('Linguiça toscana grelhada',296,23,0,22,'proteina',60,null,['carne'],['linguica','calabresa']),
    salsicha:A('Salsicha',257,12,3,22,'proteina',50,'salsicha',['carne'],['salsicha','salsichas','cachorro quente']),
    codorna:A('Ovo de codorna',177,13.7,.8,12.7,'proteina',10,'ovo',['ovo','vegetariano'],['ovo de codorna','ovos de codorna']),
    barraprot:A('Barra de proteína',350,33,35,11,'proteina',45,'barra',['lactose','vegetariano','lanche'],['barra de proteina','barrinha de proteina']),
    /* laticínios */
    mussarela:A('Queijo muçarela',330,22.6,3,25.2,'laticinio',30,'fatia',['lactose','vegetariano','cafe','lanche'],['mussarela','mucarela','muzzarela','queijo mussarela','queijo prato']),
    requeijao:A('Requeijão',257,9.6,2.4,23.4,'laticinio',30,'colher',['lactose','vegetariano','cafe','lanche'],['requeijao','cream cheese']),
    ricota:A('Ricota',140,12.6,3.8,8.1,'laticinio',50,null,['lactose','vegetariano','cafe','lanche'],['ricota']),
    leiteint:A('Leite integral',61,3.2,4.7,3.3,'laticinio',200,'copo',['lactose','vegetariano','cafe','lanche'],['leite integral']),
    manteiga:A('Manteiga',726,.4,0,82,'gordura',10,'colher',['lactose','vegetariano','cafe'],['manteiga','margarina']),
    /* carboidratos */
    milho:A('Milho verde',98,3.2,17.1,2.4,'carbo',100,null,['vegano','vegetariano','almoco','jantar'],['milho','milho verde','espiga']),
    ervilha:A('Ervilha',74,4.6,13.4,.4,'carbo',100,null,['vegano','vegetariano','almoco','jantar'],['ervilha','ervilhas']),
    quinoa:A('Quinoa cozida',120,4.4,21.3,1.9,'carbo',120,null,['vegano','vegetariano','almoco','jantar'],['quinoa','quinua']),
    inhame:A('Inhame cozido',97,2.1,23.2,.1,'carbo',150,null,['vegano','vegetariano','almoco','jantar','cafe'],['inhame']),
    farofa:A('Farofa pronta',406,2.1,80,9,'carbo',30,'colher',['vegetariano','almoco'],['farofa','farinha de mandioca']),
    paoqueijo:A('Pão de queijo',363,5.1,34.2,24.6,'carbo',25,'unidade',['lactose','vegetariano','cafe','lanche'],['pao de queijo','paes de queijo']),
    biscarroz:A('Biscoito de arroz',387,8,81,3,'carbo',9,'biscoito',['vegano','vegetariano','lanche'],['biscoito de arroz','bolacha de arroz']),
    cracker:A('Bolacha cream cracker',432,10.1,68.7,14.4,'carbo',6,'bolacha',['vegetariano','lanche'],['cream cracker','bolacha agua e sal','biscoito agua e sal','bolacha salgada']),
    wrap:A('Pão folha (wrap)',310,8,52,7,'carbo',40,'disco',['vegano','vegetariano','lanche','jantar'],['wrap','rap10','rap 10','tortilha','pao folha']),
    cereal:A('Cereal matinal',380,7,85,1,'carbo',30,null,['vegetariano','cafe'],['cereal','cereal matinal','sucrilhos','corn flakes']),
    feijoada:A('Feijoada',117,8.7,11.6,6.5,'carbo',250,'concha',['carne','almoco'],['feijoada']),
    /* frutas */
    uva:A('Uva',53,.7,13.6,.2,'fruta',100,null,['vegano','vegetariano','lanche'],['uva','uvas']),
    uvapassa:A('Uva-passa',299,3.1,79,.5,'fruta',20,null,['vegano','vegetariano','lanche'],['uva passa','passas']),
    abacaxi:A('Abacaxi',48,.9,12.3,.1,'fruta',150,'fatia',['vegano','vegetariano','lanche','cafe'],['abacaxi']),
    manga:A('Manga',60,.6,15.6,.3,'fruta',150,null,['vegano','vegetariano','lanche','cafe'],['manga']),
    melancia:A('Melancia',33,.9,8.1,0,'fruta',200,'fatia',['vegano','vegetariano','lanche','cafe'],['melancia']),
    pera:A('Pera',53,.6,14,.1,'fruta',130,'pera',['vegano','vegetariano','lanche'],['pera']),
    acai:A('Açaí na tigela (com xarope)',110,.7,21.5,3.7,'fruta',200,null,['vegano','vegetariano','lanche'],['acai','acai na tigela']),
    /* gorduras boas */
    amendoim:A('Amendoim torrado',606,22.5,18.7,54,'gordura',20,null,['vegano','vegetariano','lanche'],['amendoim']),
    chia:A('Chia',486,16.5,42,30.7,'gordura',12,'colher',['vegano','vegetariano','cafe','lanche'],['chia','semente de chia']),
    linhaca:A('Linhaça',495,14.1,43.3,32.3,'gordura',10,'colher',['vegano','vegetariano','cafe','lanche'],['linhaca']),
    castpara:A('Castanha-do-pará',643,14.5,15.1,63.5,'gordura',4,'castanha',['vegano','vegetariano','lanche'],['castanha do para','castanha-do-para','castanha do brasil']),
    nozes:A('Nozes',620,14,18,59,'gordura',20,null,['vegano','vegetariano','lanche'],['nozes','noz']),
    /* legumes e verduras */
    cenoura:A('Cenoura',34,1.3,7.7,.2,'vegetal',80,null,['vegano','vegetariano','almoco','jantar'],['cenoura']),
    abobora:A('Abóbora cozida',48,1.4,10.8,.7,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['abobora','jerimum']),
    beterraba:A('Beterraba cozida',32,1.3,7.2,.1,'vegetal',80,null,['vegano','vegetariano','almoco','jantar'],['beterraba']),
    abobrinha:A('Abobrinha cozida',15,1.1,3,.2,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['abobrinha']),
    couve:A('Couve',27,2.9,4.3,.5,'vegetal',60,null,['vegano','vegetariano','almoco','jantar'],['couve','espinafre','rucula','agriao']),
    pepino:A('Pepino',10,.9,2,0,'vegetal',100,null,['vegano','vegetariano','almoco','jantar'],['pepino']),
    /* bebidas */
    refri:A('Refrigerante',42,0,10.6,0,'bebida',350,'lata',['vegano','vegetariano'],['refrigerante','refri','coca','coca cola','guarana']),
    refrizero:A('Refrigerante zero',1,0,.1,0,'bebida',350,'lata',['vegano','vegetariano'],['refrigerante zero','refri zero','coca zero','refrigerante diet']),
    cerveja:A('Cerveja',41,.3,3.3,0,'bebida',350,'lata',['vegano','vegetariano','alcool'],['cerveja','chopp','chope']),
    vinho:A('Vinho tinto',85,.1,2.6,0,'bebida',150,'taça',['vegano','vegetariano','alcool'],['vinho','vinho tinto','vinho branco']),
    suco:A('Suco de laranja natural',42,.7,9.6,.1,'bebida',200,'copo',['vegano','vegetariano','cafe','lanche'],['suco de laranja','suco natural','suco']),
    aguacoco:A('Água de coco',22,0,5.3,0,'bebida',200,'copo',['vegano','vegetariano','lanche'],['agua de coco']),
    cafe:A('Café coado sem açúcar',2,.1,.3,0,'bebida',100,'xícara',['vegano','vegetariano','cafe'],['cafe preto','cafe coado','cafezinho','xicara de cafe','cafe sem acucar']),
    /* extras */
    acucar:A('Açúcar',387,0,99.5,0,'extra',10,'colher',['vegano','vegetariano'],['acucar']),
    pizza:A('Pizza de muçarela',270,11,30,11.5,'extra',100,'fatia',['lactose','vegetariano'],['pizza']),
    sanduiche:A('Hambúrguer de lanchonete',260,13,28,10.5,'extra',200,'sanduíche',['carne'],['hamburguer','x burguer','x-burguer','xis','cheeseburger','big mac','sanduiche']),
    coxinha:A('Coxinha frita',283,9.6,34.5,11.8,'extra',80,'coxinha',['carne'],['coxinha','salgado frito','pastel']),
    sorvete:A('Sorvete de massa',200,3.5,24,10,'extra',60,'bola',['lactose','vegetariano'],['sorvete','picole']),
    pipoca:A('Pipoca com óleo',448,9.9,70,15.9,'extra',30,null,['vegano','vegetariano','lanche'],['pipoca']),
    bolo:A('Bolo simples',330,5,52,11,'extra',60,'fatia',['vegetariano','lanche','cafe'],['bolo','bolo de cenoura','bolo de chocolate']),
    biscrecheado:A('Biscoito recheado',472,6.4,70.5,19.6,'extra',13,'biscoito',['vegetariano','lanche'],['biscoito recheado','bolacha recheada','oreo','negresco']),
    batatafrita:A('Batata frita',267,5,35.6,13.1,'extra',100,null,['vegano','vegetariano'],['batata frita','fritas'])
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
    'segunda terca quarta quinta sexta sabado domingo somente apenas define definir defina coloca colocar coloque adiciona adicionar adicione tira tirar tire remove remover troca trocar troque passa passar muda mudar inverte deixa deixar folga descanso descansar biceps triceps trapezio antebraco panturrilha quadriceps posterior posteriores exercicio exercicios superiores inferiores seja sejam sera fica fique vira virar inverte inverter substitui substituir substitua '+
    'serve servem sirvo ajuda ajudam ajudar funciona funcionam atrapalha atrapalham vale valem adianta resolve presta piora melhora usar usando uso tomar tomo tomando beber bebo comer como comendo dormir durmo durmi sinto sente senti doer doeu passa passou volta voltar voltei comecei comecar parar parei faltei falta fico fiquei ficou estava estive deve devia seria sendo ser sou somos sao foi fosse tinha teria quer quis '+
    'bora vamo vamos partiu mano cara tipo coisa coisas gente certeza acho sera pode podia queria gostaria consigo consegue '+
    'peguei pego levantei levanto recorde maximo maxima repeticoes repeticao gasto gasta gastei queimo queima queimar queimei perco perde '+
    'corro corri correr correndo corrida caminho caminhei caminhar caminhando caminhada pedalo pedalei pedalar nado nadei nadar treinei malho malhei '+
    'calorico calorica diario diaria cintura percentual quilos kilos semanas meses chegar atingir pesar ultimo ultima versus comparar compara melhor pior quantos quantas metabolismo basal').split(' '));
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
        const mq=antes.match(/(\d+(?:[.,]\d+)?)\s*(g|gr|gramas|ml)?\s*(de)?$/)||antes.match(/(\d+(?:[.,]\d+)?)\s*(unidades?|fatias?|colher(?:es)?|potes?|copos?|conchas?|doses?|latas?|tacas?|xicaras?|bolas?|barras?|discos?)?\s*(de)?$/);
        let qtd=null;if(m&&mq){const v=parseFloat(mq[1].replace(',','.'));qtd=mq[2]&&/^(g|gr|gramas|ml)$/.test(mq[2])?{g:v}:{un:v};}
        achados.push({id,qtd});resto=resto.slice(0,m.index)+' '+resto.slice(m.index+m[0].length);}
    }
    return achados.filter((x,i,a)=>a.findIndex(y=>y.id===x.id)===i);
  }
  const gramasDe=(id,q)=>{const a=ALIM[id];if(!q)return a.por;if(q.g)return q.g;if(q.un)return q.un*a.por;return a.por;};
  const macros=(id,g)=>{const a=ALIM[id],f=g/100;return{k:a.k*f,p:a.p*f,c:a.c*f,g:a.g*f};};
  function medida(id,g){
    const a=ALIM[id];
    if(a.un){const n=Math.round(g/a.por*2)/2;if(n>=.5){const pl=n>1?(a.un.endsWith('ão')?a.un.slice(0,-2)+'ães':a.un.endsWith('l')?a.un.slice(0,-1)+'is':/[rz]$/.test(a.un)?a.un+'es':a.un+'s'):a.un;return `${fmt(n)} ${pl} (${fint(g)} g)`;}}
    return `${fint(g)} g`;
  }

  /* quantidade com o nome do alimento, sem repetir quando a unidade já é o alimento */
  function qtdDe(id,g){const a=ALIM[id],m=medida(id,g);return a.un&&/\(/.test(m)&&norm(a.n).startsWith(norm(a.un))?m:`${m} de ${a.n.toLowerCase()}`;}

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
    cafe:[['ovo','tofu','iogurtepro','cottage','ricota'],['paoint','pao','tapioca','cuscuz','aveia','inhame'],['mamao','banana','morango','abacaxi','melancia'],['leite','iogurte','whey']],
    lanche:[['iogurtepro','whey','cottage','tofu','iogurte'],['aveia','granola','paoint','biscarroz'],['banana','maca','morango','uva','pera','manga'],['pastaamendoim','castanha','amendoim','nozes']],
    almoco:[['frango','patinho','tilapia','alcatra','soja','tofu','ovo','coxa','lombo','salmao'],['arroz','arrozint','batatadoce','macarrao','mandioca','quinoa','inhame'],['feijao','lentilha','graobico'],['salada','cenoura','beterraba','couve'],['azeite']],
    jantar:[['frango','tilapia','ovo','patinho','atum','tofu','soja','salmao','coxa','camarao'],['arroz','batatadoce','cuscuz','macarrao','batata','wrap'],['brocolis','salada','abobrinha','abobora'],['azeite']],
    pre:[['banana'],['aveia','paoint','tapioca','biscarroz'],['iogurtepro','whey','pastaamendoim','iogurte']],
    pos:[['whey','iogurtepro','ovo','frango','tofu'],['banana','batatadoce','paoint','arroz'],['laranja','morango','maca','abacaxi','uva']]
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

  /* ---------------- cálculos e dados da pessoa ---------------- */
  const num=s=>parseFloat(String(s).replace(',','.'));
  const dataBR=d=>d?d.slice(8,10)+'/'+d.slice(5,7):'';
  const r05=x=>Math.round(x*2)/2;
  /* carga máxima estimada: média de Epley e Brzycki até 10 repetições */
  function umRM(kg,reps){if(reps<=1)return kg;const ep=kg*(1+reps/30);return reps<=10?(ep+kg*36/(37-reps))/2:ep;}
  function rmResp(kg,reps,id){
    const m=umRM(kg,reps),tab=[1,3,5,8,10,12].map(n=>`• ${n} ${n===1?'repetição':'repetições'}: ${fmt(r05(n===1?m:m/(1+n/30)))} kg`);
    return{txt:`${id?EXS[id].n+': c':'C'}om ${fmt(kg)} kg × ${reps}, sua carga máxima estimada é de ${fmt(r05(m))} kg. Para cada faixa de repetições:\n${tab.join('\n')}\nÉ uma estimativa com margem de uns 5%. Não precisa testar o máximo para evoluir.`,ex:id||undefined};
  }
  /* histórico de um exercício: todas as sessões em que ele foi feito */
  function histEx(S,id){const L=[];(S.hist||[]).forEach(h=>(h.ex||[]).forEach(e=>{if(e.id===id&&e.sets&&e.sets.length)L.push({data:h.data,sets:e.sets});}));return L.sort((a,b)=>String(a.data).localeCompare(String(b.data)));}
  function melhorSerie(L){let b=null;L.forEach(x=>x.sets.forEach(s=>{const kg=+s.kg||0,rp=+s.r||0;if(!rp)return;const v=kg?umRM(kg,rp):rp;if(!b||v>b.v)b={v,kg,r:rp,data:x.data};}));return b;}
  const serieTxt=(s,seg)=>(+s.kg?`${fmt(+s.kg)} kg × ${s.r}`:`${s.r}${seg?' s':' repetições'}`);
  function histResp(S,id){
    const e=EXS[id],L=histEx(S,id);
    if(!L.length)return{txt:`Você ainda não registrou ${e.n} em nenhum treino. Quando fizer, eu mostro aqui as cargas e a evolução.`,ex:id};
    const u=L[L.length-1],b=melhorSerie(L),pri=L[0];
    let t=`${e.n}, última vez em ${dataBR(u.data)}: ${u.sets.map(s=>serieTxt(s,e.seg)).join(', ')}.`;
    if(b)t+=` Melhor série: ${serieTxt(b,e.seg)} em ${dataBR(b.data)}.`;
    if(b&&b.kg)t+=` Carga máxima estimada: ${fmt(r05(umRM(b.kg,b.r)))} kg.`;
    if(L.length>=3){const b0=melhorSerie([pri]);if(b0&&b){const a=b0.kg?umRM(b0.kg,b0.r):b0.r,z=b.kg?umRM(b.kg,b.r):b.r;if(z>a*1.02)t+=` Desde ${dataBR(pri.data)} você ficou uns ${Math.round((z/a-1)*100)}% mais forte nele.`;}}
    return{txt:t+` Foram ${L.length} ${L.length===1?'sessão':'sessões'} registradas.`,ex:id};
  }
  /* "quanto peguei no supino": com uma palavra só, escolhe o exercício desse tipo que a pessoa mais faz */
  const VAGAS=new Set('peso corpo livre barra halter halteres maquina polia banco sentado sentada pegada aberta fechada inclinado declinado reto unilateral alternada alternado mochila cadeira cabo frontal'.split(' '));
  function exPorPalavra(S,t){
    const w=new Set(norm(t).split(' ').filter(x=>x.length>=4&&!VAGAS.has(x))),cont={};
    (S.hist||[]).forEach(h=>(h.ex||[]).forEach(e=>{cont[e.id]=(cont[e.id]||0)+1;}));
    Object.values(S.plano&&S.plano.dias||{}).forEach(D=>D.ex.forEach(it=>{cont[it.id]=(cont[it.id]||0)+.5;}));
    const c=Object.keys(cont).filter(id=>EXS[id]&&norm(EXS[id].n.replace(/\(.*?\)/g,'')).split(' ').some(x=>x.length>=4&&!VAGAS.has(x)&&w.has(x)));
    if(c.length)return c.sort((a,b)=>cont[b]-cont[a])[0];
    /* nunca fez: a variação mais básica com essa palavra no nome */
    const todos=Object.keys(EXS).filter(id=>norm(EXS[id].n.replace(/\(.*?\)/g,'')).split(' ').some(x=>x.length>=4&&!VAGAS.has(x)&&w.has(x)));
    return todos.sort((a,b)=>EXS[a].nv-EXS[b].nv||EXS[a].n.length-EXS[b].n.length)[0]||null;
  }
  /* gasto de energia por atividade (valores de MET do Compêndio de Atividades Físicas) */
  const ATIV=[[/\b(pular corda)\b/,11,'pular corda'],[/\b(spinning|bike indoor)\b/,8.5,'spinning'],[/\b(hiit|tiros?)\b/,8,'HIIT'],[/\b(crossfit|funcional)\b/,8,'treino funcional'],
    [/\b(luta|jiu jitsu|jiu|boxe|muay thai|judo|karate|mma)\b/,9,'luta'],[/\b(escada|escadas)\b/,8,'subida de escada'],[/\b(trote|corrida leve|correr devagar)\b/,7,'corrida leve'],
    [/\b(corrida|correr|correndo|corro|corri)\b/,9.5,'corrida'],[/\b(caminhada rapida|andar rapido|caminhar rapido)\b/,4.8,'caminhada rápida'],[/\b(caminhada|caminhar|caminhando|caminho|caminhei|andar|andando)\b/,3.5,'caminhada'],
    [/\b(esteira)\b/,5,'esteira'],[/\b(bicicleta|bike|pedalar|pedalando|pedalo|pedalei|ciclismo)\b/,7,'bicicleta'],[/\b(natacao|nadar|nadando|nado|nadei)\b/,7,'natação'],
    [/\b(eliptico|transport)\b/,5,'elíptico'],[/\b(remo)\b/,7,'remo'],[/\b(futebol|pelada|futsal)\b/,7,'futebol'],[/\b(volei)\b/,4,'vôlei'],[/\b(basquete)\b/,6.5,'basquete'],
    [/\b(tenis|beach tennis|padel)\b/,7,'tênis'],[/\b(danca|dancar|dancando|zumba)\b/,5.5,'dança'],[/\b(yoga|ioga)\b/,2.5,'yoga'],[/\b(pilates)\b/,3,'pilates'],
    [/\b(musculacao|malhar|malhando|malho|academia|treino|treinar|treinando)\b/,5,'musculação']];
  function minutosNo(t){const m=t.match(/(\d+(?:[.,]\d+)?)\s*(min|mins|minutos|minuto)\b/);if(m)return num(m[1]);const h=t.match(/(\d+(?:[.,]\d+)?)\s*(h|hora|horas)\b/);if(h)return num(h[1])*60;
    if(/\bmeia hora\b/.test(t))return 30;if(/\b(uma|1) hora e meia\b/.test(t))return 90;if(/\buma hora\b/.test(t))return 60;return null;}
  /* percentual de gordura pela fórmula RFM (Woolcott e Bergman, 2018): usa só altura e cintura */
  function gorduraResp(S,cint){
    const p=S.perfil||{},alt=+p.altura;
    const ref=p.sexo==='f'?76:p.sexo==='m'?64:70,bf=ref-20*alt/cint,rc=cint/alt;
    const fx=p.sexo==='f'?(bf<21?'atlética':bf<25?'boa forma':bf<32?'média':'acima do ideal'):(bf<14?'atlética':bf<18?'boa forma':bf<25?'média':'acima do ideal');
    return{txt:`Com ${fmt(cint)} cm de cintura e ${(alt/100).toFixed(2).replace('.',',')} m de altura, seu percentual de gordura estimado fica em torno de ${Math.round(bf)}%, faixa ${fx}${p.sexo?'':' (sem o sexo no perfil, usei uma média)'}. O método RFM erra uns 3 a 5 pontos, então acompanhe a tendência. A cintura é ${rc<.5?'menor que a metade da altura, o que é bom para a saúde':'maior que a metade da altura: reduzir a barriga traria benefício para a saúde'}.`};
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
    if(/\b(quem e voce|o que voce faz|o que voce sabe|voce e uma ia|como voce funciona)\b/.test(t)||/^(ajuda|help|me ajuda|socorro)\??$/.test(t))return r({int:'social:ajuda',txt:`Sou o Coach IA do Ryke Treinos e rodo direto no seu aparelho, sem internet. Sei mais de 120 temas de treino, dieta, suplementos e saúde, e a tabela de mais de 100 alimentos. Monto cardápios nas suas metas, comparo alimentos, calculo calorias de atividades, carga máxima, percentual de gordura pela cintura e prazos para chegar num peso. Também mostro a evolução das suas cargas e mudo o seu plano na hora.`,sugs:['Monte meu cardápio de hoje','Frango ou ovo, qual tem mais proteína?','Quanto peguei no supino?','Na sexta só bíceps']});
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

    /* evolução de um exercício específico vem antes do resumo geral de progresso */
    if(/\b(evolucao|evolui|evoluindo|progresso|historico)\b/.test(t)){const id=IA.acharExercicio(t,p)||exPorPalavra(S,t);if(id)return r({int:'hist:exercicio',...histResp(S,id)});}

    /* continuação da conversa */
    if(ctx.ultimo&&ctx.ultimo.tipo==='comida'&&/\b(outra|outro|mais opc|mais uma|outra opc|diferente|trocar|muda|mudar)/.test(t)&&t.split(' ').length<=6){const o=refazerComida(ctx.ultimo,S,(ctx.ultimo.semente||0)+1);o.int='comida:outra';return r(o);}
    const so_ref=refeicaoNo(t);
    if(so_ref&&ctx.ultimo&&ctx.ultimo.tipo==='comida'&&/^(e\s+)?(no|na|o|a|pro|pra|para o|para a)?\s*\w+(\s\w+){0,3}\??$/.test(t)&&t.split(' ').length<=5){
      const m=metas(S),o=refeicaoResp(so_ref,m,S,0);o.int='refeicao:'+so_ref;return r(o);}

    /* ações no plano de treino (trocar exercício, dias, tempo, foco, dor, registrar peso...) */
    const cmd=IA.comando(t,S);
    if(cmd&&!alimentosNo(t).length&&!refeicaoNo(t)){cmd.int='cmd'+(cmd.fazer?':'+cmd.fazer.tipo:'');return r({...cmd,ctx:{tipo:'cmd'}});}

    /* pergunta que traz a frase-chave de um tema: responde pela base antes dos cálculos */
    const PEDIDO=/\b(monte|monta|montar|faz um|faz uma|faca|cria|crie|sugere|sugira|sugestao|me passa|me de|me da|cardapio|receita|registrar|registra|quantas calorias tem|quanta proteina tem)\b/;
    const kb0=IA.buscaKB(t);
    if(kb0&&kb0.frase&&kb0.s>=4.5&&!PEDIDO.test(t)&&!refeicaoNo(t)){let txt=kb0.e.k.r;if(typeof txt==='function')txt=txt(p,IA.calc(p,S.ia&&S.ia.ajKcal));return r({int:'kb:'+kb0.e.k.q,txt,tema:kb0.e.k.q,ctx:{tipo:'treino'}});}
    /* carga máxima (1RM) por uma série informada ou pelo histórico */
    const idEx=IA.acharExercicio(t,p)||(/\b(1rm|rm|maximo|maxima|peguei|levantei|pego|levanto|carga|cargas|recorde|record|ultima vez|evolui|evolucao|progresso|historico)\b/.test(t)?exPorPalavra(S,t):null);
    if(/\b(1rm|rm|carga maxima|maximo|maxima|uma repeticao|forca maxima)\b/.test(t)){
      const mk=t.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|quilos|kilos)\b/),mr=t.match(/(\d{1,2})\s*(?:reps?|repeticoes|repeticao|vezes)\b/)||t.match(/\bx\s*(\d{1,2})\b/)||t.match(/\b(\d{1,2})\s*x\s*\d/);
      if(mk&&mr){const kg=num(mk[1]),rp=+mr[1];if(kg>0&&rp>=1&&rp<=20)return r({int:'calc:1rm',...rmResp(kg,rp,idEx)});}
      if(idEx){const b=melhorSerie(histEx(S,idEx));if(b&&b.kg)return r({int:'calc:1rm',...rmResp(b.kg,b.r,idEx)});
        return r({int:'calc:1rm',txt:`Ainda não tenho uma série com carga de ${EXS[idEx].n} no seu histórico. Me diga uma, por exemplo "fiz 40 kg 10 repetições, qual meu máximo?".`,ex:idEx});}
      if(/\b(1rm|carga maxima|uma repeticao)\b/.test(t))return r({int:'calc:1rm',txt:'Me diga o peso e as repetições de uma série, por exemplo "fiz 60 kg 8 repetições, qual meu máximo?". Também calculo pelo seu histórico: "qual meu máximo no supino?".'});
    }
    /* cargas e evolução de um exercício no histórico */
    if(idEx&&/\b(peguei|levantei|pego|levanto|faco|fiz|carga|cargas|recorde|record|pr|ultima vez|evolui|evolucao|progresso|historico|quanto (eu )?(faco|pego|levanto))\b/.test(t)&&!/\b(como (fazer|faz|e)|execucao|o que e)\b/.test(t))
      return r({int:'hist:exercicio',...histResp(S,idEx)});
    /* frequência de treinos */
    if(/\b(quantos treinos|quantas vezes (eu )?treinei|ultimo treino|treinei (essa|esta|nessa|nesta) semana|treinos (do|no|neste|nesse|este|esse) mes|frequencia de treino|quando (foi que )?(eu )?treinei|ja treinei)\b/.test(t)){
      const h=(S.hist||[]).filter(x=>!x.antes),hoje=new Date(),seg=new Date(hoje);seg.setDate(hoje.getDate()-((hoje.getDay()+6)%7));
      const iso=d=>d.toISOString().slice(0,10),sem=h.filter(x=>x.data>=iso(seg)).length,mes=h.filter(x=>x.data.slice(0,7)===iso(hoje).slice(0,7)).length,u=h[h.length-1];
      const meta=(p.dias||[]).length;
      if(!h.length)return r({int:'hist:treinos',txt:'Você ainda não finalizou nenhum treino no app. Quando terminar o primeiro, ele aparece aqui e em Evolução.'});
      return r({int:'hist:treinos',txt:`Nesta semana: ${sem} de ${meta} ${meta===1?'treino':'treinos'} do plano. Neste mês: ${mes}. No total: ${h.length}. O último foi ${u.nome.toLowerCase()}, em ${dataBR(u.data)}, com ${u.feitas} séries em ${u.dur} min.`});
    }
    /* gasto calórico de uma atividade */
    if(/\b(gasto|gasta|gastar|gastaria|gastei|queimo|queima|queimar|queimei|perco|perde)\b/.test(t)&&(/\b(caloria|calorias|kcal)\b/.test(t)||minutosNo(t))){
      const at=ATIV.find(([re])=>re.test(t));
      if(at){const min=minutosNo(t)||30,peso=+p.peso||70,k=at[1]*peso*min/60;
        return r({int:'calc:atividade',txt:`${fmt(min)} min de ${at[2]} gastam uns ${fint(k)} kcal para os seus ${fmt(peso)} kg, mais ou menos ${fmt(Math.round(k/ALIM.pao.k*100/ALIM.pao.por*2)/2)} pães franceses. Relógios e aparelhos costumam exagerar esse número.${p.objetivo==='emagrecer'||p.objetivo==='definir'?' Para emagrecer, a dieta pesa mais: é mais fácil deixar de comer 300 kcal do que gastar isso no exercício.':''}`});}
    }
    /* metabolismo basal e gasto do dia */
    if(/\b(tmb|taxa metabolica|metabolismo basal|gasto basal|gasto calorico|gasto diario|quanto (eu )?gasto (por dia|no dia|de calorias|em repouso)|gasto em repouso)\b/.test(t)&&p.peso){
      const c=IA.calc(p,S.ia&&S.ia.ajKcal),n=(p.dias||[]).length;
      return r({int:'calc:tmb',txt:`Sua taxa metabólica basal estimada é de ${fint(c.tmb)} kcal, o que o corpo gasta em repouso. Somando o dia a dia e os ${n} treinos por semana, seu gasto fica em torno de ${fint(c.gasto)} kcal. Sua meta para ${(IA.OBJ[p.objetivo]||IA.OBJ.massa).n.toLowerCase()} é de ${fint(c.kcal)} kcal. São estimativas pela fórmula de Mifflin-St Jeor: ajuste pela balança a cada 2 a 3 semanas.`});
    }
    /* percentual de gordura pela cintura */
    const mCint=t.match(/\bcintura\D{0,14}(\d{2,3}(?:[.,]\d)?)/);
    if((/\b(percentual de gordura|gordura corporal|meu bf|body fat|porcentagem de gordura|quanto (eu )?tenho de gordura|meu percentual)\b/.test(t)||(mCint&&/\b(minha|meu|tenho|mede|medindo|medi)\b/.test(t)))&&!/\b(como medir|como calcular|bioimpedancia|adipometro|dexa|confiavel|metodo)\b/.test(t)){
      let cint=mCint?num(mCint[1]):null;
      if(!cint){const c=(S.corpo||[]).filter(x=>+x.cintura>0).sort((a,b)=>a.data.localeCompare(b.data));if(c.length)cint=+c[c.length-1].cintura;}
      if(cint&&+p.altura&&cint>=40&&cint<=200)return r({int:'calc:gordura',...gorduraResp(S,cint)});
      if(/\b(percentual|gordura|bf)\b/.test(t))return r({int:'calc:gordura',txt:'Eu estimo seu percentual de gordura pela cintura e pela altura. Registre a cintura em Evolução, Corpo, ou me diga, por exemplo: "minha cintura é 82 cm, qual meu percentual de gordura?". Meça na altura do umbigo, sem apertar.'});
    }
    /* prazo para atingir um peso */
    const mMeta=t.match(/\b(perder|perco|perca|emagrecer|emagreco|secar|seco|eliminar|tirar|ganhar|ganho|engordar|engordo|subir)\s+(?:uns |uns |mais )?(\d{1,2}(?:[.,]\d)?)\s*(kg|quilos|kilos)\b/),mAlvo=t.match(/\b(chegar (?:a|aos|em|nos)|chegar|ficar com|atingir|pesar)\s+(\d{2,3}(?:[.,]\d)?)\s*(kg|quilos|kilos)?\b/);
    if((mMeta||mAlvo)&&+p.peso&&!idEx){
      const peso=+p.peso,c=IA.calc(p,S.ia&&S.ia.ajKcal);
      let delta=mMeta?num(mMeta[2])*(/^(ganhar|ganho|engordar|engordo|subir)$/.test(mMeta[1])?1:-1):num(mAlvo[2])-peso;
      const alvo=peso+delta,sem=(a,b)=>`${Math.round(a)} a ${Math.round(b)} semanas`;
      if(Math.abs(delta)<.5)return r({int:'calc:meta',txt:`Você já está praticamente nos ${fmt(alvo)} kg. Agora o foco é manter e melhorar a composição: mais músculo e menos gordura com o mesmo peso.`});
      let txt;
      if(delta<0){const k=-delta;txt=`Para perder ${fmt(k)} kg num ritmo saudável, de 0,5 a 1% do peso por semana, leva umas ${sem(k/(peso*.01),k/(peso*.005))}, ou ${fmt(Math.round(k/(peso*.0075)/4.3*2)/2)} meses em média. Isso pede um déficit de uns 300 a 500 kcal por dia. Sua meta atual é de ${fint(c.kcal)} kcal.`;
        if(alvo<c.pesoMin)txt+=` Atenção: ${fmt(alvo)} kg fica abaixo da faixa saudável para a sua altura, que começa em ${c.pesoMin} kg.`;}
      else{txt=`Para ganhar ${fmt(delta)} kg com o máximo de músculo e o mínimo de gordura, o ritmo bom é de 0,25 a 0,5 kg por semana: umas ${sem(delta/.5,delta/.25)}. Coma uns 200 a 300 kcal acima do gasto, bata a proteína e progrida as cargas. Sua meta atual é de ${fint(c.kcal)} kcal.`;
        if(alvo>c.pesoMax&&p.objetivo!=='massa'&&p.objetivo!=='forca')txt+=` ${fmt(alvo)} kg passa da faixa de peso saudável para a sua altura, que vai até ${c.pesoMax} kg, a não ser que seja músculo.`;}
      return r({int:'calc:meta',txt});
    }

    /* comida */
    const als=alimentosNo(t);
    const querTroca=/\b(substitu|trocar|troca|no lugar|em vez|alternativa|equivalente)/.test(t);
    /* quanto de um alimento para chegar numa quantidade de proteína, carboidrato ou calorias */
    const mNut=t.match(/(\d+(?:[.,]\d+)?)\s*(g|gramas)?\s*(?:de\s+)?(proteina|proteinas|carboidrato|carboidratos|carbo|carbos|gordura|kcal|calorias)\b/);
    if(als.length===1&&mNut&&/\b(quanto|quanta|quantos|quantas|preciso|para|pra|bater|chegar)\b/.test(t)){
      const id=als[0].id,a=ALIM[id],chave=/^prot/.test(mNut[3])?'p':/^carb/.test(mNut[3])?'c':/^gord/.test(mNut[3])?'g':'k',meta=num(mNut[1]),nome={p:'proteína',c:'carboidrato',g:'gordura',k:'calorias'}[chave];
      if(a[chave]<1)return r({int:'alimento:meta',txt:`${a.n} quase não tem ${nome}. Para isso, escolha outro alimento.`,ctx:{tipo:'alimento',id}});
      const g=meta/a[chave]*100,m=macros(id,g);
      return r({int:'alimento:meta',txt:`Para ${fmt(meta)}${chave==='k'?' kcal':' g de '+nome}, são ${qtdDe(id,g)}, com ${fint(m.k)} kcal no total.${chave==='p'&&g>a.por*3?' É bastante comida: vale dividir essa proteína entre outros alimentos.':''}`,ctx:{tipo:'alimento',id}});
    }
    /* comparação entre alimentos */
    if(als.length>=2&&!querTroca&&!/\d/.test(t)&&/\b(ou|versus|vs|x|comparar|compara|comparando|diferenca|melhor|pior|mais|menos)\b/.test(t)){
      const L=als.slice(0,4).map(x=>({id:x.id,...ALIM[x.id]}));
      const chave=/\bprotein/.test(t)?'p':/\b(caloria|calorias|kcal|engorda|emagrec)/.test(t)?'k':/\bcarbo/.test(t)?'c':/\bgordura/.test(t)?'g':null;
      const linhas=L.map(a=>({n:a.n,med:'100 g de',k:a.k,p:a.p,c:a.c,g:a.g}));
      let txt;
      if(chave){const nome={p:'proteína',k:'calorias',c:'carboidrato',g:'gordura'}[chave],ord=L.slice().sort((a,b)=>b[chave]-a[chave]);
        txt=`Em ${nome}, por 100 g: ${ord.map(a=>`${a.n.toLowerCase()} ${chave==='k'?fint(a.k)+' kcal':fmt(a[chave])+' g'}`).join(', ')}. ${chave==='k'?`O mais leve é ${ord[ord.length-1].n.toLowerCase()}.`:`Ganha ${ord[0].n.toLowerCase()}.`}`;}
      else{const dens=L.slice().sort((a,b)=>b.p/Math.max(1,b.k)-a.p/Math.max(1,a.k)),leve=L.slice().sort((a,b)=>a.k-b.k);
        txt=`Por 100 g: ${L.map(a=>`${a.n.toLowerCase()} tem ${fint(a.k)} kcal e ${fmt(a.p)} g de proteína`).join('; ')}. Mais proteína por caloria: ${dens[0].n.toLowerCase()}. Mais leve: ${leve[0].n.toLowerCase()}. ${p.objetivo==='emagrecer'||p.objetivo==='definir'?'Para o seu objetivo, priorize proteína por caloria.':'Os dois cabem numa dieta equilibrada, o que manda é o total do dia.'}`;}
      return r({int:'alimento:compara',txt,tabela:{linhas,tot:null},ctx:{tipo:'alimento',id:L[0].id}});
    }
    /* pergunta de conhecimento que só cita um alimento ("ovo aumenta o colesterol?", "café antes do treino ajuda?") */
    if(als.length&&!querTroca&&!refeicaoNo(t)){
      const kb=IA.buscaKB(t);
      if(kb&&(kb.frase&&!PEDIDO.test(t)||!PEDE_COMIDA.test(t)&&kb.s>=3&&!/\b(quanto|quanta|quantas|quantos|caloria|calorias|kcal|proteina|carbo|carboidrato|gordura|macro|macros|engorda|faz bem|e bom|saudavel|tem)\b|\d/.test(t))){
        let txt=kb.e.k.r;if(typeof txt==='function')txt=txt(p,IA.calc(p,S.ia&&S.ia.ajKcal));return r({int:'kb:'+kb.e.k.q,txt,tema:kb.e.k.q,ctx:{tipo:'treino'}});}
    }
    const suplemento=/\b(preciso|vale a pena|funciona|devo tomar|tomar|serve)\b/.test(t)&&als.some(x=>x.id==='whey');
    if(als.length&&querTroca){const id=als[0].id,a=ALIM[id];
      const eq=AIDS.filter(x=>x!==id&&ALIM[x].cat===a.cat&&ALIM[x].k>=5&&!ALIM[x].t.includes('alcool')&&permitido(x,S)).slice(0,6).map(x=>{const g=Math.round(macros(id,gramasDe(id,als[0].qtd)).k/ALIM[x].k*100/5)*5;return `${ALIM[x].n}: ${medida(x,g)}`;});
      return r({int:'alimento:troca',txt:`No lugar de ${medida(id,gramasDe(id,als[0].qtd))} de ${a.n.toLowerCase()}, com as mesmas calorias:\n• ${eq.join('\n• ')}`,ctx:{tipo:'alimento',id}});}
    if(!suplemento&&(als.length&&!PEDE_COMIDA.test(t)||als.length&&/\b(quanto|quanta|quantas|quantos|tem|calorias|caloria|kcal|proteina|carbo|gordura|macro|engorda|faz bem|e bom|saudavel)\b/.test(t)&&!refeicaoNo(t))){
      const linhas=als.map(x=>{const g=gramasDe(x.id,x.qtd),m=macros(x.id,g);return{n:ALIM[x.id].n,med:medida(x.id,g),...m};});
      const tot=linhas.reduce((s,l)=>({k:s.k+l.k,p:s.p+l.p,c:s.c+l.c,g:s.g+l.g}),{k:0,p:0,c:0,g:0});
      let txt=linhas.length===1?`${qtdDe(als[0].id,gramasDe(als[0].id,als[0].qtd))}: ${fint(linhas[0].k)} kcal, ${fmt(linhas[0].p)} g de proteína, ${fmt(linhas[0].c)} g de carboidrato e ${fmt(linhas[0].g)} g de gordura.`:`Somando tudo: ${fint(tot.k)} kcal e ${fmt(tot.p)} g de proteína.`;
      if(/\bengorda\b/.test(t))txt+=' Nenhum alimento sozinho engorda: o que conta é o total de calorias do dia.';
      if(p.peso){const m=metas(S);txt+=` Isso é ${Math.round(tot.p/m.p*100)}% da sua proteína e ${Math.round(tot.k/m.k*100)}% das calorias do dia.`;}
      return r({int:'alimento:info',txt,tabela:linhas.length>1?{linhas,tot}:null,ctx:{tipo:'alimento',id:als[0].id}});}
    const ref=refeicaoNo(t);
    if(/\b(cardapio|dieta|plano alimentar|o que comer (hoje|no dia|durante o dia|o dia (todo|inteiro))|refeicoes do dia|dia inteiro|minha alimentacao|alimentacao do dia)\b/.test(t)&&(!ref||/\b(dia|hoje|completo)\b/.test(t))&&!/\b(atrapalha|atrapalham|funciona|funcionam|faz mal|engorda|vale a pena|e verdade|e ruim|emagrece mais)\b/.test(t)){
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
