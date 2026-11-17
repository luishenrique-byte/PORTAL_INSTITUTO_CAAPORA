'use client';

import { CircleAlert, Pencil, Plus, Search, UserMinus } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { ApiError } from '@/lib/api';
import { rotuloPerfil } from '@/lib/ocorrencia';
import { equipes, funcionarios, perfis, type Funcionario } from '@/lib/painel';
import { iniciais } from '../../_components/cabecalho-painel';
import { Aviso, CabecalhoPagina } from '../../_components/elementos';
import { SomentePerfis, useSessao } from '../../_components/sessao';
import { useConsulta } from '../../_components/usar-consulta';

const SEM_EQUIPE = 'nenhuma';

export function Funcionarios() {
  return (
    <SomentePerfis perfis={['COORDENADOR']}>
      <Conteudo />
    </SomentePerfis>
  );
}

function Conteudo() {
  const { usuario } = useSessao();
  const [busca, setBusca] = useState('');
  const [editando, setEditando] = useState<Funcionario | 'novo' | null>(null);
  const [desativando, setDesativando] = useState<Funcionario | null>(null);

  const consulta = useConsulta('funcionarios', async (signal) => {
    const [lista, listaPerfis, listaEquipes] = await Promise.all([
      funcionarios.listar(signal),
      perfis.listar(signal),
      equipes.listar(signal),
    ]);
    return { lista, perfis: listaPerfis, equipes: listaEquipes };
  });

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const lista = [...(consulta.dados?.lista ?? [])].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    if (!termo) return lista;
    return lista.filter((f) => [f.nome, f.email, f.equipe?.nome].filter(Boolean).some((v) => v!.toLowerCase().includes(termo)));
  }, [consulta.dados, busca]);

  async function desativar() {
    if (!desativando) return;
    try {
      await funcionarios.desativar(desativando.id);
      toast.success(`${desativando.nome} foi desativado.`);
      consulta.recarregar();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Não foi possível desativar.');
    } finally {
      setDesativando(null);
    }
  }

  return (
    <>
      <CabecalhoPagina titulo="Funcionários" descricao="Quem acessa o painel, com qual perfil e em qual equipe.">
        <Button onClick={() => setEditando('novo')} disabled={!consulta.dados}>
          <Plus /> Novo funcionário
        </Button>
      </CabecalhoPagina>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Nome, e-mail ou equipe" className="bg-card pl-9" aria-label="Buscar funcionário" />
      </div>

      {consulta.erro && !consulta.dados ? (
        <Aviso titulo="Não foi possível carregar os funcionários" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      ) : !consulta.dados ? (
        <Skeleton className="h-80 rounded-xl" />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border/70 bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="hidden px-4 py-2.5 font-medium md:table-cell">Perfil</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Equipe</th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {visiveis.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    Nenhum funcionário encontrado.
                  </td>
                </tr>
              )}
              {visiveis.map((f) => (
                <tr key={f.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                        {iniciais(f.nome)}
                      </span>
                      <div className="min-w-0 leading-tight">
                        <p className="truncate font-medium text-foreground">
                          {f.nome}
                          {f.id === usuario.id && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(você)</span>}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">{f.email}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground md:hidden">{rotuloPerfil(f.perfil?.perfil)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 text-foreground md:table-cell">{rotuloPerfil(f.perfil?.perfil)}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">{f.equipe?.nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditando(f)} aria-label={`Editar ${f.nome}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDesativando(f)}
                        disabled={f.id === usuario.id}
                        aria-label={`Desativar ${f.nome}`}
                        title={f.id === usuario.id ? 'Você não pode desativar o próprio acesso' : undefined}
                        className="text-destructive hover:text-destructive"
                      >
                        <UserMinus />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {consulta.dados && editando && (
        <FormularioFuncionario
          funcionario={editando === 'novo' ? null : editando}
          perfis={consulta.dados.perfis}
          equipes={consulta.dados.equipes}
          aoFechar={() => setEditando(null)}
          aoSalvar={() => {
            setEditando(null);
            consulta.recarregar();
          }}
        />
      )}

      <AlertDialog open={desativando !== null} onOpenChange={(v) => !v && setDesativando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar {desativando?.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              A pessoa sai da lista e não pode mais agir nas ocorrências. O histórico do que ela fez continua guardado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={desativar} className="bg-destructive text-white hover:bg-destructive/90">
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function FormularioFuncionario({
  funcionario,
  perfis: listaPerfis,
  equipes: listaEquipes,
  aoFechar,
  aoSalvar,
}: {
  funcionario: Funcionario | null;
  perfis: { id: number; perfil: string }[];
  equipes: { id: number; nome: string }[];
  aoFechar: () => void;
  aoSalvar: () => void;
}) {
  const [nome, setNome] = useState(funcionario?.nome ?? '');
  const [email, setEmail] = useState(funcionario?.email ?? '');
  const [senha, setSenha] = useState('');
  const [perfilId, setPerfilId] = useState(funcionario?.perfil ? String(funcionario.perfil.id) : '');
  const [equipeId, setEquipeId] = useState(funcionario?.equipe ? String(funcionario.equipe.id) : SEM_EQUIPE);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const novo = funcionario === null;
  const perfilSelecionado = listaPerfis.find((p) => String(p.id) === perfilId)?.perfil.toUpperCase();

  async function salvar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!nome.trim() || !email.trim() || !perfilId || (novo && senha.length < 6)) {
      setErro(novo && senha.length < 6 ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Preencha nome, e-mail e perfil.');
      return;
    }
    setSalvando(true);
    const dados = {
      nome: nome.trim(),
      email: email.trim(),
      // O backend exige o campo senha também na edição, mas FuncionarioService.atualizar
      // não altera a senha: na edição o valor enviado é descartado.
      senha: novo ? senha : 'nao-alterada',
      perfilId: Number(perfilId),
      equipeId: equipeId === SEM_EQUIPE ? null : Number(equipeId),
    };
    try {
      if (novo) await funcionarios.criar(dados);
      else await funcionarios.atualizar(funcionario.id, dados);
      toast.success(novo ? `${dados.nome} cadastrado.` : 'Dados atualizados.');
      aoSalvar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível salvar.');
      setSalvando(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && aoFechar()}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={salvar} noValidate>
          <DialogHeader>
            <DialogTitle>{novo ? 'Novo funcionário' : 'Editar funcionário'}</DialogTitle>
            <DialogDescription>
              {novo ? 'A pessoa entra no painel com o e-mail e a senha definidos aqui.' : 'A senha não é alterada por aqui.'}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="my-5 gap-4">
            {erro && (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="f-nome">Nome</FieldLabel>
              <Input id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
            </Field>
            <Field>
              <FieldLabel htmlFor="f-email">E-mail</FieldLabel>
              <Input id="f-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
            </Field>
            {novo && (
              <Field>
                <FieldLabel htmlFor="f-senha">Senha inicial</FieldLabel>
                <Input id="f-senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
                <FieldDescription>Mínimo de 6 caracteres. Passe para a pessoa por um canal seguro.</FieldDescription>
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="f-perfil">Perfil</FieldLabel>
                <Select value={perfilId} onValueChange={setPerfilId}>
                  <SelectTrigger id="f-perfil" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {listaPerfis.map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {rotuloPerfil(p.perfil)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="f-equipe">Equipe</FieldLabel>
                <Select value={equipeId} onValueChange={setEquipeId}>
                  <SelectTrigger id="f-equipe" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_EQUIPE}>Nenhuma</SelectItem>
                    {listaEquipes.map((e) => (
                      <SelectItem key={e.id} value={String(e.id)}>
                        {e.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            {perfilSelecionado === 'EQUIPE_CAMPO' && equipeId === SEM_EQUIPE && (
              <FieldDescription>Quem é da equipe de campo normalmente fica vinculado a uma equipe.</FieldDescription>
            )}
          </FieldGroup>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? <Spinner /> : novo ? 'Cadastrar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
