'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  MapPin,
  Navigation,
  Phone,
  RotateCw,
  Siren,
  Truck,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import {
  ApiError,
  avancarStatus,
  detalharEquipe,
  type EquipeDetalhe,
  type OcorrenciaInterna,
  type OcorrenciaStatus,
} from '@/lib/api';
import { dataRelativa, rotuloStatus } from '@/lib/ocorrencia';
import { cn } from '@/lib/utils';
import { useSessaoPainel } from '../../_components/UsuarioContexto';
import { BadgeStatusEquipe, localOcorrencia, nomeAnimal, plural } from '../../equipes/_components/visual';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: EquipeDetalhe }
  | { tipo: 'erro'; mensagem: string };

// O que a equipe de campo pode fazer em cada etapa
function proximaAcao(status: OcorrenciaStatus): { status: OcorrenciaStatus; rotulo: string } | null {
  if (status === 'RESGATE') return { status: 'CONCLUIDO', rotulo: 'Concluir resgate' };
  if (status === 'REGISTRADA' || status === 'TRIAGEM' || status === 'ATENDIMENTO') {
    return { status: 'RESGATE', rotulo: 'Iniciar resgate' };
  }
  return null;
}

const URGENCIA: Record<string, { rotulo: string; classe: string }> = {
  CRITICA: { rotulo: 'Crítica', classe: 'bg-red-100 text-red-800' },
  ALTA: { rotulo: 'Alta', classe: 'bg-orange-100 text-orange-800' },
  MEDIA: { rotulo: 'Média', classe: 'bg-amber-100 text-amber-800' },
  BAIXA: { rotulo: 'Baixa', classe: 'bg-emerald-100 text-emerald-800' },
};

