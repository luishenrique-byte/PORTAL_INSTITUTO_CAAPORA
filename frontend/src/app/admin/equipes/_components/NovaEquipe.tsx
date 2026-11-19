'use client';

import { useState, type FormEvent } from 'react';
import { CircleAlert, X } from 'lucide-react';
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { ApiError, criarEquipe } from '@/lib/api';
import { mascaraTelefone } from './visual';

interface Props {
  aberto: boolean;
  token: string;
  onFechar: () => void;
  onCriada: () => void;
  onSessaoExpirada: () => void;
}

export function NovaEquipe({ aberto, token, onFechar, onCriada, onSessaoExpirada }: Props) {
  const [nome, setNome] = useState('');
  const [regiao, setRegiao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    if (enviando) return;
    setNome('');
    setRegiao('');
    setTelefone('');
    setErro(null);
    onFechar();
  }

  async function aoEnviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      await criarEquipe(
        { nome: nome.trim(), regiao: regiao.trim() || null, telefone: telefone.trim() || null },
        token,
      );
      toast.success(`${nome.trim()} cadastrada. Ela começa como disponível.`);
      setEnviando(false);
      fechar();
      onCriada();
    } catch (e) {
      setEnviando(false);
      if (e instanceof ApiError && e.status === 401) return onSessaoExpirada();
      if (e instanceof ApiError && e.status === 403) return setErro('Apenas coordenadores podem cadastrar equipes.');
      setErro(e instanceof ApiError ? e.message : 'Não foi possível cadastrar agora. Tente novamente.');
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-md grid-cols-[minmax(0,1fr)]">
        <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pb-5">
          <DialogTitle className="pr-8 font-heading text-2xl leading-tight font-normal">Nova equipe</DialogTitle>
          <DialogDescription>Toda equipe nova começa como disponível.</DialogDescription>
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
              <FieldLabel htmlFor="nome-equipe">Nome da equipe</FieldLabel>
              <Input
                id="nome-equipe"
                required
                autoFocus
                placeholder="Ex.: Equipe Alfa"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="regiao-equipe">Região de atuação</FieldLabel>
              <Input
                id="regiao-equipe"
                placeholder="Ex.: Zona Norte – Salvador"
                value={regiao}
                onChange={(e) => setRegiao(e.target.value)}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="telefone-equipe">Telefone de contato</FieldLabel>
              <Input
                id="telefone-equipe"
                type="tel"
                inputMode="tel"
                placeholder="(71) 98001-0001"
                value={telefone}
                onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                className="h-11"
              />
            </Field>
            <div className="mt-1 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={fechar} disabled={enviando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={enviando || !nome.trim()}>
                {enviando ? (
                  <>
                    <Spinner /> Salvando…
                  </>
                ) : (
                  'Cadastrar equipe'
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
