'use client';

import { useMemo, useState } from 'react';
import { CircleAlert, Search, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';

export interface ItemSelecionavel {
  id: number;
  titulo: string;
  detalhe?: string;
  observacao?: string; // ex.: "Hoje na Equipe Beta" (aparece em destaque)
}

interface Props {
  aberto: boolean;
  titulo: string;
  descricao: string;
  itens: ItemSelecionavel[] | null; // null = carregando
  erroCarga?: string | null;
  textoVazio: string;
  rotuloAcao: (quantidade: number) => string;
  rodape?: React.ReactNode; // ex.: link "Cadastrar novo funcionário"
  onFechar: () => void;
  onConfirmar: (ids: number[]) => Promise<void>; // lança erro com mensagem para mostrar
}

// Modal genérico de seleção múltipla com busca (membros da equipe, ocorrências para vincular)
export function SelecionarItens({
  aberto,
  titulo,
  descricao,
  itens,
  erroCarga,
  textoVazio,
  rotuloAcao,
  rodape,
  onFechar,
  onConfirmar,
}: Props) {
  const [marcados, setMarcados] = useState<Set<number>>(new Set());
  const [busca, setBusca] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!itens || !termo) return itens ?? [];
    return itens.filter((i) => [i.titulo, i.detalhe, i.observacao].join(' ').toLowerCase().includes(termo));
  }, [itens, busca]);

  function fechar() {
    if (enviando) return;
    setMarcados(new Set());
    setBusca('');
    setErro(null);
    onFechar();
  }

  function alternar(id: number) {
    setMarcados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  async function confirmar() {
    if (marcados.size === 0 || enviando) return;
    setErro(null);
    setEnviando(true);
    try {
      await onConfirmar([...marcados]);
      setEnviando(false);
      setMarcados(new Set());
      setBusca('');
      onFechar();
    } catch (e) {
      setEnviando(false);
      setErro(e instanceof Error && e.message ? e.message : 'Não foi possível salvar agora. Tente novamente.');
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(a) => !a && fechar()}>
      <DialogContent showCloseButton={false} className="flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="gap-1 border-b border-border/60 px-6 pt-6 pb-5">
          <DialogTitle className="pr-8 font-heading text-2xl leading-tight font-normal">{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-3 px-6 py-4">
          {(erro || erroCarga) && (
            <Alert variant="destructive" role="alert">
              <CircleAlert />
              <AlertDescription>{erro || erroCarga}</AlertDescription>
            </Alert>
          )}

          {itens && itens.length > 5 && (
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                aria-label="Buscar na lista"
                placeholder="Buscar…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="h-10 pl-9"
              />
            </div>
          )}

          <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
            {itens === null && !erroCarga && (
              <div className="space-y-2" aria-label="Carregando">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))}
              </div>
            )}
            {itens !== null && visiveis.length === 0 && (
              <p className="rounded-xl bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                {itens.length === 0 ? textoVazio : 'Nada encontrado para essa busca.'}
              </p>
            )}
            <ul className="space-y-2">
              {visiveis.map((item) => {
                const marcado = marcados.has(item.id);
                const idCampo = `selecao-${item.id}`;
                return (
                  <li key={item.id}>
                    <label
                      htmlFor={idCampo}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/60 px-4 py-3 transition-colors hover:bg-muted/40 has-[[data-state=checked]]:border-primary/50 has-[[data-state=checked]]:bg-primary/5"
                    >
                      <Checkbox id={idCampo} checked={marcado} onCheckedChange={() => alternar(item.id)} className="mt-0.5" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-foreground">{item.titulo}</span>
                        {item.detalhe && <span className="block truncate text-sm text-muted-foreground">{item.detalhe}</span>}
                        {item.observacao && (
                          <span className="mt-0.5 block text-xs font-medium text-[#a8410f]">{item.observacao}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/60 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm">{rodape}</div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={fechar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="button" onClick={confirmar} disabled={enviando || marcados.size === 0}>
              {enviando ? (
                <>
                  <Spinner /> Salvando…
                </>
              ) : (
                rotuloAcao(marcados.size)
              )}
            </Button>
          </div>
        </div>

        <DialogClose asChild>
          <Button variant="ghost" size="icon-sm" className="absolute top-4 right-4" aria-label="Fechar">
            <X />
          </Button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