// Abre o GPS do celular: coordenadas quando houver, senão o endereço digitado
function linkDoMapa(o: OcorrenciaInterna) {
  if (o.latitude != null && o.longitude != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`;
  }
  const endereco = [o.endereco, o.pontoReferencia].filter(Boolean).join(', ');
  return endereco ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}` : null;
}

export default function MinhaEquipe() {
  const { token, usuario, sair } = useSessaoPainel();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const [verConcluidas, setVerConcluidas] = useState(false);
  const [confirmar, setConfirmar] = useState<OcorrenciaInterna | null>(null);
  const [salvando, setSalvando] = useState<number | null>(null);

  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);
  const equipeId = usuario.equipeId;

  useEffect(() => {
    if (equipeId === null) return;
    const controle = new AbortController();
    detalharEquipe(equipeId, token, controle.signal)
      .then((dados) => setEstado({ tipo: 'ok', dados }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return sair();
        setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [equipeId, token, tentativa, sair]);

  async function avancar(o: OcorrenciaInterna) {
    const acao = proximaAcao(o.ocorrenciaStatus);
    if (!acao) return;
    setSalvando(o.id);
    try {
      await avancarStatus(o.id, acao.status, usuario.id, token);
      toast.success(acao.status === 'CONCLUIDO' ? `${o.protocolo} concluída.` : `Resgate da ${o.protocolo} iniciado.`);
      recarregar();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return sair();
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível atualizar agora.');
    } finally {
      setSalvando(null);
      setConfirmar(null);
    }
  }

  if (equipeId === null) {
    return (
      <Pagina titulo="Minha equipe" subtitulo={`Olá, ${usuario.nome.split(' ')[0]}.`}>
        <Aviso Icone={Users} titulo="Você ainda não está em uma equipe">
          Peça à coordenação para incluir você em uma equipe de campo. Assim que isso acontecer, os atendimentos da equipe
          aparecem aqui.
        </Aviso>
      </Pagina>
    );
  }

  const dados = estado.tipo === 'ok' ? estado.dados : null;
  const emAndamento = dados
    ? [...dados.resgatesEmAndamento].sort((a, b) => Number(b.ocorrenciaStatus === 'RESGATE') - Number(a.ocorrenciaStatus === 'RESGATE'))
    : [];

  return (
    <Pagina
      titulo={dados?.nome ?? usuario.nomeEquipe ?? 'Minha equipe'}
      subtitulo={
        dados
          ? `${dados.regiao || 'Região não informada'} · ${plural(dados.resgatesEmAndamento.length, 'atendimento em andamento', 'atendimentos em andamento')}`
          : 'Carregando atendimentos…'
      }
      acao={
        <Button variant="outline" onClick={recarregar} disabled={estado.tipo === 'carregando'}>
          <RotateCw /> Atualizar
        </Button>
      }
    >
      {estado.tipo === 'carregando' && (
        <div className="space-y-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
      )}

      {estado.tipo === 'erro' && (
        <Aviso Icone={CircleAlert} titulo="Não foi possível carregar sua equipe">
          {estado.mensagem}
          <div className="mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setEstado({ tipo: 'carregando' });
                recarregar();
              }}
            >
              <RotateCw /> Tentar de novo
            </Button>
          </div>
        </Aviso>
      )}

      {dados && (
        <div className="space-y-8">
          <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
            <BadgeStatusEquipe status={dados.status} />
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="size-4 text-primary" aria-hidden />
              {dados.telefone || 'Telefone não cadastrado'}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="size-4 text-primary" aria-hidden />
              {dados.membros.length === 0 ? 'Sem membros' : dados.membros.map((m) => m.nome.split(' ')[0]).join(', ')}
            </p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="size-4 text-primary" aria-hidden />
              {plural(dados.totalConcluidos, 'resgate concluído', 'resgates concluídos')}
            </p>
          </section>

          <section aria-labelledby="titulo-andamento">
            <h2 id="titulo-andamento" className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Em atendimento ({emAndamento.length})
            </h2>
            {emAndamento.length === 0 ? (
              <Aviso Icone={Truck} titulo="Nenhum atendimento no momento">
                Quando a central vincular uma ocorrência à sua equipe, ela aparece aqui.
              </Aviso>
            ) : (
              <ul className="grid gap-4 lg:grid-cols-2">
                {emAndamento.map((o) => (
                  <CardAtendimento
                    key={o.id}
                    ocorrencia={o}
                    salvando={salvando === o.id}
                    onAvancar={() => (proximaAcao(o.ocorrenciaStatus)?.status === 'CONCLUIDO' ? setConfirmar(o) : avancar(o))}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Concluídas ficam escondidas por padrão para a lista mostrar só o que falta fazer */}
          <section>
            <Button
              variant="ghost"
              className="-ml-3 text-muted-foreground"
              aria-expanded={verConcluidas}
              onClick={() => setVerConcluidas((v) => !v)}
            >
              <ChevronDown className={cn('transition-transform', verConcluidas && 'rotate-180')} />
              {verConcluidas ? 'Esconder concluídas' : `Mostrar concluídas recentes (${dados.historicoRecente.length})`}
            </Button>
            {verConcluidas && (
              <ul className="mt-2 space-y-2">
                {dados.historicoRecente.length === 0 ? (
                  <li className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">Nenhum resgate concluído ainda.</li>
                ) : (
                  dados.historicoRecente.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold tabular-nums text-foreground">{o.protocolo}</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {nomeAnimal(o)} — {localOcorrencia(o)}
                        </p>
                      </div>
                      <Badge className="h-6 shrink-0 rounded-full bg-[#e4f2e1] px-2.5 text-xs font-semibold text-[#22622a]">
                        Concluído
                      </Badge>
                    </li>
                  ))
                )}
              </ul>
            )}
          </section>
        </div>
      )}

      <AlertDialog open={confirmar !== null} onOpenChange={(a) => !a && salvando === null && setConfirmar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir o resgate {confirmar?.protocolo}?</AlertDialogTitle>
            <AlertDialogDescription>
              A ocorrência sai da lista de atendimentos e não pode mais ser alterada. Confirme só depois de finalizar o resgate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={salvando !== null}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              disabled={salvando !== null}
              onClick={(e) => {
                e.preventDefault(); // mantém aberto até a API responder
                if (confirmar) avancar(confirmar);
              }}
            >
              {salvando !== null ? (
                <>
                  <Spinner /> Concluindo…
                </>
              ) : (
                'Concluir resgate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Pagina>
  );
}

function CardAtendimento({
  ocorrencia: o,
  salvando,
  onAvancar,
}: {
  ocorrencia: OcorrenciaInterna;
  salvando: boolean;
  onAvancar: () => void;
}) {
  const acao = proximaAcao(o.ocorrenciaStatus);
  const urgencia = o.grauUrgencia ? URGENCIA[o.grauUrgencia] : null;
  const mapa = linkDoMapa(o);
  const emCampo = o.ocorrenciaStatus === 'RESGATE';

  return (
    <li
      className={cn(
        'flex flex-col rounded-2xl border bg-card p-5 shadow-sm',
        emCampo ? 'border-[#e8a87c] ring-1 ring-[#e8a87c]/40' : 'border-border/70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide tabular-nums text-foreground">{o.protocolo}</p>
          <h3 className="mt-0.5 truncate font-heading text-lg text-foreground">{nomeAnimal(o)}</h3>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge className="h-6 rounded-full bg-[#fdf0e6] px-2.5 text-xs font-semibold text-[#a8410f]">
            {emCampo && <Siren className="size-3.5" aria-hidden />}
            {rotuloStatus(o.ocorrenciaStatus)}
          </Badge>
          {urgencia && (
            <Badge className={cn('h-6 rounded-full px-2.5 text-xs font-semibold', urgencia.classe)}>Urgência {urgencia.rotulo}</Badge>
          )}
        </div>
      </div>

      <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <span>
          {o.endereco || (o.latitude != null ? 'Localização por GPS' : 'Local não informado')}
          {o.pontoReferencia && <span className="block text-xs">Ref.: {o.pontoReferencia}</span>}
        </span>
      </p>
      {o.descricao && <p className="mt-2 line-clamp-3 text-sm text-foreground/80">{o.descricao}</p>}
      <p className="mt-2 text-xs text-muted-foreground">Registrada {dataRelativa(o.dataHoraRegistro)}</p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border/60 pt-4">
        {mapa && (
          <Button variant="outline" asChild>
            <a href={mapa} target="_blank" rel="noopener noreferrer">
              <Navigation /> Abrir no mapa
            </a>
          </Button>
        )}
        {acao && (
          <Button onClick={onAvancar} disabled={salvando} className="ml-auto">
            {salvando ? <Spinner /> : acao.status === 'CONCLUIDO' ? <CheckCircle2 /> : <Truck />}
            {acao.rotulo}
          </Button>
        )}
      </div>
    </li>
  );
}

function Pagina({
  titulo,
  subtitulo,
  acao,
  children,
}: {
  titulo: string;
  subtitulo: string;
  acao?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl text-foreground md:text-4xl">{titulo}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitulo}</p>
        </div>
        {acao}
      </header>
      {children}
    </div>
  );
}

function Aviso({ Icone, titulo, children }: { Icone: typeof Users; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <Icone className="size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-heading text-lg text-foreground">{titulo}</p>
      <div className="mt-1 max-w-md text-sm text-muted-foreground">{children}</div>
    </div>
  );
}
