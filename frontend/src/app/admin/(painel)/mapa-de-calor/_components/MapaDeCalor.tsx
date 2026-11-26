'use client';

import { MapPinOff, MapPinned, RotateCw, Siren, TriangleAlert, WifiOff, type LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api';
import { encerrarSessao, obterToken } from '@/lib/sessao';
import { cn } from '@/lib/utils';
import { buscarPontosMapa } from './api';
import {
  PERIODO_PADRAO,
  PERIODOS,
  URGENCIAS,
  filtrarPorUrgencia,
  resumir,
  type GrauUrgencia,
  type PontoMapa,
} from './pontos';

// O mapa só existe no navegador (Google Maps e deck.gl dependem de window)
const MapaGoogle = dynamic(() => import('./MapaGoogle'), {
  ssr: false,
  loading: () => <Skeleton className="size-full rounded-none" />,
});

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; pontos: PontoMapa[] }
  | { tipo: 'erro'; mensagem: string };

const fmtNumero = new Intl.NumberFormat('pt-BR');

interface Card {
  titulo: string;
  valor: number;
  descricao: string;
  Icone: LucideIcon;
  alerta?: boolean;
}

function Aviso({ Icone, titulo, texto }: { Icone: LucideIcon; titulo: string; texto?: string }) {
  return (
    <div className="flex size-full flex-col items-center justify-center px-6 py-10 text-center">
      <Icone className="mb-3 size-6 text-muted-foreground" aria-hidden />
      <p className="font-medium text-foreground">{titulo}</p>
      {texto && <p className="mt-1 max-w-md text-sm text-muted-foreground">{texto}</p>}
    </div>
  );
}

