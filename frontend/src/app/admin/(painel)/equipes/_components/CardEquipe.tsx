import { MapPin, Phone } from 'lucide-react';
import type { EquipeResumo } from '@/lib/api';
import { BadgeStatusEquipe } from './visual';

export function CardEquipe({ equipe, onAbrir }: { equipe: EquipeResumo; onAbrir: () => void }) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Ver detalhes da ${equipe.nome}`}
      className="group flex w-full flex-col rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-cta"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg leading-snug text-foreground">{equipe.nome}</h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{equipe.regiao || 'Região não informada'}</span>
          </p>
        </div>
        <BadgeStatusEquipe status={equipe.status} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5">
        <Metrica rotulo="Membros" valor={equipe.membros} />
        <Metrica rotulo="Em campo" valor={equipe.emCampo} />
        <Metrica rotulo="Concluídos" valor={equipe.concluidos} />
      </div>

      <p className="mt-5 flex items-center gap-2 border-t border-border/60 pt-4 text-sm text-muted-foreground">
        <Phone className="size-4 text-primary" aria-hidden />
        {equipe.telefone || 'Telefone não cadastrado'}
      </p>
    </button>
  );
}

function Metrica({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <div className="rounded-xl bg-muted/50 px-2 py-3 text-center">
      <p className="text-2xl leading-none font-semibold text-foreground tabular-nums">{valor}</p>
      <p className="mt-1.5 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</p>
    </div>
  );
}
