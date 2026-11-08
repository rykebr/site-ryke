'use strict';
/* ================= Utilidades ================= */
const $=s=>document.querySelector(s);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const isoDe=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const hojeISO=()=>isoDe(new Date());
const dt=iso=>new Date(iso+'T12:00:00');
const dataBR=iso=>dt(iso).toLocaleDateString('pt-BR',{weekday:'short',day:'2-digit',month:'2-digit'});
const dm=iso=>{const d=dt(iso);return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;};
const num=v=>{if(v===''||v==null)return NaN;const n=parseFloat(String(v).replace(',','.'));return isFinite(n)?n:NaN;};
const fk=n=>(Math.round(n*10)/10).toLocaleString('pt-BR');
const fint=n=>Math.round(n).toLocaleString('pt-BR');
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inicioSemana=d=>{const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x;};
const normNome=s=>String(s||'').trim().replace(/\s+/g,' ').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');
const iniciais=n=>String(n||'?').trim().split(/\s+/).filter(Boolean).slice(0,2).map(p=>p[0].toUpperCase()).join('');
const primeiro=n=>String(n||'').trim().split(/\s+/)[0]||'';
const CHECK='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const DIAS=IA.DIAS,DC=IA.DIAS_C,OS=IA.ORDEM_SEMANA;
const ICO={barra:'<path d="M3 4h18M8 4v5M16 4v5"/><circle cx="12" cy="8.5" r="2"/><path d="M8 9c1.6 2.2 6.4 2.2 8 0M12 11v6M9 21l3-4 3 4"/>',alvo:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>',
  chama:'<path d="M12 3c.8 3.6 5 5.2 5 10a5 5 0 0 1-10 0c0-2.6 1.6-3.8 2.2-5.4.9 1.4 1.7 2 2.6 2.1-.9-2.8-.4-4.8.2-6.7z"/>',
  brilho:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  halter:'<path d="M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12"/>',coracao:'<path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
  predio:'<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-5h6v5M8 11h2M14 11h2"/>',casa:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  corpo:'<circle cx="12" cy="4.5" r="2.2"/><path d="M12 7.5v7M6.5 10.5h11M9 21l3-6.5 3 6.5"/>',
  n1:'<path d="M6 20v-4"/><path d="M12 20v-8" opacity=".3"/><path d="M18 20V6" opacity=".3"/>',n2:'<path d="M6 20v-4M12 20v-8"/><path d="M18 20V6" opacity=".3"/>',n3:'<path d="M6 20v-4M12 20v-8M18 20V6"/>',
  ia:'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/>',mao:'<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11V4a1.5 1.5 0 0 1 3 0v7M14 11V5.5a1.5 1.5 0 0 1 3 0V14a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L3.5 14a1.5 1.5 0 0 1 2.4-1.8L8 14"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',alerta:'<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17v.5"/>',lampada:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  enviar:'<path d="M4 12l16-8-6 16-2.5-6.5z"/><path d="M11.5 13.5L20 4"/>',grafico:'<path d="M4 4v16h16"/><path d="M8 15l4-4 3 3 5-6"/>',prato:'<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M5 3v5M3 3v3a2 2 0 0 0 4 0V3M19 3c-1.5 1-2 3-2 5h2v13"/>'};
const svg=k=>`<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICO[k]||''}</svg>`;
const matiz=n=>{let h=0;for(const c of String(n||''))h=(h*31+c.charCodeAt(0))%360;return h;};
const avatar=n=>`<span class="av" style="--h:${matiz(n)}">${esc(iniciais(n))}</span>`;
const FOTOS=['fundo4.webp','fundo2.webp','fundo5.webp','fundo3.webp','fundo1.webp','fundo6.webp'];
const FRASES=['Cada série te deixa mais perto.','Constância vence motivação.','O treino de hoje é o resultado de amanhã.','Comece leve. Mas comece.','Seu único adversário é você de ontem.','Disciplina é lembrar do que você quer.'];
const fmt=s=>{s=Math.max(0,Math.floor(s));const h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return(h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0');};

/* ================= Armazenamento ================= */
const LS={
  get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}},
  set(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true;}catch(e){return false;}},
  del(k){try{localStorage.removeItem(k);}catch(e){}}
};
const K_CONTAS='rt-contas',K_LISTA='rt-lista',K_ATUAL='rt-atual',kDados=id=>'rt-dados-'+id;
let contas=LS.get(K_CONTAS,{})||{};
let listaNuvem=LS.get(K_LISTA,[])||[];
let contaId=null,S=null;
const salvarContas=()=>LS.set(K_CONTAS,contas);

const CFG0={som:true,vib:true,tema:'auto',anim:true,carga:true,crono:true};
function novoEstado(perfil,plano){
  return{v:1,perfil,plano:plano||{origem:'manual',dias:{}},inicio:hojeISO(),hist:[],corpo:perfil&&+perfil.peso?[{data:hojeISO(),peso:+perfil.peso}]:[],
    cfg:{...CFG0},sessao:null,ia:{pref:{},pulos:{},ajKcal:0},apagados:[],atualizado:Date.now()};
}
function normal(s){
  if(!s||typeof s!=='object')return null;
  s.v=1;
  s.hist=Array.isArray(s.hist)?s.hist:[];
  s.corpo=Array.isArray(s.corpo)?s.corpo:[];
  s.apagados=Array.isArray(s.apagados)?s.apagados:[];
  s.cfg={...CFG0,...(s.cfg||{})};
  s.ia={pref:{},pulos:{},ajKcal:0,...(s.ia||{})};
  s.plano=s.plano&&typeof s.plano==='object'?s.plano:{origem:'manual',dias:{}};
  s.plano.dias=s.plano.dias||{};
  Object.keys(s.plano.dias).forEach(d=>{const D=s.plano.dias[d];if(!D||!Array.isArray(D.ex)){delete s.plano.dias[d];return;}
    D.nome=D.nome||'Treino';D.ex=D.ex.filter(it=>it&&EXS[it.id]);
    D.ex.forEach(it=>{it.u=it.u||uid();it.s=Math.max(1,+it.s||3);it.r=Math.max(1,+it.r||10);it.desc=Math.max(10,+it.desc||60);});});
  s.hist.forEach(h=>{h.id=h.id||uid();h.ex=(h.ex||[]).filter(e=>e&&EXS[e.id]&&Array.isArray(e.sets));});
  if(s.sessao&&(!Array.isArray(s.sessao.itens)||!s.sessao.itens.length))s.sessao=null;
  if(s.sessao){s.sessao.itens=s.sessao.itens.filter(it=>EXS[it.id]&&Array.isArray(it.sets));if(!s.sessao.itens.length)s.sessao=null;else s.sessao.x=Math.min(Math.max(0,s.sessao.x|0),s.sessao.itens.length-1);}
  return s;
}
/* junta os dados do aparelho com os da nuvem sem perder treinos feitos em aparelhos diferentes */
function juntar(loc,nuv){
  if(!nuv||!nuv.perfil)return loc;if(!loc||!loc.perfil)return{...nuv,sessao:loc&&loc.sessao||null};
  const base=(nuv.atualizado||0)>(loc.atualizado||0)?nuv:loc,outro=base===nuv?loc:nuv;
  const r={...base};
  r.apagados=[...new Set([...(loc.apagados||[]),...(nuv.apagados||[])])];
  const H=new Map();[...base.hist,...outro.hist].forEach(h=>{if(!H.has(h.id))H.set(h.id,h);});
  r.hist=[...H.values()].filter(h=>!r.apagados.includes('h:'+h.id)).sort((a,b)=>a.data.localeCompare(b.data)||(a.start||0)-(b.start||0));
  const C=new Map();[...outro.corpo,...base.corpo].forEach(c=>C.set(c.data,{...(C.get(c.data)||{}),...c}));
  r.corpo=[...C.values()].filter(c=>!r.apagados.includes('c:'+c.data)).sort((a,b)=>a.data.localeCompare(b.data));
  r.sessao=loc.sessao||null;
  r.atualizado=Math.max(loc.atualizado||0,nuv.atualizado||0);
  return normal(r);
}

/* ================= Sincronização com a nuvem ================= */
let syncTimer=null,syncando=false,syncEst='',syncHora=0;
function setSync(e,h){syncEst=e;if(h)syncHora=h;const d=$('#sync');if(!d)return;d.hidden=!S;d.className='sync '+(e||'');d.title={ok:'Salvo na nuvem',pend:'Aguardando para enviar',erro:'Não foi possível salvar na nuvem'}[e]||'';const st=$('#syncstatus');if(st)st.innerHTML=syncTexto();}
function syncTexto(){
  const c=contas[contaId];if(!c)return '';
  if(c.pendente)return 'Conta criada só neste aparelho. Ela vai para a nuvem assim que tiver internet.';
  if(!c.token)return 'Desconectado. Entre de novo para salvar na nuvem.';
  if(syncEst==='ok')return `Tudo salvo na nuvem${syncHora?` às ${new Date(syncHora).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`:''}.`;
  if(syncEst==='pend')return navigator.onLine?'Salvando na nuvem…':'Sem internet. Tudo fica salvo no aparelho e vai para a nuvem quando conectar.';
  if(syncEst==='erro')return 'Não consegui salvar na nuvem agora. Vou tentar de novo.';
  return 'Salvo neste aparelho.';
}
const sujo=()=>{const c=contas[contaId];return !!(S&&c&&(c.pendente||(S.atualizado||0)>(c.sinc||0)));};
function save(){if(!S||!contaId)return;S.atualizado=Date.now();LS.set(kDados(contaId),S);agendarSync();}
function saveLocal(){if(S&&contaId)LS.set(kDados(contaId),S);}
function agendarSync(ms=2000){clearTimeout(syncTimer);syncTimer=setTimeout(sincronizar,ms);setSync('pend');}
async function sincronizar(){
  const id=contaId,c=contas[id];if(!c||!S)return;
  if(syncando){agendarSync(2500);return;}
  if(!navigator.onLine){setSync('pend');return;}
  syncando=true;
  try{
    if(c.pendente){
      const r=await Nuvem.criar(c.nome,c.senha,S);
      if(r&&r.erro){setSync('erro');if(r.erro==='nome_existe')toast('Já existe uma conta com o nome '+c.nome+' na nuvem. Seus dados seguem salvos neste aparelho.');return;}
      LS.set(kDados(r.id),S);LS.del(kDados(id));delete contas[id];
      contas[r.id]={nome:r.nome,token:r.token,base:r.versao,sinc:S.atualizado};contaId=r.id;LS.set(K_ATUAL,r.id);salvarContas();setSync('ok',Date.now());return;
    }
    if(!c.token){setSync('erro');return;}
    if(!sujo()){setSync('ok');return;}
    const enviado=S.atualizado;
    let r=await Nuvem.salvar(c.token,S,c.base);
    if(r&&r.erro==='conflito'){
      S=juntar(S,normal(r.estado));c.base=r.versao;saveLocal();
      r=await Nuvem.salvar(c.token,S,c.base);
      if(!r||!r.versao)throw new Error('conflito');
      c.base=r.versao;c.sinc=S.atualizado;salvarContas();setSync('ok',Date.now());
      if(!document.activeElement||!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))show(atual,true);
      return;
    }
    if(r&&r.erro==='sessao'){c.token=null;salvarContas();setSync('erro');toast('Sua sessão expirou. Toque no seu nome no início para entrar de novo.');return;}
    if(r&&r.versao){c.base=r.versao;c.sinc=enviado;salvarContas();setSync(sujo()?'pend':'ok',Date.now());if(sujo())agendarSync(1500);}
  }catch(e){setSync(e.rede?'pend':'erro');if(!e.rede)agendarSync(30000);}
  finally{syncando=false;}
}
async function puxarNuvem(){
  const c=contas[contaId];if(!c||!c.token||!navigator.onLine)return;
  try{
    const r=await Nuvem.carregar(c.token);
    if(r&&r.erro==='sessao'){c.token=null;salvarContas();setSync('erro');return;}
    if(!r||r.versao==null)return;
    if(r.versao!==c.base){
      const nuv=normal(r.estado);
      S=sujo()?juntar(S,nuv):(nuv&&nuv.perfil?{...nuv,sessao:S.sessao}:S);
      c.base=r.versao;if(!sujo())c.sinc=S.atualizado;salvarContas();saveLocal();
      const foco=document.activeElement&&/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
      if(!foco&&!$('#dlg').open)show(atual,true);
    }
    if(sujo())sincronizar();else setSync('ok',Date.now());
  }catch(e){setSync('pend');}
}
window.addEventListener('online',()=>{if(S)sujo()?sincronizar():puxarNuvem();});
setInterval(()=>{if(S&&sujo()&&navigator.onLine&&!syncando)sincronizar();},60000);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&S&&sujo())sincronizar();});

/* ================= Tema, toast e diálogos ================= */
function aplicaTema(){const t=S?S.cfg.tema:'auto';if(t==='auto')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',t);}
let toastT=null;
function toast(msg,ms=3200){const t=$('#toast');t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,ms);}
function abrirDlg(html,cls=''){const d=$('#dlg');d.className=cls;$('#dconteudo').innerHTML=html;observar();if(d.showModal){try{if(!d.open)d.showModal();return;}catch(e){}}d.setAttribute('open','');}
function fecharDlg(){const d=$('#dlg');if(d.close)d.close();else d.removeAttribute('open');observar();}
function armar(btn,fn,lab){
  if(btn.dataset.arm==='1'){btn.dataset.arm='';fn();return;}
  btn.dataset.arm='1';const old=btn.innerHTML;btn.textContent=lab||'Toque de novo para confirmar';
  setTimeout(()=>{if(btn.isConnected&&btn.dataset.arm==='1'){btn.dataset.arm='';btn.innerHTML=old;}},3500);
}
animLigada=()=>(!S||S.cfg.anim!==false)&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ================= Ciclo ================= */
function semana(){if(!S||!S.inicio)return 1;return Math.max(1,Math.floor((dt(hojeISO())-dt(S.inicio))/864e5/7)+1);}
const diasPlano=()=>OS.filter(d=>S.plano.dias[d]);
function proximoDia(apos){const ds=diasPlano();if(!ds.length)return null;for(let k=1;k<=7;k++){const d=(apos+k)%7;if(S.plano.dias[d])return d;}return ds[0];}
function diaPadrao(){if(S.sessao)return S.sessao.dia;const h=new Date().getDay();if(S.plano.dias[h])return h;return proximoDia(h);}
const repsTxt=it=>`${it.r}${EXS[it.id].seg?' s':' reps'}${EXS[it.id].lado?' '+EXS[it.id].lado:''}`;

/* ================= Histórico: consultas ================= */
function ultima(id){for(let i=S.hist.length-1;i>=0;i--){const e=S.hist[i].ex.find(x=>x.id===id&&x.sets.length);if(e)return{data:S.hist[i].data,sets:e.sets};}return null;}
const metrica=s=>s.kg>0?s.kg*(1+s.r/30):s.r;
function recorde(id,ate=S.hist.length){let best=null;for(let i=0;i<ate;i++){const h=S.hist[i];h.ex.filter(x=>x.id===id).forEach(x=>x.sets.forEach(s=>{const v=metrica(s);if(!best||v>best.v)best={v,s,data:h.data};}));}return best;}
const fmtSets=sets=>sets.map(s=>s.kg>0?`${s.r}×${fk(s.kg)}kg`:`${s.r}`).join(', ')+(sets.some(s=>s.kg>0)?'':' reps');

/* ================= Navegação ================= */
const ABAS=['treino','plano','coach','evolucao','perfil'];
let atual='inicio',diaSel=null,diaPlano=null,segEvo='exercicios',ultimaTela='';
function show(v,manter){
  if(v!=='inicio'&&v!=='novo'&&!S)v='inicio';
  if(S&&!S.perfil&&v!=='inicio'&&v!=='novo'){if(!OB||OB.modo!=='completar')OB=obNovo('completar');v='novo';}
  const y=window.scrollY;atual=v;
  const app=!!S&&(ABAS.includes(v)||v==='calistenia');
  $('#nav').hidden=!app;$('#bhome').hidden=!S||v==='inicio';
  $('#titulo').textContent=S&&v!=='inicio'&&v!=='novo'?`de ${primeiro(S.perfil&&S.perfil.nome||contas[contaId]&&contas[contaId].nome)}`:'';
  $('#semchip').textContent=app&&S.plano&&diasPlano().length?`Semana ${Math.min(semana(),8)} de 8`:'';
  $('#sync').hidden=!S||!app;
  document.querySelectorAll('#nav a').forEach(a=>a.setAttribute('aria-current',a.dataset.n===v||(v==='calistenia'&&a.dataset.n==='treino')));
  const m=$('#main');
  if(v!==ultimaTela){m.classList.remove('entra');void m.offsetWidth;m.classList.add('entra');ultimaTela=v;}else m.classList.remove('entra');
  document.body.classList.toggle('na-capa',v==='inicio');document.body.classList.toggle('no-chat',v==='coach');
  try{
    if(v==='inicio')m.innerHTML=telaInicio();
    else if(v==='novo')m.innerHTML=telaNovo();
    else if(v==='treino')m.innerHTML=telaTreino();
    else if(v==='plano')m.innerHTML=telaPlano();
    else if(v==='coach')m.innerHTML=telaCoach();
    else if(v==='evolucao')m.innerHTML=telaEvolucao();
    else if(v==='perfil')m.innerHTML=telaPerfil();
    else if(v==='calistenia')m.innerHTML=telaCalistenia();
    else if(v==='editar')m.innerHTML=telaEditar();
  }catch(e){console.error(e);m.innerHTML=`<div class="card"><h3>Algo deu errado</h3><p>${esc(e.message)}</p><button class="btn" data-act="ir" data-v="treino">Voltar</button></div>`;}
  window.scrollTo(0,manter?y:0);
  const cs=document.querySelector('.chipsel'),c=cs&&cs.querySelector('[aria-current="true"]');if(cs&&c)cs.scrollLeft=c.offsetLeft-cs.offsetLeft-cs.clientWidth/2+c.offsetWidth/2;
  const chat=$('#chat');if(chat)chat.scrollTop=chat.scrollHeight;
  observar();atualizaBarra();setSync(syncEst);
}
function ir(v){if(location.hash.slice(1)===v)show(v);else location.hash=v;}
window.addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h==='editar'&&S)return show('editar');show(ABAS.includes(h)||h==='novo'||h==='inicio'||h==='calistenia'?h:(S?'treino':'inicio'));});

