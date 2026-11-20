import { API_URL, ApiError } from '@/lib/api';
import { coordenadaValida, type PontoMapa } from './pontos';

// GET /dashboard/mapa-calor?dias=N (ATENDENTE e COORDENADOR)
export async function buscarPontosMapa(dias: number, token: string, signal?: AbortSignal): Promise<PontoMapa[]> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/dashboard/mapa-calor?dias=${dias}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet e tente novamente.', 0);
  }

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar o mapa de calor. Tente novamente.';
    try {
      const corpo = (await res.json()) as Record<string, string>;
      mensagem = corpo.erro ?? Object.values(corpo)[0] ?? mensagem;
    } catch {
      // corpo vazio: mantém a mensagem padrão
    }
    throw new ApiError(mensagem, res.status);
  }
  const corpo: unknown = await res.json();
  const pontos = Array.isArray(corpo) ? (corpo as PontoMapa[]) : [];
  return pontos.filter(coordenadaValida);
}
