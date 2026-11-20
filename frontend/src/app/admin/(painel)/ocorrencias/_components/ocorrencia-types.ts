export type CategoriaAnimal =
  | "AVE"
  | "ANFIBIO"
  | "MAMIFERO"
  | "PEIXE"
  | "REPTIL"
  | "INDEFINIDO";

export type SaudeStatus =
  | "FERIDO"
  | "DOENTE"
  | "PRESO"
  | "OBITO"
  | "ORFAO"
  | "INDEFINIDO";

export type GrauUrgencia = "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";

export type OcorrenciaStatus =
  | "REGISTRADA"
  | "TRIAGEM"
  | "ATENDIMENTO"
  | "RESGATE"
  | "CONCLUIDO";

export interface HistoricoItem {
  id: number;
  statusMovimentacao: OcorrenciaStatus;
  dataHora: string;
  responsavelId?: number | null;
  responsavelNome?: string | null;
}

export interface OcorrenciaAdmin {
  id: number;
  protocolo: string;
  dataHoraRegistro: string;
  latitude?: number | null;
  longitude?: number | null;
  endereco?: string | null;
  pontoReferencia?: string | null;
  descricao?: string | null;
  grauUrgencia: GrauUrgencia;
  origemRegistro: "APP_PUBLICO" | "CADASTRO_MANUAL";
  ocorrenciaStatus: OcorrenciaStatus;
  reportante?: {
    id?: number;
    nome?: string | null;
    telefone?: string | null;
    anonimo?: boolean;
  } | null;
  animal?: {
    id?: number;
    especie?: string | null;
    categoriaAnimal: CategoriaAnimal;
    saudeStatus: SaudeStatus;
  } | null;
  equipe?: {
    id: number;
    nome: string;
  } | null;
  midias: {
    id: number;
    url?: string;
    tipoMidia?: string;
  }[];
  historico?: HistoricoItem[];
}

export interface EquipeOption {
  id: number;
  nome: string;
  status: "DISPONIVEL" | "OCUPADO";
}

// Payload exato exigido por POST /ocorrencias/manual (OcorrenciaRequestDTO)
export interface OcorrenciaManualRequest {
  latitude?: number | null;
  longitude?: number | null;
  endereco: string;
  pontoReferencia?: string | null;
  descricao?: string | null;
  grauUrgencia: GrauUrgencia;
  origemRegistro: "CADASTRO_MANUAL";
  reportante?: {
    nome?: string | null;
    telefone?: string | null;
    anonimo: boolean;
  } | null;
  animal: {
    especie: string;
    categoriaAnimal: CategoriaAnimal;
    saudeStatus: SaudeStatus;
  };
}

export const CATEGORIA_LABEL: Record<CategoriaAnimal, string> = {
  AVE: "Ave",
  MAMIFERO: "Mamífero",
  REPTIL: "Réptil",
  ANFIBIO: "Anfíbio",
  PEIXE: "Peixe",
  INDEFINIDO: "Outros",
};

export const SAUDE_LABEL: Record<SaudeStatus, string> = {
  FERIDO: "Ferido",
  DOENTE: "Debilitado / Doente",
  ORFAO: "Órfão",
  PRESO: "Preso / Encurralado",
  OBITO: "Morto",
  INDEFINIDO: "Saudável / Desconhecido",
};

export const URGENCIA_CONFIG: Record<
  GrauUrgencia,
  { label: string; badgeClass: string; borderClass: string; dotClass: string }
> = {
  CRITICA: {
    label: "Crítica",
    badgeClass: "bg-red-100 text-red-800 border-red-300",
    borderClass: "border-l-4 border-l-red-600",
    dotClass: "bg-red-600",
  },
  ALTA: {
    label: "Alta",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-300",
    borderClass: "border-l-4 border-l-orange-500",
    dotClass: "bg-orange-500",
  },
  MEDIA: {
    label: "Média",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    borderClass: "border-l-4 border-l-amber-500",
    dotClass: "bg-amber-500",
  },
  BAIXA: {
    label: "Baixa",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    borderClass: "border-l-4 border-l-emerald-600",
    dotClass: "bg-emerald-600",
  },
};

export const STATUS_ORDEM: OcorrenciaStatus[] = [
  "REGISTRADA",
  "TRIAGEM",
  "ATENDIMENTO",
  "RESGATE",
  "CONCLUIDO",
];

export const STATUS_CONFIG: Record<
  OcorrenciaStatus,
  { label: string; badgeClass: string }
> = {
  REGISTRADA: {
    label: "Registrada",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  TRIAGEM: {
    label: "Em Triagem",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  ATENDIMENTO: {
    label: "Em Atendimento",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  RESGATE: {
    label: "Resgate em Campo",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
  },
  CONCLUIDO: {
    label: "Concluído",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export function extrairLocalizacao(endereco?: string | null): {
  bairro: string;
  municipio: string;
} {
  if (!endereco) return { bairro: "Não informado", municipio: "Não informado" };
  const partes = endereco
    .split(/[-–,]/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (partes.length >= 2) {
    return {
      bairro: partes[partes.length - 2],
      municipio: partes[partes.length - 1],
    };
  }
  return { bairro: "Não informado", municipio: partes[0] || "Não informado" };
}

export function formatarDataHora(iso?: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
