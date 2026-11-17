// Chamadas do painel administrativo. Todas levam o JWT no header Authorization.
// Os tipos espelham os DTOs de resposta do backend (pacote dto/response).
import {
  API_URL,
  ApiError,
  requisitar,
  type CategoriaAnimal,
  type OcorrenciaStatus,
  type SaudeStatus,
  type TipoMidia,
} from './api';
import { encerrarSessao, obterToken } from './sessao';

export type GrauUrgencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type OrigemRegistro = 'APP_PUBLICO' | 'CADASTRO_MANUAL';
export type EquipeStatus = 'OCUPADO' | 'DISPONIVEL';
export type Perfil = 'COORDENADOR' | 'ATENDENTE' | 'EQUIPE_CAMPO';

export interface PerfilDTO {
  id: number;
  perfil: string;
}

export interface Equipe {
  id: number;
  nome: string;
  status: EquipeStatus;
}

export interface Funcionario {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilDTO | null;
  equipe: Equipe | null;
  ativo: boolean;
}

export interface Midia {
  id: number;
  url: string;
  tipoMidia: TipoMidia;
}

export interface Ocorrencia {
  id: number;
  protocolo: string;
  dataHoraRegistro: string;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  pontoReferencia: string | null;
  descricao: string | null;
  grauUrgencia: GrauUrgencia | null;
  origemRegistro: OrigemRegistro;
  ocorrenciaStatus: OcorrenciaStatus;
  reportante: { id: number; nome: string | null; telefone: string | null; anonimo: boolean } | null;
  animal: { id: number; especie: string | null; categoriaAnimal: CategoriaAnimal; saudeStatus: SaudeStatus } | null;
  equipe: Equipe | null;
  midias: Midia[];
}

export interface HistoricoStatus {
  id: number;
  statusMovimentacao: OcorrenciaStatus;
  dataHora: string;
  responsavelId: number | null;
  responsavelNome: string | null;
}

export interface HistoricoUrgencia {
  id: number;
  urgenciaAnterior: GrauUrgencia | null;
  urgenciaNova: GrauUrgencia;
  dataHora: string;
  responsavelId: number | null;
  responsavelNome: string | null;
}

export interface EquipeDetalhe extends Equipe {
  membros: Funcionario[];
  resgatesEmAndamento: Ocorrencia[];
  historicoRecente: Ocorrencia[];
}

export interface Contagem {
  rotulo: string;
  quantidade: number;
}

export interface Resumo {
  totalOcorrencias: number;
  emAberto: number;
  urgenciasCriticas: number;
  concluidas: number;
  taxaConclusao: number;
}

export interface PontoMapa {
  latitude: number;
  longitude: number;
  grauUrgencia: GrauUrgencia | null;
}

export interface Relatorio {
  inicio: string | null;
  fim: string | null;
  totalOcorrencias: number;
  concluidas: number;
  taxaConclusao: number;
  tempoMedioRespostaMinutos: number | null;
  tempoMedioConclusaoMinutos: number | null;
  porStatus: Contagem[];
  porGrauUrgencia: Contagem[];
  porCategoriaAnimal: Contagem[];
  porEquipe: Contagem[];
}

// Corpo de POST /ocorrencias/manual (OcorrenciaRequestDTO)
export interface OcorrenciaManualRequest {
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  pontoReferencia: string | null;
  descricao: string | null;
  grauUrgencia: GrauUrgencia;
  origemRegistro: 'CADASTRO_MANUAL';
  reportante: { nome: string | null; telefone: string | null; anonimo: boolean };
  animal: { especie: string | null; categoriaAnimal: CategoriaAnimal; saudeStatus: SaudeStatus };
}

export interface FuncionarioRequest {
  nome: string;
  email: string;
  senha: string;
  perfilId: number;
  equipeId: number | null;
}

// ---------- Requisição autenticada ----------

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = obterToken();
  if (!token) {
    sessaoExpirada();
    throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
  try {
    return await requisitar<T>(caminho, { cache: 'no-store', ...init, headers });
  } catch (e) {
    // Token vencido ou inválido: o backend responde 401 sem corpo
    if (e instanceof ApiError && e.status === 401) {
      sessaoExpirada();
      throw new ApiError('Sua sessão expirou. Entre novamente.', 401);
    }
    throw e;
  }
}

function sessaoExpirada() {
  encerrarSessao();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/admin/login')) {
    window.location.replace('/admin/login?sessao=expirada');
  }
}

const json = (corpo: unknown) => JSON.stringify(corpo);

function query(params: Record<string, string | number | null | undefined>) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') q.set(k, String(v));
  }
  const s = q.toString();
  return s ? `?${s}` : '';
}

// Mídias ficam em /uploads/... na própria API; urls externas passam direto
export const urlMidia = (url: string) => (url.startsWith('/') ? `${API_URL}${url}` : url);

