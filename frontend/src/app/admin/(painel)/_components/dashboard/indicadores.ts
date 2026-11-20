import type { OcorrenciaDashboard } from './api';

// Datas no formato "AAAA-MM-DD" (mesmo formato do <input type="date">)
export interface Periodo {
  inicio: string;
  fim: string;
}

export const PERIODO_PADRAO_DIAS = 90;

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const paraIso = (d: Date) => `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;

export const hojeIso = () => paraIso(new Date());

// Últimos N dias contando hoje
export function ultimosDias(dias: number): Periodo {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - (dias - 1));
  return { inicio: paraIso(inicio), fim: hojeIso() };
}

// "2026-08-22" -> "22/08/2026"
export const dataBr = (iso: string) => iso.split('-').reverse().join('/');

export const fmtNumero = new Intl.NumberFormat('pt-BR');
export const fmtPorcentagem = (valor: number) =>
  `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}%`;

// Percentual com uma casa decimal
export const porcentagem = (parte: number, total: number) => (total === 0 ? 0 : Math.round((parte * 1000) / total) / 10);

// "2026-10" -> "out/26"
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const rotuloMes = (chave: string) => `${MESES[Number(chave.slice(5, 7)) - 1]}/${chave.slice(2, 4)}`;

// Todos os meses de "inicio" até "fim", inclusive os que não tiveram ocorrência
function mesesDoPeriodo({ inicio, fim }: Periodo) {
  const chaves: string[] = [];
  let ano = Number(inicio.slice(0, 4));
  let mes = Number(inicio.slice(5, 7));
  const ultima = fim.slice(0, 7);
  for (;;) {
    const chave = `${ano}-${doisDigitos(mes)}`;
    chaves.push(chave);
    if (chave >= ultima) break;
    mes = mes === 12 ? 1 : mes + 1;
    if (mes === 1) ano++;
  }
  return chaves;
}

export const STATUS_CONCLUIDO = 'CONCLUIDO';

// Ordem do fluxo de atendimento. RECUSADA ainda não existe no enum OcorrenciaStatus do backend,
// então fica com 0 até o backend passar a devolver esse status.
export const STATUS_DASHBOARD = [
  { status: 'REGISTRADA', rotulo: 'Registrada' },
  { status: 'TRIAGEM', rotulo: 'Em triagem' },
  { status: 'ATENDIMENTO', rotulo: 'Em atendimento' },
  { status: 'RESGATE', rotulo: 'Resgate em campo' },
  { status: 'CONCLUIDO', rotulo: 'Concluída' },
  { status: 'RECUSADA', rotulo: 'Recusada' },
];

// Status que encerram a ocorrência
const ENCERRADOS = new Set([STATUS_CONCLUIDO, 'RECUSADA']);

// Cores conferidas para daltonismo (verde, mostarda, azul, laranja, roxo)
export const GRUPOS_ANIMAIS = [
  { chave: 'aves', rotulo: 'Aves', cor: '#2d6a2f', categorias: ['AVE'] },
  { chave: 'mamiferos', rotulo: 'Mamíferos', cor: '#d4a017', categorias: ['MAMIFERO'] },
  { chave: 'repteis', rotulo: 'Répteis', cor: '#3b6ea5', categorias: ['REPTIL'] },
  { chave: 'anfibios', rotulo: 'Anfíbios', cor: '#c8501a', categorias: ['ANFIBIO'] },
  { chave: 'outros', rotulo: 'Outros', cor: '#8a5a9e', categorias: [] as string[] }, // peixe, não identificado
];

export interface PontoMensal {
  chave: string;
  mes: string;
  registradas: number;
  concluidas: number;
}

export type Indicadores = ReturnType<typeof consolidar>;

// Calcula todos os indicadores a partir da mesma lista de ocorrências do período
export function consolidar(ocorrencias: OcorrenciaDashboard[], periodo: Periodo) {
  const total = ocorrencias.length;
  const concluidas = ocorrencias.filter((o) => o.ocorrenciaStatus === STATUS_CONCLUIDO).length;
  const encerradas = ocorrencias.filter((o) => ENCERRADOS.has(o.ocorrenciaStatus)).length;
  const criticas = ocorrencias.filter((o) => o.grauUrgencia === 'CRITICA');

  // Agrupamento mensal pelo mês de registro
  const porMes = new Map<string, PontoMensal>(
    mesesDoPeriodo(periodo).map((chave) => [chave, { chave, mes: rotuloMes(chave), registradas: 0, concluidas: 0 }]),
  );
  for (const o of ocorrencias) {
    const ponto = porMes.get(o.dataHoraRegistro.slice(0, 7));
    if (!ponto) continue;
    ponto.registradas++;
    if (o.ocorrenciaStatus === STATUS_CONCLUIDO) ponto.concluidas++;
  }

  const porAnimal = GRUPOS_ANIMAIS.map((g) => ({ ...g, quantidade: 0 }));
  for (const o of ocorrencias) {
    const categoria = o.animal?.categoriaAnimal ?? 'INDEFINIDO';
    const grupo = porAnimal.find((g) => g.categorias.includes(categoria)) ?? porAnimal[porAnimal.length - 1];
    grupo.quantidade++;
  }

  const porStatus = STATUS_DASHBOARD.map((s) => ({
    ...s,
    quantidade: ocorrencias.filter((o) => o.ocorrenciaStatus === s.status).length,
  }));

  return {
    total,
    emAberto: total - encerradas,
    encerradas,
    concluidas,
    criticas: criticas.length,
    criticasEmAberto: criticas.filter((o) => !ENCERRADOS.has(o.ocorrenciaStatus)).length,
    taxaConclusao: porcentagem(concluidas, total),
    porMes: [...porMes.values()],
    porAnimal,
    porStatus,
  };
}
