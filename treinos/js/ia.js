/* IA local do Ryke Treinos.
   Um sistema especialista: regras de ciência do treino + aprendizado com o uso (trocas, pulos, desempenho).
   Roda em milissegundos no próprio aparelho, sem internet. */
const IA=(()=>{
  const PADRAO={s:3,r:10};
  const OBJ={
    massa:{n:'Ganhar massa muscular',desc:[90,75],kcal:p=>p.imc<18.5?.18:p.imc<25?.12:.06,prot:1.8},
    emagrecer:{n:'Perder gordura',desc:[75,60],kcal:p=>p.imc<20?-.1:-.2,prot:2.0},
    definir:{n:'Definir (perder gordura e manter músculo)',desc:[75,60],kcal:p=>p.imc>=23?-.12:-.05,prot:2.0},
    forca:{n:'Ganhar força',desc:[150,90],kcal:()=>.07,prot:1.8},
    saude:{n:'Saúde e condicionamento',desc:[75,60],kcal:p=>p.imc>=27?-.12:0,prot:1.5}
  };
  const NIVEL={ini:'Iniciante',inter:'Intermediário',avan:'Avançado'};
  const LOCAL={academia:'Academia completa',casa_halteres:'Casa com halteres',casa_corpo:'Casa, só peso do corpo'};
  const DIAS=['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const DIAS_C=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
  const ORDEM_SEMANA=[1,2,3,4,5,6,0];
  const hash=s=>{let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return(h>>>0);};
  const uidl=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const lista=a=>a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' e '+a[a.length-1];
  const r5=n=>Math.round(n/50)*50;

  /* ---------- números do corpo ---------- */
  function calc(p,ajKcal=0){
    const h=(+p.altura||170)/100,peso=+p.peso||70,idade=+p.idade||30;
    const imc=peso/(h*h);
    const imcTxt=imc<18.5?'abaixo do peso':imc<25?'peso saudável':imc<30?'sobrepeso':'obesidade';
    const tmb=10*peso+6.25*h*100-5*idade+(p.sexo==='m'?5:p.sexo==='f'?-161:-78);
    const n=(p.dias||[]).length;
    const fator=n<=1?1.3:n<=3?1.45:n<=5?1.6:1.72;
    const gasto=tmb*fator,o=OBJ[p.objetivo]||OBJ.massa;
    let kcal=gasto*(1+o.kcal({imc}))+(+ajKcal||0);
    kcal=Math.max(kcal,tmb,p.sexo==='f'?1200:1500);
    const pesoRef=imc>27?25*h*h:peso;
    let gk=o.prot;
    if((p.objetivo==='emagrecer'||p.objetivo==='definir')&&p.nivel&&p.nivel!=='ini')gk=2.2;
    if(idade>=60)gk=Math.max(gk,1.6);
    const prot=Math.round(gk*pesoRef),gord=Math.round(.9*pesoRef);
    const carb=Math.max(50,Math.round((kcal-prot*4-gord*9)/4));
    const ritmo={massa:'+0,25 a +0,5 kg por semana',emagrecer:`−${(peso*.005).toFixed(1).replace('.',',')} a −${(peso*.01).toFixed(1).replace('.',',')} kg por semana`,definir:'0 a −0,25 kg por semana, com a cintura diminuindo',forca:'0 a +0,25 kg por semana',saude:'peso estável ou caindo devagar'}[p.objetivo]||'';
    return{imc,imcTxt,tmb:r5(tmb),gasto:r5(gasto),kcal:r5(kcal),prot,gord,carb,agua:Math.round(peso*35/100)/10,ritmo,pesoMin:Math.round(18.5*h*h),pesoMax:Math.round(24.9*h*h)};
  }

  /* ---------- filtros ---------- */
  function eqOk(ex,p){
    if(!p||p.local==='academia'||!p.local)return true;
    const ok=new Set(p.local==='casa_halteres'?['halter','banco','corpo']:['corpo']);
    if(p.barra)ok.add('barrafixa');
    return ex.eq.every(e=>ok.has(e));
  }
  const riscoOk=(ex,p)=>!(p&&p.lesoes||[]).some(l=>ex.r.includes(l));
  const nivelOk=(ex,p)=>!p||p.nivel==='avan'||(p.nivel==='inter'?true:ex.nv<=2);
  const serve=(ex,p)=>eqOk(ex,p)&&riscoOk(ex,p)&&nivelOk(ex,p);

  /* ---------- prescrição padrão ---------- */
  function prescricao(id,p){
    const ex=EXS[id],o=OBJ[p&&p.objetivo]||OBJ.massa,it={s:PADRAO.s,r:ex.seg?30:PADRAO.r,desc:p&&p.desc?+p.desc:(ex.t==='c'?o.desc[0]:o.desc[1])};
    const ob=obsCuidado(id,p);if(ob)it.obs=ob;
    return it;
  }
  /* exercícios liberados com cuidado para quem marcou dor (evidência: amplitude e carga importam mais que o exercício) */
  const CUIDADO={leg_press:['joelho'],agachamento_goblet:['joelho'],agachamento_corpo:['joelho'],agachamento_smith:['joelho'],cadeirinha:['joelho'],
    stiff_halter:['lombar'],hip_thrust:['lombar'],hip_halter:['lombar'],hiperextensao:['lombar'],ponte:['lombar'],superman:['lombar'],
    elev_lateral:['ombro'],elev_lateral_polia:['ombro'],desenvolvimento:['ombro'],desenvolvimento_maquina:['ombro'],supino_halter:['ombro'],incl_halter:['ombro'],supino_maquina:['ombro']};
  const OBS={joelho:'Desça só até onde o joelho não doer.',lombar:'Carga leve, coluna neutra. Pare se a lombar doer.',ombro:'Amplitude sem dor. Na elevação, suba só até a linha do ombro.'};
  function obsCuidado(id,p){const l=(CUIDADO[id]||[]).filter(x=>(p&&p.lesoes||[]).includes(x));return l.length?OBS[l[0]]:'';}

  /* ---------- montagem automática ---------- */
  const BASE={G:[3,4,5],M:[3,4,5],biceps:[2,2,3],triceps:[2,2,3],trapezio:[1,1,2],antebraco:[0,1,1],panturrilha:[2,2,3],abdomen:[2,2,3],gluteos:[2,2,3],posteriores:[2,2,3]};
  function alvos(p){
    let gs=(p.somente&&p.foco&&p.foco.length)?p.foco.slice():GRUPO_IDS.slice();
    gs=gs.filter(g=>!(p.evitar||[]).includes(g));
    return gs;
  }
  function volumeAlvo(p,gs){
    const k=p.nivel==='avan'?2:p.nivel==='inter'?1:0,v={};
    gs.forEach(g=>{
      let b=(BASE[g]||BASE[GRUPOS[g].tam])[k];
      if(g==='antebraco'&&!(p.foco||[]).includes(g))b=p.nivel==='avan'?1:0;
      /* agachamentos e leg press já trabalham o glúteo */
      if(g==='gluteos'&&gs.includes('quadriceps')&&!(p.foco||[]).includes(g))b=Math.max(1,b-1);
      if((p.foco||[]).includes(g))b=Math.round(b*(p.somente?1.3:1.5))||1;
      else if(p.somente)b=Math.round(b*1.25);
      if(p.objetivo==='saude')b=Math.max(1,Math.round(b*.8));
      if(b<1&&(p.foco||[]).includes(g))b=1;
      v[g]=b;
    });
    return v;
  }
  function divisao(p,gs){
    const n=Math.max(1,Math.min(6,(p.dias||[]).length||3));
    const fam={push:[],pull:[],legs:[],core:[]};gs.forEach(g=>fam[GRUPOS[g].fam].push(g));
    const F=['push','pull','legs'].filter(f=>fam[f].length);
    const U={ALL:gs.filter(g=>g!=='abdomen'),PUSH:fam.push,PULL:fam.pull,LEGS:fam.legs,UP:[...fam.push,...fam.pull],LOW:fam.legs};
    let tpl,nome={};
    if(!F.length)return{units:Array.from({length:n},()=>[]),tipo:'Abdômen em todos os treinos'};
    /* poucos grupos escolhidos: todos entram em todos os treinos */
    if(gs.filter(g=>g!=='abdomen').length<=3)return{units:Array.from({length:n},()=>U.ALL.slice()),tipo:n===1?'Treino único':'Os mesmos grupos em todos os treinos, com exercícios variados'};
    if(n===1)tpl=['ALL'];
    else if(F.length===3){
      tpl=n===2?['ALL','ALL']:n===3?(p.nivel==='ini'?['ALL','ALL','ALL']:['UP','LOW','ALL']):n===4?['UP','LOW','UP','LOW']:n===5?['UP','LOW','PUSH','PULL','LEGS']:['PUSH','PULL','LEGS','PUSH','PULL','LEGS'];
    }else if(F.length===2&&gs.includes('peito')&&gs.includes('costas')&&n>=4){
      /* só parte de cima: divisão por grupos, como a ficha do Henrique */
      const t=g=>gs.includes(g);
      const d=[['peito','triceps'],['costas','biceps'],['ombros','trapezio','antebraco'],['peito','costas'],['biceps','triceps','ombros']].map(u=>u.filter(t)).filter(u=>u.length);
      const units=[];for(let i=0;i<n;i++)units.push(d[i%d.length]);
      return{units,tipo:'Divisão por grupos musculares (só parte de cima)'};
    }else if(F.length===2){
      const A=fam[F[0]],B=fam[F[1]];U.A=A;U.B=B;
      tpl=n===2?['A','B']:n===3?['A','B','ALL']:n===4?['A','B','A','B']:n===5?['A','B','A','B','ALL']:['A','B','A','B','A','B'];
    }else{
      const G=fam[F[0]];
      if(G.length<=2||n===1)tpl=Array(n).fill('ALL');
      else{const h=Math.ceil(G.length/2);U.A=G.slice(0,h);U.B=G.slice(h);tpl=Array.from({length:n},(_,i)=>n%2&&i===n-1?'ALL':i%2?'B':'A');}
    }
    const tipos={ALL:'Corpo inteiro',PUSH:'Empurrar',PULL:'Puxar',LEGS:'Pernas',UP:'Parte de cima',LOW:'Parte de baixo'};
    const tipo=n===1||tpl.every(x=>x==='ALL')?'Corpo inteiro em todos os treinos':tpl.join(',')==='UP,LOW,ALL'?'Parte de cima, parte de baixo e corpo inteiro':tpl.join('')==='PUSHPULLLEGS'||tpl.join('')==='PUSHPULLLEGSPUSHPULLLEGS'?'Empurrar, puxar e pernas':tpl[0]==='UP'&&n===4?'Parte de cima e parte de baixo':n===5&&F.length===3?'Superiores e inferiores com empurrar, puxar e pernas':'Divisão em '+n+' treinos';
    return{units:tpl.map(k=>U[k].slice()),tipo,tpl:tpl.map(k=>tipos[k]||'')};
  }
  const ART={ombro:'o ombro',joelho:'o joelho',lombar:'a lombar',punho:'o punho',cotovelo:'o cotovelo'};
  function nomeDia(gs){
    if(!gs.length)return 'Treino';
    const cima=['peito','costas','ombros','biceps','triceps','trapezio','antebraco'].filter(g=>gs.includes(g)).length;
    const baixo=['quadriceps','posteriores','gluteos','panturrilha'].filter(g=>gs.includes(g)).length;
    if(cima>=2&&baixo>=2)return 'Corpo inteiro';
    if(cima>=5&&!baixo)return gs.includes('abdomen')?'Parte de cima e abdômen':'Parte de cima';
    const legs=['quadriceps','posteriores','gluteos','panturrilha'];
    const temLegs=legs.filter(g=>gs.includes(g)).length,resto=gs.filter(g=>!legs.includes(g));
    if(gs.length>=7)return 'Corpo inteiro';
    const nomes=resto.map(g=>GRUPOS[g].n.toLowerCase());
    if(temLegs>=2)nomes.unshift('pernas');else legs.filter(g=>gs.includes(g)).forEach(g=>nomes.push(GRUPOS[g].n.toLowerCase()));
    const s=lista(nomes);return s.charAt(0).toUpperCase()+s.slice(1);
  }
  function porExercicioMin(p){const o=OBJ[p.objetivo]||OBJ.massa;const d=p.desc?+p.desc:(o.desc[0]+o.desc[1])/2;return 3*(40+d)/60+1.2;}
  function estimaMin(ex){return Math.round(5+ex.reduce((a,it)=>a+it.s*((EXS[it.id].seg?it.r:40)+(+it.desc||60))/60+1.2,0));}

  /* exercícios-base que a IA prefere e os que ela usa só como complemento */
  const ESSENCIAL=new Set(['supino_reto','supino_halter','incl_halter','incl_barra','supino_maquina','crossover','flexao','puxada','barra_fixa','remada_baixa','remada_curvada','remada_unilateral','remada_maquina','remada_invertida','desenvolvimento','desenvolvimento_maquina','elev_lateral','face_pull','rosca_direta','rosca_martelo','rosca_alternada','corda','polia_barra','testa','frances','encolhimento','agachamento','leg_press','agachamento_goblet','agachamento_corpo','afundo','bulgaro','stiff','stiff_halter','mesa_flexora','hip_thrust','hip_halter','ponte','panturrilha_pe','panturrilha_halter','panturrilha_corpo','abdominal','prancha','afundo_corpo','remada_uni_mochila','elev_lateral_garrafa','sumo']);
  const COMPLEMENTO=new Set(['elev_frontal','remada_alta','pullover','hiperextensao','rosca_punho','farmer','pulldown_ext','crucifixo_halter','elev_pernas_barra','bicicleta','prancha_lateral','stiff_unilateral','gluteo_polia']);
  const VERTICAL=new Set(['barra_fixa','puxada','puxada_neutra','pulldown_ext','barra_supinada']);
  /* evidência: treinar o músculo alongado rende mais (Maeo 2021 e 2023, Wolf 2023) */
  const ALONGADO=new Set(['frances','rosca_inclinada','cadeira_flexora','stiff','stiff_halter','incl_halter','crossover','bulgaro','panturrilha_pe','panturrilha_halter','rosca_scott','pullover']);
  const ACIMA_CABECA=new Set(['frances']);
  /* exercícios que levantam o corpo todo: pesados para quem tem IMC alto */
  const CORPO_TODO=new Set(['flexao','flexao_diamante','flexao_pike','barra_fixa','barra_supinada','paralelas','mergulho_banco','elev_pernas_barra','afundo_corpo','stiff_unilateral']);
  /* pesos da pontuação. O script ferramentas/treinar-ia.js ajusta esses valores e grava em ia-pesos.js */
  const PESOS0={compPrimeiro:6,compSegundo:3,compExcesso:-3,isoRepetido:-3,essencial:2.5,complemento:-2.5,vertical:2,verticalRep:-3,horizontal:1.5,lateral:4,
    iniNv1:2,iniMaquina:1,forcaComp:2,forcaBarra:2,casaNaAcademia:-2,usado:-8,poseRep:-2.5,pref:2,idosoMaquina:3,idosoBarra:-3,obesoMaquina:2,obesoCorpo:-4,
    alongado:1,acimaCabeca:2,ombroProtege:3,acaso:1};
  const pesos=()=>({...PESOS0,...(typeof window!=='undefined'&&window.IA_PESOS||{})});
  function escolher(g,k,dia,usados,p,prefs){
    const W=pesos(),idoso=+p.idade>=60,imc=(+p.peso||70)/Math.pow((+p.altura||170)/100,2),obeso=imc>=30;
    const livre=id=>EXS[id].g===g&&!dia.some(x=>x.id===id);
    let pool=EX_IDS.filter(id=>livre(id)&&serve(EXS[id],p)&&!(idoso&&p.nivel!=='avan'&&EXS[id].nv>=3));
    /* sem opção no nível da pessoa: aceita outro nível, mas nunca um exercício que force a lesão marcada */
    if(!pool.length)pool=EX_IDS.filter(id=>livre(id)&&eqOk(EXS[id],p)&&riscoOk(EXS[id],p));
    const out=[],grande=GRUPOS[g].tam!=='P',lesoes=p.lesoes||[];
    const latSemana=()=>[...usados].some(id=>EXS[id].p.includes('deltLat')&&EXS[id].t==='i');
    const ombroSemana=()=>[...usados].some(id=>EXS[id].g==='ombros'&&EXS[id].t==='c');
    for(let i=0;i<k&&pool.length;i++){
      const doDia=[...dia.map(x=>x.id),...out].filter(id=>EXS[id].g===g);
      const temVert=doDia.some(id=>VERTICAL.has(id));
      const isoDia=doDia.filter(id=>EXS[id].t==='i').length,compDia=doDia.length-isoDia;
      const temLat=doDia.some(id=>EXS[id].p.includes('deltLat')&&EXS[id].t==='i');
      const temCabeca=doDia.some(id=>ACIMA_CABECA.has(id));
      const sc=id=>{const e=EXS[id];let s=0;
        if(grande&&e.t==='c')s+=compDia===0?W.compPrimeiro:(compDia===1&&GRUPOS[g].tam==='G'?W.compSegundo:W.compExcesso);
        if(e.t==='i'&&isoDia>0)s+=W.isoRepetido;
        if(g==='ombros'&&(compDia>0||ombroSemana())&&!temLat&&!latSemana()&&e.p.includes('deltLat')&&e.t==='i')s+=W.lateral;
        if(ESSENCIAL.has(id))s+=W.essencial;
        if(COMPLEMENTO.has(id)&&!(p.foco||[]).includes(g))s+=W.complemento;
        if(g==='costas')s+=VERTICAL.has(id)?(temVert?W.verticalRep:W.vertical):(temVert?W.horizontal:0);
        if(ALONGADO.has(id))s+=W.alongado;
        if(g==='triceps'&&!temCabeca&&ACIMA_CABECA.has(id)&&p.nivel!=='ini')s+=W.acimaCabeca;
        if(lesoes.includes('ombro')&&id==='face_pull')s+=W.ombroProtege;
        if(p.nivel==='ini'&&e.nv===1)s+=W.iniNv1;
        if(p.nivel==='ini'&&e.eq.includes('maquina'))s+=W.iniMaquina;
        if(idoso&&e.eq.includes('maquina'))s+=W.idosoMaquina;
        if(idoso&&e.eq.includes('barra')&&e.t==='c')s+=W.idosoBarra;
        if(obeso&&e.eq.includes('maquina'))s+=W.obesoMaquina;
        if(obeso&&CORPO_TODO.has(id))s+=W.obesoCorpo;
        if(p.objetivo==='forca'&&e.t==='c')s+=W.forcaComp+(e.eq.includes('barra')?W.forcaBarra:0);
        if(p.local==='academia'&&e.eq.includes('corpo')&&!e.eq.includes('barrafixa')&&e.g!=='abdomen')s+=W.casaNaAcademia;
        if(usados.has(id))s+=ESSENCIAL.has(id)?W.usado*.35:W.usado;
        if(doDia.some(x=>EXS[x].pose===e.pose))s+=W.poseRep;
        s+=W.pref*((prefs&&prefs[id])||0);
        s+=W.acaso*(hash((p.nome||'')+id)%100)/100;
        return s;};
      /* não repete o mesmo movimento no mesmo dia quando há outra opção */
      const semRep=pool.filter(id=>!doDia.some(x=>EXS[x].pose===EXS[id].pose));
      const base=semRep.length?semRep:pool;
      base.sort((a,b)=>sc(b)-sc(a));
      const id=base[0];pool.splice(pool.indexOf(id),1);out.push(id);usados.add(id);
    }
    /* compostos sempre antes dos isolados do mesmo grupo */
    return out.sort((a,b)=>(EXS[a].t==='c'?0:1)-(EXS[b].t==='c'?0:1));
  }

  function gerar(p,prefs){
    const gs=alvos(p),vol=volumeAlvo(p,gs),div=divisao(p,gs);
    const dias=(p.dias&&p.dias.length?p.dias:[1,3,5]).slice().sort((a,b)=>ORDEM_SEMANA.indexOf(a)-ORDEM_SEMANA.indexOf(b)).slice(0,6);
    const units=div.units.slice(0,dias.length);
    /* abdômen entra nos dias de perna, de corpo inteiro ou nos mais leves */
    if(gs.includes('abdomen')){
      const fq=Math.min(units.length,Math.max(1,Math.min(3,vol.abdomen)));
      const idx=units.map((u,i)=>({i,s:(u.some(g=>GRUPOS[g].fam==='legs')?0:1)*100+u.length})).sort((a,b)=>a.s-b.s).slice(0,fq).map(x=>x.i);
      idx.forEach(i=>{if(!units[i].includes('abdomen'))units[i]=[...units[i],'abdomen'];});
    }
    const cap=Math.max(3,Math.floor(((+p.tempo||45)-5)/porExercicioMin(p)));
    /* quantos exercícios cada grupo recebe em cada dia */
    const cont=units.map(()=>({}));
    gs.forEach(g=>{
      const ds=units.map((u,i)=>u.includes(g)?i:-1).filter(i=>i>=0);if(!ds.length)return;
      let tot=Math.max(vol[g],g==='abdomen'?ds.length:0);
      if(GRUPOS[g].tam!=='P')tot=Math.max(tot,ds.length);
      for(let k=0;k<tot;k++){const i=ds[k%ds.length];cont[i][g]=(cont[i][g]||0)+1;}
    });
    /* ajusta ao tempo disponível: tira primeiro de quem tem mais exercícios no dia e menos prioridade */
    const foco=new Set(p.foco||[]);
    const peso=g=>(foco.has(g)?100:0)+(GRUPOS[g].tam==='G'?20:GRUPOS[g].tam==='M'?15:5);
    cont.forEach(c=>{
      let tot=Object.values(c).reduce((a,b)=>a+b,0);
      while(tot>cap){
        const g=Object.keys(c).sort((a,b)=>(c[b]-c[a])||(peso(a)-peso(b)))[0];
        if(!g)break;c[g]--;if(!c[g])delete c[g];tot--;
      }
    });
    /* escolhe os exercícios contando o volume real que cada um dá para cada músculo */
    const usados=new Set(),real={};GRUPO_IDS.forEach(g=>real[g]=0);
    const soma=id=>{const e=EXS[id],vis=new Set();e.p.forEach(m=>{const g=MUSC_GRUPO[m];if(!vis.has(g)){real[g]+=PADRAO.s;vis.add(g);}});e.sec.forEach(m=>{const g=MUSC_GRUPO[m];if(!vis.has(g)){real[g]+=PADRAO.s/2;vis.add(g);}});};
    const lista_=units.map(()=>[]);
    units.forEach((u,i)=>{const c=cont[i]||{};
      Object.keys(c).forEach(g=>escolher(g,c[g],lista_[i],usados,p,prefs).forEach(id=>{lista_[i].push({u:uidl(),id,...prescricao(id,p)});soma(id);}));});
    /* completa dias curtos, em rodízio, com o grupo mais longe do volume ideal da semana */
    const alvoDia=Math.min(cap,p.nivel==='ini'?6:7);
    const maxDia=g=>(g==='trapezio'||g==='antebraco'?1:GRUPOS[g].tam==='P'?2:3)+(foco.has(g)?1:0);
    const teto=g=>faixa(g,p).max*(p.somente&&GRUPOS[g].tam==='P'?1.5:1);
    const esgotado=units.map(()=>new Set());
    for(let rodada=0,mudou=true;mudou&&rodada<12;rodada++){
      mudou=false;
      units.forEach((u,i)=>{
        const L=lista_[i];if(L.length>=alvoDia)return;
        const noDia=g=>L.filter(it=>EXS[it.id].g===g).length;
        const opc=u.filter(g=>!esgotado[i].has(g)&&noDia(g)<maxDia(g)&&real[g]+PADRAO.s<=teto(g)&&(g!=='antebraco'||foco.has(g)));
        /* equilíbrio entre empurrar e puxar protege os ombros */
        const ep=empPux(lista_.flat().map(it=>it.id)),emp=ep.e,pux=ep.u||.1;
        const fat=g=>(foco.has(g)?.7:1)*(g==='costas'&&emp/pux>1.25?.6:1)*(g==='peito'&&emp/pux<.8?.6:1);
        opc.sort((a,b)=>real[a]/faixa(a,p).min*fat(a)-real[b]/faixa(b,p).min*fat(b));
        for(const g of opc){const r=escolher(g,1,L,usados,p,prefs);if(r.length){L.push({u:uidl(),id:r[0],...prescricao(r[0],p)});soma(r[0]);mudou=true;return;}esgotado[i].add(g);}
      });
    }
    const plano={origem:'ia',criado:Date.now(),dias:{}};
    const ordemG=g=>(foco.has(g)?0:10)+(g==='abdomen'?50:GRUPOS[g].tam==='G'?1:GRUPOS[g].tam==='M'?2:3)+GRUPO_IDS.indexOf(g)/100;
    const vazios=[];
    dias.forEach((d,i)=>{
      if(!(lista_[i]||[]).length){vazios.push(d);return;}
      const ex=(lista_[i]||[]).slice().sort((a,b)=>{const A=EXS[a.id],B=EXS[b.id];return ordemG(A.g)-ordemG(B.g)||(A.t==='c'?0:1)-(B.t==='c'?0:1);});
      plano.dias[d]={nome:nomeDia([...new Set(ex.map(it=>EXS[it.id].g))]),ex};
    });
    /* explicações */
    const o=OBJ[p.objetivo]||OBJ.massa,ex=[];
    ex.push(`${div.tipo}, porque você vai treinar ${dias.length} ${dias.length===1?'dia':'dias'} por semana no nível ${NIVEL[p.nivel]||'iniciante'}.`);
    ex.push(`Todos os exercícios começam com ${PADRAO.s} séries de ${PADRAO.r} repetições. A IA acompanha seu desempenho e avisa quando subir o peso.`);
    ex.push(`Descanso de ${o.desc[0]} s nos exercícios grandes e ${o.desc[1]} s nos isolados, pensando em ${o.n.toLowerCase()}.`);
    ex.push(`Cada treino foi ajustado para caber em uns ${p.tempo||45} minutos.`);
    if(p.foco&&p.foco.length)ex.push(p.somente?`Treino só de ${lista(p.foco.map(g=>GRUPOS[g].n.toLowerCase()))}, como você pediu.`:`Volume extra para ${lista(p.foco.map(g=>GRUPOS[g].n.toLowerCase()))} e esses grupos vêm primeiro no treino.`);
    if(p.evitar&&p.evitar.length)ex.push(`Sem exercícios de ${lista(p.evitar.map(g=>GRUPOS[g].n.toLowerCase()))}.`);
    if(p.lesoes&&p.lesoes.length)ex.push(`Evitei exercícios que forçam ${lista(p.lesoes.map(l=>ART[l]))}. Alguns ficaram liberados com um aviso de cuidado.`);
    if(p.local!=='academia')ex.push(`Só exercícios que dá para fazer em casa${p.local==='casa_halteres'?' com halteres':' sem equipamento'}${p.barra?' e na barra fixa':''}.`);
    const imcP=(+p.peso||70)/Math.pow((+p.altura||170)/100,2);
    if(+p.idade>=60)ex.push('Acima dos 60 anos, priorizei máquinas: elas dão ótimos ganhos de força com menos risco.');
    if(imcP>=30)ex.push('Escolhi exercícios com pouco impacto nas articulações. Somar caminhadas, umas 150 min por semana, ajuda muito na perda de gordura.');
    if(p.local==='casa_corpo')ex.push('Com o peso do corpo, leve as séries para perto do limite. Se 10 repetições ficarem fáceis, desça mais devagar.');
    if(vazios.length)ex.push(`Para ${p.somente&&p.foco.length?lista(p.foco.map(g=>GRUPOS[g].n.toLowerCase())):'o que você escolheu'}, ${dias.length-vazios.length} ${dias.length-vazios.length===1?'dia basta':'dias bastam'} na semana. ${lista(vazios.map(d=>DIAS[d].toLowerCase()))} ${vazios.length===1?'fica':'ficam'} de descanso, porque mais volume não traria ganho.`);
    const mins=Object.values(plano.dias).map(D=>estimaMin(D.ex)),med=mins.length?mins.reduce((a,b)=>a+b,0)/mins.length:0;
    if(med&&+p.tempo>=45&&med<+p.tempo*.65)ex.push(`Seus treinos devem levar uns ${Math.round(med)} min. Com ${dias.length-vazios.length} dias na semana, mais tempo que isso não traria ganho extra.`);
    if(dias.length===1)ex.push('Com 1 dia por semana o volume fica baixo para todos os músculos. Se der, 2 ou 3 dias rendem bem mais.');
    if(p.parado)ex.push('Como você está voltando de uma pausa, a primeira semana é de readaptação, com carga leve.');
    plano.explic=ex;plano.tipo=div.tipo;
    return plano;
  }

  /* ---------- ciclo de 8 semanas ---------- */
  function fase(w,p){
    const ini=p&&(p.nivel==='ini'||p.parado);
    if(w<=(ini?2:1))return{nome:'Adaptação',txt:'Carga leve, parando umas 3 repetições antes do limite. Foque na técnica.'};
    if(w<=3)return{nome:'Volume',txt:'Todas as séries completas, sobrando 1 ou 2 repetições no final.'};
    if(w<=6)return{nome:'Intensidade',txt:ini?'Sobrando só 1 repetição na última série. Bateu 10 em todas? Sobe o peso.':'Última série de cada exercício perto da falha. Bateu 10 em todas? Sobe o peso.'};
    if(w<=8)return{nome:'Pico',txt:ini?'Mantenha as cargas novas e capriche na execução.':'Na última série dos isolados, faça um drop-set: tira uns 30% do peso e continua.'};
    return{nome:'Ciclo concluído',txt:'As 8 semanas acabaram. Peça para a IA recalibrar o plano no Coach.'};
  }

  /* ---------- progressão de carga ---------- */
  function incremento(kg){return kg<10?1:kg<30?2:kg<80?2.5:5;}
  function sugestao(it,u,carga){
    const ex=EXS[it.id],alvo=it.r||10,un=ex.seg?' s':'';
    if(!u)return ex.bw||ex.seg?`Primeira vez: faça ${alvo}${un} com boa técnica.`:'Primeira vez: escolha uma carga em que a última repetição saia firme, sem roubar.';
    const sets=u.sets,bateu=sets.length>=it.s&&sets.every(s=>s.r>=alvo);
    const kgs=sets.map(s=>+s.kg).filter(x=>x>0),kg=kgs.length?Math.max(...kgs):0;
    if(ex.seg)return bateu?`Bateu ${alvo} s em todas. Hoje tente ${alvo+10} s.`:`Tente chegar a ${alvo} s em todas as séries.`;
    if(ex.bw&&!kg)return bateu?`Bateu ${alvo} em todas. Desça mais devagar ou faça ${alvo+2} por série.`:'Busque mais repetições que da última vez.';
    if(bateu)return carga&&kg?`Bateu ${alvo} em todas com ${fmtKg(kg)} kg. Hoje tente ${fmtKg(kg+incremento(kg))} kg.`:`Bateu ${alvo} em todas. Hoje suba um pouco o peso.`;
    if(sets.some(s=>s.r<alvo-2))return carga&&kg?`Ficou abaixo de ${alvo-2} reps. Mantenha ${fmtKg(kg)} kg até firmar, ou baixe um pouco.`:`Ficou abaixo de ${alvo-2} reps. Mantenha o peso até firmar.`;
    return carga&&kg?`Mesmos ${fmtKg(kg)} kg, buscando ${alvo} em todas.`:'Mesmo peso, buscando mais repetições.';
  }
  const fmtKg=n=>(Math.round(n*10)/10).toLocaleString('pt-BR');

  /* empurrar x puxar contado por músculo (deltoide posterior é de puxar) */
  const EMPURRA=new Set(['peito','deltAnt','triceps']),PUXA=new Set(['dorsal','romboides','deltPost','biceps']);
  function empPux(ids){let e=0,u=0;ids.forEach(id=>{const x=EXS[id];if(!x)return;x.p.forEach(m=>{if(EMPURRA.has(m))e+=1;if(PUXA.has(m))u+=1;});x.sec.forEach(m=>{if(EMPURRA.has(m))e+=.5;if(PUXA.has(m))u+=.5;});});return{e,u};}

  /* ---------- análise de um plano (montado pela pessoa ou pela IA) ---------- */
  function volumePlano(plano){
    const v={};GRUPO_IDS.forEach(g=>v[g]=0);
    Object.values(plano.dias||{}).forEach(d=>d.ex.forEach(it=>{const e=EXS[it.id];if(!e)return;
      const vistos=new Set();e.p.forEach(m=>{const g=MUSC_GRUPO[m];if(!vistos.has(g)){v[g]+=it.s;vistos.add(g);}});
      e.sec.forEach(m=>{const g=MUSC_GRUPO[m];if(!vistos.has(g)){v[g]+=it.s/2;vistos.add(g);}});}));
    return v;
  }
  function faixa(g,p){
    const k=p&&p.nivel==='avan'?2:p&&p.nivel==='inter'?1:0,P=GRUPOS[g].tam==='P';
    if(g==='trapezio'||g==='antebraco')return{min:[3,3,4][k],max:[9,10,12][k]};
    const min=P?[4,6,6][k]:[8,10,12][k],max=P?[12,14,16][k]:[16,20,22][k];
    return{min,max};
  }
  function analisar(plano,p){
    const itens=[],bons=[],dias=Object.keys(plano.dias||{}).map(Number);
    let nota=100;
    if(!dias.length)return{nota:0,itens:[{t:'alerta',txt:'Seu plano ainda não tem nenhum dia de treino.'}],bons:[],vol:{}};
    const vol=volumePlano(plano),gs=alvos(p||{}).filter(g=>g!=='antebraco'||(p&&p.foco||[]).includes(g)||vol[g]>0);
    gs.forEach(g=>{
      const f=faixa(g,p),n=vol[g];
      if(n===0){nota-=GRUPOS[g].tam==='P'?3:8;itens.push({t:'alerta',txt:`Nenhum exercício para ${GRUPOS[g].n.toLowerCase()}.`});}
      else if(n<f.min*.6){nota-=4;itens.push({t:'dica',txt:`Pouco volume para ${GRUPOS[g].n.toLowerCase()}: ${fmtKg(n)} séries na semana. O ideal fica entre ${f.min} e ${f.max}.`});}
      else if(n>f.max*1.5){nota-=5;itens.push({t:'alerta',txt:`Volume alto para ${GRUPOS[g].n.toLowerCase()}: ${fmtKg(n)} séries na semana. Acima de ${f.max} a recuperação pode não acompanhar.`});}
      else if(n>=f.min)bons.push(GRUPOS[g].n);
    });
    const ep=empPux(Object.values(plano.dias).flatMap(d=>d.ex.map(it=>it.id))),emp=ep.e,pux=ep.u;
    if(emp>0&&pux>0&&emp/pux>1.5){nota-=6;itens.push({t:'dica',txt:'Você empurra bem mais do que puxa. Inclua remadas ou face pull para equilibrar e proteger os ombros.'});}
    if(vol.quadriceps>0&&vol.posteriores===0&&gs.includes('posteriores')){nota-=5;itens.push({t:'dica',txt:'Tem quadríceps mas falta posterior de coxa. Stiff ou mesa flexora equilibram o joelho.'});}
    const ordem=[1,2,3,4,5,6,0].filter(d=>dias.includes(d));
    ordem.forEach((d,i)=>{
      const dia=plano.dias[d],est=estimaMin(dia.ex);
      if(!dia.ex.length){nota-=3;itens.push({t:'dica',txt:`${DIAS[d]} está sem exercícios.`});return;}
      if(p&&p.tempo&&est>+p.tempo+10){nota-=4;itens.push({t:'dica',txt:`${DIAS[d]} deve levar uns ${est} min, acima dos ${p.tempo} min que você tem.`});}
      if(dia.ex.length>10){nota-=3;itens.push({t:'dica',txt:`${DIAS[d]} tem ${dia.ex.length} exercícios. Depois do oitavo a qualidade costuma cair.`});}
      const vistos={};dia.ex.forEach((it,k)=>{const e=EXS[it.id];if(!e)return;
        if(e.t==='c'&&vistos[e.g]){nota-=2;itens.push({t:'dica',txt:`No treino de ${DIAS[d].toLowerCase()}, faça ${e.n} antes de ${EXS[vistos[e.g]].n}. Exercícios compostos vêm primeiro.`});}
        if(e.t==='i'&&!vistos[e.g])vistos[e.g]=it.id;});
      const prox=ordem[i+1];
      if(prox!=null&&(prox-d+7)%7===1){
        const g1=new Set(dia.ex.map(it=>EXS[it.id]&&EXS[it.id].g)),g2=plano.dias[prox].ex.map(it=>EXS[it.id]&&EXS[it.id].g);
        const rep=[...new Set(g2.filter(g=>g1.has(g)&&GRUPOS[g]&&GRUPOS[g].tam==='G'))];
        rep.forEach(g=>{const n1=dia.ex.filter(it=>EXS[it.id].g===g).length,n2=plano.dias[prox].ex.filter(it=>EXS[it.id].g===g).length;
          if(n1>=2&&n2>=2){nota-=4;itens.push({t:'dica',txt:`${GRUPOS[g].n} pesado em ${DIAS[d].toLowerCase()} e de novo em ${DIAS[prox].toLowerCase()}. O músculo grande precisa de umas 48 h para recuperar.`});}});
      }
      if(p&&p.lesoes&&p.lesoes.length)dia.ex.forEach(it=>{const e=EXS[it.id];const l=e&&e.r.filter(x=>p.lesoes.includes(x));if(l&&l.length){nota-=3;itens.push({t:'alerta',txt:`${e.n} exige cuidado com ${lista(l.map(x=>ART[x]))}, que você marcou como sensível.`});}});
    });
    if(dias.length>=6)itens.push({t:'dica',txt:'Treinar 6 dias pede sono e comida em dia. Se cansar demais, a IA sugere tirar um dia.'});
    return{nota:Math.max(0,Math.min(100,Math.round(nota))),itens,bons,vol};
  }

  /* ---------- aprendizado e conselhos com base no histórico ---------- */
  function insights(S){
    const out=[],p=S.perfil||{},hist=S.hist||[],plano=S.plano||{dias:{}};
    const nd=Object.keys(plano.dias||{}).length;
    if(!hist.length){out.push({t:'dica',tit:'Primeiro treino',txt:'Assim que você finalizar os primeiros treinos, eu começo a analisar suas cargas, repetições e frequência para ajustar o plano.'});return out;}
    /* frequência nas últimas 2 semanas */
    const agora=Date.now(),d14=hist.filter(h=>agora-new Date(h.data+'T12:00:00')<14*864e5).length;
    const primeira=new Date(hist[0].data+'T12:00:00');
    if(agora-primeira>14*864e5&&nd){
      const taxa=d14/(nd*2);
      if(taxa<.6)out.push({t:'alerta',tit:'Frequência abaixo do plano',txt:`Nas últimas 2 semanas foram ${d14} treinos de ${nd*2} planejados. Um plano com menos dias que você consiga cumprir rende mais.`,acao:{act:'ia-menosdias',lab:`Refazer com ${Math.max(2,Math.round(nd*taxa)+1)} dias`,v:Math.max(2,Math.round(nd*taxa)+1)}});
      else if(taxa>=.9)out.push({t:'ok',tit:'Constância excelente',txt:`${d14} treinos nas últimas 2 semanas. É isso que gera resultado.`});
    }
    /* por exercício */
    const porEx={};hist.forEach(h=>h.ex.forEach(e=>{(porEx[e.id]=porEx[e.id]||[]).push({data:h.data,sets:e.sets});}));
    const itens=[];Object.values(plano.dias||{}).forEach(d=>d.ex.forEach(it=>itens.push(it)));
    let subir=[],travado=[];
    itens.forEach(it=>{
      const L=porEx[it.id];if(!L||!L.length)return;
      const u=L[L.length-1],alvo=it.r||10;
      if(u.sets.length>=it.s&&u.sets.every(s=>s.r>=alvo))subir.push(it.id);
      if(L.length>=3){const t=L.slice(-3).map(x=>Math.max(...x.sets.map(s=>(+s.kg||0)*100+s.r)));if(t[2]<=t[0]&&t[1]<=t[0])travado.push(it.id);}
    });
    subir=[...new Set(subir)];travado=[...new Set(travado)].filter(id=>!subir.includes(id));
    if(subir.length)out.push({t:'ok',tit:'Hora de subir o peso',txt:`Você bateu todas as repetições em ${lista(subir.slice(0,4).map(id=>EXS[id].n))}${subir.length>4?' e mais '+(subir.length-4):''}. No próximo treino aumente um pouco a carga.`});
    travado.slice(0,2).forEach(id=>{const alt=alternativas(id,e=>serve(e,p))[0];
      out.push({t:'dica',tit:`${EXS[id].n} parou de evoluir`,txt:`Três treinos sem melhora. Trocar a variação por algumas semanas costuma destravar${alt?`, por exemplo ${EXS[alt].n}`:''}.`,acao:alt?{act:'ia-trocar',lab:`Trocar por ${EXS[alt].n}`,de:id,para:alt}:null});});
    /* exercícios pulados com frequência */
    const pulos=S.ia&&S.ia.pulos||{};
    Object.entries(pulos).filter(([id,n])=>n>=2&&itens.some(it=>it.id===id)).slice(0,2).forEach(([id])=>{
      const alt=alternativas(id,e=>serve(e,p))[0];
      out.push({t:'dica',tit:`Você costuma pular ${EXS[id].n}`,txt:'Se o aparelho vive ocupado ou o exercício incomoda, vale trocar de vez.',acao:alt?{act:'ia-trocar',lab:`Trocar por ${EXS[alt].n}`,de:id,para:alt}:null});});
    /* duração */
    const ult=hist.slice(-4).filter(h=>h.dur),med=ult.length?ult.reduce((a,h)=>a+h.dur,0)/ult.length:0;
    if(p.tempo&&med>+p.tempo*1.25&&ult.length>=3)out.push({t:'dica',tit:'Treinos mais longos que o planejado',txt:`A média recente foi de ${Math.round(med)} min para ${p.tempo} min planejados. Vale descansar só o tempo marcado ou pedir um plano mais enxuto.`});
    /* peso corporal x objetivo */
    const c=(S.corpo||[]).filter(x=>+x.peso>0).sort((a,b)=>a.data.localeCompare(b.data));
    if(c.length>=2){
      const a=c[Math.max(0,c.length-4)],b=c[c.length-1],dias=(new Date(b.data)-new Date(a.data))/864e5;
      if(dias>=13){const r=(b.peso-a.peso)/(dias/7),obj=p.objetivo;
        if(obj==='massa'&&r<.1)out.push({t:'dica',tit:'Peso parado',txt:`Seu peso variou ${fmtKg(r)} kg por semana. Para ganhar massa, some umas 250 kcal por dia.`,acao:{act:'ia-kcal',lab:'Somar 250 kcal na meta',v:250}});
        if(obj==='massa'&&r>.7)out.push({t:'dica',tit:'Ganhando peso rápido demais',txt:`${fmtKg(r)} kg por semana tende a virar gordura. Tire umas 200 kcal por dia.`,acao:{act:'ia-kcal',lab:'Tirar 200 kcal da meta',v:-200}});
        if((obj==='emagrecer'||obj==='definir')&&r>-.1)out.push({t:'dica',tit:'Peso não está caindo',txt:'Nas últimas semanas o peso ficou parado. Reduza umas 200 kcal por dia ou caminhe mais 20 min.',acao:{act:'ia-kcal',lab:'Tirar 200 kcal da meta',v:-200}});
        if(obj==='emagrecer'&&r<-(b.peso*.012))out.push({t:'alerta',tit:'Perdendo peso rápido demais',txt:'Mais de 1% do peso por semana costuma levar músculo junto. Some umas 200 kcal.',acao:{act:'ia-kcal',lab:'Somar 200 kcal',v:200}});
      }
    }else out.push({t:'dica',tit:'Registre seu peso',txt:'Pese-se uma vez por semana em Evolução, Corpo. Com isso eu ajusto suas calorias.'});
    /* ciclo */
    const ini=S.inicio?new Date(S.inicio+'T12:00:00'):primeira,sem=Math.floor((agora-ini)/864e5/7)+1;
    if(sem>8)out.push({t:'alerta',tit:'Ciclo de 8 semanas concluído',txt:'Hora de recalibrar: eu monto um plano novo com variações e mais volume para o seu nível atual.',acao:{act:'ia-recalibrar',lab:'Recalibrar o plano'}});
    return out;
  }

  /* ---------- perguntas e respostas ---------- */
  const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
  const STOP=new Set('a o e de da do das dos um uma uns umas para pra por com sem em no na nos nas que qual quais como quando onde eu meu minha meus minhas voce vc se ser e ou mais muito muita ao aos as os isso esse essa este esta tem ter ta to fazer faz fiz posso pode devo deve preciso precisa quero queria sobre tipo coisa melhor'.split(' '));
  const raiz=w=>w.length>4?w.replace(/(oes|aes|ais|eis|ns|s)$/,''):w;
  const toks=s=>norm(s).split(' ').filter(w=>w&&!STOP.has(w)).map(raiz);
  let idx=null;
  function indexar(){
    idx=(window.CONHECIMENTO||[]).map(k=>({k,t:new Set(k.k.flatMap(x=>toks(x)))}));
    const df={};idx.forEach(e=>e.t.forEach(w=>df[w]=(df[w]||0)+1));
    idx.forEach(e=>e.idf=w=>Math.log(1+idx.length/(df[w]||1)));
  }
  function acharExercicio(q){
    const qt=new Set(toks(q));let best=null;
    EX_IDS.forEach(id=>{const nt=toks(EXS[id].n.replace(/\(.*?\)/g,''));if(!nt.length)return;
      const hit=nt.filter(w=>qt.has(w)).length,s=hit/nt.length+hit*.1;
      if(hit>=Math.min(2,nt.length)&&(!best||s>best.s))best={id,s};});
    return best&&best.s>=.6?best.id:null;
  }
  function responder(q,S){
    if(!idx)indexar();
    const n=norm(q),p=S&&S.perfil||{},cc=S&&S.perfil?calc(p,S.ia&&S.ia.ajKcal):null;
    const tem=re=>re.test(n);
    /* perguntas sobre os próprios números */
    if(cc&&tem(/\b(caloria|calorias|kcal|quanto (devo )?comer|dieta)\b/))return{txt:`Pelo seu perfil, ${cc.kcal.toLocaleString('pt-BR')} kcal por dia, com ${cc.prot} g de proteína, ${cc.carb} g de carboidrato e ${cc.gord} g de gordura. Seu gasto estimado é de ${cc.gasto.toLocaleString('pt-BR')} kcal. Meta de ritmo: ${cc.ritmo}. Ajuste pela balança a cada 2 semanas.`};
    if(cc&&tem(/\bproteina/)&&tem(/\b(quanto|quantas|quantos|meta|preciso|devo)\b/))return{txt:`Sua meta é de ${cc.prot} g de proteína por dia, dividida em 3 a 5 refeições. Boas fontes: ovos, frango, carne, peixe, leite, iogurte, queijo, feijão e whey se precisar completar.`};
    if(cc&&tem(/\b(agua|hidrat)/))return{txt:`Uns ${String(cc.agua).replace('.',',')} litros de água por dia para o seu peso, mais um pouco nos dias de treino e calor. Urina clara é um bom sinal.`};
    if(cc&&tem(/\b(imc|peso ideal)\b/))return{txt:`Seu IMC é ${fmtKg(cc.imc)}, ${cc.imcTxt}. Para sua altura, a faixa considerada saudável vai de ${cc.pesoMin} a ${cc.pesoMax} kg. O IMC não diferencia músculo de gordura, então a cintura e o espelho contam muito.`};
    if(S&&S.plano&&tem(/\b(treino de hoje|treino hoje|hoje)\b/)){const d=new Date().getDay(),t=S.plano.dias[d];
      return{txt:t?`Hoje é ${t.nome.toLowerCase()}: ${lista(t.ex.map(it=>EXS[it.id].n))}.`:'Hoje é dia de descanso no seu plano. Aproveite para dormir bem e comer direito.'};}
    /* exercício específico */
    const exId=acharExercicio(q);
    if(exId&&!tem(/\b(substitu|trocar|alternativa)/)){const e=EXS[exId];return{txt:`${e.n}: ${e.dica} Trabalha ${lista(e.p.map(m=>NOMES[m].toLowerCase()))}${e.sec.length?`, com ajuda de ${lista(e.sec.map(m=>NOMES[m].toLowerCase()))}`:''}.`,ex:exId};}
    if(exId){const a=alternativas(exId,e=>serve(e,p)).slice(0,3);return{txt:`Boas alternativas para ${EXS[exId].n}: ${lista(a.map(x=>EXS[x].n))}. Dá para trocar direto no treino, no botão Trocar.`,ex:exId};}
    /* base de conhecimento */
    const qt=toks(q);let best=null,seg=null;
    idx.forEach(e=>{let s=0;qt.forEach(w=>{if(e.t.has(w))s+=e.idf(w);});
      if(e.k.frase&&e.k.frase.some(f=>n.includes(norm(f))))s+=3;
      if(!best||s>best.s){seg=best;best={e,s};}else if(!seg||s>seg.s)seg={e,s};});
    if(best&&best.s>=1.2){let txt=best.e.k.r;if(typeof txt==='function')txt=txt(p,cc);return{txt,tema:best.e.k.q,rel:seg&&seg.s>=1.2?seg.e.k.q:null};}
    return{txt:'Ainda não sei responder isso. Pergunte sobre treino, descanso, alimentação, suplementos, dor, progressão de carga ou sobre um exercício pelo nome.',nada:true};
  }

  return{calc,gerar,analisar,insights,responder,sugestao,fase,prescricao,serve,eqOk,estimaMin,volumePlano,faixa,nomeDia,alvos,OBJ,NIVEL,LOCAL,DIAS,DIAS_C,ORDEM_SEMANA,PADRAO,lista,fmtKg,uidl};
})();