// ---------- Sessão ----------

export const usuarioLogado = (signal?: AbortSignal) => chamar<Funcionario>('/auth/me', { signal });

// ---------- Dashboard ----------

export const dashboard = {
  resumo: (signal?: AbortSignal) => chamar<Resumo>('/dashboard/resumo', { signal }),
  porStatus: (signal?: AbortSignal) => chamar<Contagem[]>('/dashboard/por-status', { signal }),
  porCategoria: (signal?: AbortSignal) => chamar<Contagem[]>('/dashboard/por-categoria', { signal }),
  porMes: (meses: number, signal?: AbortSignal) =>
    chamar<Contagem[]>(`/dashboard/por-mes${query({ meses })}`, { signal }),
  mapaCalor: (dias: number, signal?: AbortSignal) =>
    chamar<PontoMapa[]>(`/dashboard/mapa-calor${query({ dias })}`, { signal }),
};

// ---------- Ocorrências ----------

export interface FiltroOcorrencias {
  status?: OcorrenciaStatus | null;
  urgencia?: GrauUrgencia | null;
  equipeId?: number | null;
  inicio?: string | null; // LocalDateTime, ex.: 2026-10-01T00:00:00
  fim?: string | null;
}

export const ocorrencias = {
  ativas: (signal?: AbortSignal) => chamar<Ocorrencia[]>('/ocorrencias', { signal }),
  filtrar: (f: FiltroOcorrencias, signal?: AbortSignal) =>
    chamar<Ocorrencia[]>(`/ocorrencias/filtro${query({ ...f })}`, { signal }),
  buscar: (id: number, signal?: AbortSignal) => chamar<Ocorrencia>(`/ocorrencias/${id}`, { signal }),
  historico: (id: number, signal?: AbortSignal) =>
    chamar<HistoricoStatus[]>(`/ocorrencias/${id}/historico`, { signal }),
  historicoUrgencia: (id: number, signal?: AbortSignal) =>
    chamar<HistoricoUrgencia[]>(`/ocorrencias/${id}/historico-urgencia`, { signal }),
  registrarManual: (dados: OcorrenciaManualRequest, funcionarioId: number) =>
    chamar<Ocorrencia>(`/ocorrencias/manual${query({ funcionarioId })}`, { method: 'POST', body: json(dados) }),
  atualizarStatus: (id: number, status: OcorrenciaStatus, responsavelId: number) =>
    chamar<Ocorrencia>(`/ocorrencias/${id}/status`, {
      method: 'PATCH',
      body: json({ status, responsavelId }),
    }),
  alterarUrgencia: (id: number, urgencia: GrauUrgencia, funcionarioId: number) =>
    chamar<Ocorrencia>(`/ocorrencias/${id}/urgencia${query({ urgencia, funcionarioId })}`, { method: 'PATCH' }),
  atribuirEquipe: (id: number, equipeId: number, funcionarioId: number) =>
    chamar<Ocorrencia>(`/ocorrencias/${id}/equipe${query({ equipeId, funcionarioId })}`, { method: 'PATCH' }),
};

// ---------- Equipes ----------

export const equipes = {
  listar: (signal?: AbortSignal) => chamar<Equipe[]>('/equipes', { signal }),
  disponiveis: (signal?: AbortSignal) => chamar<Equipe[]>('/equipes/disponiveis', { signal }),
  detalhar: (id: number, signal?: AbortSignal) => chamar<EquipeDetalhe>(`/equipes/${id}/detalhe`, { signal }),
  criar: (nome: string) => chamar<Equipe>('/equipes', { method: 'POST', body: json({ nome }) }),
  renomear: (id: number, nome: string) => chamar<Equipe>(`/equipes/${id}`, { method: 'PUT', body: json({ nome }) }),
};

// ---------- Funcionários e perfis (só coordenador) ----------

export const funcionarios = {
  listar: (signal?: AbortSignal) => chamar<Funcionario[]>('/funcionarios', { signal }),
  criar: (dados: FuncionarioRequest) => chamar<Funcionario>('/funcionarios', { method: 'POST', body: json(dados) }),
  atualizar: (id: number, dados: FuncionarioRequest) =>
    chamar<Funcionario>(`/funcionarios/${id}`, { method: 'PUT', body: json(dados) }),
  desativar: (id: number) => chamar<void>(`/funcionarios/${id}`, { method: 'DELETE' }),
};

export const perfis = {
  listar: (signal?: AbortSignal) => chamar<PerfilDTO[]>('/perfis', { signal }),
};

// ---------- Relatórios ----------

export const relatorios = {
  gerar: (f: { inicio?: string | null; fim?: string | null; equipeId?: number | null }, signal?: AbortSignal) =>
    chamar<Relatorio>(`/relatorios${query({ ...f })}`, { signal }),
};
