/* Conexão com o Supabase. A chave publicável é pública por natureza: o banco só aceita as funções leitucast_*,
   que conferem a senha (bcrypt) e o token de cada pessoa. As tabelas ficam fechadas. */
'use strict';
const Nuvem = (() => {
  const URL_SUPA = 'https://vgmopnsjjeggynhhqqtg.supabase.co';
  const KEY = 'sb_publishable_j6UJ7L1kk6bceCe48PCkAg_DHKaBFIB';
  async function rpc(fn, args = {}, ms = 15000) {
    const ctl = new AbortController();
    const tm = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(`${URL_SUPA}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers: { apikey: KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(args), signal: ctl.signal, cache: 'no-store',
      });
      const txt = await r.text();
      let j = null;
      try { j = txt ? JSON.parse(txt) : null; } catch (e) { /* resposta sem JSON */ }
      if (!r.ok) {
        const e = new Error((j && (j.message || j.hint)) || ('HTTP ' + r.status));
        e.http = r.status; e.servidor = true;
        if (r.status === 404 || (j && /function .* does not exist|Could not find the function/i.test(j.message || ''))) e.semFuncoes = true;
        throw e;
      }
      return j;
    } catch (e) {
      if (!e.servidor) e.rede = true;
      throw e;
    } finally { clearTimeout(tm); }
  }
  const limpa = (S) => { const c = { ...S }; delete c.sessao; return c; };
  return {
    lista: () => rpc('leitucast_lista'),
    criar: (nome, senha, estado) => rpc('leitucast_criar', { p_nome: nome, p_senha: senha, p_estado: limpa(estado) }),
    entrar: (id, senha) => rpc('leitucast_entrar', { p_id: id, p_senha: senha }),
    carregar: (token) => rpc('leitucast_carregar', { p_token: token }),
    salvar: (token, estado, base) => rpc('leitucast_salvar', { p_token: token, p_estado: limpa(estado), p_base: base == null ? null : base }, 20000),
    sair: (token) => rpc('leitucast_sair', { p_token: token }),
    trocarSenha: (token, atual, nova) => rpc('leitucast_trocar_senha', { p_token: token, p_atual: atual, p_nova: nova }),
    excluir: (token, senha) => rpc('leitucast_excluir', { p_token: token, p_senha: senha }),
  };
})();
