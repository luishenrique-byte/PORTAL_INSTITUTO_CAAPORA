import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Caixa branca com título, usada por todos os gráficos do Dashboard
export function Secao({
  titulo,
  descricao,
  acao,
  className,
  children,
}: {
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col rounded-2xl border border-border/70 bg-card p-5', className)}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-sans text-sm font-semibold text-foreground">{titulo}</h2>
          {descricao && <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>}
        </div>
        {acao}
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function CarregandoGrafico({ altura = 'h-64' }: { altura?: string }) {
  return <Skeleton className={cn('w-full rounded-xl', altura)} />;
}

export function SemOcorrencias({ altura = 'h-64' }: { altura?: string }) {
  return (
    <div className={cn('flex items-center justify-center text-center text-sm text-muted-foreground', altura)}>
      Nenhuma ocorrência registrada neste período.
    </div>
  );
}
