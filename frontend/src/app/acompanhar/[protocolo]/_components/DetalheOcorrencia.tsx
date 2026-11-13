'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Check,
  ClipboardCheck,
  Clock,
  MapPin,
  Phone,
  RotateCw,
  SearchX,
  Siren,
  Stethoscope,
  Truck,
  Users,
  WifiOff,
  type LucideIcon,
} from 'lucide-react';
import { CabecalhoPublico } from '@/components/cabecalho-publico';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, rastrearOcorrencia, type OcorrenciaStatus, type RastreioOcorrencia } from '@/lib/api';
import {
  CATEGORIAS,
  ETAPAS_OCORRENCIA,
  PROTOCOLO_REGEX,
  dataCompleta,
  dataRelativa,
  rotuloCategoria,
  rotuloStatus,
} from '@/lib/ocorrencia';
import { cn } from '@/lib/utils';

const TELEFONE = '0800 640-9999';

const ICONE_STATUS: Record<OcorrenciaStatus, LucideIcon> = {
  REGISTRADA: ClipboardCheck,
  TRIAGEM: Stethoscope,
  ATENDIMENTO: Truck,
  RESGATE: Siren,
  CONCLUIDO: Check,
};

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: RastreioOcorrencia }
  | { tipo: 'nao-encontrado' }
  | { tipo: 'erro'; mensagem: string };

export function DetalheOcorrencia({ protocolo }: { protocolo: string }) {
  const formatoValido = PROTOCOLO_REGEX.test(protocolo);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    if (!formatoValido) return;
    const controle = new AbortController();
    rastrearOcorrencia(protocolo, controle.signal)
      .then((dados) => setEstado({ tipo: 'ok', dados }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 404) setEstado({ tipo: 'nao-encontrado' });
        else setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [protocolo, formatoValido, tentativa]);

  function tentarDeNovo() {
    setEstado({ tipo: 'carregando' });
    setTentativa((t) => t + 1);
  }

  const atual: Estado = formatoValido ? estado : { tipo: 'nao-encontrado' };

  return (
    <>
      <CabecalhoPublico titulo="Detalhes da ocorrência" subtitulo={protocolo} voltar="/acompanhar" rotuloVoltar="Consultar outro protocolo" />
      <main className="mx-auto max-w-xl px-5 pt-6 pb-16">
        {atual.tipo === 'carregando' && <Carregando />}
        {atual.tipo === 'nao-encontrado' && (
          <Aviso
            Icone={SearchX}
            titulo="Protocolo não encontrado"
            texto={`Não encontramos a ocorrência ${protocolo}. Confira o número recebido no registro.`}
          />
        )}
        {atual.tipo === 'erro' && (
          <Aviso Icone={WifiOff} titulo="Não foi possível consultar" texto={atual.mensagem}>
            <Button variant="dark" className="h-12 w-full rounded-xl text-base font-semibold" onClick={tentarDeNovo}>
              <RotateCw /> Tentar de novo
            </Button>
          </Aviso>
        )}
        {atual.tipo === 'ok' && <Conteudo dados={atual.dados} />}

        <div className="mt-6 space-y-3">
          <Button asChild variant="outline" className="h-12 w-full rounded-xl bg-transparent text-base font-semibold">
            <Link href="/acompanhar">Consultar outro protocolo</Link>
          </Button>
          <Button asChild variant="secondary" className="h-12 w-full rounded-xl bg-muted text-base font-semibold text-foreground">
            <a href="tel:08006409999">
              <Phone /> Falar com a equipe · {TELEFONE}
            </a>
          </Button>
        </div>
      </main>
    </>
  );
}

