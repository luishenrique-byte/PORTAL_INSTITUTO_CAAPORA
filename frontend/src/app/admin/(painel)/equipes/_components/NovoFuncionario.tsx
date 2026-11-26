'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { CircleAlert, Eye, EyeOff, X } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, criarFuncionario, listarPerfis, type Funcionario, type Perfil } from '@/lib/api';

const ROTULO_PERFIL: Record<string, string> = {
  COORDENADOR: 'Coordenador',
  ATENDENTE: 'Atendente',
  EQUIPE_CAMPO: 'Equipe de campo',
};

const SENHA_MINIMA = 8;

export const CLASSE_SELECT =
  'h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-50';

interface Props {
  aberto: boolean;
  token: string;
  equipes: { id: number; nome: string }[];
  equipeInicial?: number | null; // já vem marcada quando o cadastro parte do modal da equipe
  onFechar: () => void;
  onCriado: (funcionario: Funcionario) => void;
  onSessaoExpirada: () => void;
}

export function NovoFuncionario({ aberto, token, equipes, equipeInicial = null, onFechar, onCriado, onSessaoExpirada }: Props) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [perfilId, setPerfilId] = useState('');
  const [equipeId, setEquipeId] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Perfis vêm do banco; ao abrir pelo modal da equipe, já sugere "Equipe de campo" e a equipe
  useEffect(() => {
    if (!aberto) return;
    const controle = new AbortController();
    listarPerfis(token, controle.signal)
      .then((lista) => {
        setPerfis(lista);
        if (equipeInicial !== null) {
          const campo = lista.find((p) => p.perfil === 'EQUIPE_CAMPO');
          if (campo) setPerfilId(String(campo.id));
        }
      })
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return onSessaoExpirada();
        setErro(e instanceof ApiError && e.status === 403 ? 'Apenas coordenadores podem cadastrar funcionários.' : 'Não foi possível carregar os perfis.');
      });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza o formulário com a equipe de origem
    setEquipeId(equipeInicial !== null ? String(equipeInicial) : '');
    return () => controle.abort();
  }, [aberto, token, equipeInicial, onSessaoExpirada]);

  function fechar() {
    if (enviando) return;
    setNome('');
    setEmail('');
    setSenha('');
    setVerSenha(false);
    setPerfilId('');
    setEquipeId('');
    setErro(null);
    onFechar();
  }

  const senhaCurta = senha.length > 0 && senha.length < SENHA_MINIMA;
  const valido = nome.trim() && email.trim() && senha.length >= SENHA_MINIMA && perfilId;

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando || !valido) return;
    setErro(null);
    setEnviando(true);
    try {
      const criado = await criarFuncionario(
        {
          nome: nome.trim(),
          email: email.trim().toLowerCase(),
          senha,
          perfilId: Number(perfilId),
          equipeId: equipeId ? Number(equipeId) : null,
        },
        token,
      );
      toast.success(`${criado.nome} cadastrado. O acesso é pelo e-mail e senha informados.`);
      setEnviando(false);
      fechar();
      onCriado(criado);
    } catch (e) {
      setEnviando(false);
      if (e instanceof ApiError && e.status === 401) return onSessaoExpirada();
      if (e instanceof ApiError && e.status === 403) return setErro('Apenas coordenadores podem cadastrar funcionários.');
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cadastrar agora. Tente novamente.');
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] gap-0 overflow-y-auto p-0 sm:max-w-md grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pb-5">
          <DialogTitle className="pr-8 font-heading text-2xl leading-tight font-normal">Novo funcionário</DialogTitle>
          <DialogDescription>Cria o acesso ao painel. O perfil define o que a pessoa pode fazer.</DialogDescription>
        </DialogHeader>

        <form onSubmit={aoEnviar} className="px-6 py-5">
          <FieldGroup className="gap-4">
            {erro && (
              <Alert variant="destructive" role="alert">
                <CircleAlert />
                <AlertDescription>{erro}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="nome-funcionario">Nome completo</FieldLabel>
              <Input
                id="nome-funcionario"
                required
                autoFocus
                autoComplete="off"
                placeholder="Ex.: Maria Souza"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="email-funcionario">E-mail de acesso</FieldLabel>
              <Input
                id="email-funcionario"
                type="email"
                required
                autoComplete="off"
                placeholder="maria@institutocaapora.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field data-invalid={senhaCurta || undefined}>
              <FieldLabel htmlFor="senha-funcionario">Senha inicial</FieldLabel>
              <div className="relative">
                <Input
                  id="senha-funcionario"
                  type={verSenha ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  minLength={SENHA_MINIMA}
                  aria-invalid={senhaCurta || undefined}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-11 pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
                  aria-label={verSenha ? 'Esconder senha' : 'Mostrar senha'}
                  onClick={() => setVerSenha((v) => !v)}
                >
                  {verSenha ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              <FieldDescription>Mínimo de {SENHA_MINIMA} caracteres. Passe para a pessoa trocar depois.</FieldDescription>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="perfil-funcionario">Perfil</FieldLabel>
                <select
                  id="perfil-funcionario"
                  required
                  value={perfilId}
                  onChange={(e) => setPerfilId(e.target.value)}
                  className={CLASSE_SELECT}
                >
                  <option value="" disabled>
                    Selecione…
                  </option>
                  {perfis.map((p) => (
                    <option key={p.id} value={p.id}>
                      {ROTULO_PERFIL[p.perfil] ?? p.perfil}
                    </option>
                  ))}
                </select>
              </Field>
              <Field>
                <FieldLabel htmlFor="equipe-funcionario">Equipe</FieldLabel>
                <select
                  id="equipe-funcionario"
                  value={equipeId}
                  onChange={(e) => setEquipeId(e.target.value)}
                  className={CLASSE_SELECT}
                >
                  <option value="">Sem equipe</option>
                  {equipes.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.nome}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={fechar} disabled={enviando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando || !valido}>
                {enviando ? (
                  <>
                    <Spinner /> Salvando…
                  </>
                ) : (
                  'Cadastrar funcionário'
                )}
              </Button>
            </div>
          </FieldGroup>
        </form>

        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Fechar">
            <X />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
