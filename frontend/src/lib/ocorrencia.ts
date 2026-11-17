// Rótulos e textos das ocorrências usados nas telas públicas (registro e acompanhamento).
import type { CategoriaAnimal, OcorrenciaStatus } from './api';

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
