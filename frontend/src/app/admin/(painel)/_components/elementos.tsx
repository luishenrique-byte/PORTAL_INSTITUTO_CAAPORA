'use client';

import {
  Check,
  CircleAlert,
  ClipboardCheck,
  RotateCw,
  Siren,
  Stethoscope,
  Truck,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { OcorrenciaStatus } from '@/lib/api';
import { rotuloStatus, rotuloUrgencia } from '@/lib/ocorrencia';
import type { EquipeStatus, GrauUrgencia } from '@/lib/painel';
import { cn } from '@/lib/utils';

export function CabecalhoPagina({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: React.ReactNode;
  children?: React.ReactNode; // ações à direita
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        <h1 className="font-heading text-2xl leading-tight text-foreground md:text-[1.75rem]">{titulo}</h1>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 print:hidden">{children}</div>}
    </header>
  );
}

// Bloco branco com título, usado em todas as telas do painel
export function Bloco({
  titulo,
  acao,
  className,
  children,
}: {
  titulo?: React.ReactNode;
  acao?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('flex flex-col rounded-xl border border-border/70 bg-card p-5', className)}>
      {(titulo || acao) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="font-sans text-sm font-semibold text-foreground">{titulo}</h2>}
          {acao}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </section>
  );
}

export function Aviso({
  titulo,
  texto,
  acao,
  Icone = CircleAlert,
}: {
  titulo: string;
  texto: string;
  acao?: { rotulo: string; aoClicar: () => void };
  Icone?: LucideIcon;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-14 text-center">
      <Icone className="mb-3 size-6 text-muted-foreground" aria-hidden />
      <p className="font-medium text-foreground">{titulo}</p>
      <p className="mt-1 text-sm text-muted-foreground">{texto}</p>
      {acao && (
        <Button variant="outline" className="mt-5" onClick={acao.aoClicar}>
          <RotateCw /> {acao.rotulo}
        </Button>
      )}
    </div>
  );
}

export const ICONE_STATUS: Record<OcorrenciaStatus, LucideIcon> = {
  REGISTRADA: ClipboardCheck,
  TRIAGEM: Stethoscope,
  ATENDIMENTO: Truck,
  RESGATE: Siren,
  CONCLUIDO: Check,
};

const COR_STATUS: Record<OcorrenciaStatus, string> = {
  REGISTRADA: 'bg-muted text-foreground',
  TRIAGEM: 'bg-[#f3ead2] text-[#6b4f0a]',
  ATENDIMENTO: 'bg-[#e3ecf3] text-[#264b66]',
  RESGATE: 'bg-[#f7e1d4] text-[#8a3510]',
  CONCLUIDO: 'bg-secondary text-primary',
};

export function SeloStatus({ status, className }: { status: OcorrenciaStatus; className?: string }) {
  const Icone = ICONE_STATUS[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        COR_STATUS[status],
        className,
      )}
    >
      <Icone className="size-3.5" aria-hidden />
      {rotuloStatus(status)}
    </span>
  );
}

// Cor de urgência é reservada a este selo e ao mapa; sempre acompanha o texto
export const COR_URGENCIA: Record<GrauUrgencia, string> = {
  BAIXA: '#4f8a4b',
  MEDIA: '#c99a12',
  ALTA: '#d4691f',
  CRITICA: '#b42318',
};

export function SeloUrgencia({ urgencia }: { urgencia: GrauUrgencia | null }) {
  if (!urgencia) return <span className="text-xs text-muted-foreground">—</span>;
  const critica = urgencia === 'CRITICA';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        critica ? 'border-transparent bg-destructive text-white' : 'border-border bg-card text-foreground',
      )}
    >
      {!critica && (
        <span className="size-2 rounded-full" style={{ backgroundColor: COR_URGENCIA[urgencia] }} aria-hidden />
      )}
      {rotuloUrgencia(urgencia)}
    </span>
  );
}

export function SeloEquipe({ status }: { status: EquipeStatus }) {
  const livre = status === 'DISPONIVEL';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        livre ? 'bg-secondary text-primary' : 'bg-[#f7e1d4] text-[#8a3510]',
      )}
    >
      <span className={cn('size-1.5 rounded-full', livre ? 'bg-primary' : 'bg-cta')} aria-hidden />
      {livre ? 'Disponível' : 'Em atendimento'}
    </span>
  );
}
