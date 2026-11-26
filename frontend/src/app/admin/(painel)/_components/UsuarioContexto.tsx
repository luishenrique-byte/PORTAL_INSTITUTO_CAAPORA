'use client';

import { createContext, useContext } from 'react';
import type { UsuarioLogado } from '@/lib/api';

// Quem está logado no painel (GET /auth/me), carregado uma vez pela casca do painel.
export interface SessaoPainel {
  token: string;
  usuario: UsuarioLogado;
  sair: () => void; // encerra a sessão e volta para o login (ex.: token vencido)
}

const Contexto = createContext<SessaoPainel | null>(null);

export const UsuarioProvider = Contexto.Provider;

export function useSessaoPainel(): SessaoPainel {
  const valor = useContext(Contexto);
  if (!valor) throw new Error('useSessaoPainel precisa estar dentro do PainelShell');
  return valor;
}

export const ehCoordenador = (u: UsuarioLogado) => u.perfil === 'COORDENADOR';
export const ehEquipeDeCampo = (u: UsuarioLogado) => u.perfil === 'EQUIPE_CAMPO';

export const ROTA_EQUIPE_CAMPO = '/admin/minha-equipe';