/* ================= Instalar como app ================= */
let instalarEvt=null;
const instalado=()=>(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
const ehIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();instalarEvt=e;if(atual==='inicio'||atual==='perfil')show(atual,true);});
window.addEventListener('appinstalled',()=>{instalarEvt=null;LS.set('rt-instalado',1);toast('App instalado! Procure o ícone Treinos na tela inicial.',4500);if(atual==='inicio'||atual==='perfil')show(atual,true);});
function cartaoInstalar(lugar){
  if(instalado()||(lugar==='inicio'&&LS.get('rt-instalar-oculto',0)>Date.now()))return '';
  const ios=ehIOS();
  return `<div class="instalar" id="instalar"><img src="img/icon-192.png" alt="" width="48" height="48"><div><b>Instale o app</b><small>${ios?'Fica na tela inicial do iPhone, abre em tela cheia e funciona sem internet.':'Ícone na tela inicial, abre em tela cheia, funciona sem internet e tem atalhos para Treino e Coach.'}</small></div>
    <button class="btn cheio" type="button" data-act="instalar">${ios?'Como instalar':'Instalar'}</button>${lugar==='inicio'?'<button class="x" type="button" data-act="instalarx" aria-label="Agora não">×</button>':''}</div>`;
}
async function instalar(){
  if(instalarEvt){const e=instalarEvt;instalarEvt=null;try{e.prompt();const r=await e.userChoice;if(r&&r.outcome==='accepted')LS.set('rt-instalado',1);}catch(err){}show(atual,true);return;}
  const ios=ehIOS();
  abrirDlg(`<h3>Instalar o app</h3>${ios?`<ol class="passosinst"><li>Abra este site no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> <span class="ic">⬆︎</span> na barra de baixo.</li><li>Role e toque em <b>Adicionar à Tela de Início</b>.</li><li>Confirme em <b>Adicionar</b>. O ícone Treinos aparece junto dos seus apps.</li></ol>`
  :`<ol class="passosinst"><li>No <b>Chrome</b> ou <b>Edge</b>, toque no menu <span class="ic">⋮</span> no canto da tela.</li><li>Escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</li><li>Confirme. O ícone Treinos aparece junto dos seus apps.</li></ol><p class="sub">No computador, também dá para clicar no ícone de instalar na barra de endereço.</p>`}
  <button class="btn cheio bloco" type="button" data-act="fechar">Entendi</button>`);
}

/* ================= Tela: início (quem vai treinar) ================= */
let listaStatus='',capaI=0;
/* troca a foto e a frase da capa a cada 6 segundos */
setInterval(()=>{if(atual!=='inicio'||document.hidden)return;capaI++;
  document.querySelectorAll('.capa .fotos i').forEach((el,i)=>el.classList.toggle('on',i===capaI%FOTOS.length));
  const f=$('#frase');if(f){f.classList.remove('troca');void f.offsetWidth;f.textContent=FRASES[capaI%FRASES.length];f.classList.add('troca');}},6000);
const ehHenrique=n=>normNome(n)==='henrique';
function telaInicio(){
  const meus=Object.entries(contas).filter(([id,c])=>c.token||c.pendente);
  const idsMeus=new Set(meus.map(([id])=>id));
  const outros=listaNuvem.filter(p=>!idsMeus.has(p.id)&&!ehHenrique(p.nome));
  const atualC=S&&contas[contaId];
  let h=`<section class="capa" aria-label="Ryke Treinos"><div class="fotos">${FOTOS.map((f,i)=>`<i class="${i===capaI%FOTOS.length?'on':''}" style="background-image:url(img/fundo/${f})"></i>`).join('')}</div><div class="veu"></div>
  <div class="capa-in"><div class="logo"><img src="img/icon-192.png" alt="" width="42" height="42"><span class="marca">Ryke Sistemas</span></div>
  <h2 class="logocapa"><img src="img/logo-treinos.webp" alt="Treinos" width="900" height="454"></h2><p class="frase" id="frase">${FRASES[capaI%FRASES.length]}</p>
  <p class="desc">Treino montado por uma IA que roda no seu celular, com coach para treino e alimentação.</p>
  <div class="selos"><span>${svg('ia')} IA no aparelho</span><span>${svg('halter')} ${EX_IDS.length} exercícios animados</span><span>${svg('prato')} Cardápios na sua meta</span></div></div></section>
  <div class="sobe">`;
  if(atualC&&!ehHenrique(atualC.nome))h+=`<button class="destaque" type="button" data-act="continuar">${avatar(atualC.nome)}<span><b>Continuar</b><small>Treinos de ${esc(atualC.nome)}</small></span><span class="seta">›</span></button>`;
  h+=`<button class="destaque" type="button" data-act="henrique">${avatar('Henrique')}<span><b>Treinos de Henrique</b><small>Peito, costas, ombros e braços, de segunda a sexta</small></span><span class="seta">›</span></button>`;
  h+=cartaoInstalar('inicio');
  h+=`<p class="subt">Quem vai treinar?</p><input class="busca" id="busca" type="search" placeholder="Procure seu nome e sobrenome" autocomplete="off" aria-label="Procurar nome">
  <div class="pessoas" id="pessoas">`;
  meus.filter(([id,c])=>!ehHenrique(c.nome)).forEach(([id,c])=>{h+=`<button class="pessoa aqui" type="button" data-act="pessoa" data-id="${esc(id)}" data-nome="${esc(normNome(c.nome))}">${avatar(c.nome)}<span><b>${esc(c.nome)}</b><small>${c.pendente?'Salvo neste aparelho':'Entra direto neste aparelho'}</small></span><span class="seta">›</span></button>`;});
  outros.forEach(p=>{h+=`<button class="pessoa" type="button" data-act="pessoa" data-id="${esc(p.id)}" data-nome="${esc(normNome(p.nome))}">${avatar(p.nome)}<span><b>${esc(p.nome)}</b><small>Toque para entrar com sua senha</small></span><span class="seta">›</span></button>`;});
  h+=`</div><p class="vazio" id="nenhum" ${meus.length||outros.length?'hidden':''}>${listaStatus==='carregando'?'Buscando os nomes…':'Nenhum nome encontrado. Crie sua conta abaixo.'}</p>
  <button class="btn cheio grande" type="button" data-act="novo" style="margin-top:8px">Criar minha conta</button>
  <p class="rodape">${listaStatus==='offline'?'Sem internet: mostrando os nomes salvos neste aparelho.<br>':''}A IA funciona sem internet depois do primeiro acesso.<br>Fotos: Unsplash.</p></div>`;
  return h;
}
async function atualizarLista(){
  if(!navigator.onLine){listaStatus='offline';if(atual==='inicio')show('inicio',true);return;}
  listaStatus=listaNuvem.length?'':'carregando';
  try{const l=await Nuvem.lista();if(Array.isArray(l)){listaNuvem=l;LS.set(K_LISTA,l);listaStatus='';}}
  catch(e){listaStatus=e.rede?'offline':'';}
  if(atual==='inicio'){const b=$('#busca'),q=b?b.value:'';show('inicio',true);const nb=$('#busca');if(nb&&q){nb.value=q;filtraPessoas(q);}}
}
function filtraPessoas(q){
  const n=normNome(q);let vis=0;
  document.querySelectorAll('#pessoas .pessoa').forEach(b=>{const ok=!n||b.dataset.nome.includes(n);b.hidden=!ok;if(ok)vis++;});
  const nn=$('#nenhum');if(nn){nn.hidden=vis>0;nn.textContent='Nenhum nome encontrado. Crie sua conta abaixo.';}
}
function abrirConta(id){
  const c=contas[id];if(!c)return false;
  const dados=normal(LS.get(kDados(id),null));if(!dados)return false;
  contaId=id;S=dados;LS.set(K_ATUAL,id);aplicaTema();diaSel=null;diaPlano=null;chatCtx={};
  setSync(sujo()?'pend':'');
  if(location.hash.slice(1)==='treino')show('treino');else location.hash='treino';
  puxarNuvem();if(S.sessao)wake();
  return true;
}
function entrarPessoa(id,nome){
  if((contas[id]&&(contas[id].token||contas[id].pendente))&&abrirConta(id))return;
  pedirSenha(id,nome||(contas[id]&&contas[id].nome)||'');
}
function pedirSenha(id,nome,msg){
  abrirDlg(`<h3>Olá, ${esc(primeiro(nome))}</h3><p>Digite sua senha para entrar. Você só precisa fazer isso uma vez neste aparelho.</p>
  <form id="fsenha" data-id="${esc(id)}" data-nome="${esc(nome)}"><label class="campo">Senha<span class="senha"><input id="isenha" type="password" autocomplete="current-password" required><button type="button" data-act="versenha">Ver</button></span></label>
  <p class="erro" id="esenha">${msg?esc(msg):''}</p>
  <div class="acoes" style="margin-top:12px"><button class="btn cheio" type="submit">Entrar</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div></form>
  <p class="sub" style="margin-top:12px;font-size:14px">Esqueceu a senha? Peça para o Ryke redefinir.</p>`);
  setTimeout(()=>{const i=$('#isenha');if(i)i.focus();},60);
}
async function enviarSenha(f){
  const id=f.dataset.id,nome=f.dataset.nome,senha=$('#isenha').value,e=$('#esenha'),b=f.querySelector('[type=submit]');
  if(!senha){e.textContent='Digite a senha.';return;}
  b.disabled=true;b.textContent='Entrando…';
  try{
    const r=await Nuvem.entrar(id,senha);
    if(r&&r.erro){b.disabled=false;b.textContent='Entrar';e.textContent=r.erro==='senha_errada'?'Senha errada. Tente de novo.':r.erro==='bloqueado'?'Muitas tentativas erradas. Espere 10 minutos.':'Essa conta não existe mais.';return;}
    const local=normal(LS.get(kDados(r.id),null)),nuv=normal(r.estado);
    let est=local&&local.perfil?juntar(local,nuv):nuv;
    if(!est)est=normal({perfil:null});
    contas[r.id]={nome:r.nome,token:r.token,base:r.versao,sinc:nuv&&nuv.atualizado||0};salvarContas();
    LS.set(kDados(r.id),est);fecharDlg();
    abrirConta(r.id);if(sujo())sincronizar();
  }catch(err){b.disabled=false;b.textContent='Entrar';e.textContent=err.rede?'Sem internet. Para entrar pela primeira vez neste aparelho é preciso estar conectado.':'Não deu para entrar agora: '+err.message;}
}

/* ---------- Henrique ---------- */
function estadoHenrique(){
  const perfil={nome:'Henrique',sexo:'m',idade:28,altura:166,peso:60,objetivo:'massa',nivel:'inter',parado:true,dias:[1,2,3,4,5],tempo:40,local:'academia',barra:true,foco:[],somente:false,evitar:['quadriceps','posteriores','gluteos','panturrilha','abdomen'],lesoes:[],desc:50};
  const D=(nome,ids)=>({nome,ex:ids.map(id=>({u:uid(),id,s:3,r:10,desc:50}))});
  const plano={origem:'pronto',tipo:'Divisão por grupos, de segunda a sexta',criado:Date.now(),dias:{
    1:D('Peito e tríceps',['supino_reto','incl_halter','crossover','flexao','testa','corda','mergulho_banco']),
    2:D('Costas e bíceps',['barra_fixa','remada_curvada','remada_unilateral','pulldown_ext','remada_baixa','rosca_direta','rosca_martelo']),
    3:D('Ombros e trapézio',['desenvolvimento','elev_lateral','elev_frontal','crucifixo_inverso','remada_alta','encolhimento']),
    4:D('Peito e costas',['incl_barra','puxada','supino_halter','remada_cavalinho','paralelas','pullover','face_pull']),
    5:D('Braços e ombros',['rosca_direta','polia_barra','rosca_scott','frances','rosca_alternada','flexao_diamante','elev_lateral','encolhimento'])}};
  const s=novoEstado(perfil,plano);
  s.inicio='2026-11-05';s.cfg.carga=false;s.corpo=[];
  s.hist=[{id:uid(),dia:1,nome:'Peito e tríceps',data:'2026-11-05',dur:null,feitas:null,total:null,ex:[],antes:true}];
  return normal(s);
}
function abrirHenrique(){
  const local=Object.entries(contas).find(([id,c])=>ehHenrique(c.nome)&&(c.token||c.pendente));
  if(local&&abrirConta(local[0]))return;
  const nuv=listaNuvem.find(p=>ehHenrique(p.nome));
  if(nuv)return pedirSenha(nuv.id,nuv.nome);
  if(!navigator.onLine&&!listaNuvem.length){toast('Conecte na internet para o primeiro acesso.');return;}
  abrirDlg(`<h3>Treinos de Henrique</h3><p>Primeiro acesso: crie uma senha simples. O plano de segunda a sexta já vem pronto e você só digita a senha uma vez neste aparelho.</p>
  <form id="fhenrique"><label class="campo">Nova senha<span class="senha"><input id="hsenha" type="password" autocomplete="new-password" minlength="3" required><button type="button" data-act="versenha">Ver</button></span></label>
  <p class="erro" id="ehenrique"></p><div class="acoes" style="margin-top:12px"><button class="btn cheio" type="submit">Criar e entrar</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div></form>`);
  setTimeout(()=>{const i=$('#hsenha');if(i)i.focus();},60);
}
async function criarHenrique(f){
  const senha=$('#hsenha').value,e=$('#ehenrique'),b=f.querySelector('[type=submit]');
  if(senha.length<3){e.textContent='Use pelo menos 3 caracteres.';return;}
  b.disabled=true;b.textContent='Criando…';
  const est=estadoHenrique();
  await criarNaNuvem('Henrique',senha,est,msg=>{b.disabled=false;b.textContent='Criar e entrar';e.textContent=msg;});
}
/* cria a conta na nuvem (ou só no aparelho, se estiver sem internet) e abre */
async function criarNaNuvem(nome,senha,est,erro){
  try{
    const r=await Nuvem.criar(nome,senha,est);
    if(r&&r.erro){erro(r.erro==='nome_existe'?'Esse nome já tem conta. Volte ao início e toque nele para entrar.':r.erro==='senha_curta'?'Use pelo menos 3 caracteres na senha.':'Nome inválido.');return false;}
    contas[r.id]={nome:r.nome,token:r.token,base:r.versao,sinc:est.atualizado};salvarContas();
    LS.set(kDados(r.id),est);listaNuvem=[...listaNuvem.filter(p=>p.id!==r.id),{id:r.id,nome:r.nome}];LS.set(K_LISTA,listaNuvem);
    fecharDlg();abrirConta(r.id);setSync('ok',Date.now());return true;
  }catch(err){
    if(!err.rede){erro('Não deu para criar a conta agora: '+err.message);return false;}
    const id='local-'+uid();contas[id]={nome,pendente:true,senha};salvarContas();LS.set(kDados(id),est);
    fecharDlg();abrirConta(id);toast('Sem internet: sua conta está salva no aparelho e vai para a nuvem quando conectar.',5000);return true;
  }
}

