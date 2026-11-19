// Cálculos e rótulos usados pelos componentes do Dashboard.
import type { CategoriaAnimal, Contagem, OcorrenciaConcluida, OcorrenciaStatus } from '@/lib/api';

export const fmtNumero = new Intl.NumberFormat('pt-BR');

// 56.3 -> "56,3%"
export const fmtPorcentagem = (valor: number) =>
  `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

// Mesmo arredondamento do DashboardService.porcentagem (uma casa decimal); total zero devolve 0
export const porcentagem = (parte: number, total: number) =>
  total === 0 ? 0 : Math.round((parte * 1000) / total) / 10;

const fmtMes = new Intl.DateTimeFormat('pt-BR', { month: 'short' });

// "2026-10" -> "out/26"
export function rotuloMes(anoMes: string) {
  const [ano, mes] = anoMes.split('-').map(Number);
  return `${fmtMes.format(new Date(ano, mes - 1, 1)).replace('.', '')}/${String(ano).slice(2)}`;
}

// Primeiro dia do mês mais antigo do gráfico, no formato aceito pelo backend.
// Bate com o período que /dashboard/por-mes usa.
export function inicioDosUltimosMeses(meses: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (meses - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01T00:00:00`;
}

export interface PontoMensal {
  mes: string;
  registradas: number;
  concluidas: number;
  resgates: number;
}

// Junta o total por mês (/dashboard/por-mes) com as concluídas de cada mês.
// O backend ainda não tem endpoint de concluídas por mês, então elas são contadas aqui,
// pelo mês de registro. "Resgate" = ocorrência concluída que teve equipe de campo designada.
export function montarSerieMensal(porMes: Contagem[], concluidas: OcorrenciaConcluida[]): PontoMensal[] {
  const contar = (lista: OcorrenciaConcluida[]) => {
    const porAnoMes: Record<string, number> = {};
    for (const o of lista) {
      const anoMes = o.dataHoraRegistro.slice(0, 7); // "2026-10-03T09:14:00" -> "2026-10"
      porAnoMes[anoMes] = (porAnoMes[anoMes] ?? 0) + 1;
    }
    return porAnoMes;
  };
  const concluidasPorMes = contar(concluidas);
  const resgatesPorMes = contar(concluidas.filter((o) => o.equipe !== null));

  return porMes.map((m) => ({
    mes: rotuloMes(m.rotulo),
    registradas: m.quantidade,
    concluidas: concluidasPorMes[m.rotulo] ?? 0,
    resgates: resgatesPorMes[m.rotulo] ?? 0,
  }));
}

// Categorias do gráfico de rosca. Peixe e "não identificado" entram em "Outros".
// Cores conferidas para daltonismo; a legenda sempre mostra nome e percentual.
export const GRUPOS_ANIMAIS: { chave: string; rotulo: string; categorias: CategoriaAnimal[]; cor: string }[] = [
  { chave: 'aves', rotulo: 'Aves', categorias: ['AVE'], cor: '#2d6a2f' },
  { chave: 'mamiferos', rotulo: 'Mamíferos', categorias: ['MAMIFERO'], cor: '#d4a017' },
  { chave: 'repteis', rotulo: 'Répteis', categorias: ['REPTIL'], cor: '#3b6ea5' },
  { chave: 'anfibios', rotulo: 'Anfíbios', categorias: ['ANFIBIO'], cor: '#c8501a' },
  { chave: 'outros', rotulo: 'Outros', categorias: ['PEIXE', 'INDEFINIDO'], cor: '#8a5a9e' },
];

export function agruparPorAnimal(porCategoria: Contagem[]) {
  return GRUPOS_ANIMAIS.map((grupo) => ({
    ...grupo,
    quantidade: porCategoria
      .filter((c) => grupo.categorias.includes(c.rotulo as CategoriaAnimal))
      .reduce((soma, c) => soma + c.quantidade, 0),
  }));
}

export const quantidadeDoStatus = (porStatus: Contagem[], status: OcorrenciaStatus) =>
  porStatus.find((c) => c.rotulo === status)?.quantidade ?? 0;
