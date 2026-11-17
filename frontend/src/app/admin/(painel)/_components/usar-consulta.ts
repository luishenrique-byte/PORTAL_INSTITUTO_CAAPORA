'use client';

import { useCallback, useEffect, useEffectEvent, useState } from 'react';
import { ApiError } from '@/lib/api';

interface Resultado<T> {
  dados: T | undefined;
  erro: string | null;
  carregando: boolean;
  recarregar: () => void;
}

// Busca dados da API e refaz a busca quando `chave` muda.
// Enquanto recarrega, mantém os dados anteriores na tela (sem piscar).
export function useConsulta<T>(chave: string, carregar: (signal: AbortSignal) => Promise<T>): Resultado<T> {
  const [versao, setVersao] = useState(0);
  const atual = `${chave}#${versao}`;
  const [estado, setEstado] = useState<{ chave: string; dados?: T; erro: string | null }>({
    chave: '',
    erro: null,
  });

  const buscar = useEffectEvent((signal: AbortSignal) => carregar(signal));

  useEffect(() => {
    const controle = new AbortController();
    buscar(controle.signal)
      .then((dados) => setEstado({ chave: atual, dados, erro: null }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        const erro = e instanceof ApiError ? e.message : 'Erro inesperado ao carregar.';
        setEstado((anterior) => ({ chave: atual, dados: anterior.dados, erro }));
      });
    return () => controle.abort();
  }, [atual]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);

  return {
    dados: estado.dados,
    erro: estado.chave === atual ? estado.erro : null,
    carregando: estado.chave !== atual,
    recarregar,
  };
}