/* ================= Cadastro (assistente) ================= */
let OB=null;
function obNovo(modo='novo'){
  return{passo:0,modo,erro:'',d:{nome:'',senha:'',sexo:'',idade:'',altura:'',peso:'',objetivo:'',nivel:'',parado:false,dias:[1,3,5],tempo:45,local:'academia',barra:false,foco:[],somente:false,evitar:[],lesoes:[],montar:'ia'}};
}
const ICO_OPC={objetivo:{massa:'halter',emagrecer:'chama',definir:'brilho',forca:'alvo',saude:'coracao'},nivel:{ini:'n1',inter:'n2',avan:'n3'},local:{academia:'predio',casa_halteres:'casa',casa_corpo:'corpo',calistenia:'barra'},montar:{ia:'ia',manual:'mao'}};
const OPC=(k,v,tit,sub,on)=>{const ic=ICO_OPC[k]&&ICO_OPC[k][v];return `<button class="opcao" type="button" data-act="ob" data-k="${k}" data-v="${v}" aria-pressed="${!!on}">${ic?`<span class="oico">${svg(ic)}</span>`:''}<b>${tit}</b>${sub?`<small>${sub}</small>`:''}</button>`;};
const CHX=(k,v,tit,on,cls='')=>`<button class="chipx ${cls}" type="button" data-act="obl" data-k="${k}" data-v="${v}" aria-pressed="${!!on}">${tit}</button>`;
const PASSOS=[
  {id:'nome',r:d=>`<h2 class="pergunta">Como você se chama?</h2><p class="sub">Use nome e sobrenome. É assim que você vai se achar na tela inicial.</p>
    <div class="form"><label class="campo inteiro">Nome e sobrenome<input id="obnome" data-ob="nome" value="${esc(d.nome)}" autocomplete="name" placeholder="Ex.: Maria Souza" maxlength="60"></label>
    <label class="campo inteiro">Crie uma senha simples<span class="senha"><input id="obsenha" data-ob="senha" type="password" value="${esc(d.senha)}" autocomplete="new-password" placeholder="Pelo menos 3 caracteres"><button type="button" data-act="versenha">Ver</button></span></label></div>
    <p class="sub" style="margin-top:8px;font-size:14px">Você digita a senha só uma vez em cada aparelho. Depois o login fica salvo.</p>`,
   v:d=>{const p=d.nome.trim().split(/\s+/).filter(x=>x.length>=2);if(p.length<2)return 'Digite nome e sobrenome.';if(d.senha.length<3)return 'A senha precisa ter pelo menos 3 caracteres.';if(listaNuvem.some(x=>normNome(x.nome)===normNome(d.nome)))return 'Esse nome já tem conta. Volte ao início e toque nele para entrar.';return '';}},
  {id:'voce',r:d=>`<h2 class="pergunta">Sobre você</h2><p class="sub">Isso ajuda a IA a calcular suas calorias e o ritmo do treino.</p>
    <div class="opcoes duas">${OPC('sexo','m','Masculino','',d.sexo==='m')}${OPC('sexo','f','Feminino','',d.sexo==='f')}</div>
    ${OPC('sexo','x','Prefiro não dizer','',d.sexo==='x')}
    <div class="form" style="margin-top:12px"><label class="campo">Idade<input data-ob="idade" inputmode="numeric" value="${esc(d.idade)}" placeholder="anos"></label></div>`,
   v:d=>{if(!d.sexo)return 'Escolha uma opção.';const i=num(d.idade);if(!(i>=10&&i<=100))return 'Digite uma idade entre 10 e 100.';return '';}},
  {id:'medidas',r:d=>`<h2 class="pergunta">Altura e peso</h2><p class="sub">Pode ser aproximado. Depois você atualiza o peso em Evolução.</p>
    <div class="form"><label class="campo">Altura (cm)<input data-ob="altura" inputmode="numeric" value="${esc(d.altura)}" placeholder="ex.: 170"></label>
    <label class="campo">Peso (kg)<input data-ob="peso" inputmode="decimal" value="${esc(d.peso)}" placeholder="ex.: 70"></label></div>`,
   v:d=>{const a=num(d.altura),p=num(d.peso);if(!(a>=120&&a<=230))return 'Digite a altura em centímetros, por exemplo 170.';if(!(p>=30&&p<=250))return 'Digite o peso em kg, por exemplo 70.';return '';}},
  {id:'objetivo',r:d=>`<h2 class="pergunta">Qual é o seu objetivo?</h2><div class="opcoes">
    ${OPC('objetivo','massa','Ganhar massa muscular','Ficar maior e mais forte',d.objetivo==='massa')}
    ${OPC('objetivo','emagrecer','Perder gordura','Emagrecer mantendo os músculos',d.objetivo==='emagrecer')}
    ${OPC('objetivo','definir','Definir','Perder gordura e ganhar músculo ao mesmo tempo',d.objetivo==='definir')}
    ${OPC('objetivo','forca','Ganhar força','Levantar mais peso',d.objetivo==='forca')}
    ${OPC('objetivo','saude','Saúde e condicionamento','Disposição, postura e qualidade de vida',d.objetivo==='saude')}</div>`,
   v:d=>d.objetivo?'':'Escolha um objetivo.'},
  {id:'nivel',r:d=>`<h2 class="pergunta">Quanto você já treinou?</h2><div class="opcoes">
    ${OPC('nivel','ini','Iniciante','Nunca treinei ou treinei menos de 6 meses',d.nivel==='ini')}
    ${OPC('nivel','inter','Intermediário','Treino há 6 meses a 2 anos',d.nivel==='inter')}
    ${OPC('nivel','avan','Avançado','Treino há mais de 2 anos com constância',d.nivel==='avan')}</div>
    <label class="toggle"><input type="checkbox" data-obc="parado"${d.parado?' checked':''}> Estou voltando depois de mais de 3 meses parado</label>`,
   v:d=>d.nivel?'':'Escolha seu nível.'},
  {id:'dias',r:d=>`<h2 class="pergunta">Quais dias você vai treinar?</h2><p class="sub">Escolha de 1 a 6 dias. Pelo menos um dia de descanso faz parte do resultado.</p>
    <div class="chipsx">${OS.map(x=>CHX('dias',x,DIAS[x],d.dias.includes(x))).join('')}</div>
    <p class="subt">Tempo por treino</p><div class="chipsx">${[30,45,60,75,90].map(t=>`<button class="chipx" type="button" data-act="ob" data-k="tempo" data-v="${t}" aria-pressed="${+d.tempo===t}">${t} min</button>`).join('')}</div>`,
   v:d=>!d.dias.length?'Escolha pelo menos um dia.':d.dias.length>6?'Deixe pelo menos um dia de descanso.':''},
  {id:'local',r:d=>`<h2 class="pergunta">Onde você treina?</h2><div class="opcoes">
    ${OPC('local','academia','Academia','Barras, halteres, máquinas e polias',d.local==='academia')}
    ${OPC('local','casa_halteres','Em casa com halteres','Halteres e, se tiver, um banco',d.local==='casa_halteres')}
    ${OPC('local','casa_corpo','Em casa sem equipamento','Só o peso do corpo e objetos da casa',d.local==='casa_corpo')}
    ${OPC('local','calistenia','Calistenia','Barra fixa, paralelas e peso do corpo, na praça ou em casa',d.local==='calistenia')}</div>
    ${d.local&&d.local.startsWith('casa')?`<label class="toggle"><input type="checkbox" data-obc="barra"${d.barra?' checked':''}> Tenho uma barra fixa</label>`:''}`,
   v:d=>d.local?'':'Escolha onde treina.'},
  {id:'musculos',r:d=>`<h2 class="pergunta">Quais partes do corpo?</h2><p class="sub">Opcional. Sem escolher nada, a IA monta um treino equilibrado para o corpo todo.</p>
    <p class="subt">Quero mais foco em</p><div class="chipsx">${GRUPO_IDS.map(g=>CHX('foco',g,GRUPOS[g].n,d.foco.includes(g))).join('')}</div>
    <label class="toggle"><input type="checkbox" data-obc="somente"${d.somente?' checked':''}> Treinar somente essas partes</label>
    <p class="subt">Não quero treinar</p><div class="chipsx">${GRUPO_IDS.map(g=>CHX('evitar',g,GRUPOS[g].n,d.evitar.includes(g),'evita')).join('')}</div>`,
   v:d=>{if(d.somente&&!d.foco.length)return 'Para treinar somente algumas partes, escolha quais em "Quero mais foco em".';if(GRUPO_IDS.every(g=>d.evitar.includes(g)))return 'Deixe pelo menos uma parte para treinar.';if(d.foco.some(g=>d.evitar.includes(g)))return 'Uma parte está marcada como foco e como "não quero treinar" ao mesmo tempo.';return '';}},
  {id:'lesoes',r:d=>`<h2 class="pergunta">Alguma dor ou lesão?</h2><p class="sub">A IA evita os exercícios que mais forçam essas regiões. Dor forte ou que não passa pede avaliação médica.</p>
    <div class="chipsx">${Object.entries(LESOES).map(([k,n])=>CHX('lesoes',k,n,d.lesoes.includes(k),'evita')).join('')}</div>
    <p class="sub">${d.lesoes.length?'':'Nenhuma marcada.'}</p>`,v:()=>''},
  {id:'montar',r:d=>`<h2 class="pergunta">Como quer montar seu treino?</h2><div class="opcoes">
    ${OPC('montar','ia','A IA monta para mim','Recomendado. Divisão, exercícios, ordem e descanso calculados para você. Dá para ajustar depois.',d.montar==='ia')}
    ${OPC('montar','manual','Quero montar o meu','Escolho os exercícios por grupo e em qual dia da semana fazer.',d.montar==='manual')}</div>`,v:d=>d.montar?'':'Escolha uma opção.'}
];
function passosAtivos(){return OB.modo==='completar'?PASSOS.slice(1):PASSOS;}
function telaNovo(){
  if(!OB)OB=obNovo();
  const L=passosAtivos(),p=L[OB.passo],ult=OB.passo===L.length-1;
  return `<div class="passos">${L.map((_,i)=>`<i class="${i<=OB.passo?'on':''}"></i>`).join('')}</div>
  <form id="fob" novalidate>${p.r(OB.d)}<p class="erro" id="oberro">${esc(OB.erro)}</p>
  <div class="navpasso"><button class="btn" type="button" data-act="obvoltar">${OB.passo?'Voltar':'Cancelar'}</button><button class="btn cheio" type="submit">${ult?(OB.modo==='completar'?'Concluir':'Criar minha conta'):'Continuar'}</button></div></form>`;
}
function perfilDe(d){
  return{nome:d.nome.trim().replace(/\s+/g,' '),sexo:d.sexo==='x'?'':d.sexo,idade:Math.round(num(d.idade)),altura:Math.round(num(d.altura)),peso:num(d.peso),objetivo:d.objetivo,nivel:d.nivel,parado:!!d.parado,
    dias:d.dias.slice().sort((a,b)=>OS.indexOf(a)-OS.indexOf(b)),tempo:+d.tempo||45,local:d.local,barra:d.local==='calistenia'||(d.local!=='academia'&&!!d.barra),foco:d.foco.slice(),somente:!!d.somente&&d.foco.length>0,evitar:d.evitar.slice(),lesoes:d.lesoes.slice(),desc:d.desc||null};
}
function planoVazio(dias){const p={origem:'manual',criado:Date.now(),dias:{}};dias.forEach(d=>p.dias[d]={nome:'Treino de '+DIAS[d].toLowerCase(),ex:[]});return p;}
async function obAvancar(){
  const L=passosAtivos(),p=L[OB.passo];
  const e=p.v(OB.d);if(e){OB.erro=e;const el=$('#oberro');if(el)el.textContent=e;return;}
  OB.erro='';
  if(OB.passo<L.length-1){OB.passo++;show('novo');return;}
  const perfil=perfilDe(OB.d);
  if(OB.modo==='completar'){perfil.nome=contas[contaId]&&contas[contaId].nome||perfil.nome;S.perfil=perfil;S.plano=OB.d.montar==='ia'?IA.gerar(perfil,S.ia.pref):planoVazio(perfil.dias);S.inicio=hojeISO();save();OB=null;posCriacao();return;}
  const est=normal(novoEstado(perfil,OB.d.montar==='ia'?IA.gerar(perfil,{}):planoVazio(perfil.dias)));
  const b=$('#fob [type=submit]');if(b){b.disabled=true;b.textContent='Criando sua conta…';}
  const ok=await criarNaNuvem(perfil.nome,OB.d.senha,est,msg=>{OB.passo=0;OB.erro=msg;show('novo');});
  if(ok){OB=null;posCriacao();}
}
function posCriacao(){
  if(S.plano.origem==='ia'){
    const c=IA.calc(S.perfil);
    abrirDlg(`<h3 class="ok">Seu treino está pronto</h3><p><b>${esc(S.plano.tipo||'')}</b></p><ul class="lista-ia">${(S.plano.explic||[]).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>
    <div class="nums"><div><b>${fint(c.kcal)}</b><span>kcal por dia</span></div><div><b>${c.prot} g</b><span>proteína</span></div><div><b>${String(c.agua).replace('.',',')} L</b><span>água</span></div></div>
    <p class="sub">Esses números ficam no Coach IA e se ajustam conforme você registra o peso.</p><button class="btn cheio bloco" type="button" data-act="fechar">Ver meu treino</button>`);
    ir('treino');
  }else{diaPlano=diasPlano()[0];ir('plano');setTimeout(()=>abrirBiblioteca(diaPlano),250);}
}

/* ================= Tela: treino ================= */
function statusCard(){
  const w=semana(),f=IA.fase(w,S.perfil);
  const sw=Math.min(w,8);
  return `<div class="status"><div class="anelsem" style="--p:${Math.round(sw/8*100)}%"><span>${sw}<small>DE 8</small></span></div><div><b>Semana ${sw}, ${f.nome.toLowerCase()}</b><p>${f.txt}</p></div></div>`;
}
function seletor(sel,act='dia',todos=false){
  const hoje=new Date().getDay(),dias=todos?OS:diasPlano();
  return `<div class="chipsel" role="list">${dias.map(d=>{const D=S.plano.dias[d];
    const tag=S.sessao&&S.sessao.dia===d?'agora':d===hoje?'hoje':'';
    return `<button type="button" role="listitem" data-act="${act}" data-d="${d}" aria-current="${d===sel}" class="${D?'':'descanso'}"><b>${DIAS[d]}${tag?`<span class="tag">${tag}</span>`:''}</b><span>${D?esc(D.nome):'Descanso'}</span></button>`;}).join('')}</div>`;
}
function telaTreino(){
  const ds=diasPlano();
  if(!ds.length)return statusCard()+`<div class="card"><h3>Seu plano está vazio</h3><p>Monte seus treinos em Plano, escolhendo os exercícios e os dias, ou peça para a IA montar.</p><div class="acoes"><button class="btn cheio" data-act="ir" data-v="plano">Ir para o Plano</button><button class="btn" data-act="refazer">A IA monta</button></div></div>`;
  if(diaSel==null||!S.plano.dias[diaSel])diaSel=diaPadrao();
  if(S.sessao&&diaSel===S.sessao.dia)return telaPlayer();
  return telaVisao(diaSel);
}
function telaVisao(d){
  const D=S.plano.dias[d],hoje=new Date().getDay();
  let h=statusCard()+seletor(d);
  if(!D)return h;
  const est=IA.estimaMin(D.ex);
  h+=`<div class="thead"><div><h2 class="tit">${esc(D.nome)}</h2><p class="sub">${DIAS[d]}, ${D.ex.length} exercícios, uns ${est} min${d===hoje?', é o treino de hoje':''}</p></div></div>`;
  if(S.sessao)h+=`<div class="card"><p>O treino de ${DIAS[S.sessao.dia].toLowerCase()} está em andamento.</p><div class="acoes"><button class="btn cheio" data-act="dia" data-d="${S.sessao.dia}">Voltar ao treino em andamento</button></div></div>`;
  else if(D.ex.length)h+=`<button class="btn cheio grande" type="button" data-act="comecar" data-d="${d}">Começar treino</button>`;
  else h+=`<div class="card"><p>Este dia ainda não tem exercícios.</p><button class="btn cheio" data-act="editardia" data-d="${d}">Adicionar exercícios</button></div>`;
  h+=`<div class="card"><h3>Aquecimento, 4 a 5 min</h3><p>Algo leve para esquentar, como polichinelo ou bicicleta, mobilidade das articulações do dia e 1 ou 2 séries leves do primeiro exercício.</p></div>`;
  if(D.ex.length){
    h+=`<div class="card">`;
    D.ex.forEach((it,i)=>{const e=EXS[it.id];h+=`<div class="previa"><div class="art">${poseSVG(it.id)}</div><div><h4>${i+1}. ${esc(e.n)}</h4><p><span class="num">${it.s} × ${repsTxt(it)}</span>, descanso ${it.desc} s</p>${it.obs?`<p class="obs">${esc(it.obs)}</p>`:''}<p>${e.p.map(m=>NOMES[m]).join(', ')}</p></div><div>${mapSVG(e.p,e.sec)}</div></div>`;});
    h+=`<div class="acoes" style="margin-top:10px"><button class="btn" type="button" data-act="editardia" data-d="${d}">Editar este treino</button></div></div>`;
  }
  return h+cartaoCal();
}
/* ================= Calistenia ================= */
let calTrilha='empurrar';
const nivelCal=id=>['','Básico','Intermediário','Avançado'][EXS[id].nv]||'';
const doseCal=id=>{const e=EXS[id];return e.seg?`${e.rr||30} s`:`${e.rr||IA.PADRAO.r} repetições`;};
function cartaoCal(){
  const eh=S.perfil.local==='calistenia';
  return `<button type="button" class="calcard" data-act="ircal"><span class="calico">${svg('barra')}</span><span><b>${eh?'Suas trilhas de calistenia':'Treino de calistenia'}</b><small>${eh?'Veja as progressões e o próximo passo de cada exercício.':'Prefere treinar com o peso do corpo? Veja os exercícios e monte seu treino.'}</small></span><span class="seta" aria-hidden="true">›</span></button>`;
}
function telaCalistenia(){
  const p=S.perfil,eh=p.local==='calistenia',noPlano=new Set(Object.values(S.plano.dias).flatMap(D=>D.ex.map(it=>it.id)));
  const T=TRILHAS_CAL.find(t=>t.id===calTrilha)||TRILHAS_CAL[0];
  const volta=p.localAnt&&p.localAnt!=='calistenia'?p.localAnt:'academia';
  let h=`<div class="calhero"><span class="calico">${svg('barra')}</span><div><h2 class="tit">Calistenia</h2><p class="sub">Treino com o peso do corpo, barra fixa e paralelas. Cada trilha vai do mais fácil ao mais difícil.</p></div></div>`;
  h+=eh?`<div class="card calstatus ok"><h3>Seu plano é de calistenia</h3><p>A IA escolhe os passos das trilhas no seu nível e avisa no treino quando for hora de avançar.</p><div class="acoes"><button class="btn cheio" type="button" data-act="ir" data-v="treino">Ir para o treino</button><button class="btn" type="button" data-act="calsair">Voltar para ${volta==='academia'?'a academia':esc(IA.LOCAL[volta].toLowerCase())}</button></div></div>`
    :`<div class="card calstatus"><h3>Prefere calistenia?</h3><p>A IA monta um plano só com peso do corpo, barra fixa e paralelas, no seu nível (${esc((IA.NIVEL[p.nivel]||'iniciante').toLowerCase())}), nos seus ${diasPlano().length||(p.dias||[]).length} dias de treino.</p><button class="btn cheio" type="button" data-act="calplano">Montar meu treino de calistenia</button></div>`;
  h+=`<div class="abas calabas" role="tablist">${TRILHAS_CAL.map(t=>`<button type="button" data-act="caltrilha" data-t="${t.id}" aria-pressed="${t.id===T.id}">${t.n}</button>`).join('')}</div>`;
  h+=`<p class="sub">${esc(T.d)}. ${T.ex.length} passos. Toque para ver como fazer.</p><ol class="trilha">${T.ex.map((id,i)=>{const e=EXS[id],eq=e.eq.filter(q=>q!=='corpo');
    return `<li><button type="button" class="calpasso" data-act="calex" data-id="${id}"><span class="n">${i+1}</span><span class="art">${poseSVG(id)}</span><span class="txt"><b>${esc(e.n)}</b><small>${nivelCal(id)} · 3 × ${doseCal(id)}${eq.length?' · '+eq.map(q=>EQ_NOME[q]).join(' + '):''}</small>${noPlano.has(id)?'<em class="noplano">No seu plano</em>':''}</span></button></li>`;}).join('')}</ol>`;
  h+=`<div class="card"><h3>Como progredir</h3><ul class="lista-ia"><li>Faça 3 séries perto da falha, com boa técnica.</li><li>Quando passar de 12 a 15 repetições fáceis, ou de 30 a 60 segundos nos exercícios parados, vá para o próximo passo.</li><li>Aqueça punhos, ombros e cotovelos antes das habilidades.</li><li>Dúvidas? Pergunte ao Coach, por exemplo: "como fazer a primeira barra?"</li></ul></div>`;
  return h;
}
function verCal(id){
  const e=EXS[id],nx=proximaCal(id),ds=diasPlano();
  abrirDlg(`<h3>${esc(e.n)}</h3><div class="calver"><div class="art">${poseSVG(id)}</div><div>${mapSVG(e.p,e.sec)}</div></div>
  <p><span class="selo">${nivelCal(id)}</span> 3 × ${doseCal(id)} · ${e.eq.map(q=>EQ_NOME[q]).join(' + ')}</p>
  <p class="dica">${esc(e.dica)}</p>${nx?`<p>Próximo passo: <button class="linkbtn" type="button" data-act="calex" data-id="${nx}">${esc(EXS[nx].n)}</button></p>`:''}
  ${ds.length?`<p class="subt">Adicionar ao treino de</p><div class="diasadd">${ds.map(d=>{const tem=S.plano.dias[d].ex.some(x=>x.id===id);return `<button type="button" class="btn${tem?' ok':''}" data-act="caladd" data-id="${id}" data-d="${d}"${tem?' disabled':''}>${DC[d]}${tem?' ✓':''}</button>`;}).join('')}</div>`:''}
  <button class="btn bloco" type="button" data-act="fechar" style="margin-top:12px">Fechar</button>`);
}
function trocarLocal(v){
  const t=executarCmd({tipo:'local',v});save();fecharDlg();
  abrirDlg(`<h3 class="ok">Plano novo pronto</h3><p>${esc(t)}</p><ul class="lista-ia">${S.plano.explic.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><button class="btn cheio bloco" type="button" data-act="fechar">Ver o plano</button>`);ir('plano');
}

