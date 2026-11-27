'use client';

import { useCallback, useEffect, useState } from 'react';
import { CircleAlert, Link2, RotateCw, UserMinus, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ApiError,
  definirEquipeDoFuncionario,
  detalharEquipe,
  listarFuncionarios,
  listarOcorrenciasEmAberto,
  vincularEquipe,
  type EquipeDetalhe,
  type EquipeResumo,
  type OcorrenciaInterna,
} from '@/lib/api';
import { rotuloStatus } from '@/lib/ocorrencia';
import { ehCoordenador, ehEquipeDeCampo, useSessaoPainel } from '../../_components/UsuarioContexto';
import { NovoFuncionario } from './NovoFuncionario';
import { SelecionarItens, type ItemSelecionavel } from './SelecionarItens';
import { BadgeStatusEquipe, localOcorrencia, nomeAnimal, plural } from './visual';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: EquipeDetalhe }
  | { tipo: 'erro'; mensagem: string };

const ROTULO_PERFIL: Record<string, string> = {
  COORDENADOR: 'Coordenador',
  ATENDENTE: 'Atendente',
  EQUIPE_CAMPO: 'Equipe de campo',
};

interface Props {
  equipe: EquipeResumo | null; // null = modal fechado
  equipes: EquipeResumo[]; // para o cadastro de funcionário escolher a equipe
  onFechar: () => void;
}

