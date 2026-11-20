'use client';

import { RotateCw, WifiOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api';
import { encerrarSessao, obterToken } from '@/lib/sessao';
import { buscarOcorrenciasDoPeriodo, type OcorrenciaDashboard } from './api';
import { CardsIndicadores } from './CardsIndicadores';
import { FiltroPeriodo } from './FiltroPeriodo';
import { GraficoOcorrenciasMensais } from './GraficoOcorrenciasMensais';
import { GraficoResgatesMensais } from './GraficoResgatesMensais';
import { GraficoTipoAnimal } from './GraficoTipoAnimal';
import { PERIODO_PADRAO_DIAS, consolidar, dataBr, ultimosDias, type Periodo } from './indicadores';
import { OcorrenciasPorStatus } from './OcorrenciasPorStatus';
import { CarregandoGrafico, Secao } from './Secao';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; ocorrencias: OcorrenciaDashboard[]; periodo: Periodo }
  | { tipo: 'erro'; mensagem: string };

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>(() => ultimosDias(PERIODO_PADRAO_DIAS));
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [recarga, setRecarga] = useState(0);

  // O layout do painel já redireciona quem não tem sessão; aqui só lemos o token para a API
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
    setToken(obterToken());
  }, []);

  const sair = useCallback(() => {
    encerrarSessao();
    router.replace('/admin/login');
  }, [router]);

  // Uma única busca por período: cards, gráficos e status saem da mesma lista
  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    buscarOcorrenciasDoPeriodo(periodo, token, controle.signal)
      .then((ocorrencias) => setEstado({ tipo: 'ok', ocorrencias, periodo }))
      .catch((erro) => {
        if (controle.signal.aborted) return;
        if (erro instanceof ApiError && erro.status === 401) return sair(); // token vencido
        setEstado({
          tipo: 'erro',
          mensagem: erro instanceof ApiError ? erro.message : 'Erro inesperado. Tente novamente.',
        });
      });
    return () => controle.abort();
  }, [token, periodo, recarga, sair]);

  const indicadores = useMemo(
    () => (estado.tipo === 'ok' ? consolidar(estado.ocorrencias, estado.periodo) : undefined),
    [estado],
  );

  function mudarPeriodo(novo: Periodo) {
    setEstado({ tipo: 'carregando' });
    setPeriodo(novo);
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

  return (
    <>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-foreground md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Período de referência: {dataBr(periodo.inicio)} a {dataBr(periodo.fim)}
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <FiltroPeriodo periodo={periodo} aoMudar={mudarPeriodo} desabilitado={carregando} />
            <Button variant="outline" onClick={atualizar} disabled={carregando} aria-label="Atualizar dados">
              <RotateCw className={carregando ? 'animate-spin' : undefined} />
            </Button>
          </div>
        </div>

        {estado.tipo === 'erro' ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <WifiOff className="mb-3 size-6 text-muted-foreground" aria-hidden />
            <p className="font-medium text-foreground">Não foi possível carregar os indicadores</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">{estado.mensagem}</p>
            <Button variant="outline" className="mt-5" onClick={atualizar}>
              <RotateCw /> Tentar de novo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <CardsIndicadores dados={indicadores} />

            <div className="grid gap-4 xl:grid-cols-5">
              <Secao className="xl:col-span-3" titulo="Ocorrências por mês" descricao="Registradas e concluídas em cada mês do período">
                {indicadores ? <GraficoOcorrenciasMensais dados={indicadores.porMes} /> : <CarregandoGrafico altura="h-72" />}
              </Secao>
              <Secao className="xl:col-span-2" titulo="Ocorrências por tipo de animal">
                {indicadores ? <GraficoTipoAnimal dados={indicadores.porAnimal} /> : <CarregandoGrafico altura="h-72" />}
              </Secao>
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <Secao className="xl:col-span-3" titulo="Resgates por mês" descricao="Ocorrências concluídas em cada mês do período">
                {indicadores ? <GraficoResgatesMensais dados={indicadores.porMes} /> : <CarregandoGrafico />}
              </Secao>
              <Secao className="xl:col-span-2" titulo="Ocorrências por status">
                {indicadores ? (
                  <OcorrenciasPorStatus dados={indicadores.porStatus} total={indicadores.total} />
                ) : (
                  <CarregandoGrafico />
                )}
              </Secao>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