/* ---------- sessão ---------- */
const pendente=s=>!s.ok&&!s.skip;
function ativo(x){const ses=S.sessao,it=ses&&ses.itens[x];if(!it)return -1;if(ses.sel&&ses.sel.x===x&&it.sets[ses.sel.i]&&pendente(it.sets[ses.sel.i]))return ses.sel.i;return it.sets.findIndex(pendente);}
function proximoComPendente(x){const L=S.sessao.itens;for(let k=1;k<=L.length;k++){const j=(x+k)%L.length;if(L[j].sets.some(pendente))return j;}return null;}
const totalSeries=()=>S.sessao.itens.reduce((a,it)=>a+it.sets.length,0);
const feitas=()=>S.sessao.itens.reduce((a,it)=>a+it.sets.filter(s=>s.ok).length,0);
const resolvidas=()=>S.sessao.itens.reduce((a,it)=>a+it.sets.filter(s=>!pendente(s)).length,0);
function placeholders(x,i){
  const it=S.sessao.itens[x],u=ultima(it.id),ref=u?(u.sets[i]||u.sets[u.sets.length-1]):null;
  return{r:String(it.r),kg:ref&&ref.kg>0?String(ref.kg).replace('.',','):''};
}
function comecar(d){
  if(S.sessao)return;const D=S.plano.dias[d];if(!D||!D.ex.length)return;
  S.sessao={dia:d,nome:D.nome,start:Date.now(),x:0,sel:null,restEnd:null,restTotal:null,restDe:null,
    itens:D.ex.map(it=>({u:it.u,id:it.id,s:it.s,r:it.r,desc:it.desc,obs:it.obs||'',sets:Array.from({length:it.s},()=>({r:'',kg:'',ok:false,skip:false}))}))};
  diaSel=d;saveLocal();wake();
}
function telaPlayer(){
  const ses=S.sessao,x=ses.x,it=ses.itens[x],e=EXS[it.id],n=ses.itens.length,a=ativo(x),kg=S.cfg.carga&&!e.seg;
  const tot=totalSeries(),f=feitas(),res=resolvidas(),u=ultima(it.id),completo=a<0;
  let h=seletor(ses.dia);
  h+=`<div class="painel"><div class="crono" id="crono"${S.cfg.crono?'':' hidden'}>${fmt((Date.now()-ses.start)/1000)}</div><div class="info"><b>${esc(ses.nome)}</b>Exercício ${x+1} de ${n}, ${f} de ${tot} séries<div class="trilho"><i style="width:${tot?Math.min(100,res/tot*100):0}%"></i></div></div><button type="button" data-act="fila">Lista</button></div>`;
  const chips=e.p.map(m=>`<span class="chip p">${NOMES[m]}</span>`).join('')+e.sec.map(m=>`<span class="chip">${NOMES[m]}</span>`).join('');
  h+=`<article class="exatual${completo?' feito':''}" id="exatual">
    <div class="topoex"><div class="palco"><div class="art">${poseSVG(it.id)}</div><div class="map">${mapSVG(e.p,e.sec)}</div></div>
    <div><div class="posicao">${completo?'Exercício concluído':`Exercício ${x+1} de ${n}, série ${a+1} de ${it.sets.length}`}</div>
    <h3>${esc(e.n)}</h3><p class="dose"><b>${it.sets.length} ×</b> ${repsTxt(it)}, descanso ${it.desc} s</p>${it.obs?`<p class="obs">${esc(it.obs)}</p>`:''}
    <div class="chips">${chips}</div><p class="dica">${esc(e.dica)}</p></div></div>
    <div class="ultima">${u?`<b>Última vez (${dm(u.data)}):</b> ${fmtSets(u.sets)}`:'<b>Sem registro anterior.</b>'}<span class="sug">${esc(IA.sugestao(it,u,S.cfg.carga))}</span></div>
    <div class="srows${kg?' kg':''}"><div class="srow cab"><span>Série</span><span>${e.seg?'Segundos':'Repetições'}</span>${kg?'<span>Carga (kg)</span>':''}<span></span></div>`;
  it.sets.forEach((s,i)=>{const ph=placeholders(x,i),est=s.ok?' ok':s.skip?' pul':i===a?' cur':'';
    h+=`<div class="srow${est}"><button class="n" type="button" data-act="sel" data-i="${i}" aria-label="Ir para a série ${i+1}">${i+1}</button>
      <input inputmode="numeric" data-f="r" data-i="${i}" value="${esc(s.r)}" placeholder="${esc(ph.r)}" aria-label="${e.seg?'Segundos':'Repetições'} da série ${i+1}">
      ${kg?`<input inputmode="decimal" data-f="kg" data-i="${i}" value="${esc(s.kg)}" placeholder="${esc(ph.kg||'kg')}" aria-label="Carga da série ${i+1}">`:''}
      <button class="chk" type="button" data-act="chk" data-i="${i}" aria-pressed="${!!s.ok}" aria-label="${s.ok?'Desfazer':'Concluir'} série ${i+1}">${s.skip?'Pulada':CHECK}</button></div>`;});
  h+=`</div>`;
  const tudo=proximoComPendente(x)==null&&completo;
  if(!completo)h+=`<button class="btn laranja grande concluir" type="button" data-act="concluir">Concluir série ${a+1}</button>`;
  else if(!tudo)h+=`<button class="btn ok grande concluir" type="button" data-act="avancar">Próximo exercício ›</button>`;
  else h+=`<button class="btn ok grande concluir" type="button" data-act="finalizar">Finalizar o treino</button>`;
  h+=`<div class="exacoes">
      <button class="mini" type="button" data-act="pulaserie"${completo?' disabled':''}>Pular série</button>
      <button class="mini" type="button" data-act="addset">+ Série</button>
      <button class="mini" type="button" data-act="rmset"${it.sets.length<2||it.sets[it.sets.length-1].ok?' disabled':''}>− Série</button>
      <button class="mini" type="button" data-act="trocar">Trocar exercício</button>
      <button class="mini" type="button" data-act="pulaex"${completo?' disabled':''}>Pular exercício</button></div>
    <div class="navex"><button class="btn" type="button" data-act="anterior"${x===0?' disabled':''}>‹ Anterior</button><button class="btn" type="button" data-act="proximo"${x===n-1?' disabled':''}>Próximo ›</button></div>
  </article>`;
  h+=`<div class="card"><h3>Ordem do treino</h3>${filaHTML()}</div>`;
  h+=`<div class="card fimtreino">${tudo?'<p><b>Todas as séries resolvidas.</b> Bom treino!</p>':'<p>Terminou por hoje? Séries não concluídas ficam de fora do histórico.</p>'}
    <button class="btn cheio grande" type="button" data-act="finalizar">Finalizar o treino</button>
    <button class="btn perigo" type="button" data-act="descartar">Descartar sem salvar</button></div>`;
  return h;
}
function filaHTML(){
  const ses=S.sessao;
  return `<div class="fila">${ses.itens.map((it,j)=>{const ok=it.sets.filter(s=>s.ok).length,res=it.sets.filter(s=>!pendente(s)).length,fim=res===it.sets.length;
    return `<button type="button" data-act="irex" data-x="${j}" class="${j===ses.x?'vez':''}${fim?' fim':''}"><span class="idx">${j+1}</span><span><b>${esc(EXS[it.id].n)}</b><br><span>${it.sets.length} × ${repsTxt(it)}</span></span><span class="st">${fim?(ok?'✓ ':'')+ok+'/'+it.sets.length:ok+'/'+it.sets.length}</span></button>`;}).join('')}</div>`;
}
function rolarEx(){const el=$('#exatual');if(el){const y=el.getBoundingClientRect().top+window.scrollY-120;window.scrollTo({top:Math.max(0,y),behavior:'smooth'});}}
function irEx(x){const ses=S.sessao;if(!ses)return;ses.x=Math.max(0,Math.min(ses.itens.length-1,x));ses.sel=null;saveLocal();show('treino',true);rolarEx();}
function concluir(i){
  const ses=S.sessao,x=ses.x,it=ses.itens[x],s=it.sets[i];if(!s)return;
  const ph=placeholders(x,i);
  if(s.r==='')s.r=ph.r;
  if(S.cfg.carga&&!EXS[it.id].seg&&s.kg===''&&ph.kg)s.kg=ph.kg;
  if(!(num(s.r)>0)){const inp=document.querySelector(`input[data-f="r"][data-i="${i}"]`);if(inp)inp.focus();toast('Digite quantas repetições fez.');return;}
  s.ok=true;s.skip=false;ses.sel=null;
  if(proximoComPendente(x)==null&&!it.sets.some(pendente)){ses.restEnd=null;ses.restDe=null;saveLocal();show('treino',true);toast('Todas as séries feitas. Finalize o treino.');return;}
  descanso(it.desc,{x,i});show('treino',true);
}
function descanso(seg,de){const ses=S.sessao;if(!ses)return;ses.restEnd=Date.now()+seg*1000;ses.restTotal=seg;ses.restDe=de||null;flashAte=0;saveLocal();atualizaBarra();}
function fimDescanso(){
  const ses=S.sessao;if(!ses)return;
  const de=ses.restDe;ses.restEnd=null;ses.restDe=null;
  let mudou=false;
  if(de&&ses.x===de.x&&ativo(de.x)<0){const nx=proximoComPendente(de.x);if(nx!=null){ses.x=nx;ses.sel=null;mudou=true;}}
  saveLocal();
  if(atual==='treino'&&diaSel===ses.dia){const foco=document.activeElement&&document.activeElement.tagName==='INPUT';if(!foco||mudou){show('treino',true);if(mudou)rolarEx();}}
}
function marcar(i){
  const ses=S.sessao,it=ses.itens[ses.x],s=it.sets[i];if(!s)return;
  if(s.ok){s.ok=false;ses.sel={x:ses.x,i};if(ses.restDe&&ses.restDe.x===ses.x&&ses.restDe.i===i){ses.restEnd=null;ses.restDe=null;}saveLocal();show('treino',true);return;}
  concluir(i);
}
function selecionar(i){
  const ses=S.sessao,s=ses.itens[ses.x].sets[i];if(!s)return;
  if(s.ok){const inp=document.querySelector(`input[data-f="r"][data-i="${i}"]`);if(inp)inp.focus();return;}
  s.skip=false;ses.sel={x:ses.x,i};saveLocal();show('treino',true);
}
function pularSerie(){
  const ses=S.sessao,x=ses.x,a=ativo(x);if(a<0)return;
  ses.itens[x].sets[a].skip=true;ses.sel=null;
  if(ativo(x)<0){const nx=proximoComPendente(x);if(nx!=null)ses.x=nx;saveLocal();show('treino',true);rolarEx();return;}
  saveLocal();show('treino',true);
}
function pularExercicio(){
  const ses=S.sessao,x=ses.x;ses.itens[x].sets.forEach(s=>{if(pendente(s))s.skip=true;});ses.sel=null;
  const nx=proximoComPendente(x);if(nx!=null)ses.x=nx;saveLocal();show('treino',true);rolarEx();
}
function finalizar(){
  const ses=S.sessao;if(!ses)return;
  const exs=[];
  ses.itens.forEach(it=>{const ok=it.sets.filter(s=>s.ok);
    if(ok.length)exs.push({id:it.id,u:it.u,sets:ok.map(s=>{const o={r:Math.max(0,Math.round(num(s.r)||0))};const k=num(s.kg);if(S.cfg.carga&&k>0)o.kg=k;return o;})});
    const p=S.ia.pulos;if(!ok.length)p[it.id]=(p[it.id]||0)+1;else if(p[it.id])p[it.id]=Math.max(0,p[it.id]-1);});
  if(!exs.length){abrirDlg(`<h3>Nenhuma série concluída</h3><p>Conclua pelo menos uma série para salvar o treino, ou descarte se não treinou.</p><div class="acoes"><button class="btn" type="button" data-act="fechar">Voltar</button><button class="btn perigo" type="button" data-act="descartar">Descartar</button></div>`);return;}
  const prs=[];exs.forEach(e=>{const ant=recorde(e.id);const best=Math.max(...e.sets.map(metrica));if(ant&&best>ant.v+1e-9)prs.push(e.id);});
  const f=exs.reduce((a,e)=>a+e.sets.length,0),tot=totalSeries(),dur=Math.max(1,Math.round((Date.now()-ses.start)/60000));
  const reps=exs.reduce((a,e)=>a+e.sets.reduce((y,s)=>y+s.r,0),0),carga=exs.reduce((a,e)=>a+e.sets.reduce((y,s)=>y+(s.kg||0)*s.r,0),0);
  S.hist.push({id:uid(),dia:ses.dia,nome:ses.nome,data:hojeISO(),start:ses.start,dur,feitas:f,total:tot,ex:exs,prs});
  if(!S.inicio)S.inicio=hojeISO();
  S.sessao=null;save();soltar();
  const prox=proximoDia(new Date().getDay()),dica=IA.insights(S).find(x=>x.t==='ok'&&/peso/.test(x.tit));
  abrirDlg(`<h3 class="ok">Treino salvo</h3><div class="nums"><div><b>${dur}</b><span>${dur===1?'minuto':'minutos'}</span></div><div><b>${f}/${tot}</b><span>séries</span></div><div><b>${carga?fint(carga):fint(reps)}</b><span>${carga?'kg levantados':'repetições'}</span></div></div>
   ${prs.length?`<p class="pr">Recorde batido em: ${prs.map(id=>esc(EXS[id].n)).join(', ')}.</p>`:''}
   ${dica?`<p><b>IA:</b> ${esc(dica.txt)}</p>`:''}
   ${prox!=null?`<p>Próximo treino: ${DIAS[prox].toLowerCase()}, ${esc(S.plano.dias[prox].nome.toLowerCase())}. Agora é comer bem e descansar.</p>`:''}<button class="btn cheio bloco" type="button" data-act="fechar">Fechar</button>`);
  diaSel=null;show('treino');
}
function descartar(){S.sessao=null;saveLocal();soltar();fecharDlg();diaSel=null;show('treino');}

/* ================= Tela: plano ================= */
function telaPlano(){
  const ds=diasPlano();
  if(diaPlano==null||(!S.plano.dias[diaPlano]&&!OS.includes(diaPlano)))diaPlano=ds[0]!=null?ds[0]:1;
  const D=S.plano.dias[diaPlano],orig=S.plano.origem;
  let h=`<h2 class="tit">Seu plano</h2><p class="sub"><span class="selo${orig==='ia'?' ia':''}">${orig==='ia'?'Montado pela IA':orig==='pronto'?'Plano pronto':'Personalizado'}</span> ${esc(S.plano.tipo||'')}</p>
  <div class="acoes"><button class="btn cheio" type="button" data-act="analisar">Analisar com a IA</button><button class="btn" type="button" data-act="refazer">Refazer com a IA</button><button class="btn" type="button" data-act="ircal">Calistenia</button></div>
  <p class="subt">Dias da semana</p>${seletor(diaPlano,'diaplano',true)}`;
  if(!D){
    h+=`<div class="card"><h3>${DIAS[diaPlano]}: descanso</h3><p>Não tem treino neste dia.</p><button class="btn cheio" type="button" data-act="adddia" data-d="${diaPlano}">Adicionar treino na ${DIAS[diaPlano].toLowerCase()}</button></div>`;
  }else{
    h+=`<div class="card diaplano"><div class="topo"><h3>${esc(D.nome)}</h3><button class="mini" type="button" data-act="renomear" data-d="${diaPlano}">Renomear</button></div>
      <p class="sub">${DIAS[diaPlano]}, ${D.ex.length} exercícios, uns ${IA.estimaMin(D.ex)} min</p>`;
    if(!D.ex.length)h+=`<p class="vazio">Nenhum exercício ainda. Toque em Adicionar exercícios para escolher por grupo muscular.</p>`;
    D.ex.forEach((it,i)=>{const e=EXS[it.id];
      h+=`<div class="itplano"><div class="art">${poseSVG(it.id)}</div><div><b>${i+1}. ${esc(e.n)}</b><small>${it.s} × ${repsTxt(it)}, descanso ${it.desc} s</small>${it.obs?`<small class="obs">${esc(it.obs)}</small>`:''}<br><small>${e.p.map(m=>NOMES[m]).join(', ')}</small></div>
      <div class="ctl"><button type="button" data-act="mover" data-u="${it.u}" data-v="-1" aria-label="Subir"${i===0?' disabled':''}>↑</button><button type="button" data-act="mover" data-u="${it.u}" data-v="1" aria-label="Descer"${i===D.ex.length-1?' disabled':''}>↓</button><button type="button" data-act="edititem" data-u="${it.u}" aria-label="Editar">✎</button></div></div>`;});
    h+=`<div class="acoes" style="margin-top:12px"><button class="btn cheio" type="button" data-act="biblioteca">+ Adicionar exercícios</button><button class="btn perigo" type="button" data-act="rmdia" data-d="${diaPlano}">Tirar este dia</button></div></div>`;
  }
  const v=IA.volumePlano(S.plano),gs=IA.alvos(S.perfil);
  h+=`<div class="card"><h3>Séries por semana em cada grupo</h3><p class="sub">Contando exercícios principais (1 série) e de apoio (meia série). A linha tracejada é o mínimo recomendado para o seu nível.</p><div class="barras">${gs.map(g=>{const fx=IA.faixa(g,S.perfil),n=v[g],mx=fx.max*1.2;return `<div class="barra-l"><span>${GRUPOS[g].n}</span><div class="tr2"><i class="${n>=fx.min?'bom':''}" style="width:${Math.min(100,n/mx*100)}%"></i><em style="left:${fx.min/mx*100}%"></em></div><b>${fk(n)}</b></div>`;}).join('')}</div></div>`;
  return h;
}
function itemPlano(u){for(const d of Object.keys(S.plano.dias)){const D=S.plano.dias[d],i=D.ex.findIndex(x=>x.u===u);if(i>=0)return{d:+d,D,i,it:D.ex[i]};}return null;}
function marcarEditado(){if(S.plano.origem==='ia'||S.plano.origem==='pronto'){S.plano.origem='manual';S.plano.tipo=(S.plano.tipo?S.plano.tipo+', com ajustes seus':'');}}
function pref(id,v){const p=S.ia.pref;p[id]=Math.max(-3,Math.min(3,(p[id]||0)+v));}
let edTmp=null;
const podeUsar=e=>IA.eqOk(e,S.perfil)&&!(S.perfil.lesoes||[]).some(l=>e.r.includes(l));
function editarItem(u){
  const r=itemPlano(u);if(!r)return;edTmp={u,s:r.it.s,r:r.it.r,desc:r.it.desc};const e=EXS[r.it.id];
  abrirDlg(`<h3>${esc(e.n)}</h3><div class="palco" style="margin-bottom:10px"><div class="art">${poseSVG(r.it.id)}</div><div>${mapSVG(e.p,e.sec)}</div></div>
  <div class="form"><div class="campo">Séries<div class="stepper"><button type="button" data-act="step" data-k="s" data-v="-1">−</button><output id="out-s">${edTmp.s}</output><button type="button" data-act="step" data-k="s" data-v="1">+</button></div></div>
  <div class="campo">${e.seg?'Segundos':'Repetições'}<div class="stepper"><button type="button" data-act="step" data-k="r" data-v="${e.seg?-5:-1}">−</button><output id="out-r">${edTmp.r}</output><button type="button" data-act="step" data-k="r" data-v="${e.seg?5:1}">+</button></div></div>
  <label class="campo inteiro">Descanso entre séries<select id="eddesc">${[30,40,45,50,60,75,90,120,150,180].map(s=>`<option value="${s}"${s===edTmp.desc?' selected':''}>${s} segundos</option>`).join('')}${[30,40,45,50,60,75,90,120,150,180].includes(edTmp.desc)?'':`<option value="${edTmp.desc}" selected>${edTmp.desc} segundos</option>`}</select></label></div>
  <p class="dica" style="margin-top:10px">${esc(e.dica)}</p>
  <div class="acoes" style="margin-top:12px"><button class="btn cheio" type="button" data-act="salvaritem">Salvar</button><button class="btn" type="button" data-act="trocaritem" data-u="${u}">Trocar</button><button class="btn perigo" type="button" data-act="rmitem" data-u="${u}">Remover</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div>`);
}
/* biblioteca: "monte o seu" */
let libAba=0,libBusca='',libLocal=true,libDia=null;
function abrirBiblioteca(d){libDia=d;libBusca='';abrirDlg(bibliotecaHTML(),'grande');}
function bibliotecaHTML(){
  const D=S.plano.dias[libDia];
  return `<h3>Adicionar exercícios</h3><p class="sub">Treino de ${DIAS[libDia].toLowerCase()}${D?`: ${esc(D.nome)}`:''}. Toque para adicionar ou tirar.</p>
  <input class="busca" id="libbusca" type="search" placeholder="Buscar exercício" value="${esc(libBusca)}" autocomplete="off">
  ${S.perfil.local!=='academia'||(S.perfil.lesoes||[]).length?`<label class="toggle"><input type="checkbox" id="liblocal"${libLocal?' checked':''}> Só os que combinam com meu local e minhas restrições</label>`:''}
  <div class="abas" id="libabas">${[...SECOES,['Calistenia',null]].map(([n],i)=>`<button type="button" data-act="libaba" data-i="${i}" aria-pressed="${i===libAba&&!libBusca}">${n}</button>`).join('')}</div>
  <div id="liblista">${bibliotecaLista()}</div>
  <button class="btn cheio bloco" type="button" data-act="libok" style="margin-top:12px">Pronto</button>`;
}
function bibliotecaLista(){
  const D=S.plano.dias[libDia],tem=new Set((D?D.ex:[]).map(x=>x.id)),p=S.perfil;
  const filtro=e=>!libLocal||(IA.eqOk(e,p)&&!(p.lesoes||[]).some(l=>e.r.includes(l)));
  const linha=id=>{const e=EXS[id],risco=(p.lesoes||[]).filter(l=>e.r.includes(l));
    return `<div class="libitem"><div class="art">${poseSVG(id)}</div><div><b>${esc(e.n)}</b><small>${e.p.map(m=>NOMES[m]).join(', ')}</small><small>${e.eq.map(q=>EQ_NOME[q]).join(' + ')}${!IA.eqOk(e,p)?' (fora do seu local)':''}</small>${risco.length?`<small class="aviso">Cuidado: ${risco.map(l=>LESOES[l].toLowerCase()).join(', ')}</small>`:''}</div>
    <button class="btn${tem.has(id)?' ok':''}" type="button" data-act="libadd" data-id="${id}">${tem.has(id)?'✓ No treino':'+ Adicionar'}</button></div>`;};
  if(libBusca){
    const q=normNome(libBusca),ids=EX_IDS.filter(id=>normNome(EXS[id].n).includes(q)||normNome(GRUPOS[EXS[id].g].n).includes(q));
    return ids.length?ids.map(linha).join(''):'<p class="vazio">Nada encontrado.</p>';
  }
  if(!SECOES[libAba]){const vistos=new Set();return TRILHAS_CAL.map(t=>{const ids=t.ex.filter(id=>!vistos.has(id)&&filtro(EXS[id]));ids.forEach(id=>vistos.add(id));
    return ids.length?`<p class="libsec">${t.n}</p>`+ids.map(linha).join(''):'';}).join('')||'<p class="vazio">Nenhum exercício disponível com os filtros atuais.</p>';}
  return SECOES[libAba][1].map(g=>{const ids=EX_IDS.filter(id=>EXS[id].g===g&&filtro(EXS[id]));
    return `<p class="libsec">${GRUPOS[g].n}</p>`+(ids.length?ids.map(linha).join(''):'<p class="vazio">Nenhum exercício disponível com os filtros atuais.</p>');}).join('');
}
function atualizaLib(){const l=$('#liblista');if(l){l.innerHTML=bibliotecaLista();observar();}}