function Conteudo({ dados }: { dados: RastreioOcorrencia }) {
  const ultima = dados.linhaDoTempo.at(-1)?.dataHora ?? dados.dataHoraRegistro;
  const IconeAtual = ICONE_STATUS[dados.ocorrenciaStatus];
  const categoria = CATEGORIAS.find((c) => c.valor === dados.categoriaAnimal);
  const animal = [rotuloCategoria(dados.categoriaAnimal), dados.especie].filter(Boolean).join(' — ');
  const local = dados.local ?? (dados.localPorGps ? 'Localização enviada por GPS' : 'Não informado');

  return (
    <div className="fade-up space-y-3">
      <section className="rounded-2xl bg-[#1c2b1a] px-6 py-6 text-center text-white" aria-label="Situação atual">
        <p className="text-[0.7rem] tracking-[0.2em] text-[#a8d5a2]/80 uppercase">Protocolo</p>
        <p className="mt-1 text-2xl font-semibold tracking-wider text-[#a8d5a2]" style={{ fontFamily: 'var(--font-display)' }}>
          {dados.protocolo}
        </p>
        <Badge className="mt-3 gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          <IconeAtual className="size-3.5" aria-hidden />
          {rotuloStatus(dados.ocorrenciaStatus)}
        </Badge>
        <p className="mt-3 text-xs text-[#b8c9b4]">Atualizado em {dataCompleta(ultima)}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Info icone={<span aria-hidden>{categoria?.icone ?? '🐾'}</span>} rotulo="Animal" valor={animal} />
        <Info icone={<MapPin className="size-4 text-cta" aria-hidden />} rotulo="Local" valor={local} />
        <Info icone={<Users className="size-4 text-primary" aria-hidden />} rotulo="Equipe" valor={dados.equipe ?? 'Ainda não definida'} />
        <Info icone={<Clock className="size-4 text-muted-foreground" aria-hidden />} rotulo="Aberto em" valor={dataCompleta(dados.dataHoraRegistro)} />
      </div>

      <LinhaDoTempo dados={dados} />
    </div>
  );
}

function Info({ icone, rotulo, valor }: { icone: React.ReactNode; rotulo: string; valor: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex h-5 items-center">{icone}</div>
      <p className="text-xs text-muted-foreground">{rotulo}</p>
      <p className="mt-0.5 text-sm leading-snug font-semibold text-foreground">{valor}</p>
    </div>
  );
}

function LinhaDoTempo({ dados }: { dados: RastreioOcorrencia }) {
  const indiceAtual = ETAPAS_OCORRENCIA.findIndex((e) => e.status === dados.ocorrenciaStatus);
  // última vez que a ocorrência entrou em cada status
  const quando = (s: OcorrenciaStatus) => dados.linhaDoTempo.filter((e) => e.status === s).at(-1)?.dataHora;

  return (
    <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="titulo-historico">
      <h2 id="titulo-historico" className="mb-5 text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-body)' }}>
        Histórico da ocorrência
      </h2>
      <ol>
        {ETAPAS_OCORRENCIA.map((etapa, i) => {
          const feita = i < indiceAtual || (i === indiceAtual && etapa.status === 'CONCLUIDO');
          const atual = i === indiceAtual && !feita;
          const pendente = i > indiceAtual;
          const Icone = ICONE_STATUS[etapa.status];
          const data = quando(etapa.status);
          const descricao =
            etapa.status === 'ATENDIMENTO' && dados.equipe ? `${dados.equipe} acionada para o atendimento.` : etapa.descricao;
          const ultima = i === ETAPAS_OCORRENCIA.length - 1;

          return (
            <li key={etapa.status} className="relative flex gap-4 pb-6 last:pb-0" aria-current={atual ? 'step' : undefined}>
              {!ultima && (
                <span
                  className={cn('absolute top-9 bottom-1 left-[17px] w-0.5 rounded', i < indiceAtual ? 'bg-primary' : 'bg-border')}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full',
                  feita && 'bg-primary text-primary-foreground',
                  atual && 'border-2 border-primary bg-card text-primary',
                  pendente && 'border border-border bg-muted text-muted-foreground/50',
                )}
              >
                {feita ? <Check className="size-4" strokeWidth={3} /> : <Icone className="size-4" aria-hidden />}
              </span>
              <div className="min-w-0 flex-1 pt-1">
                <p className={cn('flex items-center gap-2 text-sm font-semibold', pendente ? 'text-muted-foreground/60' : 'text-foreground')}>
                  {etapa.rotulo}
                  {atual && <span className="size-2 rounded-full bg-primary" aria-label="(etapa atual)" />}
                </p>
                <p className={cn('text-xs', pendente ? 'text-muted-foreground/50' : 'text-muted-foreground')}>
                  {pendente ? 'Aguardando etapa anterior' : data ? dataRelativa(data) : 'Etapa concluída'}
                </p>
                {!pendente && (
                  <p className="mt-2 rounded-lg border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{descricao}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function Carregando() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando ocorrência">
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  );
}

function Aviso({
  Icone,
  titulo,
  texto,
  children,
}: {
  Icone: LucideIcon;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="fade-up rounded-2xl border border-border bg-card px-6 py-10 text-center" role="alert">
      <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icone className="size-5" aria-hidden />
      </span>
      <h1 className="text-xl font-light text-foreground">{titulo}</h1>
      <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{texto}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
}