export default function MapaDeCalor() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [dias, setDias] = useState(PERIODO_PADRAO);
  const [urgencia, setUrgencia] = useState<GrauUrgencia | 'TODAS'>('TODAS');
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [recarga, setRecarga] = useState(0);
  const [falhaMapa, setFalhaMapa] = useState<string | null>(null);

  // O layout do painel já redireciona quem não tem sessão; aqui só lemos o token para a API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
    setToken(obterToken());
  }, []);

  const sair = useCallback(() => {
    encerrarSessao();
    router.replace('/admin/login');
  }, [router]);

  // Busca por período; o filtro de urgência é local e não refaz a requisição
  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    buscarPontosMapa(dias, token, controle.signal)
      .then((pontos) => {
        if (controle.signal.aborted) return;
        setEstado({ tipo: 'ok', pontos });
      })
      .catch((erro) => {
        if (controle.signal.aborted) return;
        if (erro instanceof ApiError && erro.status === 401) return sair(); // token vencido
        setEstado({
          tipo: 'erro',
          mensagem: erro instanceof ApiError ? erro.message : 'Erro inesperado. Tente novamente.',
        });
      });
    return () => controle.abort();
  }, [token, dias, recarga, sair]);

  const doPeriodo = useMemo(() => (estado.tipo === 'ok' ? estado.pontos : undefined), [estado]);

  // Referência estável (useMemo); o enquadramento do mapa usa só doPeriodo, não este filtro
  const filtrados = useMemo(
    () => (doPeriodo ? filtrarPorUrgencia(doPeriodo, urgencia) : undefined),
    [doPeriodo, urgencia],
  );

  const resumo = useMemo(
    () => (doPeriodo && filtrados ? resumir(doPeriodo, filtrados) : undefined),
    [doPeriodo, filtrados],
  );

  function mudarPeriodo(valor: string) {
    setEstado({ tipo: 'carregando' });
    setDias(Number(valor));
  }

  function atualizar() {
    setEstado({ tipo: 'carregando' });
    setRecarga((r) => r + 1);
  }

  if (!token) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center">
        <Spinner className="size-6 text-primary" />
      </div>
    );
  }

  const carregando = estado.tipo === 'carregando';
  const chave = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const cards: Card[] | undefined = resumo && [
    {
      titulo: 'Pontos no mapa',
      valor: resumo.noMapa,
      descricao: 'Com localização, conforme o filtro',
      Icone: MapPinned,
    },
    {
      titulo: 'Urgência crítica',
      valor: resumo.criticas,
      descricao: resumo.criticas === 0 ? 'Nenhum caso crítico no período' : 'No período selecionado',
      Icone: Siren,
      alerta: resumo.criticas > 0,
    },
    {
      titulo: 'Urgência alta',
      valor: resumo.altas,
      descricao: 'No período selecionado',
      Icone: TriangleAlert,
    },
  ];

  let areaMapa: React.ReactNode;
  if (estado.tipo === 'erro') {
    areaMapa = (
      <div className="flex size-full flex-col items-center justify-center px-6 py-10 text-center">
        <WifiOff className="mb-3 size-6 text-muted-foreground" aria-hidden />
        <p className="font-medium text-foreground">Não foi possível carregar o mapa de calor</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{estado.mensagem}</p>
        <Button variant="outline" className="mt-5" onClick={atualizar}>
          <RotateCw /> Tentar de novo
        </Button>
      </div>
    );
  } else if (!filtrados) {
    areaMapa = <Skeleton className="size-full rounded-none" />;
  } else if (!chave) {
    areaMapa = (
      <Aviso Icone={MapPinOff} titulo="Mapa indisponível: falta configurar NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" />
    );
  } else if (falhaMapa) {
    areaMapa = (
      <Aviso
        Icone={MapPinOff}
        titulo="Mapa indisponível"
        texto={`${falhaMapa} Recarregue a página; se persistir, avise o suporte.`}
      />
    );
  } else {
    areaMapa = (
      <>
        <MapaGoogle pontos={filtrados} enquadrar={doPeriodo ?? filtrados} chave={chave} aoFalhar={setFalhaMapa} />
        {filtrados.length === 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
            <p className="rounded-xl border border-border bg-card/95 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              Nenhuma ocorrência com localização neste filtro
            </p>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-foreground md:text-3xl">Mapa de Calor</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Concentração de ocorrências com localização nos últimos {dias} dias
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Select value={String(dias)} onValueChange={mudarPeriodo} disabled={carregando}>
            <SelectTrigger className="w-44 bg-card" aria-label="Período de referência">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODOS.map((p) => (
                <SelectItem key={p.dias} value={String(p.dias)}>
                  Últimos {p.rotulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={urgencia}
            onValueChange={(v) => setUrgencia(v as GrauUrgencia | 'TODAS')}
            disabled={carregando}
          >
            <SelectTrigger className="w-44 bg-card" aria-label="Urgência">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {URGENCIAS.map((u) => (
                <SelectItem key={u.valor} value={u.valor}>
                  {u.valor === 'TODAS' ? 'Todas as urgências' : `Urgência ${u.rotulo.toLowerCase()}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:gap-4">
          {cards
            ? cards.map(({ titulo, valor, descricao, Icone, alerta }) => (
                <div
                  key={titulo}
                  className={cn(
                    'rounded-2xl border bg-card px-5 py-4',
                    alerta ? 'border-destructive/40 bg-[#fdf3f2]' : 'border-border/70',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">{titulo}</p>
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg',
                        alerta ? 'bg-destructive/10 text-destructive' : 'bg-secondary text-primary',
                      )}
                    >
                      <Icone className="size-4" aria-hidden />
                    </span>
                  </div>
                  <p
                    className={cn(
                      'mt-1 font-heading text-3xl tabular-nums',
                      alerta ? 'text-destructive' : 'text-foreground',
                    )}
                  >
                    {fmtNumero.format(valor)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
                </div>
              ))
            : carregando &&
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-[7.5rem] rounded-2xl" />)}
        </div>

        <div className="relative h-[60dvh] min-h-[22rem] overflow-hidden rounded-2xl border border-border/70 bg-card">
          {areaMapa}
        </div>
      </div>
    </div>
  );
}