/* ================= Tela: Coach IA (chat) ================= */
let chatCtx={};
const SUGS_INI=['Monte meu cardápio de hoje','Frango ou ovo, qual tem mais proteína?','Quanto peguei no supino?','Em quanto tempo perco 5 kg?','Quantas calorias gasto correndo 30 min?','Na sexta só bíceps','Creatina funciona?','Como fazer o agachamento?'];
function volumeFeito(){
  const ini=inicioSemana(new Date()),v={};GRUPO_IDS.forEach(g=>v[g]=0);
  const conta=(id,n)=>{const e=EXS[id];if(!e)return;const vis=new Set();e.p.forEach(m=>{const g=MUSC_GRUPO[m];if(!vis.has(g)){v[g]+=n;vis.add(g);}});e.sec.forEach(m=>{const g=MUSC_GRUPO[m];if(!vis.has(g)){v[g]+=n/2;vis.add(g);}});};
  S.hist.forEach(h=>{if(dt(h.data)>=ini)h.ex.forEach(e=>conta(e.id,e.sets.length));});
  if(S.sessao)S.sessao.itens.forEach(it=>conta(it.id,it.sets.filter(s=>s.ok).length));
  return v;
}
const chatMsgs=()=>(S.ia.chat=S.ia.chat||[]);
function telaCoach(){
  const p=S.perfil,msgs=chatMsgs();
  const boas={ia:1,t:`Oi, ${primeiro(p.nome)}! Sou o seu Coach IA. Monto cardápios nas suas metas, comparo alimentos, calculo gasto de atividades, carga máxima e prazos de peso, mostro a evolução das suas cargas, explico exercícios e mudo o seu plano na hora. Pergunte o que quiser sobre treino, dieta e saúde.`,sugs:SUGS_INI};
  return `<div class="chatwrap"><div class="chat-top"><span class="bot">${svg('ia')}</span><div><b>Coach IA</b><small>${navigator.onLine?'Roda no seu aparelho':'Sem internet, funcionando normal'}</small></div>
    <button class="mini" type="button" data-act="painel">${svg('grafico')} Seus números</button>${msgs.length?`<button class="mini" type="button" data-act="limparchat" aria-label="Limpar conversa">Limpar</button>`:''}</div>
  <div class="chat" id="chat" aria-live="polite">${[boas,...msgs].map((m,i,arr)=>msgHTML(m,i===arr.length-1)).join('')}</div>
  <form class="perg" id="fperg"><input id="pergunta" placeholder="Pergunte sobre treino ou alimentação" autocomplete="off" enterkeyhint="send" maxlength="300"><button class="btn cheio" type="submit" aria-label="Enviar">${svg('enviar')}</button></form></div>`;
}
const quebra=t=>esc(t).replace(/\n/g,'<br>');
function refeicaoHTML(r){
  return `<div class="refeicao"><div class="ref-top"><b>${esc(r.nome)}</b><span>${fint(r.tot.k)} kcal · ${fk(r.tot.p)} g proteína</span></div><ul>${r.itens.map(i=>`<li><span>${esc(i.n)}</span><em>${esc(i.med)}</em></li>`).join('')}</ul></div>`;
}
function msgHTML(m,ultima){
  if(m.eu)return `<div class="msg eu">${esc(m.t)}</div>`;
  let h=`<div class="msg ia"><p>${quebra(m.t)}</p>`;
  if(m.refeicoes)h+=m.refeicoes.map(refeicaoHTML).join('');
  if(m.tabela)h+=`<div class="refeicao"><ul>${m.tabela.linhas.map(l=>`<li><span>${esc(l.med)} ${esc(l.n.toLowerCase())}</span><em>${fint(l.k)} kcal · ${fk(l.p)} g</em></li>`).join('')}</ul></div>`;
  if(m.ex&&EXS[m.ex])h+=`<div class="ex"><div class="art">${poseSVG(m.ex)}</div><div>${mapSVG(EXS[m.ex].p,EXS[m.ex].sec)}</div></div>`;
  if(m.acoes&&m.acoes.length)h+=`<div class="respostas">${m.acoes.map((a,j)=>`<button type="button" class="${a.sim?'sim':''}" data-act="iacmd" data-m="${m.id||''}" data-a="${j}"${m.feito?' disabled':''}>${esc(a.lab)}</button>`).join('')}</div>`;
  const sugs=ultima&&(m.sugs||(m.rel?[m.rel]:null));
  if(sugs&&sugs.length)h+=`<div class="sugs">${sugs.map(x=>`<button type="button" data-act="sug">${esc(x)}</button>`).join('')}</div>`;
  return h+'</div>';
}
function desenhaChat(digitando){
  const ch=$('#chat');if(!ch)return;
  const p=S.perfil,msgs=chatMsgs(),boas={ia:1,t:`Oi, ${primeiro(p.nome)}! Sou o seu Coach IA. Monto cardápios nas suas metas, comparo alimentos, calculo gasto de atividades, carga máxima e prazos de peso, mostro a evolução das suas cargas, explico exercícios e mudo o seu plano na hora. Pergunte o que quiser sobre treino, dieta e saúde.`,sugs:SUGS_INI};
  ch.innerHTML=[boas,...msgs].map((m,i,arr)=>msgHTML(m,!digitando&&i===arr.length-1)).join('')+(digitando?'<div class="msg ia digitando" aria-label="Coach digitando"><i></i><i></i><i></i></div>':'');
  observar();ch.scrollTop=ch.scrollHeight;
}
let respondendo=false;
function perguntar(q){
  q=String(q||'').trim();if(!q||respondendo)return;
  const msgs=chatMsgs();msgs.push({eu:true,t:q});
  const i=$('#pergunta');if(i)i.value='';
  respondendo=true;desenhaChat(true);
  setTimeout(()=>{
    let r;try{r=Cerebro.responder(q,S,chatCtx)||{txt:'Não entendi.'};}catch(e){console.error(e);r={txt:'Tive um problema para responder isso. Tente de outro jeito.'};}
    const id=uid();let txt=r.txt,acoes=r.acoes;
    if(r.fazer){const f=aplicarCmd(r.fazer,id);txt=f.t;acoes=f.mudou?[...(r.acoes||[]),...f.acoes]:[];}
    msgs.push({id,t:txt,refeicoes:r.refeicoes,tabela:r.tabela,ex:r.ex,acoes,sugs:r.sugs,rel:r.rel});
    if(msgs.length>60)msgs.splice(0,msgs.length-60);
    respondendo=false;save();desenhaChat(false);
  },Math.min(900,300+q.length*6));
}
/* aplica um pedido do chat, guardando como estava para o botão Desfazer */
const antesCmd={};
const NAV=new Set(['irtreino','irplano','ircal']);
function fotoEstado(){return JSON.stringify({plano:S.plano,perfil:S.perfil,corpo:S.corpo,apagados:S.apagados,pref:S.ia.pref});}
function aplicarCmd(c,id){
  const antes=fotoEstado();let t;
  try{t=executarCmd(c);}catch(e){console.error(e);t='Não consegui fazer essa mudança. Tente de outro jeito ou ajuste em Plano.';}
  const mudou=fotoEstado()!==antes;
  if(mudou){antesCmd[id]=antes;const ks=Object.keys(antesCmd);if(ks.length>20)delete antesCmd[ks[0]];}
  const acoes=mudou?[{lab:'Desfazer',cmd:{tipo:'desfazer',ref:id}},...(c.tipo==='peso'?[]:[{lab:'Ver o plano',cmd:{tipo:'irplano'},sim:1}])]:[];
  return{t:t||'Feito.',mudou,acoes};
}
function nomeAuto(D){return !D.nome||D.nome===IA.nomeDia([...new Set(D.ex.map(it=>EXS[it.id].g))])||/^Treino de /.test(D.nome);}
function ajustaDiasPerfil(){const p=S.perfil;p.dias=Object.keys(S.plano.dias).map(Number).sort((a,b)=>OS.indexOf(a)-OS.indexOf(b));diaSel=null;diaPlano=null;}
const naDia=d=>IA.naDia(d),doDia=d=>naDia(d).replace(/^n/,'d');
const nomesEx=L=>IA.lista(L.map(id=>EXS[id].n));
const gtxt=gs=>IA.lista(gs.map(g=>GRUPOS[g].n.toLowerCase()));
function regerarPlano(msg){S.plano=IA.gerar(S.perfil,S.ia.pref);diaPlano=null;diaSel=null;return msg+` Plano novo: ${S.plano.tipo.toLowerCase()}. Veja em Plano.`;}
function executarCmd(c){
  const p=S.perfil;let txt='Feito.';
  if(c.tipo==='trocar'){let n=0;Object.entries(S.plano.dias).forEach(([d,D])=>{if(c.d!=null&&+d!==c.d)return;D.ex.forEach(it=>{if(it.id===c.de){it.id=c.para;n++;const ob=IA.prescricao(c.para,p).obs;if(ob)it.obs=ob;else delete it.obs;}});});
    if(!n)return `${EXS[c.de].n} não está mais no seu plano.`;
    pref(c.de,-1);pref(c.para,1);marcarEditado();txt=`Pronto! ${EXS[c.para].n} entrou no lugar de ${EXS[c.de].n}${c.d!=null?' '+naDia(c.d):n>1?' em todos os treinos':''}.`;}
  else if(c.tipo==='remover'){Object.values(S.plano.dias).forEach(D=>{D.ex=D.ex.filter(it=>it.id!==c.id);});
    const vaz=Object.keys(S.plano.dias).filter(d=>!S.plano.dias[d].ex.length).map(Number);vaz.forEach(d=>delete S.plano.dias[d]);if(vaz.length)ajustaDiasPerfil();
    pref(c.id,-1);marcarEditado();txt=`Pronto, tirei ${EXS[c.id].n} do seu plano.${vaz.length?` ${IA.lista(vaz.map(d=>DIAS[d]))} ficou sem exercícios e virou descanso.`:''}`;}
  else if(c.tipo==='diagrupos'){const D0=S.plano.dias[c.d],add=c.add&&D0;
    const novo=IA.montarDia(c.gs,p,S.ia.pref,S.plano,c.d,add?D0.ex:null);
    if(!novo.novos.length)return `Não achei exercícios de ${gtxt(c.gs)} que sirvam para o seu local e as suas restrições. Monte o dia em Plano, pela biblioteca.`;
    const nome=add&&!nomeAuto(D0)?D0.nome:novo.nome;
    S.plano.dias[c.d]={nome,ex:novo.ex};ajustaDiasPerfil();
    const ev=(p.evitar||[]).filter(g=>c.gs.includes(g));if(ev.length)p.evitar=p.evitar.filter(g=>!ev.includes(g));
    marcarEditado();
    txt=add?`Pronto! Coloquei ${gtxt(c.gs)} ${naDia(c.d)}: ${nomesEx(novo.novos)}.`
      :`Pronto! O treino ${doDia(c.d)} agora é só de ${gtxt(c.gs)}, com ${novo.ex.length} ${novo.ex.length===1?'exercício':'exercícios'}: ${nomesEx(novo.novos)}. Cada um com ${IA.PADRAO.s} séries de ${IA.PADRAO.r}.`;
    if(ev.length)txt+=` Tirei ${gtxt(ev)} da lista de grupos para evitar.`;}
  else if(c.tipo==='diatirag'){const D=S.plano.dias[c.d];if(!D)return 'Esse dia já é de descanso.';const auto=nomeAuto(D);
    const tirados=D.ex.filter(it=>c.gs.includes(EXS[it.id].g));D.ex=D.ex.filter(it=>!c.gs.includes(EXS[it.id].g));
    if(!D.ex.length){delete S.plano.dias[c.d];ajustaDiasPerfil();marcarEditado();txt=`Pronto, tirei ${gtxt(c.gs)} ${doDia(c.d)}. Como não sobrou nenhum exercício, ${DIAS[c.d].toLowerCase()} virou dia de descanso.`;}
    else{if(auto)D.nome=IA.nomeDia([...new Set(D.ex.map(it=>EXS[it.id].g))]);marcarEditado();txt=`Pronto, tirei ${gtxt(c.gs)} ${doDia(c.d)}: ${nomesEx(tirados.map(it=>it.id))}.`;}}
  else if(c.tipo==='diaaddex'){let D=S.plano.dias[c.d];if(!D){D=S.plano.dias[c.d]={nome:'',ex:[]};}const auto=nomeAuto(D);
    D.ex.push({u:uid(),id:c.id,...IA.prescricao(c.id,p)});if(auto)D.nome=IA.nomeDia([...new Set(D.ex.map(it=>EXS[it.id].g))]);
    ajustaDiasPerfil();pref(c.id,.5);marcarEditado();txt=`Pronto! ${EXS[c.id].n} entrou no treino ${doDia(c.d)}, com ${IA.PADRAO.s} séries de ${EXS[c.id].seg?'30 s':IA.PADRAO.r}.`;}
  else if(c.tipo==='diarmex'){const D=S.plano.dias[c.d];if(!D)return 'Esse dia já é de descanso.';const auto=nomeAuto(D);D.ex=D.ex.filter(it=>it.id!==c.id);
    if(!D.ex.length){delete S.plano.dias[c.d];txt=`Pronto, tirei ${EXS[c.id].n}. Como não sobrou nenhum exercício, ${DIAS[c.d].toLowerCase()} virou dia de descanso.`;}
    else{if(auto)D.nome=IA.nomeDia([...new Set(D.ex.map(it=>EXS[it.id].g))]);txt=`Pronto, tirei ${EXS[c.id].n} do treino ${doDia(c.d)}.`;}
    ajustaDiasPerfil();pref(c.id,-.5);marcarEditado();}
  else if(c.tipo==='diafolga'){if(!S.plano.dias[c.d])return `${DIAS[c.d]} já é dia de descanso.`;
    if(Object.keys(S.plano.dias).length<=1)return 'Esse é o único dia de treino do seu plano. Para pausar tudo, é só não abrir o treino.';
    delete S.plano.dias[c.d];ajustaDiasPerfil();marcarEditado();txt=`Pronto, ${DIAS[c.d].toLowerCase()} agora é dia de descanso. Seu plano fica com ${S.perfil.dias.length} ${S.perfil.dias.length===1?'dia':'dias'}: ${S.perfil.dias.map(d=>DC[d]).join(', ')}.`;}
  else if(c.tipo==='diatrocar'){const A=S.plano.dias[c.a],B=S.plano.dias[c.b];
    if(B)S.plano.dias[c.a]=B;else delete S.plano.dias[c.a];
    if(A)S.plano.dias[c.b]=A;else delete S.plano.dias[c.b];
    ajustaDiasPerfil();marcarEditado();
    txt=A&&B?`Pronto, troquei: ${DIAS[c.a].toLowerCase()} agora é ${B.nome.toLowerCase()} e ${DIAS[c.b].toLowerCase()} é ${A.nome.toLowerCase()}.`:`Pronto, o treino ${doDia(A?c.a:c.b)} passou para ${DIAS[A?c.b:c.a].toLowerCase()}. ${DIAS[A?c.a:c.b]} virou descanso.`;}
  else if(c.tipo==='desfazer'){const a=antesCmd[c.ref];if(!a)return 'Não consigo mais desfazer essa mudança. Ajuste direto em Plano.';
    const o=JSON.parse(a);S.plano=o.plano;S.perfil=o.perfil;S.corpo=o.corpo;S.apagados=o.apagados;S.ia.pref=o.pref;delete antesCmd[c.ref];diaSel=null;diaPlano=null;txt='Desfeito. Voltei tudo como estava.';}
  else if(c.tipo==='irplano'){ir('plano');return null;}
  else if(c.tipo==='ircal'){ir('calistenia');return null;}
  else if(c.tipo==='local'){if(c.v==='calistenia'&&p.local!=='calistenia')p.localAnt=p.local;p.local=c.v;if(c.v==='calistenia')p.barra=true;
    txt=regerarPlano(c.v==='calistenia'?'Pronto! Seu plano agora é de calistenia: peso do corpo, barra fixa e paralelas.':`Pronto, voltei seu plano para ${c.v==='academia'?'a academia':IA.LOCAL[c.v].toLowerCase()}.`);}
  else if(c.tipo==='tempo'){p.tempo=c.v;txt=regerarPlano(`Pronto! Refiz o plano para treinos de uns ${c.v} min.`);}
  else if(c.tipo==='dias'){const MOD={1:[1],2:[1,4],3:[1,3,5],4:[1,2,4,5],5:[1,2,3,4,5],6:[1,2,3,4,5,6]};const atual=p.dias||[];
    let novo=atual.length>=c.v?Array.from({length:c.v},(_,i)=>atual[Math.round(i*atual.length/c.v)]):MOD[c.v];p.dias=[...new Set(novo)].sort((a,b)=>OS.indexOf(a)-OS.indexOf(b));
    txt=regerarPlano(`Pronto, ${p.dias.length} dias: ${p.dias.map(d=>DC[d]).join(', ')}. Dá para trocar os dias em Perfil.`);}
  else if(c.tipo==='foco'){p.foco=[...new Set([...(p.foco||[]),c.g])];p.evitar=(p.evitar||[]).filter(g=>g!==c.g);txt=regerarPlano(`Pronto! ${GRUPOS[c.g].n} virou foco: mais volume e no começo dos treinos.`);}
  else if(c.tipo==='evitar'){p.evitar=[...new Set([...(p.evitar||[]),c.g])];p.foco=(p.foco||[]).filter(g=>g!==c.g);txt=regerarPlano(`Pronto, tirei ${GRUPOS[c.g].n.toLowerCase()} do seu treino.`);}
  else if(c.tipo==='lesao'){p.lesoes=[...new Set([...(p.lesoes||[]),c.l])];txt=regerarPlano('Anotei no seu perfil.');}
  else if(c.tipo==='tirarlesao'){p.lesoes=(p.lesoes||[]).filter(l=>l!==c.l);txt=regerarPlano('Restrição retirada.');}
  else if(c.tipo==='peso'){const d=hojeISO(),i=S.corpo.findIndex(x=>x.data===d);if(i>=0)S.corpo[i].peso=c.v;else S.corpo.push({data:d,peso:c.v});S.apagados=S.apagados.filter(x=>x!=='c:'+d);p.peso=c.v;txt=`Peso de ${fk(c.v)} kg registrado hoje. Acompanhe em Evolução, Corpo.`;}
  else if(c.tipo==='irtreino'){ir('treino');return null;}
  return txt;
}
function painelNumeros(){
  const p=S.perfil,c=IA.calc(p,S.ia.ajKcal),ins=IA.insights(S),vol=volumeFeito(),gs=IA.alvos(p);
  abrirDlg(`<h3>Seus números</h3><div class="nums quatro"><div><b>${fint(c.kcal)}</b><span>kcal por dia</span></div><div><b>${c.prot} g</b><span>proteína</span></div><div><b>${c.carb} g</b><span>carboidrato</span></div><div><b>${c.gord} g</b><span>gordura</span></div></div>
  <p>Água: <b>${String(c.agua).replace('.',',')} L</b> por dia. IMC <b>${fk(c.imc)}</b>, ${c.imcTxt}. Gasto estimado de ${fint(c.gasto)} kcal. Ritmo esperado: ${c.ritmo}.${S.ia.ajKcal?` Meta ajustada pela IA em ${S.ia.ajKcal>0?'+':''}${S.ia.ajKcal} kcal. <button class="linkbtn" type="button" data-act="zerakcal">Desfazer</button>`:''}</p>
  ${statusCard()}
  ${ins.map((x,i)=>`<div class="card insight ${x.t}"><span class="iico">${svg(x.t==='ok'?'check':x.t==='alerta'?'alerta':'lampada')}</span><h3>${esc(x.tit)}</h3><p>${esc(x.txt)}</p>${x.acao?`<button class="btn" type="button" data-act="iaacao" data-i="${i}">${esc(x.acao.lab)}</button>`:''}</div>`).join('')}
  <div class="card"><h3>Séries feitas nesta semana</h3><p class="sub">A linha tracejada é o mínimo para evoluir no seu nível.</p><div class="barras">${gs.map(g=>{const fx=IA.faixa(g,p),n=vol[g],mx=fx.max*1.2;return `<div class="barra-l"><span>${GRUPOS[g].n}</span><div class="tr2"><i class="${n>=fx.min?'bom':''}" style="width:${Math.min(100,n/mx*100)}%"></i><em style="left:${fx.min/mx*100}%"></em></div><b>${fk(n)}</b></div>`;}).join('')}</div></div>
  <button class="btn cheio bloco" type="button" data-act="fechar">Fechar</button>`,'grande');
}
function acaoIA(a){
  if(!a)return;
  if(a.act==='ia-kcal'){S.ia.ajKcal=(S.ia.ajKcal||0)+a.v;save();toast(`Meta de calorias ajustada em ${a.v>0?'+':''}${a.v} kcal.`);fecharDlg();show('coach',true);}
  else if(a.act==='ia-trocar'){let n=0;Object.values(S.plano.dias).forEach(D=>D.ex.forEach(it=>{if(it.id===a.de){it.id=a.para;n++;}}));pref(a.de,-1);pref(a.para,1);delete S.ia.pulos[a.de];save();toast(`${EXS[a.para].n} entrou no lugar de ${EXS[a.de].n}.`);fecharDlg();show('coach',true);}
  else if(a.act==='ia-menosdias'){const ds=S.perfil.dias,n=Math.max(1,Math.min(a.v,ds.length)),novo=[];for(let i=0;i<n;i++)novo.push(ds[Math.round(i*ds.length/n)]);S.perfil.dias=[...new Set(novo)];S.plano=IA.gerar(S.perfil,S.ia.pref);save();toast(`Plano refeito com ${S.perfil.dias.length} dias.`);fecharDlg();show('coach',true);}
  else if(a.act==='ia-recalibrar'){if(S.perfil.nivel==='ini')S.perfil.nivel='inter';S.inicio=hojeISO();S.plano=IA.gerar(S.perfil,S.ia.pref);save();toast('Plano novo montado. Novo ciclo de 8 semanas começando hoje.');fecharDlg();show('coach',true);}
}

