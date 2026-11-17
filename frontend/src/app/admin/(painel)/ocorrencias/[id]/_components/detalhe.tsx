'use client';

import { ArrowLeft, ExternalLink, Lock, MapPin, Phone, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, type OcorrenciaStatus } from '@/lib/api';
import {
  ETAPAS_OCORRENCIA,
  URGENCIAS,
  dataCompleta,
  rotuloCategoria,
  rotuloOrigem,
  rotuloSaude,
  rotuloStatus,
  rotuloUrgencia,
} from '@/lib/ocorrencia';
import {
  equipes,
  ocorrencias,
  urlMidia,
  type GrauUrgencia,
  type HistoricoStatus,
  type HistoricoUrgencia,
  type Ocorrencia,
} from '@/lib/painel';
import { Aviso, Bloco, ICONE_STATUS, SeloEquipe, SeloStatus, SeloUrgencia } from '../../../_components/elementos';
import { useSessao } from '../../../_components/sessao';
import { useConsulta } from '../../../_components/usar-consulta';

export function DetalheOcorrenciaPainel({ id }: { id: number }) {
  const { pode } = useSessao();
  const central = pode('ATENDENTE', 'COORDENADOR');

  const consulta = useConsulta(`ocorrencia-${id}`, async (signal) => {
    const [ocorrencia, historico, historicoUrgencia, disponiveis] = await Promise.all([
      ocorrencias.buscar(id, signal),
      ocorrencias.historico(id, signal),
      ocorrencias.historicoUrgencia(id, signal),
      central ? equipes.disponiveis(signal) : Promise.resolve([]),
    ]);
    return { ocorrencia, historico, historicoUrgencia, disponiveis };
  });

  const voltar = (
    <Link
      href="/admin/ocorrencias"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-4" /> Ocorrências
    </Link>
  );

  if (consulta.erro && !consulta.dados) {
    return (
      <>
        {voltar}
        <Aviso titulo="Não foi possível abrir a ocorrência" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      </>
    );
  }

  if (!consulta.dados) {
    return (
      <>
        {voltar}
        <Skeleton className="mb-6 h-16 w-80" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </>
    );
  }

  const { ocorrencia: o, historico, historicoUrgencia, disponiveis } = consulta.dados;

  return (
    <>
      {voltar}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs tracking-wider text-muted-foreground uppercase">Protocolo</p>
          <h1 className="font-heading text-2xl text-foreground md:text-[1.75rem]">{o.protocolo}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registrada em {dataCompleta(o.dataHoraRegistro)} · {rotuloOrigem(o.origemRegistro)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeloUrgencia urgencia={o.grauUrgencia} />
          <SeloStatus status={o.ocorrenciaStatus} />
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Bloco titulo="Animal">
            <dl className="grid gap-4 sm:grid-cols-3">
              <Dado rotulo="Tipo" valor={rotuloCategoria(o.animal?.categoriaAnimal ?? null)} />
              <Dado rotulo="Espécie" valor={o.animal?.especie || 'Não informada'} />
              <Dado rotulo="Estado de saúde" valor={rotuloSaude(o.animal?.saudeStatus)} />
            </dl>
            {o.descricao && (
              <div className="mt-4 border-t border-border/60 pt-4">
                <p className="mb-1 text-xs text-muted-foreground">Relato</p>
                <p className="text-sm whitespace-pre-line text-foreground">{o.descricao}</p>
              </div>
            )}
          </Bloco>

          <Bloco titulo="Local">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 size-4 shrink-0 text-cta" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-foreground">{o.endereco || 'Endereço não informado'}</p>
                {o.pontoReferencia && <p className="mt-0.5 text-muted-foreground">Referência: {o.pontoReferencia}</p>}
                {o.latitude !== null && o.longitude !== null && (
                  <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground">
                    <span className="font-mono text-xs">
                      {o.latitude.toFixed(5)}, {o.longitude.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${o.latitude}&mlon=${o.longitude}#map=17/${o.latitude}/${o.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      Abrir no mapa <ExternalLink className="size-3" />
                    </a>
                  </p>
                )}
              </div>
            </div>
          </Bloco>

          <Bloco titulo={`Fotos e vídeos${o.midias.length ? ` (${o.midias.length})` : ''}`}>
            {o.midias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum arquivo enviado.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {o.midias.map((m) =>
                  m.tipoMidia === 'VIDEO' ? (
                    <video key={m.id} src={urlMidia(m.url)} controls className="aspect-square w-full rounded-lg bg-black object-cover" />
                  ) : (
                    <a key={m.id} href={urlMidia(m.url)} target="_blank" rel="noreferrer" className="group block overflow-hidden rounded-lg bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element -- arquivo servido pela API, fora do next/image */}
                      <img
                        src={urlMidia(m.url)}
                        alt={`Foto da ocorrência ${o.protocolo}`}
                        className="aspect-square w-full object-cover transition-transform group-hover:scale-[1.03]"
                      />
                    </a>
                  ),
                )}
              </div>
            )}
          </Bloco>

          <Bloco titulo="Quem avisou">
            {!o.reportante ? (
              <p className="text-sm text-muted-foreground">Sem dados do comunicante.</p>
            ) : o.reportante.anonimo ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Lock className="size-4" /> Comunicante pediu anonimato. Os dados pessoais não foram guardados.
              </p>
            ) : (
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <span className="flex items-center gap-2 text-foreground">
                  <User className="size-4 text-muted-foreground" /> {o.reportante.nome || 'Nome não informado'}
                </span>
                {o.reportante.telefone && (
                  <a href={`tel:${o.reportante.telefone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Phone className="size-4" /> {o.reportante.telefone}
                  </a>
                )}
              </div>
            )}
          </Bloco>
        </div>

        <div className="space-y-4">
          <Acoes
            key={`${o.ocorrenciaStatus}-${o.equipe?.id ?? 0}`}
            ocorrencia={o}
            disponiveis={disponiveis}
            aoAlterar={consulta.recarregar}
          />
          <LinhaDoTempo historico={historico} urgencias={historicoUrgencia} />
        </div>
      </div>
    </>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rotulo}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{valor}</dd>
    </div>
  );
}

// ---------- Ações de atendimento ----------

function Acoes({
  ocorrencia: o,
  disponiveis,
  aoAlterar,
}: {
  ocorrencia: Ocorrencia;
  disponiveis: { id: number; nome: string }[];
  aoAlterar: () => void;
}) {
  const { usuario, pode } = useSessao();
  const central = pode('ATENDENTE', 'COORDENADOR');
  const [salvando, setSalvando] = useState<string | null>(null);
  const [confirmarConclusao, setConfirmarConclusao] = useState(false);

  const atual = ETAPAS_OCORRENCIA.findIndex((e) => e.status === o.ocorrenciaStatus);
  // A linha do tempo só anda para frente (regra do OcorrenciaService.atualizarStatus)
  const proximas = ETAPAS_OCORRENCIA.slice(atual + 1);
  const [status, setStatus] = useState<string>(proximas[0]?.status ?? '');
  const [equipe, setEquipe] = useState<string>('');

  const concluida = o.ocorrenciaStatus === 'CONCLUIDO';

  async function executar(acao: string, chamada: () => Promise<unknown>, sucesso: string) {
    setSalvando(acao);
    try {
      await chamada();
      toast.success(sucesso);
      aoAlterar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(null);
    }
  }

  const mudarStatus = (novo: OcorrenciaStatus) =>
    executar('status', () => ocorrencias.atualizarStatus(o.id, novo, usuario.id), `Status alterado para ${rotuloStatus(novo)}.`);

  if (concluida) {
    return (
      <Bloco titulo="Atendimento">
        <p className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lock className="mt-0.5 size-4 shrink-0" />
          Ocorrência concluída. Não pode mais ser alterada.
        </p>
        {o.equipe && <p className="mt-3 text-sm">Atendida pela <strong>{o.equipe.nome}</strong>.</p>}
      </Bloco>
    );
  }

  const precisaEquipe = status === 'RESGATE' && !o.equipe;
  const opcoesEquipe = disponiveis.filter((e) => e.id !== o.equipe?.id);

  return (
    <Bloco titulo="Atendimento">
      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Avançar etapa</p>
          <div className="flex gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="flex-1" aria-label="Próxima etapa">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {proximas.map((e) => (
                  <SelectItem key={e.status} value={e.status} disabled={e.status === 'RESGATE' && !o.equipe}>
                    {e.rotulo}
                    {e.status === 'RESGATE' && !o.equipe ? ' (precisa de equipe)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              disabled={!status || precisaEquipe || salvando !== null}
              onClick={() => (status === 'CONCLUIDO' ? setConfirmarConclusao(true) : mudarStatus(status as OcorrenciaStatus))}
            >
              {salvando === 'status' ? <Spinner /> : 'Salvar'}
            </Button>
          </div>
          {!o.equipe && (
            <p className="mt-1.5 text-xs text-muted-foreground">O resgate em campo só começa depois que uma equipe for designada.</p>
          )}
        </div>

        {central && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Grau de urgência</p>
            <Select
              value={o.grauUrgencia ?? undefined}
              disabled={salvando !== null}
              onValueChange={(v) =>
                executar(
                  'urgencia',
                  () => ocorrencias.alterarUrgencia(o.id, v as GrauUrgencia, usuario.id),
                  `Urgência alterada para ${rotuloUrgencia(v as GrauUrgencia)}.`,
                )
              }
            >
              <SelectTrigger className="w-full" aria-label="Grau de urgência">
                <SelectValue placeholder="Definir urgência" />
              </SelectTrigger>
              <SelectContent>
                {[...URGENCIAS].reverse().map((u) => (
                  <SelectItem key={u.valor} value={u.valor}>
                    {u.rotulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Equipe responsável</p>
          {o.equipe ? (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">{o.equipe.nome}</span>
              <SeloEquipe status={o.equipe.status} />
            </div>
          ) : (
            !central && <p className="text-sm text-muted-foreground">Ainda não definida.</p>
          )}
          {central &&
            (opcoesEquipe.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma outra equipe disponível no momento.</p>
            ) : (
              <div className="flex gap-2">
                <Select value={equipe} onValueChange={setEquipe}>
                  <SelectTrigger className="flex-1" aria-label="Equipe disponível">
                    <SelectValue placeholder={o.equipe ? 'Trocar por…' : 'Escolher equipe disponível'} />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesEquipe.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!equipe || salvando !== null}
                  onClick={() =>
                    executar(
                      'equipe',
                      () => ocorrencias.atribuirEquipe(o.id, Number(equipe), usuario.id).then(() => setEquipe('')),
                      'Equipe designada.',
                    )
                  }
                >
                  {salvando === 'equipe' ? <Spinner /> : o.equipe ? 'Trocar' : 'Designar'}
                </Button>
              </div>
            ))}
          {central && o.equipe && opcoesEquipe.length > 0 && (
            <p className="mt-1.5 text-xs text-muted-foreground">Ao trocar, a equipe atual volta a ficar disponível.</p>
          )}
        </div>
      </div>

      <AlertDialog open={confirmarConclusao} onOpenChange={setConfirmarConclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir a ocorrência {o.protocolo}?</AlertDialogTitle>
            <AlertDialogDescription>
              Depois de concluída, ela não pode mais ser alterada.
              {o.equipe ? ` A ${o.equipe.nome} volta a ficar disponível para novos chamados.` : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => mudarStatus('CONCLUIDO')}>Concluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Bloco>
  );
}

// ---------- Histórico (status + urgência) ----------

type Evento =
  | { tipo: 'status'; dataHora: string; item: HistoricoStatus }
  | { tipo: 'urgencia'; dataHora: string; item: HistoricoUrgencia };

function LinhaDoTempo({ historico, urgencias }: { historico: HistoricoStatus[]; urgencias: HistoricoUrgencia[] }) {
  const eventos: Evento[] = [
    ...historico.map((item) => ({ tipo: 'status' as const, dataHora: item.dataHora, item })),
    ...urgencias.map((item) => ({ tipo: 'urgencia' as const, dataHora: item.dataHora, item })),
  ].sort((a, b) => b.dataHora.localeCompare(a.dataHora));

  return (
    <Bloco titulo="Histórico">
      <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[0.6875rem] before:w-px before:bg-border">
        {eventos.map((e) => {
          if (e.tipo === 'status') {
            const Icone = ICONE_STATUS[e.item.statusMovimentacao];
            return (
              <li key={`s${e.item.id}`} className="relative flex gap-3">
                <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary text-primary ring-4 ring-card">
                  <Icone className="size-3.5" />
                </span>
                <div className="text-sm">
                  <p className="font-medium text-foreground">{rotuloStatus(e.item.statusMovimentacao)}</p>
                  <p className="text-xs text-muted-foreground">
                    {dataCompleta(e.dataHora)} · {e.item.responsavelNome ?? 'Portal público'}
                  </p>
                </div>
              </li>
            );
          }
          return (
            <li key={`u${e.item.id}`} className="relative flex gap-3">
              <span className="z-10 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted ring-4 ring-card">
                <span className="size-2 rounded-full bg-cta" />
              </span>
              <div className="text-sm">
                <p className="text-foreground">
                  Urgência: {rotuloUrgencia(e.item.urgenciaAnterior)} → <strong>{rotuloUrgencia(e.item.urgenciaNova)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {dataCompleta(e.dataHora)} · {e.item.responsavelNome ?? '—'}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </Bloco>
  );
}
