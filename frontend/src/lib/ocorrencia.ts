// Rótulos e textos das ocorrências (telas públicas e painel administrativo).
import type { CategoriaAnimal, OcorrenciaStatus, SaudeStatus } from './api';
import type { GrauUrgencia, OrigemRegistro } from './painel';

export const CATEGORIAS: { valor: CategoriaAnimal; rotulo: string; icone: string }[] = [
  { valor: 'AVE', rotulo: 'Ave', icone: '🐦' },
  { valor: 'REPTIL', rotulo: 'Réptil', icone: '🦎' },
  { valor: 'MAMIFERO', rotulo: 'Mamífero', icone: '🐿️' },
  { valor: 'ANFIBIO', rotulo: 'Anfíbio', icone: '🐸' },
  { valor: 'PEIXE', rotulo: 'Peixe', icone: '🐟' },
  { valor: 'INDEFINIDO', rotulo: 'Não sei', icone: '❓' },
];

export const rotuloCategoria = (c: CategoriaAnimal | null) =>
  c === null || c === 'INDEFINIDO' ? 'Não identificado' : (CATEGORIAS.find((x) => x.valor === c)?.rotulo ?? c);

// Ordem do fluxo de atendimento (igual ao enum OcorrenciaStatus do backend)
export const ETAPAS_OCORRENCIA: { status: OcorrenciaStatus; rotulo: string; descricao: string }[] = [
  { status: 'REGISTRADA', rotulo: 'Registrada', descricao: 'Protocolo gerado automaticamente.' },
  { status: 'TRIAGEM', rotulo: 'Em triagem', descricao: 'Caso em análise pela central de atendimento.' },
  { status: 'ATENDIMENTO', rotulo: 'Em atendimento', descricao: 'Equipe acionada para o atendimento.' },
  { status: 'RESGATE', rotulo: 'Resgate em campo', descricao: 'Equipe no local realizando o resgate.' },
  { status: 'CONCLUIDO', rotulo: 'Concluído', descricao: 'Atendimento finalizado.' },
];

export const rotuloStatus = (s: OcorrenciaStatus) => ETAPAS_OCORRENCIA.find((e) => e.status === s)?.rotulo ?? s;

// Protocolo no formato CAA-AAMMDD-NNNNN (GeradorProtocolo do backend)
export const PROTOCOLO_REGEX = /^CAA-\d{6}-\d{5}$/;

// Formata enquanto digita: "26092217852" ou "caa26092217852" -> "CAA-260922-17852"
export function mascaraProtocolo(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (!d) return valor.trim().toUpperCase().startsWith('C') ? 'CAA-' : '';
  if (d.length <= 6) return `CAA-${d}`;
  return `CAA-${d.slice(0, 6)}-${d.slice(6)}`;
}

const fmtHora = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' });
const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' }); // "set."
const diaMes = (d: Date) => `${d.getDate()} ${fmtMes.format(d)}`; // "23 set."

// O backend manda LocalDateTime sem fuso (horário de Brasília); tratamos como horário local.
const data = (iso: string) => new Date(iso);

function mesmoDia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// "Hoje · 09:14", "Ontem · 18:02", "23 set. · 09:14"
export function dataRelativa(iso: string, agora = new Date()) {
  const d = data(iso);
  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);
  const dia = mesmoDia(d, agora) ? 'Hoje' : mesmoDia(d, ontem) ? 'Ontem' : diaMes(d);
  return `${dia} · ${fmtHora.format(d)}`;
}

// "23 set. 2025 · 09:14"
export function dataCompleta(iso: string) {
  const d = data(iso);
  return `${diaMes(d)} ${d.getFullYear()} · ${fmtHora.format(d)}`;
}

// ---------- Painel administrativo ----------

export const SAUDE: { valor: SaudeStatus; rotulo: string }[] = [
  { valor: 'FERIDO', rotulo: 'Ferido' },
  { valor: 'DOENTE', rotulo: 'Doente / debilitado' },
  { valor: 'PRESO', rotulo: 'Preso / enroscado' },
  { valor: 'ORFAO', rotulo: 'Filhote órfão' },
  { valor: 'OBITO', rotulo: 'Sem vida' },
  { valor: 'INDEFINIDO', rotulo: 'Não avaliado' },
];

export const rotuloSaude = (s: SaudeStatus | null | undefined) =>
  SAUDE.find((x) => x.valor === s)?.rotulo ?? 'Não avaliado';

// Do menos para o mais urgente (mesma ordem do enum GrauUrgencia)
export const URGENCIAS: { valor: GrauUrgencia; rotulo: string }[] = [
  { valor: 'BAIXA', rotulo: 'Baixa' },
  { valor: 'MEDIA', rotulo: 'Média' },
  { valor: 'ALTA', rotulo: 'Alta' },
  { valor: 'CRITICA', rotulo: 'Crítica' },
];

export const rotuloUrgencia = (u: GrauUrgencia | null | undefined) =>
  URGENCIAS.find((x) => x.valor === u)?.rotulo ?? 'Sem urgência';

export const rotuloOrigem = (o: OrigemRegistro) => (o === 'APP_PUBLICO' ? 'Portal público' : 'Cadastro manual');

export const PERFIS: Record<string, string> = {
  COORDENADOR: 'Coordenação',
  ATENDENTE: 'Atendimento',
  EQUIPE_CAMPO: 'Equipe de campo',
};

export const rotuloPerfil = (p: string | null | undefined) => (p ? (PERFIS[p.toUpperCase()] ?? p) : '—');

// "2026-10" -> "out. 26"
export function rotuloMes(anoMes: string) {
  const [ano, mes] = anoMes.split('-').map(Number);
  if (!ano || !mes) return anoMes;
  return `${fmtMes.format(new Date(ano, mes - 1, 1))} ${String(ano).slice(2)}`;
}

// 95 -> "1 h 35 min"; 2900 -> "2 d 0 h"
export function duracao(minutos: number | null | undefined) {
  if (minutos === null || minutos === undefined) return '—';
  const m = Math.round(minutos);
  if (m < 60) return `${m} min`;
  if (m < 60 * 24) return `${Math.floor(m / 60)} h ${m % 60} min`;
  return `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h`;
}

// <input type="date"> -> LocalDateTime aceito pelo backend
export const inicioDoDia = (data: string) => (data ? `${data}T00:00:00` : null);
export const fimDoDia = (data: string) => (data ? `${data}T23:59:59` : null);