/* ================= Tela: evolução ================= */
let progEx=null,progMet='peso',calMes=null;
const MET={peso:['Peso','kg'],cintura:['Cintura','cm'],braco:['Braço','cm'],peito:['Peito','cm'],quadril:['Quadril','cm'],coxa:['Coxa','cm']};
function linhaGraf(pts,{suf='',meta=null}={}){
  if(!pts.length)return '<p class="vazio">Ainda sem registros.</p>';
  const W=340,Hh=170,pl=40,pr=12,pt=14,pb=26;
  const ys=pts.map(p=>p.y).concat(meta!=null?[meta]:[]);
  let mn=Math.min(...ys),mx=Math.max(...ys);if(mn===mx){mn-=1;mx+=1;}const pad=(mx-mn)*.18;mn-=pad;mx+=pad;
  const Xp=i=>pts.length===1?pl+(W-pl-pr)/2:pl+i*(W-pl-pr)/(pts.length-1);
  const Yp=v=>pt+(Hh-pt-pb)*(1-(v-mn)/(mx-mn));
  let g='';
  [mn+pad,(mn+mx)/2,mx-pad].forEach(v=>{g+=`<line class="gl" x1="${pl}" x2="${W-pr}" y1="${Yp(v).toFixed(1)}" y2="${Yp(v).toFixed(1)}"/><text class="gt" x="${pl-6}" y="${(Yp(v)+4).toFixed(1)}" text-anchor="end">${fk(v)}</text>`;});
  if(meta!=null)g+=`<line class="meta" x1="${pl}" x2="${W-pr}" y1="${Yp(meta).toFixed(1)}" y2="${Yp(meta).toFixed(1)}"/>`;
  const d=pts.map((p,i)=>`${i?'L':'M'}${Xp(i).toFixed(1)} ${Yp(p.y).toFixed(1)}`).join(' ');
  if(pts.length>1)g+=`<path class="ar2" d="${d} L${Xp(pts.length-1).toFixed(1)} ${Hh-pb} L${Xp(0).toFixed(1)} ${Hh-pb} Z"/><path class="ln" d="${d}"/>`;
  pts.forEach((p,i)=>{g+=`<circle class="pt" cx="${Xp(i).toFixed(1)}" cy="${Yp(p.y).toFixed(1)}" r="4"/>`;});
  const idx=pts.length===1?[0]:pts.length===2?[0,1]:[0,Math.floor((pts.length-1)/2),pts.length-1];
  idx.forEach(i=>{g+=`<text class="gt" x="${Xp(i).toFixed(1)}" y="${Hh-6}" text-anchor="${i===0&&pts.length>1?'start':i===pts.length-1&&pts.length>1?'end':'middle'}">${pts[i].l}</text>`;});
  return `<svg class="graf" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Gráfico ${esc(suf)}">${g}</svg>`;
}
function telaEvolucao(){
  let h=`<h2 class="tit">Evolução</h2><div class="seg">${[['exercicios','Exercícios'],['corpo','Corpo'],['historico','Histórico']].map(([k,n])=>`<button type="button" data-act="segevo" data-k="${k}" aria-pressed="${k===segEvo}">${n}</button>`).join('')}</div>`;
  if(segEvo==='corpo')return h+telaCorpo();
  if(segEvo==='historico')return h+telaHist();
  return h+telaExercicios();
}
function telaExercicios(){
  const H=S.hist.filter(x=>!x.antes);
  const comDados=EX_IDS.filter(id=>S.hist.some(h=>h.ex.some(e=>e.id===id&&e.sets.length)));
  if(!progEx||!EXS[progEx])progEx=comDados[0]||(Object.values(S.plano.dias)[0]&&Object.values(S.plano.dias)[0].ex[0]?Object.values(S.plano.dias)[0].ex[0].id:'supino_reto');
  const ex=EXS[progEx],pts=[];
  S.hist.forEach(x=>x.ex.filter(e=>e.id===progEx&&e.sets.length).forEach(e=>{const kgs=e.sets.map(s=>s.kg||0),temKg=kgs.some(k=>k>0);pts.push({l:dm(x.data),y:temKg?Math.max(...kgs):e.sets.reduce((a,s)=>a+s.r,0),kg:temKg,x,e});}));
  const usaKg=pts.some(p=>p.kg),serie=usaKg?pts.filter(p=>p.kg):pts;
  const rec=recorde(progEx);
  const reps=S.hist.reduce((a,x)=>a+x.ex.reduce((y,e)=>y+e.sets.reduce((z,s)=>z+s.r,0),0),0);
  const carga=S.hist.reduce((a,x)=>a+x.ex.reduce((y,e)=>y+e.sets.reduce((z,s)=>z+(s.kg||0)*s.r,0),0),0);
  const series=S.hist.reduce((a,x)=>a+x.ex.reduce((y,e)=>y+e.sets.length,0),0);
  const ini=inicioSemana(new Date()),meta=diasPlano().length||3,semanas=[];
  for(let i=7;i>=0;i--){const a=new Date(ini);a.setDate(a.getDate()-7*i);const b=new Date(a);b.setDate(b.getDate()+7);semanas.push({l:dm(isoDe(a)),n:S.hist.filter(x=>{const d=dt(x.data);return d>=a&&d<b;}).length});}
  const ord=EX_IDS.slice().sort((a,b)=>(comDados.includes(b)-comDados.includes(a))||EXS[a].n.localeCompare(EXS[b].n));
  return `<div class="nums quatro"><div><b>${H.length}</b><span>${H.length===1?'treino':'treinos'}</span></div><div><b>${fint(series)}</b><span>${series===1?'série':'séries'}</span></div><div><b>${fint(reps)}</b><span>repetições</span></div><div><b>${carga?fint(carga):'–'}</b><span>kg levantados</span></div></div>
  <div class="card"><h3>Evolução por exercício</h3>
  <select id="selex" aria-label="Exercício">${ord.map(id=>`<option value="${id}"${id===progEx?' selected':''}>${esc(EXS[id].n)}${comDados.includes(id)?'':' (sem dados)'}</option>`).join('')}</select>
  <p class="sub" style="margin-top:8px">${usaKg?'Maior carga usada em cada treino (kg).':'Total de repetições somando as séries de cada treino.'}</p>
  ${linhaGraf(serie.map(p=>({l:p.l,y:p.y})),{suf:ex.n})}
  ${rec?`<p style="margin-top:10px"><b>Recorde:</b> ${rec.s.r} reps${rec.s.kg?` com ${fk(rec.s.kg)} kg`:''}, em ${dm(rec.data)}</p>`:''}
  ${pts.length?`<div class="rolagem"><table class="tabelinha"><thead><tr><th>Data</th><th>Séries</th></tr></thead><tbody>${pts.slice(-6).reverse().map(p=>`<tr><td>${dm(p.x.data)}</td><td>${fmtSets(p.e.sets)}</td></tr>`).join('')}</tbody></table></div>`:''}</div>
  <div class="card"><h3>Treinos por semana</h3><p class="sub">Meta: ${meta} por semana, como no seu plano.</p>
  <div class="barras">${semanas.map(s=>`<div class="barra-l"><span>${s.l}</span><div class="tr2"><i class="${s.n>=meta?'bom':''}" style="width:${Math.min(100,s.n/meta*100)}%"></i></div><b>${s.n}</b></div>`).join('')}</div></div>`;
}
function telaCorpo(){
  const c=S.corpo.slice().sort((a,b)=>a.data.localeCompare(b.data)),comP=c.filter(x=>+x.peso>0);
  const pts=c.filter(x=>+x[progMet]>0).map(x=>({l:dm(x.data),y:+x[progMet]}));
  let ritmo='–';
  if(comP.length>=2){const a=comP[0],b=comP[comP.length-1],dias=(dt(b.data)-dt(a.data))/864e5;if(dias>=6){const r=(b.peso-a.peso)/(dias/7);ritmo=`${r>=0?'+':''}${fk(r)}`;}}
  const cc=IA.calc(S.perfil,S.ia.ajKcal);
  return `<div class="nums"><div><b>${comP.length?fk(comP[0].peso):'–'}</b><span>peso inicial</span></div><div><b>${comP.length?fk(comP[comP.length-1].peso):'–'}</b><span>peso atual</span></div><div><b>${ritmo}</b><span>kg por semana</span></div></div>
  <p class="sub">Ritmo ideal para o seu objetivo: ${cc.ritmo}.</p>
  <div class="card"><h3>Registrar medidas</h3><div class="form">
    <label class="campo">Data<input type="date" id="cdata" value="${hojeISO()}"></label>
    <label class="campo">Peso (kg)<input inputmode="decimal" id="c-peso" placeholder="${comP.length?fk(comP[comP.length-1].peso):'70,0'}"></label>
    <label class="campo">Cintura (cm)<input inputmode="decimal" id="c-cintura" placeholder="opcional"></label>
    <label class="campo">Braço (cm)<input inputmode="decimal" id="c-braco" placeholder="opcional"></label>
    <label class="campo">Peito (cm)<input inputmode="decimal" id="c-peito" placeholder="opcional"></label>
    <label class="campo">Quadril (cm)<input inputmode="decimal" id="c-quadril" placeholder="opcional"></label>
    <label class="campo">Coxa (cm)<input inputmode="decimal" id="c-coxa" placeholder="opcional"></label></div>
    <div class="acoes" style="margin-top:12px"><button class="btn cheio" type="button" data-act="salvarcorpo">Salvar medidas</button></div>
    <p class="sub" style="margin-top:10px">Pese-se uma vez por semana, no mesmo dia, em jejum. Meça sempre no mesmo ponto.</p></div>
  <div class="card"><h3>Gráfico</h3><div class="seg">${Object.entries(MET).map(([k,[n]])=>`<button type="button" data-act="met" data-k="${k}" aria-pressed="${k===progMet}">${n}</button>`).join('')}</div>
    ${linhaGraf(pts,{suf:MET[progMet][0]})}
    ${c.length?`<div class="rolagem"><table class="tabelinha" style="margin-top:8px"><thead><tr><th>Data</th><th>Peso</th><th>Cintura</th><th>Braço</th><th></th></tr></thead><tbody>${c.slice(-10).reverse().map(x=>`<tr><td>${dm(x.data)}</td><td>${x.peso?fk(x.peso):'–'}</td><td>${x.cintura?fk(x.cintura):'–'}</td><td>${x.braco?fk(x.braco):'–'}</td><td><button class="mini" type="button" data-act="apagacorpo" data-d="${x.data}" aria-label="Apagar registro de ${dm(x.data)}">Apagar</button></td></tr>`).join('')}</tbody></table></div>`:''}</div>`;
}
function telaHist(){
  const hoje=new Date();if(!calMes)calMes=new Date(hoje.getFullYear(),hoje.getMonth(),1);
  const ano=calMes.getFullYear(),mes=calMes.getMonth(),prim=new Date(ano,mes,1),offs=(prim.getDay()+6)%7,dias=new Date(ano,mes+1,0).getDate();
  const porDia={};S.hist.forEach(x=>{(porDia[x.data]=porDia[x.data]||[]).push(DC[x.dia]||'•');});
  let cal=['S','T','Q','Q','S','S','D'].map(d=>`<div class="dn">${d}</div>`).join('');
  for(let i=0;i<offs;i++)cal+='<div class="d fora"></div>';
  for(let d=1;d<=dias;d++){const iso=isoDe(new Date(ano,mes,d)),tem=porDia[iso];cal+=`<div class="d${tem?' tem':''}${iso===hojeISO()?' hoje':''}">${d}${tem?`<small>${tem.join(' ')}</small>`:''}</div>`;}
  const meta=Math.min(3,diasPlano().length||3);let seq=0;
  {const cnt=a=>{const b=new Date(a);b.setDate(b.getDate()+7);return S.hist.filter(x=>{const y=dt(x.data);return y>=a&&y<b;}).length;};
   const w=inicioSemana(hoje);if(cnt(w)>=meta)seq++;w.setDate(w.getDate()-7);while(seq<300&&cnt(w)>=meta){seq++;w.setDate(w.getDate()-7);}}
  let h=`<p class="sub">${S.hist.length} ${S.hist.length===1?'treino registrado':'treinos registrados'}. Sequência de ${seq} semana${seq===1?'':'s'} com ${meta} treinos ou mais.</p>
  <div class="card"><div class="calnav"><button class="mini" type="button" data-act="mes" data-v="-1" aria-label="Mês anterior">‹</button><b>${(m=>m.charAt(0).toUpperCase()+m.slice(1))(calMes.toLocaleDateString('pt-BR',{month:'long',year:'numeric'}))}</b><button class="mini" type="button" data-act="mes" data-v="1" aria-label="Próximo mês">›</button></div><div class="cal">${cal}</div></div><div class="card"><h3>Treinos</h3>`;
  const lista=S.hist.slice().reverse();
  if(!lista.length)h+='<p class="vazio">Nenhum treino ainda. Vá em Treino e toque em Começar.</p>';
  lista.forEach(x=>{const reps=x.ex.reduce((a,e)=>a+e.sets.reduce((y,s)=>y+s.r,0),0);
    h+=`<details class="sess"><summary><span class="dt">${dataBR(x.data)}</span><span class="tt">${esc(x.nome||'Treino')}</span><span class="dd">${x.antes?'Registrado antes do app':`${x.dur} min, ${x.feitas} séries${reps?`, ${fint(reps)} repetições`:''}`}</span></summary>
      ${x.ex.length?`<ul>${x.ex.map(e=>`<li><b>${esc(EXS[e.id].n)}:</b> ${fmtSets(e.sets)}</li>`).join('')}</ul>`:'<p class="vazio" style="margin:8px 0">Sem séries detalhadas.</p>'}
      ${x.prs&&x.prs.length?`<p class="pr">Recordes: ${x.prs.filter(id=>EXS[id]).map(id=>esc(EXS[id].n)).join(', ')}</p>`:''}
      <button class="btn perigo" type="button" data-act="apagahist" data-id="${x.id}">Apagar este treino</button></details>`;});
  return h+'</div>';
}

