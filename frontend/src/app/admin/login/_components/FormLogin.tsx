'use client';

import { CircleAlert, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, entrar } from '@/lib/api';
import { obterToken, salvarSessao } from '@/lib/sessao';

const DESTINO = '/admin';

export default function FormLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Quem já tem sessão válida vai direto para o painel
  useEffect(() => {
    if (obterToken()) router.replace(DESTINO);
  }, [router]);

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      const { token, expiresIn } = await entrar(email.trim(), senha);
      salvarSessao(token, expiresIn);
      router.replace(DESTINO);
    } catch (e) {
      setErro(
        e instanceof ApiError
          ? e.message
          : 'Não foi possível entrar agora. Tente novamente.',
      );
      setSenha('');
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={aoEnviar}
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm md:p-7"
    >
      <FieldGroup className="gap-5">
        {erro && (
          <Alert variant="destructive" role="alert">
            <CircleAlert />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="email">E-mail institucional</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="seu@caapora.org"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={erro ? true : undefined}
            className="h-11 bg-muted/40"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="senha">Senha</FieldLabel>
          <div className="relative">
            <Input
              id="senha"
              type={verSenha ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              aria-invalid={erro ? true : undefined}
              className="h-11 bg-muted/40 pr-11"
            />
            <button
              type="button"
              onClick={() => setVerSenha((v) => !v)}
              aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={verSenha}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            >
              {verSenha ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Button
          type="submit"
          size="lg"
          disabled={enviando}
          className="mt-1 h-12 w-full rounded-xl text-base font-semibold"
        >
          {enviando ? (
            <>
              <Spinner /> Entrando…
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </FieldGroup>
    </form>
  );
}
