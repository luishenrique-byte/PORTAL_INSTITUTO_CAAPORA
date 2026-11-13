'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Copy, Search, Smartphone, Timer, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export interface ResultadoEnvio {
  protocolo: string;
  anonimo: boolean;
  falhas: string[]; // nomes dos arquivos que não subiram
}

export function Sucesso({ resultado, onNova }: { resultado: ResultadoEnvio; onNova: () => void }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(resultado.protocolo);
      setCopiado(true);
      toast.success('Protocolo copiado');
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível (ex.: http fora de localhost): o protocolo continua visível na tela
      toast.error('Não foi possível copiar. Anote o protocolo.');
    }
  }

  const infos = [
    !resultado.anonimo && { Icone: Smartphone, texto: 'Você receberá atualizações via WhatsApp' },
    { Icone: Timer, texto: 'Tempo médio de resposta: 72 horas' },
    { Icone: Search, texto: 'Acompanhe pelo protocolo acima' },
  ].filter(Boolean) as { Icone: typeof Timer; texto: string }[];

  return (
    <main className="mx-auto max-w-xl px-5 pt-12 pb-16 text-center">
      <div className="fade-up">
        <span className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-[3px] border-primary text-primary">
          <Check className="size-7" strokeWidth={3} />
        </span>
        <h1 className="text-[2rem] leading-tight font-light text-foreground">Ocorrência registrada!</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Nossa equipe foi acionada e entrará em contato em breve. Guarde o número de protocolo.
        </p>

        <div className="mx-auto mt-7 max-w-sm rounded-2xl bg-[#1c2b1a] px-6 py-5 text-white">
          <p className="text-[0.7rem] tracking-[0.2em] text-[#a8d5a2]/80 uppercase">Número de protocolo</p>
          <p
            className="mt-1 text-2xl font-semibold tracking-wider text-[#a8d5a2] select-all"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {resultado.protocolo}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={copiar}
            className="mt-1 text-xs text-[#b8c9b4] hover:bg-white/10 hover:text-white"
          >
            {copiado ? <Check /> : <Copy />}
            {copiado ? 'Copiado!' : 'Copiar protocolo'}
          </Button>
        </div>

        {resultado.falhas.length > 0 && (
          <Alert variant="destructive" className="mx-auto mt-4 max-w-sm border-destructive/30 bg-destructive/5">
            <TriangleAlert />
            <AlertDescription>
              A ocorrência foi registrada, mas{' '}
              {resultado.falhas.length === 1 ? 'um arquivo não pôde ser enviado' : `${resultado.falhas.length} arquivos não puderam ser enviados`}:{' '}
              {resultado.falhas.join(', ')}.
            </AlertDescription>
          </Alert>
        )}

        <ul className="mx-auto mt-4 max-w-sm space-y-2 rounded-2xl bg-muted px-5 py-4 text-left text-sm text-muted-foreground">
          {infos.map((i) => (
            <li key={i.texto} className="flex items-center gap-3">
              <i.Icone className="size-4 shrink-0 text-primary" aria-hidden />
              {i.texto}
            </li>
          ))}
        </ul>

        <Button asChild variant="dark" className="mx-auto mt-6 flex h-12 w-full max-w-sm rounded-xl text-base font-semibold">
          <Link href={`/acompanhar/${resultado.protocolo}`}>
            <Search /> Acompanhar ocorrência
          </Link>
        </Button>
        <Button type="button" variant="link" onClick={onNova} className="mt-3 underline">
          Registrar outra ocorrência
        </Button>
      </div>
    </main>
  );
}
