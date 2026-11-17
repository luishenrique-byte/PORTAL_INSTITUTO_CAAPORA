// Sessão da equipe do instituto (painel administrativo).
// O backend devolve um JWT sem estado; guardamos o token e quando ele expira
// no localStorage do navegador. O token vai no header Authorization das chamadas.

const CHAVE = 'caapora.sessao';

interface Sessao {
  token: string;
  expiraEm: number; // timestamp em ms
}

export function salvarSessao(token: string, expiresInMs: number) {
  const sessao: Sessao = { token, expiraEm: Date.now() + expiresInMs };
  try {
    localStorage.setItem(CHAVE, JSON.stringify(sessao));
  } catch {
    // navegação privada ou armazenamento bloqueado: a sessão dura só esta página
  }
}

// Devolve o token se ainda for válido; sessão vencida é apagada.
export function obterToken(): string | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const sessao = JSON.parse(bruto) as Sessao;
    if (!sessao.token || Date.now() >= sessao.expiraEm) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return sessao.token;
  } catch {
    return null;
  }
}

export function encerrarSessao() {
  try {
    localStorage.removeItem(CHAVE);
  } catch {
    // nada a fazer
  }
}
