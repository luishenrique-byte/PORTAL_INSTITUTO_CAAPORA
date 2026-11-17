'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { encerrarSessao, obterToken } from '@/lib/sessao';

export default function PainelProvisorio() {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  // Sem sessão válida, volta para o login
  useEffect(() => {
    if (obterToken()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
      setAutorizado(true);
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  function sair() {
    encerrarSessao();
    router.replace('/admin/login');
  }

  if (!autorizado) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-5 text-center">
      <h1 className="font-heading text-2xl text-foreground">Painel Administrativo</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Você está conectado. O dashboard ainda está em construção.
      </p>
      <Button variant="outline" onClick={sair}>
        <LogOut /> Sair
      </Button>
    </main>
  );
}
