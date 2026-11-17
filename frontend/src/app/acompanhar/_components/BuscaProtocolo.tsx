'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';
import { CabecalhoPublico } from '@/components/cabecalho-publico';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PROTOCOLO_REGEX, mascaraProtocolo } from '@/lib/ocorrencia';

export function BuscaProtocolo() {
  const router = useRouter();
  const [protocolo, setProtocolo] = useState('');
  const [tocado, setTocado] = useState(false);
  const valido = PROTOCOLO_REGEX.test(protocolo);

  function buscar(e: React.FormEvent) {
    e.preventDefault();
    setTocado(true);
    if (valido) router.push(`/acompanhar/${protocolo}`);
  }

  const erro = tocado && !valido ? 'Digite o protocolo completo, no formato CAA-AAMMDD-XXXXX.' : '';

  return (
    <>
      <CabecalhoPublico titulo="Acompanhar ocorrência" voltar="/" rotuloVoltar="Voltar para o início" />
      <main className="mx-auto max-w-xl px-5 pt-16 pb-16 text-center">
        <div className="fade-up">
          <span className="mx-auto mb-6 flex size-14 items-center justify-center rounded-full bg-secondary text-primary">
            <Search className="size-6" aria-hidden />
          </span>
          <h1 className="text-[1.75rem] leading-tight font-light text-foreground">Acompanhe sua ocorrência</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Informe o número de protocolo recebido no momento do registro.
          </p>

          <form onSubmit={buscar} noValidate className="mx-auto mt-8 max-w-sm space-y-3">
            <label htmlFor="protocolo" className="sr-only">
              Número de protocolo
            </label>
            <Input
              id="protocolo"
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="numeric"
              spellCheck={false}
              placeholder="CAA-AAMMDD-XXXXX"
              value={protocolo}
              onChange={(e) => setProtocolo(mascaraProtocolo(e.target.value))}
              aria-invalid={!!erro}
              aria-describedby={erro ? 'erro-protocolo' : undefined}
              className="h-12 rounded-lg bg-card text-center text-base tracking-wider md:text-base"
            />
            {erro && (
              <p id="erro-protocolo" role="alert" className="text-xs text-destructive">
                {erro}
              </p>
            )}
            <Button type="submit" variant="dark" className="h-12 w-full rounded-xl text-base font-semibold">
              <Search /> Buscar protocolo
            </Button>
          </form>
        </div>
      </main>
    </>
  );
}
