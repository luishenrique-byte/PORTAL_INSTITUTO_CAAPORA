'use client';

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { PontoMensal } from './dados';
import { SemOcorrencias } from './Secao';

// Azul e verde: par de cores que se distingue também para daltônicos
const config = {
  registradas: { label: 'Registradas', color: '#3b6ea5' },
  concluidas: { label: 'Concluídas', color: '#2d6a2f' },
} satisfies ChartConfig;

export function GraficoOcorrenciasMensais({ dados }: { dados: PontoMensal[] }) {
  if (!dados.some((d) => d.registradas > 0)) return <SemOcorrencias altura="h-72" />;

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full xl:h-full xl:min-h-72">
      <LineChart data={dados} margin={{ top: 8, right: 12, left: -16 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent className="justify-end pt-0 pb-4" />} />
        <Line
          dataKey="registradas"
          type="monotone"
          stroke="var(--color-registradas)"
          strokeWidth={2}
          dot={{ r: 3.5, fill: 'var(--color-registradas)', strokeWidth: 0 }}
          activeDot={{ r: 5.5, stroke: 'var(--card)', strokeWidth: 2 }}
        />
        <Line
          dataKey="concluidas"
          type="monotone"
          stroke="var(--color-concluidas)"
          strokeWidth={2}
          dot={{ r: 3.5, fill: 'var(--color-concluidas)', strokeWidth: 0 }}
          activeDot={{ r: 5.5, stroke: 'var(--card)', strokeWidth: 2 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
