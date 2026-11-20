import { API_URL, ApiError, type CategoriaAnimal } from '@/lib/api';
import type { Periodo } from './indicadores';

export type GrauUrgencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Campos do OcorrenciaResponseDTO que o Dashboard usa
export interface OcorrenciaDashboard {
  id: number;
  dataHoraRegistro: string; // LocalDateTime sem fuso, ex.: "2026-10-05T14:30:00"
  grauUrgencia: GrauUrgencia;
  ocorrenciaStatus: string;
  animal: { categoriaAnimal: CategoriaAnimal | null } | null;
}

// GET /ocorrencias/filtro?inicio=...&fim=...
// Todos os indicadores saem desta mesma lista, então cards e gráficos usam os mesmos registros.
export async function buscarOcorrenciasDoPeriodo(periodo: Periodo, token: string, signal?: AbortSignal) {
  const params = new URLSearchParams({
    inicio: `${periodo.inicio}T00:00:00`,
    fim: `${periodo.fim}T23:59:59`,
  });

  let res: Response;
  try {
    res = await fetch(`${API_URL}/ocorrencias/filtro?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError('Sem conexão com o servidor. Verifique sua internet e tente novamente.', 0);
  }

  if (!res.ok) {
    let mensagem = 'Não foi possível carregar os indicadores. Tente novamente.';
    try {
      const corpo = (await res.json()) as Record<string, string>;
      mensagem = corpo.erro ?? Object.values(corpo)[0] ?? mensagem;
    } catch {
      // corpo vazio: mantém a mensagem padrão
    }
    throw new ApiError(mensagem, res.status);
  }
  return (await res.json()) as OcorrenciaDashboard[];
}
