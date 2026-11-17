'use client';

import { ChevronRight, Pencil, Plus, RotateCw, Users } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ApiError } from '@/lib/api';
import { dataRelativa, rotuloCategoria, rotuloPerfil } from '@/lib/ocorrencia';
import { equipes, type EquipeDetalhe, type Ocorrencia } from '@/lib/painel';
import { iniciais } from '../../_components/cabecalho-painel';
import { Aviso, CabecalhoPagina, SeloEquipe, SeloStatus, SeloUrgencia } from '../../_components/elementos';
import { useSessao } from '../../_components/sessao';
import { useConsulta } from '../../_components/usar-consulta';

type Filtro = 'todas' | 'DISPONIVEL' | 'OCUPADO';

export function Equipes() {
  const { pode } = useSessao();
  const coordenador = pode('COORDENADOR');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [aberta, setAberta] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<{ id?: number; nome: string } | null>(null);

  const consulta = useConsulta('equipes', async (signal) => {
    const lista = await equipes.listar(signal);
    return Promise.all(lista.map((e) => equipes.detalhar(e.id, signal)));
  });

  const todas = [...(consulta.dados ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  const visiveis = todas.filter((e) => filtro === 'todas' || e.status === filtro);
  const livres = todas.filter((e) => e.status === 'DISPONIVEL').length;
  const detalhe = todas.find((e) => e.id === aberta) ?? null;

  return (
    <>
      <CabecalhoPagina titulo="Equipes" descricao="Equipes de campo, quem faz parte de cada uma e o que estão atendendo.">
        <Button variant="outline" size="icon" onClick={consulta.recarregar} aria-label="Atualizar equipes">
          <RotateCw className={consulta.carregando ? 'animate-spin' : undefined} />
        </Button>
        {coordenador && (
          <Button onClick={() => setFormulario({ nome: '' })}>
            <Plus /> Nova equipe
          </Button>
        )}
      </CabecalhoPagina>

      {consulta.erro && !consulta.dados ? (
        <Aviso titulo="Não foi possível carregar as equipes" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      ) : !consulta.dados ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : todas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50">
          <Aviso
            Icone={Users}
            titulo="Nenhuma equipe cadastrada"
            texto={coordenador ? 'Crie a primeira equipe de campo para poder designá-la às ocorrências.' : 'A coordenação ainda não cadastrou equipes.'}
          />
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <ToggleGroup type="single" variant="outline" value={filtro} onValueChange={(v) => v && setFiltro(v as Filtro)} aria-label="Filtrar equipes">
              <ToggleGroupItem value="todas" className="px-3">Todas · {todas.length}</ToggleGroupItem>
              <ToggleGroupItem value="DISPONIVEL" className="px-3">Disponíveis · {livres}</ToggleGroupItem>
              <ToggleGroupItem value="OCUPADO" className="px-3">Em atendimento · {todas.length - livres}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          {visiveis.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma equipe nesta situação.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visiveis.map((e) => (
                <CartaoEquipe key={e.id} equipe={e} aoAbrir={() => setAberta(e.id)} />
              ))}
            </div>
          )}
        </>
      )}

      <Sheet open={detalhe !== null} onOpenChange={(v) => !v && setAberta(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {detalhe && (
            <DetalheEquipe
              equipe={detalhe}
              aoRenomear={coordenador ? () => setFormulario({ id: detalhe.id, nome: detalhe.nome }) : undefined}
            />
          )}
        </SheetContent>
      </Sheet>

      <FormularioEquipe
        dados={formulario}
        aoFechar={() => setFormulario(null)}
        aoSalvar={() => {
          setFormulario(null);
          consulta.recarregar();
        }}
      />
    </>
  );
}

function Avatares({ membros }: { membros: EquipeDetalhe['membros'] }) {
  if (!membros.length) return <span className="text-xs text-muted-foreground">Sem membros</span>;
  return (
    <div className="flex items-center">
      {membros.slice(0, 4).map((m) => (
        <span
          key={m.id}
          title={m.nome}
          className="-ml-1.5 flex size-7 items-center justify-center rounded-full bg-secondary text-[0.65rem] font-semibold text-primary ring-2 ring-card first:ml-0"
        >
          {iniciais(m.nome)}
        </span>
      ))}
      {membros.length > 4 && <span className="ml-1.5 text-xs text-muted-foreground">+{membros.length - 4}</span>}
    </div>
  );
}

function CartaoEquipe({ equipe: e, aoAbrir }: { equipe: EquipeDetalhe; aoAbrir: () => void }) {
  const atual = e.resgatesEmAndamento[0];
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className="group flex flex-col rounded-xl border border-border/70 bg-card p-5 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-sans text-base font-semibold text-foreground">{e.nome}</h2>
        <SeloEquipe status={e.status} />
      </div>

      <div className="mt-4 min-h-[3.25rem] rounded-lg bg-muted/50 px-3 py-2.5 text-sm">
        {atual ? (
          <>
            <p className="text-xs text-muted-foreground">Atendendo agora</p>
            <p className="mt-0.5 truncate text-foreground">
              <span className="font-mono text-[0.8rem]">{atual.protocolo}</span> · {rotuloCategoria(atual.animal?.categoriaAnimal ?? null)}
            </p>
          </>
        ) : (
          <p className="py-1.5 text-muted-foreground">Livre para novos chamados</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Avatares membros={e.membros} />
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {e.historicoRecente.length} {e.historicoRecente.length === 1 ? 'atendimento recente' : 'atendimentos recentes'}
          <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

function ListaOcorrencias({ itens, vazio }: { itens: Ocorrencia[]; vazio: string }) {
  if (!itens.length) return <p className="text-sm text-muted-foreground">{vazio}</p>;
  return (
    <ul className="divide-y divide-border/60">
      {itens.map((o) => (
        <li key={o.id}>
          <Link href={`/admin/ocorrencias/${o.id}`} className="flex items-center gap-3 py-2.5 hover:opacity-80">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.8rem] text-foreground">{o.protocolo}</p>
              <p className="text-xs text-muted-foreground">
                {rotuloCategoria(o.animal?.categoriaAnimal ?? null)} · {dataRelativa(o.dataHoraRegistro)}
              </p>
            </div>
            {o.ocorrenciaStatus === 'CONCLUIDO' ? <SeloUrgencia urgencia={o.grauUrgencia} /> : <SeloStatus status={o.ocorrenciaStatus} />}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function DetalheEquipe({ equipe: e, aoRenomear }: { equipe: EquipeDetalhe; aoRenomear?: () => void }) {
  return (
    <>
      <SheetHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <SheetTitle className="font-heading text-xl font-normal">{e.nome}</SheetTitle>
          {aoRenomear && (
            <Button variant="ghost" size="icon-sm" onClick={aoRenomear} aria-label="Renomear equipe">
              <Pencil />
            </Button>
          )}
        </div>
        <SheetDescription asChild>
          <div>
            <SeloEquipe status={e.status} />
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-6 px-4 pb-8">
        <section>
          <h3 className="mb-2 font-sans text-sm font-semibold">Membros ({e.membros.length})</h3>
          {e.membros.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum funcionário ativo nesta equipe.</p>
          ) : (
            <ul className="space-y-2">
              {e.membros.map((m) => (
                <li key={m.id} className="flex items-center gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                    {iniciais(m.nome)}
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="truncate text-sm text-foreground">{m.nome}</p>
                    <p className="truncate text-xs text-muted-foreground">{rotuloPerfil(m.perfil?.perfil)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="mb-1 font-sans text-sm font-semibold">Resgates em andamento</h3>
          <ListaOcorrencias itens={e.resgatesEmAndamento} vazio="Nenhum no momento." />
        </section>

        <section>
          <h3 className="mb-1 font-sans text-sm font-semibold">Últimos atendimentos concluídos</h3>
          <ListaOcorrencias itens={e.historicoRecente} vazio="A equipe ainda não concluiu atendimentos." />
        </section>
      </div>
    </>
  );
}

function FormularioEquipe({
  dados,
  aoFechar,
  aoSalvar,
}: {
  dados: { id?: number; nome: string } | null;
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [aberto, setAberto] = useState<typeof dados>(null);

  // Ao abrir, preenche com o nome atual (renomear) ou vazio (nova)
  if (dados !== aberto) {
    setAberto(dados);
    setNome(dados?.nome ?? '');
  }

  async function salvar(ev: FormEvent) {
    ev.preventDefault();
    if (!nome.trim() || !dados) return;
    setSalvando(true);
    try {
      if (dados.id) await equipes.renomear(dados.id, nome.trim());
      else await equipes.criar(nome.trim());
      toast.success(dados.id ? 'Equipe renomeada.' : `${nome.trim()} criada. Ela já está disponível para chamados.`);
      aoSalvar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={dados !== null} onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={salvar}>
          <DialogHeader>
            <DialogTitle>{dados?.id ? 'Renomear equipe' : 'Nova equipe'}</DialogTitle>
            <DialogDescription>
              {dados?.id ? 'O novo nome aparece nas ocorrências e na consulta pública.' : 'Toda equipe nova começa disponível. Os membros são definidos no cadastro de funcionários.'}
            </DialogDescription>
          </DialogHeader>
          <Input
            className="my-5"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Equipe Alfa"
            aria-label="Nome da equipe"
            autoFocus
            required
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!nome.trim() || salvando}>
              {salvando ? <Spinner /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
