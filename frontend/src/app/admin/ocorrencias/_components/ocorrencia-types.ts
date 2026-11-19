export type CategoriaAnimal = "AVE" | "MAMIFERO" | "REPTIL" | "ANFIBIO" | "OUTROS";

export type CondicaoAnimal =
  | "FERIDO"
  | "DEBILITADO"
  | "ORFAO"
  | "SAUDAVEL"
  | "MORTO"
  | "DESCONHECIDO";

export type GrauUrgencia = "CRITICA" | "ALTA" | "MEDIA" | "BAIXA";

export type OcorrenciaStatus =
  | "ABERTA"
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "RESGATADO"
  | "CONCLUIDA"
  | "CANCELADA";

export interface HistoricoItem {
  id?: number;
  descricao?: string;
  observacao?: string;
  status?: string;
  dataHora?: string;
  responsavel?: string;
}

export interface OcorrenciaAdmin {
  id: number;
  protocolo: string;
  animal: {
    nomePopular: string;
    especie?: string;
    categoria: CategoriaAnimal;
    condicao: CondicaoAnimal;
  };
  localizacao: {
    enderecoReferencia: string;
    bairro: string;
    municipio: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  urgencia: GrauUrgencia;
  status: OcorrenciaStatus;
  equipeResponsavel?: {
    id: number;
    nome: string;
  } | null;
  comunicante?: {
    nome?: string;
    telefone?: string;
  } | null;
  quantidadeMidias: number;
  dataAbertura: string;
  dataAtualizacao?: string;
  historico?: HistoricoItem[];
}

export interface NovaOcorrenciaPayload {
  nomeAnimal: string;
  categoriaAnimal: CategoriaAnimal;
  condicaoAnimal: CondicaoAnimal;
  enderecoReferencia: string;
  bairro?: string;
  municipio: string;
  urgencia: GrauUrgencia;
  nomeComunicante?: string;
  telefoneComunicante?: string;
}

export const CATEGORIA_LABEL: Record<CategoriaAnimal, string> = {
  AVE: "Ave",
  MAMIFERO: "Mamífero",
  REPTIL: "Réptil",
  ANFIBIO: "Anfíbio",
  OUTROS: "Outros",
};

export const CONDICAO_LABEL: Record<CondicaoAnimal, string> = {
  FERIDO: "Ferido",
  DEBILITADO: "Debilitado",
  ORFAO: "Órfão",
  SAUDAVEL: "Saudável",
  MORTO: "Morto",
  DESCONHECIDO: "Desconhecido",
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

export const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  ABERTA: {
    label: "Aberta",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PENDENTE: {
    label: "Pendente",
    badgeClass: "bg-slate-100 text-slate-800 border-slate-300",
  },
  EM_ANDAMENTO: {
    label: "Em Atendimento",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  RESGATADO: {
    label: "Resgatado",
    badgeClass: "bg-teal-100 text-teal-800 border-teal-200",
  },
  CONCLUIDA: {
    label: "Concluída",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CANCELADA: {
    label: "Cancelada",
    badgeClass: "bg-zinc-200 text-zinc-700 border-zinc-300",
  },
};

export function formatarDataHora(iso?: string): string {
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