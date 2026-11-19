'use client';

import { Lock, RotateCw, WifiOff, type LucideIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  ApiError,
  buscarResumoDashboard,
  contarOcorrenciasPorCategoria,
  contarOcorrenciasPorMes,
  contarOcorrenciasPorStatus,
  listarOcorrenciasConcluidas,
  type Contagem,
  type DashboardResumo,
} from '@/lib/api';
import { encerrarSessao, obterToken } from '@/lib/sessao';
import { PainelAdmin } from '../PainelAdmin';
import { CardsIndicadores } from './CardsIndicadores';
import { agruparPorAnimal, inicioDosUltimosMeses, montarSerieMensal, type PontoMensal } from './dados';
import { GraficoOcorrenciasMensais } from './GraficoOcorrenciasMensais';
import { GraficoResgatesMensais } from './GraficoResgatesMensais';
import { GraficoTipoAnimal } from './GraficoTipoAnimal';
import { OcorrenciasPorStatus } from './OcorrenciasPorStatus';
import { CarregandoGrafico, Secao } from './Secao';

interface DadosGerais {
  resumo: DashboardResumo;
  porStatus: Contagem[];
  porCategoria: Contagem[];
}

type Estado<T> = { tipo: 'carregando' } | { tipo: 'ok'; dados: T } | { tipo: 'erro'; erro: unknown };

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [gerais, setGerais] = useState<Estado<DadosGerais>>({ tipo: 'carregando' });
  const [mensal, setMensal] = useState<Estado<PontoMensal[]>>({ tipo: 'carregando' });
  const [meses, setMeses] = useState(6);
  const [recarga, setRecarga] = useState(0);

  // Sem sessão válida, volta para o login (mesma regra das outras telas do painel)
  useEffect(() => {
    const t = obterToken();
    if (t) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
      setToken(t);
    } else {
      router.replace('/admin/login');
    }
  }, [router]);

  const sair = useCallback(() => {
    encerrarSessao();
    router.replace('/admin/login');
  }, [router]);

  // Cards, status e tipos de animal
  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    Promise.all([
      buscarResumoDashboard(token, controle.signal),
      contarOcorrenciasPorStatus(token, controle.signal),
      contarOcorrenciasPorCategoria(token, controle.signal),
    ])
      .then(([resumo, porStatus, porCategoria]) => setGerais({ tipo: 'ok', dados: { resumo, porStatus, porCategoria } }))
      .catch((erro) => {
        if (controle.signal.aborted) return;
        if (erro instanceof ApiError && erro.status === 401) return sair(); // token vencido
        setGerais({ tipo: 'erro', erro });
      });
    return () => controle.abort();
  }, [token, recarga, sair]);

  // Gráficos mensais (6 ou 12 meses)
  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();
    Promise.all([
      contarOcorrenciasPorMes(meses, token, controle.signal),
      listarOcorrenciasConcluidas(inicioDosUltimosMeses(meses), token, controle.signal),
    ])
      .then(([porMes, concluidas]) => setMensal({ tipo: 'ok', dados: montarSerieMensal(porMes, concluidas) }))
      .catch((erro) => {
        if (controle.signal.aborted) return;
        if (erro instanceof ApiError && erro.status === 401) return sair();
        setMensal({ tipo: 'erro', erro });
      });
    return () => controle.abort();
  }, [token, meses, recarga, sair]);

  function atualizar() {
    setGerais({ tipo: 'carregando' });
    setMensal({ tipo: 'carregando' });
    setRecarga((r) => r + 1);
  }

  function trocarPeriodo(valor: string) {
    if (!valor) return;
    setMensal({ tipo: 'carregando' });
    setMeses(Number(valor));
  }

  if (!token) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    );
  }

  const dadosGerais = gerais.tipo === 'ok' ? gerais.dados : undefined;
  const serieMensal = mensal.tipo === 'ok' ? mensal.dados : undefined;
  const carregando = gerais.tipo === 'carregando' || mensal.tipo === 'carregando';

  return (
    <PainelAdmin pagina="Dashboard" token={token} aoSair={sair}>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl text-foreground md:text-3xl">Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Visão geral das ocorrências, atendimentos e resgates do instituto.
            </p>
          </div>
          <Button variant="outline" onClick={atualizar} disabled={carregando}>
            <RotateCw className={carregando ? 'animate-spin' : undefined} /> Atualizar
          </Button>
        </div>

        {gerais.tipo === 'erro' ? (
          <ErroCarregamento erro={gerais.erro} aoTentarDeNovo={atualizar} />
        ) : (
          <div className="space-y-4">
            <CardsIndicadores resumo={dadosGerais?.resumo} />

            <div className="grid gap-4 xl:grid-cols-5">
              <Secao
                className="xl:col-span-3"
                titulo="Ocorrências por mês"
                descricao="Registradas e concluídas em cada mês"
                acao={
                  <ToggleGroup
                    type="single"
                    size="sm"
                    variant="outline"
                    value={String(meses)}
                    onValueChange={trocarPeriodo}
                    aria-label="Período dos gráficos mensais"
                  >
                    <ToggleGroupItem value="6" className="px-3">6 meses</ToggleGroupItem>
                    <ToggleGroupItem value="12" className="px-3">12 meses</ToggleGroupItem>
                  </ToggleGroup>
                }
              >
                {mensal.tipo === 'erro' ? (
                  <ErroGrafico />
                ) : serieMensal ? (
                  <GraficoOcorrenciasMensais dados={serieMensal} />
                ) : (
                  <CarregandoGrafico altura="h-72" />
                )}
              </Secao>

              <Secao className="xl:col-span-2" titulo="Ocorrências por tipo de animal">
                {dadosGerais ? (
                  <GraficoTipoAnimal dados={agruparPorAnimal(dadosGerais.porCategoria)} />
                ) : (
                  <CarregandoGrafico altura="h-72" />
                )}
              </Secao>
            </div>

            <div className="grid gap-4 xl:grid-cols-5">
              <Secao
                className="xl:col-span-3"
                titulo="Resgates realizados por mês"
                descricao="Ocorrências concluídas que tiveram equipe de campo designada"
              >
                {mensal.tipo === 'erro' ? (
                  <ErroGrafico />
                ) : serieMensal ? (
                  <GraficoResgatesMensais dados={serieMensal} />
                ) : (
                  <CarregandoGrafico />
                )}
              </Secao>

              <Secao className="xl:col-span-2" titulo="Ocorrências por status">
                {dadosGerais ? (
                  <OcorrenciasPorStatus
                    porStatus={dadosGerais.porStatus}
                    total={dadosGerais.resumo.totalOcorrencias}
                  />
                ) : (
                  <CarregandoGrafico />
                )}
              </Secao>
            </div>
          </div>
        )}
      </main>
    </PainelAdmin>
  );
}

function Aviso({ Icone, titulo, texto, children }: { Icone: LucideIcon; titulo: string; texto: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      <Icone className="mb-3 size-6 text-muted-foreground" aria-hidden />
      <p className="font-medium text-foreground">{titulo}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function ErroCarregamento({ erro, aoTentarDeNovo }: { erro: unknown; aoTentarDeNovo: () => void }) {
  // O backend libera o Dashboard só para COORDENADOR e ATENDENTE
  if (erro instanceof ApiError && erro.status === 403) {
    return (
      <Aviso
        Icone={Lock}
        titulo="Acesso restrito"
        texto="O Dashboard é liberado para a coordenação e o atendimento. Fale com a coordenação se precisar de acesso."
      />
    );
  }
  return (
    <Aviso
      Icone={WifiOff}
      titulo="Não foi possível carregar os indicadores"
      texto={erro instanceof ApiError ? erro.message : 'Erro inesperado. Tente novamente.'}
    >
      <Button variant="outline" onClick={aoTentarDeNovo}>
        <RotateCw /> Tentar de novo
      </Button>
    </Aviso>
  );
}

function ErroGrafico() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
      Não foi possível carregar este gráfico. Use “Atualizar” para tentar de novo.
    </div>
  );
}
