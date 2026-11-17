'use client';

import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api';
import { usuarioLogado, type Funcionario, type Perfil } from '@/lib/painel';
import { encerrarSessao, obterToken } from '@/lib/sessao';
import { Aviso } from './elementos';

interface SessaoPainel {
  usuario: Funcionario;
  perfil: Perfil;
  pode: (...perfis: Perfil[]) => boolean;
  sair: () => void;
}

const Contexto = createContext<SessaoPainel | null>(null);

export function useSessao() {
  const sessao = useContext(Contexto);
  if (!sessao) throw new Error('useSessao fora do ProvedorSessao');
  return sessao;
}

type Estado = { tipo: 'carregando' } | { tipo: 'ok'; usuario: Funcionario } | { tipo: 'erro'; mensagem: string };

// Confere o token e carrega o funcionário logado antes de mostrar qualquer tela do painel
export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!obterToken()) {
      router.replace('/admin/login');
      return;
    }
    const controle = new AbortController();
    usuarioLogado(controle.signal)
      .then((usuario) => setEstado({ tipo: 'ok', usuario }))
      .catch((e) => {
        if (controle.signal.aborted || (e instanceof ApiError && e.status === 401)) return;
        setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [router, tentativa]);

  if (estado.tipo === 'carregando') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    );
  }

  if (estado.tipo === 'erro') {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-5">
        <Aviso
          titulo="Não foi possível abrir o painel"
          texto={estado.mensagem}
          acao={{
            rotulo: 'Tentar de novo',
            aoClicar: () => {
              setEstado({ tipo: 'carregando' });
              setTentativa((t) => t + 1);
            },
          }}
        />
      </main>
    );
  }

  const { usuario } = estado;
  const perfil = (usuario.perfil?.perfil.toUpperCase() ?? 'EQUIPE_CAMPO') as Perfil;
  const valor: SessaoPainel = {
    usuario,
    perfil,
    pode: (...perfis) => perfis.includes(perfil),
    sair: () => {
      encerrarSessao();
      router.replace('/admin/login');
    },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

// Esconde a tela de quem não tem o perfil (o backend responderia 403 de qualquer forma)
export function SomentePerfis({ perfis, children }: { perfis: Perfil[]; children: React.ReactNode }) {
  const { pode } = useSessao();
  if (!pode(...perfis)) {
    return (
      <Aviso
        titulo="Acesso restrito"
        texto="Esta área não está disponível para o seu perfil. Fale com a coordenação se precisar de acesso."
      />
    );
  }
  return children;
}