export function ModalEquipe({ equipe, equipes, onFechar }: Props) {
  return (
    <Dialog open={equipe !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg grid-cols-[minmax(0,1fr)]"
      >
        {equipe && (
          // key: ao trocar de equipe o conteúdo recomeça do zero (busca os dados de novo)
          <Conteudo key={equipe.id} equipe={equipe} equipes={equipes} />
        )}
        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Fechar">
            <X />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}

// Junta as falhas de uma ação em lote numa mensagem só
async function emLote(ids: number[], acao: (id: number) => Promise<unknown>) {
  const falhas: string[] = [];
  for (const id of ids) {
    try {
      await acao(id);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) throw e;
      falhas.push(e instanceof ApiError ? e.message : 'erro inesperado');
    }
  }
  return falhas;
}

function Conteudo({ equipe, equipes }: { equipe: EquipeResumo; equipes: EquipeResumo[] }) {
  const { token, usuario, sair } = useSessaoPainel();
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);
  const [aberto, setAberto] = useState<null | 'membros' | 'ocorrencias' | 'novo'>(null);
  const [itens, setItens] = useState<ItemSelecionavel[] | null>(null);
  const [erroItens, setErroItens] = useState<string | null>(null);
  const [removendo, setRemovendo] = useState<number | null>(null);

  const podeGerirMembros = ehCoordenador(usuario);
  const podeVincular = !ehEquipeDeCampo(usuario);
  const recarregar = useCallback(() => setTentativa((t) => t + 1), []);

  // Busca os dados sempre que o modal abre, para mostrar a situação atual da equipe
  useEffect(() => {
    const controle = new AbortController();
    detalharEquipe(equipe.id, token, controle.signal)
      .then((dados) => setEstado({ tipo: 'ok', dados }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return sair();
        setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [equipe.id, token, tentativa, sair]);

  // Lista do modal de seleção: funcionários de fora da equipe ou ocorrências em aberto de outras equipes
  useEffect(() => {
    if (aberto !== 'membros' && aberto !== 'ocorrencias') return;
    const controle = new AbortController();
    const carga =
      aberto === 'membros'
        ? listarFuncionarios(token, controle.signal).then((lista) =>
            lista
              .filter((f) => f.equipe?.id !== equipe.id)
              .map<ItemSelecionavel>((f) => ({
                id: f.id,
                titulo: f.nome,
                detalhe: `${ROTULO_PERFIL[f.perfil?.perfil ?? ''] ?? f.perfil?.perfil ?? 'Sem perfil'} · ${f.email}`,
                observacao: f.equipe ? `Hoje na ${f.equipe.nome}: será transferido` : undefined,
              })),
          )
        : listarOcorrenciasEmAberto(token, controle.signal).then((lista) =>
            lista
              .filter((o) => o.equipe?.id !== equipe.id)
              .map<ItemSelecionavel>((o) => ({
                id: o.id,
                titulo: o.protocolo,
                detalhe: `${nomeAnimal(o)} — ${localOcorrencia(o)} · ${rotuloStatus(o.ocorrenciaStatus)}`,
                observacao: o.equipe ? `Hoje com a ${o.equipe.nome}: será transferida` : undefined,
              })),
          );
    carga
      .then(setItens)
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return sair();
        setErroItens(e instanceof ApiError ? e.message : 'Não foi possível carregar a lista.');
      });
    return () => controle.abort();
  }, [aberto, equipe.id, token, sair]);

  function abrir(qual: 'membros' | 'ocorrencias' | 'novo') {
    setItens(null);
    setErroItens(null);
    setAberto(qual);
  }

  async function adicionarMembros(ids: number[]) {
    const falhas = await emLote(ids, (id) => definirEquipeDoFuncionario(id, equipe.id, token)).catch(() => sair());
    recarregar();
    if (falhas && falhas.length) throw new Error(`${falhas.length} não puderam ser adicionados: ${falhas[0]}`);
    toast.success(`${plural(ids.length, 'pessoa adicionada', 'pessoas adicionadas')} à ${equipe.nome}.`);
  }

  async function vincularOcorrencias(ids: number[]) {
    const falhas = await emLote(ids, (id) => vincularEquipe(id, equipe.id, usuario.id, token)).catch(() => sair());
    recarregar();
    if (falhas && falhas.length) throw new Error(`${falhas.length} não puderam ser vinculadas: ${falhas[0]}`);
    toast.success(`${plural(ids.length, 'ocorrência vinculada', 'ocorrências vinculadas')} à ${equipe.nome}.`);
  }

  async function removerMembro(id: number, nome: string) {
    setRemovendo(id);
    try {
      await definirEquipeDoFuncionario(id, null, token);
      toast.success(`${nome} saiu da ${equipe.nome}.`);
      recarregar();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return sair();
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível remover agora.');
    } finally {
      setRemovendo(null);
    }
  }

  // Enquanto carrega, o cabeçalho já mostra o que veio do card
  const dados = estado.tipo === 'ok' ? estado.dados : null;
  const regiao = (dados?.regiao ?? equipe.regiao) || 'Região não informada';
  const membros = dados ? dados.membros.length : equipe.membros;

  return (
    <>
      <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pb-5">
        <DialogTitle className="pr-8 font-heading text-2xl leading-tight font-normal">{equipe.nome}</DialogTitle>
        <DialogDescription className="text-sm">
          {regiao} · {plural(membros, 'membro', 'membros')}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 px-6 py-5">
        {estado.tipo === 'carregando' && <Carregando />}

        {estado.tipo === 'erro' && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <CircleAlert className="size-4" /> Não foi possível carregar a equipe
            </p>
            <p className="mt-1 text-muted-foreground">{estado.mensagem}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setEstado({ tipo: 'carregando' });
                recarregar();
              }}
            >
              <RotateCw /> Tentar de novo
            </Button>
          </div>
        )}

        {dados && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Resumo rotulo="Status">
                <BadgeStatusEquipe status={dados.status} />
              </Resumo>
              <Resumo rotulo="Telefone">
                <span className="whitespace-nowrap">{dados.telefone || 'Não cadastrado'}</span>
              </Resumo>
              <Resumo rotulo="Ativos">{dados.resgatesEmAndamento.length}</Resumo>
              <Resumo rotulo="Histórico total">{dados.totalConcluidos}</Resumo>
            </div>

            <Secao
              titulo={`Membros (${dados.membros.length})`}
              acao={
                podeGerirMembros && (
                  <Button variant="outline" size="sm" onClick={() => abrir('membros')}>
                    <UserPlus /> Adicionar
                  </Button>
                )
              }
            >
              {dados.membros.length === 0 ? (
                <Vazio texto="Ninguém nesta equipe ainda." />
              ) : (
                dados.membros.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground">
                        {m.nome.trim().charAt(0)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{m.nome}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {ROTULO_PERFIL[m.perfil?.perfil ?? ''] ?? m.perfil?.perfil ?? ''}
                          {m.email ? ` · ${m.email}` : ''}
                        </p>
                      </div>
                    </div>
                    {podeGerirMembros && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Tirar ${m.nome} da equipe`}
                        title="Tirar da equipe"
                        disabled={removendo === m.id}
                        onClick={() => removerMembro(m.id, m.nome)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus />
                      </Button>
                    )}
                  </li>
                ))
              )}
            </Secao>

            <Secao
              titulo={`Em atendimento (${dados.resgatesEmAndamento.length})`}
              acao={
                podeVincular && (
                  <Button variant="outline" size="sm" onClick={() => abrir('ocorrencias')}>
                    <Link2 /> Vincular ocorrências
                  </Button>
                )
              }
            >
              {dados.resgatesEmAndamento.length === 0 ? (
                <Vazio texto="Nenhuma ocorrência em andamento." />
              ) : (
                dados.resgatesEmAndamento.map((o) => (
                  <ItemOcorrencia key={o.id} ocorrencia={o}>
                    <Badge className="h-6 shrink-0 rounded-full bg-[#fdf0e6] px-2.5 text-xs font-semibold text-[#a8410f]">
                      {rotuloStatus(o.ocorrenciaStatus)}
                    </Badge>
                  </ItemOcorrencia>
                ))
              )}
            </Secao>

            <Secao titulo="Histórico recente">
              {dados.historicoRecente.length === 0 ? (
                <Vazio texto="Nenhum atendimento concluído ainda." />
              ) : (
                dados.historicoRecente.map((o) => (
                  <ItemOcorrencia key={o.id} ocorrencia={o} mostrarLocal={false}>
                    <Badge className="h-6 shrink-0 rounded-full bg-[#e4f2e1] px-2.5 text-xs font-semibold text-[#22622a]">
                      Concluído
                    </Badge>
                  </ItemOcorrencia>
                ))
              )}
            </Secao>
          </>
        )}
      </div>

      <SelecionarItens
        aberto={aberto === 'membros'}
        titulo="Adicionar membros"
        descricao={`Escolha quem passa a fazer parte da ${equipe.nome}.`}
        itens={aberto === 'membros' ? itens : null}
        erroCarga={erroItens}
        textoVazio="Todos os funcionários ativos já estão nesta equipe."
        rotuloAcao={(n) => (n > 1 ? `Adicionar ${n} pessoas` : 'Adicionar')}
        rodape={
          <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => abrir('novo')}>
            Cadastrar novo funcionário
          </button>
        }
        onFechar={() => setAberto(null)}
        onConfirmar={adicionarMembros}
      />

      <SelecionarItens
        aberto={aberto === 'ocorrencias'}
        titulo="Vincular ocorrências"
        descricao={`Marque uma ou mais ocorrências em aberto para a ${equipe.nome} atender.`}
        itens={aberto === 'ocorrencias' ? itens : null}
        erroCarga={erroItens}
        textoVazio="Não há ocorrências em aberto fora desta equipe."
        rotuloAcao={(n) => (n > 1 ? `Vincular ${n} ocorrências` : 'Vincular')}
        onFechar={() => setAberto(null)}
        onConfirmar={vincularOcorrencias}
      />

      <NovoFuncionario
        aberto={aberto === 'novo'}
        token={token}
        equipes={equipes}
        equipeInicial={equipe.id}
        onFechar={() => setAberto(null)}
        onCriado={recarregar}
        onSessaoExpirada={sair}
      />
    </>
  );
}

function Resumo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 px-4 py-3">
      <p className="text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">{rotulo}</p>
      <div className="mt-1 text-base font-semibold text-foreground">{children}</div>
    </div>
  );
}

function Secao({ titulo, acao, children }: { titulo: string; acao?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2.5 flex min-h-8 items-center justify-between gap-3">
        <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{titulo}</h3>
        {acao}
      </div>
      <ul className="space-y-2">{children}</ul>
    </section>
  );
}

function ItemOcorrencia({
  ocorrencia,
  mostrarLocal = true,
  children,
}: {
  ocorrencia: OcorrenciaInterna;
  mostrarLocal?: boolean;
  children: React.ReactNode;
}) {
  const descricao = mostrarLocal
    ? `${nomeAnimal(ocorrencia)} — ${localOcorrencia(ocorrencia)}`
    : nomeAnimal(ocorrencia);
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold tracking-wide whitespace-nowrap text-foreground tabular-nums">{ocorrencia.protocolo}</p>
        <p className="truncate text-sm text-muted-foreground">{descricao}</p>
      </div>
      {children}
    </li>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <li className="rounded-xl bg-muted/40 px-4 py-3 text-sm text-muted-foreground">{texto}</li>;
}

function Carregando() {
  return (
    <div className="space-y-6" aria-label="Carregando dados da equipe">
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
    </div>
  );
}