/* ================= Tela: perfil ================= */
function telaPerfil(){
  const p=S.perfil,c=contas[contaId]||{},cf=S.cfg;
  const L=a=>a&&a.length?a.map(g=>GRUPOS[g]?GRUPOS[g].n:LESOES[g]).join(', '):'nenhum';
  return `<h2 class="tit">Perfil</h2>
  <div class="card"><div class="acoes" style="gap:12px">${avatar(c.nome||p.nome)}<div><h3 style="margin:0">${esc(c.nome||p.nome)}</h3><span class="sub">${p.idade?p.idade+' anos, ':''}${p.altura} cm, ${fk(p.peso)} kg</span></div></div>
  <table class="tabelinha" style="margin-top:10px"><tbody>
   <tr><th>Objetivo</th><td>${esc(IA.OBJ[p.objetivo]?IA.OBJ[p.objetivo].n:'')}</td></tr>
   <tr><th>Nível</th><td>${esc(IA.NIVEL[p.nivel]||'')}${p.parado?', voltando de pausa':''}</td></tr>
   <tr><th>Dias</th><td>${(p.dias||[]).map(d=>DC[d]).join(', ')}, ${p.tempo} min</td></tr>
   <tr><th>Local</th><td>${esc(IA.LOCAL[p.local]||'')}${p.barra?', com barra fixa':''}</td></tr>
   <tr><th>Foco</th><td>${esc(L(p.foco))}${p.somente?' (somente)':''}</td></tr>
   <tr><th>Não treina</th><td>${esc(L(p.evitar))}</td></tr>
   <tr><th>Cuidados</th><td>${esc(L(p.lesoes))}</td></tr></tbody></table>
  <div class="acoes" style="margin-top:12px"><button class="btn cheio" type="button" data-act="editarperfil">Editar meus dados</button></div></div>
  <div class="card"><h3>Conta e nuvem</h3><p id="syncstatus">${syncTexto()}</p>
   <div class="acoes"><button class="btn" type="button" data-act="syncagora">Sincronizar agora</button>${c.token?'<button class="btn" type="button" data-act="trocasenha">Trocar senha</button>':''}<button class="btn" type="button" data-act="ir" data-v="inicio">Trocar de pessoa</button><button class="btn perigo" type="button" data-act="sair">Sair deste aparelho</button></div></div>
  ${cartaoInstalar('perfil')}
  <div class="card"><h3>Ajustes</h3><div class="form">
    <label class="campo">Registrar carga (kg)<select data-cfg="carga"><option value="1"${cf.carga?' selected':''}>Sim</option><option value="0"${!cf.carga?' selected':''}>Não, só repetições</option></select></label>
    <label class="campo">Cronômetro do treino<select data-cfg="crono"><option value="1"${cf.crono?' selected':''}>Mostrar</option><option value="0"${!cf.crono?' selected':''}>Esconder</option></select></label>
    <label class="campo">Aviso do descanso<select data-cfg="aviso"><option value="ambos"${cf.som&&cf.vib?' selected':''}>Som e vibração</option><option value="som"${cf.som&&!cf.vib?' selected':''}>Só som</option><option value="vib"${!cf.som&&cf.vib?' selected':''}>Só vibração</option><option value="nada"${!cf.som&&!cf.vib?' selected':''}>Nenhum</option></select></label>
    <label class="campo">Bonecos dos exercícios<select data-cfg="anim"><option value="1"${cf.anim!==false?' selected':''}>Animados</option><option value="0"${cf.anim===false?' selected':''}>Parados</option></select></label>
    <label class="campo">Tema<select data-cfg="tema"><option value="auto"${cf.tema==='auto'?' selected':''}>Igual ao celular</option><option value="light"${cf.tema==='light'?' selected':''}>Claro</option><option value="dark"${cf.tema==='dark'?' selected':''}>Escuro</option></select></label>
    <label class="campo">Início do ciclo<input type="date" data-cfg="inicio" value="${S.inicio||''}"></label>
  </div><div class="acoes" style="margin-top:12px"><button class="btn" type="button" data-act="testesom">Testar aviso</button></div></div>
  <div class="card"><h3>Backup</h3><p>Seus dados já ficam na nuvem e no aparelho. O backup em arquivo é uma cópia extra. Restaurar também aceita o backup do app antigo do Henrique.</p>
   <div class="acoes"><button class="btn cheio" type="button" data-act="exportar">Baixar backup</button><button class="btn" type="button" data-act="importar">Restaurar backup</button></div></div>
  <div class="card"><h3>Excluir conta</h3><p>Apaga sua conta e todos os seus treinos da nuvem e deste aparelho. Não dá para desfazer.</p><button class="btn perigo" type="button" data-act="excluir">Excluir minha conta</button></div>`;
}
function telaEditar(){
  if(!OB||OB.modo!=='editar'){OB=obNovo('editar');const p=S.perfil;Object.assign(OB.d,{...p,sexo:p.sexo||'x',idade:String(p.idade||''),altura:String(p.altura||''),peso:String(p.peso||'').replace('.',','),dias:(p.dias||[]).slice(),foco:(p.foco||[]).slice(),evitar:(p.evitar||[]).slice(),lesoes:(p.lesoes||[]).slice()});}
  return `<h2 class="tit">Editar meus dados</h2><form id="fedit" novalidate>${PASSOS.slice(1,9).map(p=>`<div class="card">${p.r(OB.d)}</div>`).join('')}<p class="erro" id="oberro">${esc(OB.erro)}</p>
  <div class="navpasso"><button class="btn" type="button" data-act="ir" data-v="perfil">Cancelar</button><button class="btn cheio" type="submit">Salvar</button></div></form>`;
}
function salvarEdicao(){
  for(const p of PASSOS.slice(1,9)){const e=p.v(OB.d);if(e){OB.erro=e;const el=$('#oberro');if(el){el.textContent=e;el.scrollIntoView({block:'center'});}return;}}
  const novo=perfilDe(OB.d);novo.nome=S.perfil.nome;novo.desc=S.perfil.desc||null;
  S.perfil=novo;if(+novo.peso&&!S.corpo.some(c=>c.data===hojeISO()))S.corpo.push({data:hojeISO(),peso:+novo.peso});
  save();OB=null;
  abrirDlg(`<h3 class="ok">Dados salvos</h3><p>Quer que a IA refaça o plano com os dados novos? Seu histórico continua.</p><div class="acoes"><button class="btn cheio" type="button" data-act="refazerok">Refazer o plano</button><button class="btn" type="button" data-act="fechar">Manter meu plano</button></div>`);
  ir('perfil');
}

/* ================= Backup e importação ================= */
function importarHenriqueAntigo(j){
  const mapa={a:1,b:2,c:3,d:4,e:5},nomes={a:'Peito e tríceps',b:'Costas e bíceps',c:'Ombros e trapézio',d:'Peito e costas',e:'Braços e ombros'};
  let n=0;
  (j.hist||[]).forEach(h=>{const dia=mapa[h.t];if(!dia)return;
    if(S.hist.some(x=>x.data===h.data&&x.dia===dia))return;
    S.hist.push({id:uid(),dia,nome:nomes[h.t],data:h.data,start:h.start||null,dur:h.dur,feitas:h.feitas,total:h.total,antes:!!h.antes,prs:(h.prs||[]).filter(id=>EXS[id]),
      ex:(h.ex||[]).filter(e=>EXS[e.id]).map(e=>({id:e.id,u:e.slot||uid(),sets:(e.sets||[]).map(s=>({r:+s.r||0}))}))});n++;});
  S.hist.sort((a,b)=>a.data.localeCompare(b.data)||(a.start||0)-(b.start||0));
  (j.corpo||[]).forEach(c=>{const i=S.corpo.findIndex(x=>x.data===c.data),reg={data:c.data};['peso','braco','peito','cintura'].forEach(k=>{if(+c[k]>0)reg[k]=+c[k];});if(i>=0)S.corpo[i]={...S.corpo[i],...reg};else S.corpo.push(reg);});
  if(j.inicio)S.inicio=j.inicio;
  return n;
}
function restaurar(txt){
  let j;try{j=JSON.parse(txt);}catch(e){j=null;}
  if(j&&j.v===3&&Array.isArray(j.hist)){const n=importarHenriqueAntigo(j);save();abrirDlg(`<h3 class="ok">Backup importado</h3><p>${n} treinos e as medidas do app antigo foram trazidos para cá.</p><button class="btn cheio" type="button" data-act="fechar">Fechar</button>`);show(atual,true);return;}
  if(j&&j.v===1&&j.perfil&&j.plano){const s=normal(j);s.sessao=null;s.perfil.nome=S.perfil.nome;s.apagados=[...new Set([...(S.apagados||[]),...(s.apagados||[])])];S=s;save();aplicaTema();abrirDlg('<h3 class="ok">Backup restaurado</h3><p>Seus treinos, medidas e ajustes voltaram.</p><button class="btn cheio" type="button" data-act="fechar">Fechar</button>');show(atual,true);return;}
  abrirDlg('<h3>Arquivo inválido</h3><p>Escolha um arquivo de backup baixado por este app, ou pelo app antigo do Henrique, com final .json.</p><button class="btn" type="button" data-act="fechar">Fechar</button>');
}

/* ================= Som, vibração e tela acesa ================= */
let actx=null,wl=null,flashAte=0;
function audio(){try{if(!actx){const A=window.AudioContext||window.webkitAudioContext;if(A)actx=new A();}if(actx&&actx.state==='suspended')actx.resume();}catch(e){}}
function aviso(){
  if(S&&S.cfg.som&&actx){try{[0,.28,.56].forEach(t=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;const n=actx.currentTime+t;g.gain.setValueAtTime(.0001,n);g.gain.exponentialRampToValueAtTime(.35,n+.02);g.gain.exponentialRampToValueAtTime(.0001,n+.2);o.connect(g).connect(actx.destination);o.start(n);o.stop(n+.22);});}catch(e){}}
  if(S&&S.cfg.vib){try{navigator.vibrate&&navigator.vibrate([250,120,250]);}catch(e){}}
}
async function wake(){try{if(S&&S.sessao&&'wakeLock' in navigator&&document.visibilityState==='visible'){wl=await navigator.wakeLock.request('screen');}}catch(e){}}
function soltar(){try{if(wl)wl.release();}catch(e){}wl=null;}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){wake();atualizaBarra();}});

/* ================= Barra do descanso e cronômetro ================= */
const barra=$('#barra'),bt=$('#bt'),btit=$('#btit'),bsub=$('#bsub'),blinha=$('#blinha'),bfill=$('#bfill'),bplus=$('#bplus'),bmenos=$('#bmenos'),bacao=$('#bacao');
function atualizaBarra(){
  const ses=S&&S.sessao,agora=Date.now();
  const cr=$('#crono');if(cr&&ses)cr.textContent=fmt((agora-ses.start)/1000);
  if(ses&&ses.restEnd){
    if(agora<ses.restEnd){
      const left=Math.ceil((ses.restEnd-agora)/1000),de=ses.restDe,x=de?de.x:ses.x;
      const it=ses.itens[x],a=it?ativo(x):-1,nx=a>=0?{x,i:a}:(()=>{const j=proximoComPendente(x);return j==null?null:{x:j,i:ativo(j)};})();
      barra.hidden=false;barra.classList.remove('alerta');[bplus,bmenos,bacao,blinha].forEach(b=>b.hidden=false);
      bt.textContent=fmt(left);btit.textContent='Descanso';
      bsub.textContent=nx?`Depois: ${EXS[ses.itens[nx.x].id].n}, série ${nx.i+1}`:'Era a última série';
      bfill.style.transform=`scaleX(${Math.min(1,left/ses.restTotal)})`;
      const an=$('#banel');if(an)an.style.strokeDashoffset=(169.6*(1-Math.min(1,left/ses.restTotal))).toFixed(1);
      return;
    }
    aviso();flashAte=agora+2500;fimDescanso();
  }
  if(ses&&agora<flashAte){
    barra.hidden=false;barra.classList.add('alerta');[bplus,bmenos,bacao,blinha].forEach(b=>b.hidden=true);
    const an=$('#banel');if(an)an.style.strokeDashoffset='0';
    bt.textContent='0:00';btit.textContent='Bora, próxima série';bsub.textContent='A série em laranja está esperando você';
    return;
  }
  barra.hidden=true;barra.classList.remove('alerta');
}
bplus.addEventListener('click',()=>{const s=S&&S.sessao;if(s&&s.restEnd){s.restEnd+=15000;s.restTotal+=15;saveLocal();atualizaBarra();}});
bmenos.addEventListener('click',()=>{const s=S&&S.sessao;if(s&&s.restEnd){s.restEnd=Math.max(Date.now()+1000,s.restEnd-15000);saveLocal();atualizaBarra();}});
bacao.addEventListener('click',()=>{const s=S&&S.sessao;if(!s||!s.restEnd)return;flashAte=0;fimDescanso();atualizaBarra();});
setInterval(atualizaBarra,500);

