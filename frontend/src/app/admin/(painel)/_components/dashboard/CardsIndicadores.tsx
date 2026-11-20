import { CircleCheckBig, ClipboardList, Clock, Siren, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { fmtNumero, fmtPorcentagem, porcentagem, type Indicadores } from './indicadores';

interface Card {
  titulo: string;
  valor: string;
  descricao: string;
  Icone: LucideIcon;
  alerta?: boolean;
}

const plural = (n: number, singular: string, plural: string) => `${fmtNumero.format(n)} ${n === 1 ? singular : plural}`;

export function CardsIndicadores({ dados }: { dados?: Indicadores }) {
  if (!dados) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />
        ))}
      </div>
    );
  }

  const cards: Card[] = [
    {
      titulo: 'Total de ocorrências',
      valor: fmtNumero.format(dados.total),
      descricao: 'Registradas no período selecionado',
      Icone: ClipboardList,
    },
    {
      titulo: 'Em aberto',
      valor: fmtNumero.format(dados.emAberto),
      descricao: plural(dados.encerradas, 'encerrada', 'encerradas'),
      Icone: Clock,
    },
    {
      titulo: 'Urgência crítica',
      valor: fmtNumero.format(dados.criticas),
      descricao:
        dados.criticas === 0
          ? 'Nenhum caso crítico no período'
          : `${fmtPorcentagem(porcentagem(dados.criticas, dados.total))} do total · ${fmtNumero.format(dados.criticasEmAberto)} em aberto`,
      Icone: Siren,
      alerta: dados.criticasEmAberto > 0,
    },
    {
      titulo: 'Taxa de conclusão',
      valor: fmtPorcentagem(dados.taxaConclusao),
      descricao: `${fmtNumero.format(dados.concluidas)} de ${fmtNumero.format(dados.total)} concluídas`,
      Icone: CircleCheckBig,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 xl:gap-4">
      {cards.map(({ titulo, valor, descricao, Icone, alerta }) => (
        <div
          key={titulo}
          className={cn('rounded-2xl border bg-card px-5 py-4', alerta ? 'border-destructive/40 bg-[#fdf3f2]' : 'border-border/70')}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{titulo}</p>
            <span
              className={cn(
                'flex size-8 items-center justify-center rounded-lg',
                alerta ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary',
              )}
            >
              <Icone className="size-4" aria-hidden />
            </span>
          </div>
          <p className={cn('mt-1 font-heading text-3xl tabular-nums', alerta ? 'text-destructive' : 'text-foreground')}>
            {valor}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
        </div>
      ))}
    </div>
  );
}
