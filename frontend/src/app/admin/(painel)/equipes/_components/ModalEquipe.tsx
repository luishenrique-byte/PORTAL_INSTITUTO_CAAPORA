'use client';

import { useEffect, useState } from 'react';
import { CircleAlert, RotateCw, X } from 'lucide-react';
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
import { ApiError, detalharEquipe, type EquipeDetalhe, type EquipeResumo, type OcorrenciaInterna } from '@/lib/api';
import { rotuloStatus } from '@/lib/ocorrencia';
import { BadgeStatusEquipe, localOcorrencia, nomeAnimal, plural } from './visual';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: EquipeDetalhe }
  | { tipo: 'erro'; mensagem: string };

interface Props {
  equipe: EquipeResumo | null; // null = modal fechado
  token: string;
  onFechar: () => void;
  onSessaoExpirada: () => void;
}

export function ModalEquipe({ equipe, token, onFechar, onSessaoExpirada }: Props) {
  return (
    <Dialog open={equipe !== null} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent
        showCloseButton={false}
        className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-lg grid-cols-[minmax(0,1fr)]"
      >
        {equipe && (
          // key: ao trocar de equipe o conteúdo recomeça do zero (busca os dados de novo)
          <Conteudo key={equipe.id} equipe={equipe} token={token} onSessaoExpirada={onSessaoExpirada} />
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

function Conteudo({ equipe, token, onSessaoExpirada }: Omit<Props, 'equipe' | 'onFechar'> & { equipe: EquipeResumo }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [tentativa, setTentativa] = useState(0);

  // Busca os dados sempre que o modal abre, para mostrar a situação atual da equipe
  useEffect(() => {
    const controle = new AbortController();
    detalharEquipe(equipe.id, token, controle.signal)
      .then((dados) => setEstado({ tipo: 'ok', dados }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return onSessaoExpirada();
        setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [equipe.id, token, tentativa, onSessaoExpirada]);

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
                setTentativa((t) => t + 1);
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

            <Secao titulo={`Em atendimento (${dados.resgatesEmAndamento.length})`}>
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

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{titulo}</h3>
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
