import { STATUS_CONCLUIDO, fmtNumero, porcentagem, type Indicadores } from './indicadores';

// Barras de progresso por status, na ordem do fluxo de atendimento
export function OcorrenciasPorStatus({ dados, total }: { dados: Indicadores['porStatus']; total: number }) {
  return (
    <ul className="space-y-4">
      {dados.map(({ status, rotulo, quantidade }) => {
        const pct = porcentagem(quantidade, total);
        return (
          <li key={status}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
              <span className="text-foreground">{rotulo}</span>
              <span className="font-medium text-foreground tabular-nums">
                {fmtNumero.format(quantidade)}
                <span className="ml-2 text-xs font-normal text-muted-foreground">{pct.toLocaleString('pt-BR')}%</span>
              </span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={rotulo}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={status === STATUS_CONCLUIDO ? 'h-full rounded-full bg-primary' : 'h-full rounded-full bg-primary/55'}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
