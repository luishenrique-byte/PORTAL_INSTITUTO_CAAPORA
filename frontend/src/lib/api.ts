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

export type OcorrenciaStatus = 'REGISTRADA' | 'TRIAGEM' | 'ATENDIMENTO' | 'RESGATE' | 'CONCLUIDO' | 'CANCELADO';

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
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') throw e;
    throw new ApiError(
      'Sem conexão com o servidor. Verifique sua internet e tente novamente.',
      0,
    );
  }
  if (!res.ok) throw await lerErro(res);
  return (await res.json()) as T;
}

// Visão pública da ocorrência (GET /ocorrencias/rastreio/{protocolo}).
// Datas sem fuso (LocalDateTime do backend), ex.: "2026-09-22T09:14:00".
export interface RastreioOcorrencia {
  protocolo: string;
  dataHoraRegistro: string;
  ocorrenciaStatus: OcorrenciaStatus;
  categoriaAnimal: CategoriaAnimal | null;
  especie: string | null;
  local: string | null; // endereço sem números
  localPorGps: boolean;
  equipe: string | null;
  linhaDoTempo: { status: OcorrenciaStatus; dataHora: string }[];
}

export function rastrearOcorrencia(protocolo: string, signal?: AbortSignal) {
  return requisitar<RastreioOcorrencia>(`/ocorrencias/rastreio/${encodeURIComponent(protocolo)}`, {
    cache: 'no-store',
    signal,
  });
}

// POST /ocorrencias/publica (multipart): os dados vão na parte "dados" (JSON) e as
// fotos/vídeos em "arquivos". O backend exige pelo menos uma foto e grava tudo junto.
export function registrarOcorrenciaPublica(dados: OcorrenciaPublicaRequest, arquivos: File[]) {
  const form = new FormData();
  form.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
  for (const arquivo of arquivos) form.append('arquivos', arquivo);
  return requisitar<OcorrenciaResponse>('/ocorrencias/publica', { method: 'POST', body: form });
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

// ---------- Painel administrativo ----------

// POST /auth/login. expiresIn vem em milissegundos (spring.jwt.expiration).
export interface TokenResponse {
  token: string;
  expiresIn: number;
}

export async function entrar(email: string, senha: string) {
  try {
    return await requisitar<TokenResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha }),
    });
  } catch (e) {
    // Credenciais erradas: o Spring Security responde 401 sem corpo
    if (e instanceof ApiError && e.status === 401) {
      throw new ApiError('E-mail ou senha incorretos.', 401);
    }
    throw e;
  }
}

// ---------- Equipes de campo (painel) ----------

export type EquipeStatus = 'DISPONIVEL' | 'OCUPADO';

// GET /equipes/resumo: um item por card da tela "Equipes de Campo"
export interface EquipeResumo {
  id: number;
  nome: string;
  regiao: string | null;
  telefone: string | null;
  status: EquipeStatus;
  membros: number;
  emCampo: number; // ocorrências em andamento
  concluidos: number;
}

// Ocorrência como o painel interno recebe (OcorrenciaResponseDTO), só com o que a tela usa
export interface OcorrenciaInterna {
  id: number;
  protocolo: string;
  dataHoraRegistro: string;
  endereco: string | null;
  pontoReferencia: string | null;
  ocorrenciaStatus: OcorrenciaStatus;
  animal: { especie: string | null; categoriaAnimal: CategoriaAnimal; saudeStatus?: SaudeStatus | null } | null;
  latitude?: number | null;
  longitude?: number | null;
  descricao?: string | null;
  grauUrgencia?: 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAIXA' | null;
}

// GET /equipes/{id}/detalhe: modal da equipe
export interface EquipeDetalhe {
  id: number;
  nome: string;
  regiao: string | null;
  telefone: string | null;
  status: EquipeStatus;
  membros: { id: number; nome: string; email?: string; perfil?: { id: number; perfil: string } | null }[];
  resgatesEmAndamento: OcorrenciaInterna[];
  historicoRecente: OcorrenciaInterna[]; // os últimos concluídos
  totalConcluidos: number;
}

