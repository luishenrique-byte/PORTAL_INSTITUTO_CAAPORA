// Cliente da API do backend (Spring Boot).
// A URL vem de NEXT_PUBLIC_API_URL (definida no build); sem ela, usa a API local.
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'
).replace(/\/$/, '');

export type CategoriaAnimal =
  | 'AVE'
  | 'ANFIBIO'
  | 'MAMIFERO'
  | 'PEIXE'
  | 'REPTIL'
  | 'INDEFINIDO';

export type SaudeStatus =
  | 'FERIDO'
  | 'DOENTE'
  | 'PRESO'
  | 'OBITO'
  | 'ORFAO'
  | 'INDEFINIDO';

export type TipoMidia = 'TEXTO' | 'FOTO' | 'VIDEO' | 'AUDIO';

export interface OcorrenciaPublicaRequest {
  latitude?: number | null;
  longitude?: number | null;
  endereco?: string | null;
  pontoReferencia?: string | null;
  descricao?: string | null;
  origemRegistro: 'APP_PUBLICO';
  reportante: { nome?: string | null; telefone?: string | null; anonimo: boolean };
  animal: {
    especie?: string | null;
    categoriaAnimal: CategoriaAnimal;
    saudeStatus: SaudeStatus;
  };
}

export interface OcorrenciaResponse {
  id: number;
  protocolo: string;
  dataHoraRegistro: string;
}

export interface MidiaResponse {
  id: number;
  url: string;
  tipoMidia: TipoMidia;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

// O backend responde erros como { "erro": "..." } ou { "campo": "mensagem" }
async function lerErro(res: Response): Promise<ApiError> {
  let mensagem = 'Não foi possível concluir. Tente novamente.';
  try {
    const corpo = (await res.json()) as Record<string, string>;
    mensagem = corpo.erro ?? Object.values(corpo)[0] ?? mensagem;
  } catch {
    // corpo vazio ou não-JSON: mantém a mensagem padrão
  }
  return new ApiError(mensagem, res.status);
}

async function requisitar<T>(caminho: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${caminho}`, init);
  } catch {
    throw new ApiError(
      'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      0,
    );
  }
  if (!res.ok) throw await lerErro(res);
  return (await res.json()) as T;
}

export function registrarOcorrenciaPublica(dados: OcorrenciaPublicaRequest) {
  return requisitar<OcorrenciaResponse>('/ocorrencias/publica', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
}

export function enviarMidiaPublica(protocolo: string, arquivo: File) {
  const form = new FormData();
  form.append('arquivo', arquivo);
  return requisitar<MidiaResponse>(
    `/ocorrencias/publica/${encodeURIComponent(protocolo)}/midias`,
    { method: 'POST', body: form },
  );
}

// Mesmos limites do backend (application.yaml / ArmazenamentoArquivoService)
export const MIDIA_MAX_ARQUIVOS = 5;
export const MIDIA_MAX_BYTES = 20 * 1024 * 1024;
export const MIDIA_TIPOS_ACEITOS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'video/mp4',
  'video/quicktime',
  'video/webm',
];
