export type GrauUrgencia = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';

// Item devolvido por GET /dashboard/mapa-calor
export interface PontoMapa {
  latitude: number;
  longitude: number;
  grauUrgencia: GrauUrgencia | string;
}

export const PERIODOS: { dias: number; rotulo: string }[] = [
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 180, rotulo: '180 dias' },
  { dias: 365, rotulo: '365 dias' },
];

export const PERIODO_PADRAO = 90;

export const URGENCIAS: { valor: GrauUrgencia | 'TODAS'; rotulo: string }[] = [
  { valor: 'TODAS', rotulo: 'Todas' },
  { valor: 'CRITICA', rotulo: 'Crítica' },
  { valor: 'ALTA', rotulo: 'Alta' },
  { valor: 'MEDIA', rotulo: 'Média' },
  { valor: 'BAIXA', rotulo: 'Baixa' },
];

// Peso de cada ponto no mapa de calor; urgência desconhecida conta como baixa
export function pesoDaUrgencia(grau: string): number {
  switch (grau) {
    case 'CRITICA':
      return 4;
    case 'ALTA':
      return 3;
    case 'MEDIA':
      return 2;
    default:
      return 1;
  }
}

// Descarta coordenadas malformadas (não numéricas ou fora da faixa geográfica) que quebrariam o mapa
export function coordenadaValida(p: PontoMapa): boolean {
  return (
    Number.isFinite(p.latitude) &&
    Number.isFinite(p.longitude) &&
    p.latitude >= -90 &&
    p.latitude <= 90 &&
    p.longitude >= -180 &&
    p.longitude <= 180
  );
}

export function filtrarPorUrgencia(pontos: PontoMapa[], urgencia: GrauUrgencia | 'TODAS'): PontoMapa[] {
  if (urgencia === 'TODAS') return pontos;
  return pontos.filter((p) => p.grauUrgencia === urgencia);
}

// "No mapa" respeita o filtro de urgência; críticas e altas contam o período inteiro
export function resumir(doPeriodo: PontoMapa[], filtrados: PontoMapa[]) {
  return {
    noMapa: filtrados.length,
    criticas: doPeriodo.filter((p) => p.grauUrgencia === 'CRITICA').length,
    altas: doPeriodo.filter((p) => p.grauUrgencia === 'ALTA').length,
  };
}
