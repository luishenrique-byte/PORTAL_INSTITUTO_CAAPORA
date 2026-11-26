'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import type { PontoMensal } from './indicadores';
import { SemDados } from './Secao';

const config = { concluidas: { label: 'Resgates concluídos', color: '#2d6a2f' } } satisfies ChartConfig;

export function GraficoResgatesMensais({ dados }: { dados: PontoMensal[] }) {
  if (!dados.some((d) => d.registradas > 0)) return <SemDados />;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={dados} margin={{ top: 16, right: 12, left: -16 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltipContent />} />
        <Bar dataKey="concluidas" fill="var(--color-concluidas)" radius={[4, 4, 0, 0]} maxBarSize={36} />
      </BarChart>
    </ChartContainer>
  );
}
