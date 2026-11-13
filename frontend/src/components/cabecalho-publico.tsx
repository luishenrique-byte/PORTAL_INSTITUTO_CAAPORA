'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Cabeçalho das telas públicas (registro e acompanhamento):
// botão voltar, título com subtítulo opcional e o logo.
export function CabecalhoPublico({
  titulo,
  subtitulo,
  voltar,
  rotuloVoltar = 'Voltar',
}: {
  titulo: string;
  subtitulo?: string;
  voltar: string | (() => void); // href ou ação
  rotuloVoltar?: string;
}) {
  const classe = 'size-9 rounded-full bg-card';
  return (
    <header
      className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-md"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="mx-auto flex h-16 max-w-xl items-center gap-3 px-5">
        {typeof voltar === 'string' ? (
          <Button asChild variant="outline" size="icon" className={classe}>
            <Link href={voltar} aria-label={rotuloVoltar}>
              <ChevronLeft />
            </Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" size="icon" className={classe} onClick={voltar} aria-label={rotuloVoltar}>
            <ChevronLeft />
          </Button>
        )}
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{titulo}</p>
          {subtitulo && <p className="truncate text-xs text-muted-foreground">{subtitulo}</p>}
        </div>
        <Link href="/" aria-label="Instituto Caapora — início" className="shrink-0">
          <Image src="/logo-caapora.png" alt="" width={456} height={547} className="h-9 w-9 object-contain" priority />
        </Link>
      </div>
    </header>
  );
}
