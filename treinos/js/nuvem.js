/* Conexão com o Supabase. A chave publicável é pública por natureza: o banco só aceita as funções treinos_*. */
const Nuvem=(()=>{
  const URL='https://vykxbulskzqohmmoumzr.supabase.co';
  const KEY='sb_publishable_zr1Q-CllZYaCTzK3yGbmOQ_BNhGqEBO';
  async function rpc(fn,args={},ms=15000){
    const ctl=new AbortController(),tm=setTimeout(()=>ctl.abort(),ms);
    try{
      const r=await fetch(`${URL}/rest/v1/rpc/${fn}`,{method:'POST',headers:{apikey:KEY,'Content-Type':'application/json'},body:JSON.stringify(args),signal:ctl.signal,cache:'no-store'});
      const txt=await r.text();let j=null;try{j=txt?JSON.parse(txt):null;}catch(e){}
      if(!r.ok){const e=new Error((j&&(j.message||j.hint))||('HTTP '+r.status));e.http=r.status;e.servidor=true;throw e;}
      return j;
    }catch(e){if(!e.servidor)e.rede=true;throw e;}
    finally{clearTimeout(tm);}
  }
  const limpa=S=>{const c={...S};delete c.sessao;return c;};
  return{
    lista:()=>rpc('treinos_lista'),
    criar:(nome,senha,estado)=>rpc('treinos_criar',{p_nome:nome,p_senha:senha,p_estado:limpa(estado)}),
    entrar:(id,senha)=>rpc('treinos_entrar',{p_id:id,p_senha:senha}),
    carregar:token=>rpc('treinos_carregar',{p_token:token}),
    salvar:(token,estado,base)=>rpc('treinos_salvar',{p_token:token,p_estado:limpa(estado),p_base:base==null?null:base},20000),
    sair:token=>rpc('treinos_sair',{p_token:token}),
    trocarSenha:(token,atual,nova)=>rpc('treinos_trocar_senha',{p_token:token,p_atual:atual,p_nova:nova}),
    excluir:(token,senha)=>rpc('treinos_excluir',{p_token:token,p_senha:senha})
  };
})();
