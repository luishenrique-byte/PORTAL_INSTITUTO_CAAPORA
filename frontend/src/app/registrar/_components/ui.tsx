'use client';

import { Check, TriangleAlert } from 'lucide-react';
import { CabecalhoPublico } from '@/components/cabecalho-publico';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export const ETAPAS = ['Localização', 'O animal', 'Seus dados'] as const;

// Altura e acabamento dos campos do formulário público (sobre os componentes shadcn)
export const campoClasse = 'h-12 rounded-lg bg-card px-4 text-[0.95rem] md:text-[0.95rem]';

export function Cabecalho({
  etapa,
  onVoltar,
}: {
  etapa: number | null; // null = tela final, sem "Etapa x de 3"
  onVoltar: (() => void) | null; // null = volta para a página inicial
}) {
  return (
    <CabecalhoPublico
      titulo="Registrar Ocorrência"
      subtitulo={etapa !== null ? `Etapa ${etapa + 1} de ${ETAPAS.length} — ${ETAPAS[etapa]}` : undefined}
      voltar={onVoltar ?? '/'}
      rotuloVoltar={onVoltar ? 'Voltar para a etapa anterior' : 'Voltar para o início'}
    />
  );
}

export function Stepper({ etapa }: { etapa: number }) {
  return (
    <ol className="mb-8 flex items-center" aria-label={`Etapa ${etapa + 1} de ${ETAPAS.length}`}>
      {ETAPAS.map((nome, i) => {
        const feita = i < etapa;
        const atual = i === etapa;
        return (
          <li key={nome} className="flex items-center">
            {i > 0 && <span className={cn('mx-2 h-0.5 w-8 rounded', i <= etapa ? 'bg-primary' : 'bg-border')} aria-hidden />}
            <span
              aria-current={atual ? 'step' : undefined}
              className={cn(
                'flex size-7 items-center justify-center rounded-full text-xs font-semibold',
                feita && 'bg-primary text-primary-foreground',
                atual && 'bg-foreground text-background',
                !feita && !atual && 'bg-muted text-muted-foreground',
              )}
            >
              {feita ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
              <span className="sr-only">
                {' '}
                {nome}
                {feita ? ' (concluída)' : ''}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function Titulo({ titulo, subtitulo }: { titulo: string; subtitulo: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-[1.75rem] leading-tight font-light text-foreground">{titulo}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{subtitulo}</p>
    </div>
  );
}

export function Rotulo({ htmlFor, children, opcional }: { htmlFor?: string; children: React.ReactNode; opcional?: boolean }) {
  return (
    <Label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold">
      {children}
      {opcional && <span className="font-normal text-cta"> (opcional)</span>}
    </Label>
  );
}

export function Rodape({
  etapa,
  onVoltar,
  podeAvancar,
  rotulo,
  destaque = false,
  carregando = false,
}: {
  etapa: number;
  onVoltar?: () => void;
  podeAvancar: boolean;
  rotulo: React.ReactNode;
  destaque?: boolean; // botão laranja (envio final)
  carregando?: boolean;
}) {
  const altura = 'h-12 rounded-xl px-6 text-base font-semibold';
  return (
    <div className="mt-8">
      <div className="flex gap-3">
        {onVoltar && (
          <Button type="button" variant="outline" className={cn(altura, 'bg-transparent')} onClick={onVoltar} disabled={carregando}>
            Voltar
          </Button>
        )}
        <Button
          type="submit"
          variant={destaque ? 'cta' : 'dark'}
          disabled={!podeAvancar || carregando}
          className={cn(altura, 'flex-1 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none')}
        >
          {carregando && <Spinner />}
          {rotulo}
        </Button>
      </div>
      <Progress value={((etapa + 1) / ETAPAS.length) * 100} className="mt-5 h-1 bg-border" aria-label="Progresso do registro" />
    </div>
  );
}

export function Erro({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive" className="mt-4 border-destructive/30 bg-destructive/5">
      <TriangleAlert />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}