export interface NovaEquipeRequest {
  nome: string;
  regiao?: string | null;
  telefone?: string | null;
}

// As rotas do painel exigem o token do login no header Authorization
const comToken = (token: string) => ({ Authorization: `Bearer ${token}` });

export function listarEquipesResumo(token: string, signal?: AbortSignal) {
  return requisitar<EquipeResumo[]>('/equipes/resumo', {
    headers: comToken(token),
    cache: 'no-store',
    signal,
  });
}

export function detalharEquipe(id: number, token: string, signal?: AbortSignal) {
  return requisitar<EquipeDetalhe>(`/equipes/${id}/detalhe`, {
    headers: comToken(token),
    cache: 'no-store',
    signal,
  });
}

// ---------- Usuário logado, perfis e funcionários (painel) ----------

export type PerfilAcesso = 'COORDENADOR' | 'ATENDENTE' | 'EQUIPE_CAMPO';

// GET /auth/me
export interface UsuarioLogado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilAcesso | string;
  equipeId: number | null;
  nomeEquipe: string | null;
}

export function obterUsuarioLogado(token: string, signal?: AbortSignal) {
  return requisitar<UsuarioLogado>('/auth/me', { headers: comToken(token), cache: 'no-store', signal });
}

export interface Perfil {
  id: number;
  perfil: string;
}

// GET /perfis (só COORDENADOR)
export function listarPerfis(token: string, signal?: AbortSignal) {
  return requisitar<Perfil[]>('/perfis', { headers: comToken(token), cache: 'no-store', signal });
}

export interface Funcionario {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil | null;
  equipe: { id: number; nome: string } | null;
  ativo: boolean;
}

export interface NovoFuncionarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfilId: number;
  equipeId: number | null;
}

// GET /funcionarios: só os ativos (só COORDENADOR)
export function listarFuncionarios(token: string, signal?: AbortSignal) {
  return requisitar<Funcionario[]>('/funcionarios', { headers: comToken(token), cache: 'no-store', signal });
}

export function criarFuncionario(dados: NovoFuncionarioRequest, token: string) {
  return requisitar<Funcionario>('/funcionarios', {
    method: 'POST',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
}

// PATCH /funcionarios/{id}/equipe: coloca na equipe ou, com equipeId nulo, tira de qualquer equipe
export function definirEquipeDoFuncionario(funcionarioId: number, equipeId: number | null, token: string) {
  const query = equipeId === null ? '' : `?equipeId=${equipeId}`;
  return requisitar<Funcionario>(`/funcionarios/${funcionarioId}/equipe${query}`, {
    method: 'PATCH',
    headers: comToken(token),
  });
}

// ---------- Ocorrências (painel) ----------

// GET /ocorrencias: fila em aberto (sem concluídas e canceladas)
export function listarOcorrenciasEmAberto(token: string, signal?: AbortSignal) {
  return requisitar<(OcorrenciaInterna & { equipe: { id: number; nome: string } | null })[]>('/ocorrencias', {
    headers: comToken(token),
    cache: 'no-store',
    signal,
  });
}

// PATCH /ocorrencias/{id}/equipe: a mesma equipe pode ficar com várias ocorrências
export function vincularEquipe(ocorrenciaId: number, equipeId: number, funcionarioId: number, token: string) {
  return requisitar<OcorrenciaInterna>(
    `/ocorrencias/${ocorrenciaId}/equipe?equipeId=${equipeId}&funcionarioId=${funcionarioId}`,
    { method: 'PATCH', headers: comToken(token) },
  );
}

// PATCH /ocorrencias/{id}/status: a linha do tempo só anda para frente
export function avancarStatus(ocorrenciaId: number, status: OcorrenciaStatus, responsavelId: number, token: string) {
  return requisitar<OcorrenciaInterna>(`/ocorrencias/${ocorrenciaId}/status`, {
    method: 'PATCH',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, responsavelId }),
  });
}

// Só o COORDENADOR pode criar (o backend responde 403 para os outros perfis)
export function criarEquipe(dados: NovaEquipeRequest, token: string) {
  return requisitar<EquipeResumo>('/equipes', {
    method: 'POST',
    headers: { ...comToken(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(dados),
  });
}