/* ================= Eventos ================= */
document.addEventListener('click',e=>{
  audio();
  const b=e.target.closest('[data-act]');if(!b||b.disabled)return;
  const a=b.dataset.act;if(b.tagName==='A')e.preventDefault();
  const ses=S&&S.sessao;
  switch(a){
    /* início e contas */
    case 'continuar':if(contaId)ir('treino');break;
    case 'henrique':abrirHenrique();break;
    case 'pessoa':entrarPessoa(b.dataset.id,(listaNuvem.find(p=>p.id===b.dataset.id)||contas[b.dataset.id]||{}).nome);break;
    case 'novo':OB=obNovo();ir('novo');break;
    case 'versenha':{const i=b.parentElement.querySelector('input');if(i){i.type=i.type==='password'?'text':'password';b.textContent=i.type==='password'?'Ver':'Ocultar';}break;}
    case 'ob':{const k=b.dataset.k;let v=b.dataset.v;if(k==='tempo')v=+v;OB.d[k]=v;OB.erro='';show(atual==='editar'?'editar':'novo',true);break;}
    case 'obl':{const k=b.dataset.k;let v=b.dataset.v;if(k==='dias')v=+v;const L=OB.d[k],i=L.indexOf(v);if(i>=0)L.splice(i,1);else{if(k==='dias'&&L.length>=6){toast('Deixe pelo menos um dia de descanso.');break;}L.push(v);}
      if(k==='foco'){const j=OB.d.evitar.indexOf(v);if(j>=0)OB.d.evitar.splice(j,1);}if(k==='evitar'){const j=OB.d.foco.indexOf(v);if(j>=0)OB.d.foco.splice(j,1);}
      OB.erro='';show(atual==='editar'?'editar':'novo',true);break;}
    case 'obvoltar':if(OB.passo>0){OB.passo--;OB.erro='';show('novo');}else{const m=OB.modo;OB=null;if(m==='completar'){S=null;contaId=null;}ir('inicio');}break;
    case 'ir':ir(b.dataset.v);break;
    /* treino */
    case 'dia':diaSel=+b.dataset.d;show('treino');break;
    case 'comecar':comecar(+b.dataset.d);show('treino');rolarEx();break;
    case 'concluir':if(ses)concluir(ativo(ses.x));break;
    case 'chk':if(ses)marcar(+b.dataset.i);break;
    case 'sel':if(ses)selecionar(+b.dataset.i);break;
    case 'avancar':if(ses){const nx=proximoComPendente(ses.x);irEx(nx==null?ses.x+1:nx);}break;
    case 'anterior':if(ses)irEx(ses.x-1);break;
    case 'proximo':if(ses)irEx(ses.x+1);break;
    case 'irex':if(ses){fecharDlg();irEx(+b.dataset.x);}break;
    case 'fila':if(ses)abrirDlg(`<h3>Ordem do treino</h3><p class="sub">Toque em um exercício para ir até ele.</p>${filaHTML()}<div class="acoes" style="margin-top:12px"><button class="btn cheio" type="button" data-act="finalizar">Finalizar o treino</button><button class="btn" type="button" data-act="fechar">Fechar</button></div>`);break;
    case 'pulaserie':if(ses)pularSerie();break;
    case 'pulaex':if(ses)pularExercicio();break;
    case 'addset':if(ses){ses.itens[ses.x].sets.push({r:'',kg:'',ok:false,skip:false});saveLocal();show('treino',true);}break;
    case 'rmset':if(ses){const arr=ses.itens[ses.x].sets;if(arr.length>1&&!arr[arr.length-1].ok){arr.pop();if(ses.sel&&ses.sel.x===ses.x&&ses.sel.i>=arr.length)ses.sel=null;if(ses.restDe&&ses.restDe.x===ses.x&&ses.restDe.i>=arr.length)ses.restDe=null;saveLocal();show('treino',true);}}break;
    case 'trocar':if(ses){const it=ses.itens[ses.x];
      if(it.sets.some(s=>s.ok)){toast('Já tem série feita neste exercício. Troque antes de começar, ou pule e siga.');break;}
      const ops=alternativas(it.id,podeUsar);
      abrirDlg(`<h3>Trocar exercício</h3><p>Alternativas para ${esc(EXS[it.id].n)}. A troca vale também para os próximos treinos.</p><div class="altlist">${ops.slice(0,8).map(id=>`<button type="button" data-act="escolher" data-id="${id}"><span class="art">${poseSVG(id)}</span><span><b>${esc(EXS[id].n)}</b><small>${EXS[id].p.map(m=>NOMES[m]).join(', ')}</small></span></button>`).join('')||'<p class="vazio">Nenhuma alternativa para o seu local.</p>'}</div><button class="btn" type="button" data-act="fechar">Cancelar</button>`);}break;
    case 'escolher':if(ses){const it=ses.itens[ses.x],de=it.id,para=b.dataset.id;it.id=para;it.obs=IA.prescricao(para,S.perfil).obs||'';it.sets.forEach(s=>{s.r='';s.kg='';s.skip=false;});const r=itemPlano(it.u);if(r){r.it.id=para;if(it.obs)r.it.obs=it.obs;else delete r.it.obs;}pref(de,-1);pref(para,1);fecharDlg();save();show('treino',true);}break;
    case 'finalizar':fecharDlg();finalizar();break;
    case 'descartar':if(b.closest('dialog'))descartar();else armar(b,descartar);break;
    case 'fechar':fecharDlg();break;
    /* plano */
    case 'editardia':diaPlano=+b.dataset.d;ir('plano');break;
    case 'diaplano':diaPlano=+b.dataset.d;show('plano',true);break;
    case 'adddia':{const d=+b.dataset.d;S.plano.dias[d]={nome:'Treino de '+DIAS[d].toLowerCase(),ex:[]};if(!S.perfil.dias.includes(d))S.perfil.dias.push(d);marcarEditado();save();show('plano',true);abrirBiblioteca(d);break;}
    case 'rmdia':armar(b,()=>{const d=+b.dataset.d;delete S.plano.dias[d];S.perfil.dias=S.perfil.dias.filter(x=>x!==d);marcarEditado();save();if(diaSel===d)diaSel=null;show('plano',true);});break;
    case 'renomear':{const d=+b.dataset.d;abrirDlg(`<h3>Nome do treino</h3><form id="frenome" data-d="${d}"><label class="campo">Nome<input id="inome" value="${esc(S.plano.dias[d].nome)}" maxlength="40"></label><div class="acoes" style="margin-top:12px"><button class="btn cheio" type="submit">Salvar</button><button class="btn" type="button" data-act="nomeauto" data-d="${d}">Nome automático</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div></form>`);break;}
    case 'nomeauto':{const d=+b.dataset.d,D=S.plano.dias[d];D.nome=IA.nomeDia([...new Set(D.ex.map(it=>EXS[it.id].g))]);save();fecharDlg();show(atual,true);break;}
    case 'mover':{const r=itemPlano(b.dataset.u);if(!r)break;const j=r.i+(+b.dataset.v);if(j<0||j>=r.D.ex.length)break;const t=r.D.ex[r.i];r.D.ex[r.i]=r.D.ex[j];r.D.ex[j]=t;marcarEditado();save();show('plano',true);break;}
    case 'edititem':editarItem(b.dataset.u);break;
    case 'step':{if(!edTmp)break;const k=b.dataset.k;edTmp[k]=Math.max(1,Math.min(k==='s'?10:300,edTmp[k]+(+b.dataset.v)));const o=$('#out-'+k);if(o)o.textContent=edTmp[k];break;}
    case 'salvaritem':{const r=edTmp&&itemPlano(edTmp.u);if(r){r.it.s=edTmp.s;r.it.r=edTmp.r;r.it.desc=+$('#eddesc').value||r.it.desc;marcarEditado();save();}fecharDlg();show(atual,true);break;}
    case 'rmitem':armar(b,()=>{const r=itemPlano(b.dataset.u);if(r){r.D.ex.splice(r.i,1);pref(r.it.id,-1);marcarEditado();save();}fecharDlg();show(atual,true);},'Toque de novo para remover');break;
    case 'trocaritem':{const r=itemPlano(b.dataset.u);if(!r)break;const ops=alternativas(r.it.id,podeUsar);
      abrirDlg(`<h3>Trocar exercício</h3><p>Alternativas para ${esc(EXS[r.it.id].n)}.</p><div class="altlist">${ops.slice(0,10).map(id=>`<button type="button" data-act="trocaritemok" data-u="${r.it.u}" data-id="${id}"><span class="art">${poseSVG(id)}</span><span><b>${esc(EXS[id].n)}</b><small>${EXS[id].p.map(m=>NOMES[m]).join(', ')}</small></span></button>`).join('')||'<p class="vazio">Nenhuma alternativa para o seu local.</p>'}</div><button class="btn" type="button" data-act="fechar">Cancelar</button>`);break;}
    case 'trocaritemok':{const r=itemPlano(b.dataset.u);if(r){pref(r.it.id,-1);pref(b.dataset.id,1);r.it.id=b.dataset.id;const ob=IA.prescricao(r.it.id,S.perfil).obs;if(ob)r.it.obs=ob;else delete r.it.obs;marcarEditado();save();}fecharDlg();show(atual,true);break;}
    case 'biblioteca':abrirBiblioteca(diaPlano);break;
    case 'libaba':libAba=+b.dataset.i;libBusca='';const lb=$('#libbusca');if(lb)lb.value='';document.querySelectorAll('#libabas button').forEach(x=>x.setAttribute('aria-pressed',x===b));atualizaLib();const dl=$('#dlg');if(dl)dl.scrollTop=0;break;
    case 'libadd':{const id=b.dataset.id,D=S.plano.dias[libDia];if(!D)break;const i=D.ex.findIndex(x=>x.id===id);
      if(i>=0){D.ex.splice(i,1);pref(id,-.5);}else{D.ex.push({u:uid(),id,...IA.prescricao(id,S.perfil)});pref(id,.5);}
      marcarEditado();save();b.classList.toggle('ok',i<0);b.textContent=i<0?'✓ No treino':'+ Adicionar';break;}
    case 'libok':fecharDlg();show('plano',true);break;
    case 'analisar':{const r=IA.analisar(S.plano,S.perfil);
      abrirDlg(`<h3>Análise da IA</h3><div class="nota"><b>${r.nota}</b><span>de 100<br>${r.nota>=85?'Plano muito bem montado.':r.nota>=65?'Bom plano, com alguns ajustes possíveis.':'Dá para melhorar bastante.'}</span></div>
      ${r.bons.length?`<p style="margin-top:10px"><b>Bem equilibrado:</b> ${esc(r.bons.join(', '))}.</p>`:''}
      ${r.itens.length?`<ul class="lista-ia">${r.itens.map(x=>`<li class="${x.t}">${esc(x.txt)}</li>`).join('')}</ul>`:'<p>Nenhum problema encontrado.</p>'}
      <div class="acoes" style="margin-top:12px">${r.nota<85?'<button class="btn cheio" type="button" data-act="refazer">Deixar a IA refazer</button>':''}<button class="btn" type="button" data-act="fechar">Fechar</button></div>`);break;}
    case 'refazer':abrirDlg(`<h3>Refazer com a IA</h3><p>A IA monta um plano novo com base no seu perfil e no que aprendeu com suas trocas. O plano atual será substituído. Seu histórico continua.</p><div class="acoes"><button class="btn cheio" type="button" data-act="refazerok">Refazer o plano</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div>`);break;
    case 'refazerok':{S.plano=IA.gerar(S.perfil,S.ia.pref);save();diaPlano=null;diaSel=null;fecharDlg();
      abrirDlg(`<h3 class="ok">Plano novo pronto</h3><p><b>${esc(S.plano.tipo)}</b></p><ul class="lista-ia">${S.plano.explic.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><button class="btn cheio bloco" type="button" data-act="fechar">Ver o plano</button>`);ir('plano');break;}
    /* coach */
    case 'sug':perguntar(b.textContent);break;
    case 'instalar':instalar();break;
    case 'ircal':ir('calistenia');break;
    case 'caltrilha':calTrilha=b.dataset.t;show('calistenia',true);break;
    case 'calex':verCal(b.dataset.id);break;
    case 'caladd':{const d=+b.dataset.d,id=b.dataset.id,D=S.plano.dias[d];if(!D||D.ex.some(x=>x.id===id))break;
      D.ex.push({u:uid(),id,...IA.prescricao(id,{...S.perfil,local:'calistenia'})});pref(id,.5);marcarEditado();save();toast(`${EXS[id].n} entrou no treino de ${DIAS[d].toLowerCase()}.`);verCal(id);if(atual==='calistenia')show('calistenia',true);break;}
    case 'calplano':abrirDlg(`<h3>Treino de calistenia</h3><p>A IA vai montar um plano novo só com peso do corpo, barra fixa e paralelas, mantendo seus dias, tempo e objetivo. O plano atual será substituído. Seu histórico continua.</p><div class="acoes"><button class="btn cheio" type="button" data-act="calplanook">Montar o plano</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div>`);break;
    case 'calplanook':trocarLocal('calistenia');break;
    case 'calsair':{const v=S.perfil.localAnt&&S.perfil.localAnt!=='calistenia'?S.perfil.localAnt:'academia';abrirDlg(`<h3>Voltar para ${v==='academia'?'a academia':esc(IA.LOCAL[v].toLowerCase())}</h3><p>A IA monta um plano novo com os equipamentos de antes. Seu histórico continua.</p><div class="acoes"><button class="btn cheio" type="button" data-act="calsairok">Montar o plano</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div>`);break;}
    case 'calsairok':trocarLocal(S.perfil.localAnt&&S.perfil.localAnt!=='calistenia'?S.perfil.localAnt:'academia');break;
    case 'instalarx':LS.set('rt-instalar-oculto',Date.now()+7*864e5);{const c=$('#instalar');if(c)c.remove();}break;
    case 'painel':painelNumeros();break;
    case 'limparchat':armar(b,()=>{S.ia.chat=[];chatCtx={};save();show('coach');},'Limpar?');break;
    case 'iacmd':{const m=chatMsgs().find(x=>x.id===b.dataset.m),a=m&&m.acoes&&m.acoes[+b.dataset.a];if(!a||m.feito)break;
      if(NAV.has(a.cmd.tipo)){executarCmd(a.cmd);break;}
      m.feito=true;const id=uid();
      if(a.cmd.tipo==='desfazer'){const t=executarCmd(a.cmd);chatMsgs().push({id,t});}
      else{const f=aplicarCmd(a.cmd,id);chatMsgs().push({id,t:f.t,acoes:f.acoes});}
      save();desenhaChat(false);break;}
    case 'iaacao':{const x=IA.insights(S)[+b.dataset.i];if(x)acaoIA(x.acao);break;}
    case 'zerakcal':S.ia.ajKcal=0;save();fecharDlg();painelNumeros();break;
    /* evolução */
    case 'segevo':segEvo=b.dataset.k;show('evolucao',true);break;
    case 'met':progMet=b.dataset.k;show('evolucao',true);break;
    case 'mes':calMes=new Date(calMes.getFullYear(),calMes.getMonth()+(+b.dataset.v),1);show('evolucao',true);break;
    case 'salvarcorpo':{const d=$('#cdata').value||hojeISO(),reg={data:d};let algum=false;
      Object.keys(MET).forEach(k=>{const v=num($('#c-'+k).value);if(v>0){reg[k]=v;algum=true;}});
      if(!algum){$('#c-peso').focus();toast('Preencha pelo menos uma medida.');break;}
      const i=S.corpo.findIndex(x=>x.data===d);if(i>=0)S.corpo[i]={...S.corpo[i],...reg};else S.corpo.push(reg);
      S.apagados=S.apagados.filter(x=>x!=='c:'+d);if(reg.peso&&d>=(S.corpo.filter(x=>x.peso).map(x=>x.data).sort().pop()||''))S.perfil.peso=reg.peso;
      save();toast('Medidas salvas.');show('evolucao',true);break;}
    case 'apagacorpo':armar(b,()=>{const d=b.dataset.d;S.corpo=S.corpo.filter(x=>x.data!==d);S.apagados.push('c:'+d);save();show('evolucao',true);},'Confirmar');break;
    case 'apagahist':armar(b,()=>{const id=b.dataset.id;S.hist=S.hist.filter(x=>x.id!==id);S.apagados.push('h:'+id);save();show('evolucao',true);});break;
    /* perfil */
    case 'editarperfil':OB=null;location.hash='editar';break;
    case 'syncagora':if(!navigator.onLine){toast('Sem internet agora.');break;}const c=contas[contaId];if(c&&c.token){c.sinc=0;}sincronizar().then(puxarNuvem);toast('Sincronizando…');break;
    case 'trocasenha':abrirDlg(`<h3>Trocar senha</h3><form id="ftroca"><label class="campo">Senha atual<input id="tsa" type="password" autocomplete="current-password"></label><label class="campo" style="margin-top:8px">Nova senha<input id="tsn" type="password" autocomplete="new-password"></label><p class="erro" id="etroca"></p><div class="acoes" style="margin-top:12px"><button class="btn cheio" type="submit">Trocar</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div></form>`);break;
    case 'sair':armar(b,sairDoAparelho,sujo()&&!navigator.onLine?'Há dados não enviados. Toque de novo para sair mesmo assim':'Toque de novo para sair');break;
    case 'excluir':abrirDlg(`<h3>Excluir conta</h3><p>Digite sua senha para apagar a conta e todos os treinos. Não dá para desfazer.</p><form id="fexcluir"><label class="campo">Senha<input id="xsenha" type="password" autocomplete="current-password"></label><p class="erro" id="eexcluir"></p><div class="acoes" style="margin-top:12px"><button class="btn perigo" type="submit">Excluir para sempre</button><button class="btn" type="button" data-act="fechar">Cancelar</button></div></form>`);break;
    case 'testesom':audio();setTimeout(aviso,50);break;
    case 'exportar':{const blob=new Blob([JSON.stringify(S,null,1)],{type:'application/json'}),u=URL.createObjectURL(blob),l=document.createElement('a');l.href=u;l.download=`treinos-${normNome(S.perfil.nome).replace(/\s+/g,'-')}-${hojeISO()}.json`;document.body.appendChild(l);l.click();setTimeout(()=>{URL.revokeObjectURL(u);l.remove();},1000);break;}
    case 'importar':$('#arquivo').click();break;
  }
});
async function sairDoAparelho(){
  const c=contas[contaId];
  if(c&&sujo()&&navigator.onLine){try{await sincronizar();}catch(e){}}
  if(c&&c.token){try{await Nuvem.sair(c.token);}catch(e){}}
  if(S&&S.sessao)soltar();
  LS.del(kDados(contaId));delete contas[contaId];salvarContas();LS.del(K_ATUAL);
  S=null;contaId=null;aplicaTema();toast('Você saiu deste aparelho.');ir('inicio');atualizarLista();
}
document.addEventListener('submit',async e=>{
  const f=e.target;e.preventDefault();
  if(f.id==='fsenha')return enviarSenha(f);
  if(f.id==='fhenrique')return criarHenrique(f);
  if(f.id==='fob')return obAvancar();
  if(f.id==='fedit')return salvarEdicao();
  if(f.id==='fperg')return perguntar($('#pergunta').value);
  if(f.id==='frenome'){const d=+f.dataset.d,v=$('#inome').value.trim();if(v){S.plano.dias[d].nome=v;save();}fecharDlg();show(atual,true);return;}
  if(f.id==='ftroca'){const c=contas[contaId],er=$('#etroca');if($('#tsn').value.length<3){er.textContent='A nova senha precisa ter pelo menos 3 caracteres.';return;}
    try{const r=await Nuvem.trocarSenha(c.token,$('#tsa').value,$('#tsn').value);if(r&&r.erro){er.textContent=r.erro==='senha_errada'?'A senha atual está errada.':'Não deu para trocar.';return;}fecharDlg();toast('Senha trocada.');}
    catch(err){er.textContent=err.rede?'Sem internet agora.':'Erro: '+err.message;}return;}
  if(f.id==='fexcluir'){const c=contas[contaId],er=$('#eexcluir');
    if(c.pendente){LS.del(kDados(contaId));delete contas[contaId];salvarContas();S=null;contaId=null;fecharDlg();ir('inicio');return;}
    try{const r=await Nuvem.excluir(c.token,$('#xsenha').value);if(r&&r.erro){er.textContent=r.erro==='senha_errada'?'Senha errada.':'Não deu para excluir.';return;}
      listaNuvem=listaNuvem.filter(p=>p.id!==contaId);LS.set(K_LISTA,listaNuvem);LS.del(kDados(contaId));delete contas[contaId];salvarContas();LS.del(K_ATUAL);S=null;contaId=null;soltar();fecharDlg();toast('Conta excluída.');ir('inicio');}
    catch(err){er.textContent=err.rede?'Sem internet agora.':'Erro: '+err.message;}return;}
});
document.addEventListener('input',e=>{
  const i=e.target;
  if(i.id==='busca')return filtraPessoas(i.value);
  if(i.id==='libbusca'){libBusca=i.value;document.querySelectorAll('#libabas button').forEach(x=>x.setAttribute('aria-pressed',!libBusca&&+x.dataset.i===libAba));atualizaLib();return;}
  if(i.dataset.ob&&OB){OB.d[i.dataset.ob]=i.value;return;}
  if(i.dataset.f&&S&&S.sessao){const it=S.sessao.itens[S.sessao.x],s=it&&it.sets[+i.dataset.i];if(s){s[i.dataset.f]=i.value.trim();saveLocal();}}
});
document.addEventListener('change',e=>{
  const i=e.target;
  if(i.dataset.obc&&OB){OB.d[i.dataset.obc]=i.checked;if(i.dataset.obc!=='parado')show(atual==='editar'?'editar':'novo',true);return;}
  if(i.id==='liblocal'){libLocal=i.checked;atualizaLib();return;}
  if(i.id==='selex'){progEx=i.value;show('evolucao',true);return;}
  if(i.dataset.cfg&&S){const k=i.dataset.cfg,v=i.value.trim();
    if(k==='inicio')S.inicio=v||null;
    else if(k==='anim'||k==='carga'||k==='crono')S.cfg[k]=v==='1';
    else if(k==='aviso'){S.cfg.som=v==='ambos'||v==='som';S.cfg.vib=v==='ambos'||v==='vib';}
    else S.cfg[k]=v;
    save();aplicaTema();show(atual,true);}
});
document.addEventListener('keydown',e=>{
  if(e.key==='Enter'&&e.target.dataset&&e.target.dataset.f==='r'&&S&&S.sessao){e.preventDefault();const i=+e.target.dataset.i;if(ativo(S.sessao.x)===i)concluir(i);else e.target.blur();}
});
$('#arquivo').addEventListener('change',e=>{
  const f=e.target.files&&e.target.files[0];if(!f||!S)return;
  const rd=new FileReader();rd.onload=()=>{restaurar(rd.result);e.target.value='';};rd.readAsText(f);
});
$('#dlg').addEventListener('click',e=>{if(e.target===$('#dlg'))fecharDlg();});
$('#bhome').addEventListener('click',()=>ir('inicio'));

/* ================= Início ================= */
(function iniciar(){
  const ultimo=LS.get(K_ATUAL,null);
  if(ultimo&&contas[ultimo]&&(contas[ultimo].token||contas[ultimo].pendente)){
    const d=normal(LS.get(kDados(ultimo),null));if(d){contaId=ultimo;S=d;}
  }
  aplicaTema();
  if(S&&!location.hash)history.replaceState(null,'','#treino');
  const alvo=location.hash.slice(1);
  show(alvo==='editar'&&S?'editar':ABAS.includes(alvo)||alvo==='novo'||alvo==='inicio'?alvo:(S?'treino':'inicio'));
  if(S){setSync(sujo()?'pend':'');puxarNuvem();if(S.sessao)wake();}
  atualizarLista();
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{});
})();
