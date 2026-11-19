'use client';

import { Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { GRUPOS_ANIMAIS, fmtNumero, fmtPorcentagem, porcentagem, type agruparPorAnimal } from './dados';
import { SemOcorrencias } from './Secao';

const config = Object.fromEntries(
  GRUPOS_ANIMAIS.map((g) => [g.chave, { label: g.rotulo, color: g.cor }]),
) satisfies ChartConfig;

export function GraficoTipoAnimal({ dados }: { dados: ReturnType<typeof agruparPorAnimal> }) {
  const total = dados.reduce((soma, d) => soma + d.quantidade, 0);
  if (total === 0) return <SemOcorrencias altura="h-72" />;

  const fatias = dados.filter((d) => d.quantidade > 0);

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row xl:flex-col 2xl:flex-row">
      <ChartContainer config={config} className="relative aspect-square h-48 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="chave" hideLabel />} />
          <Pie
            data={fatias}
            dataKey="quantidade"
            nameKey="chave"
            innerRadius="62%"
            outerRadius="100%"
            stroke="var(--card)"
            strokeWidth={2}
          >
            {fatias.map((d) => (
              <Cell key={d.chave} fill={d.cor} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {dados.map((d) => (
          <li key={d.chave} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.cor }} aria-hidden />
            <span className="flex-1 text-foreground">{d.rotulo}</span>
            <span className="text-muted-foreground tabular-nums">{fmtNumero.format(d.quantidade)}</span>
            <span className="w-14 text-right font-medium text-foreground tabular-nums">
              {fmtPorcentagem(porcentagem(d.quantidade, total))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
