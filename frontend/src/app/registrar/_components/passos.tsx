'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Lock, MapPin, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  MIDIA_MAX_ARQUIVOS,
  MIDIA_MAX_BYTES,
  MIDIA_TIPOS_ACEITOS,
  type CategoriaAnimal,
  type SaudeStatus,
} from '@/lib/api';
import { CATEGORIAS } from '@/lib/ocorrencia';
import { cn } from '@/lib/utils';
import { Rotulo, Titulo, campoClasse } from './ui';

export interface DadosFormulario {
  latitude: number | null;
  longitude: number | null;
  precisao: number | null;
  endereco: string;
  pontoReferencia: string;
  categoria: CategoriaAnimal | null;
  especie: string;
  saude: SaudeStatus | null;
  descricao: string;
  arquivos: File[];
  anonimo: boolean;
  nome: string;
  telefone: string;
}

type Atualizar = (parcial: Partial<DadosFormulario>) => void;

// Cartão selecionável (usado nos ToggleGroups de tipo de animal e saúde)
const opcaoClasse =
  'h-auto border border-border bg-card hover:border-primary/50 hover:bg-card data-[state=on]:border-primary data-[state=on]:bg-secondary';

// ---------------------------------------------------------------------------
// Passo 1 — Onde o animal está?
// ---------------------------------------------------------------------------

type EstadoGps = 'parado' | 'buscando' | 'ok' | 'erro';

export function PassoLocalizacao({ dados, atualizar }: { dados: DadosFormulario; atualizar: Atualizar }) {
  const [gps, setGps] = useState<EstadoGps>(dados.latitude !== null ? 'ok' : 'parado');
  const [erroGps, setErroGps] = useState('');

  function usarGps() {
    if (!('geolocation' in navigator)) {
      setGps('erro');
      setErroGps('Seu navegador não permite obter a localização. Informe o endereço abaixo.');
      return;
    }
    setGps('buscando');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        atualizar({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          precisao: Math.round(pos.coords.accuracy),
        });
        setGps('ok');
      },
      (err) => {
        setGps('erro');
        setErroGps(
          err.code === err.PERMISSION_DENIED
            ? 'Permissão de localização negada. Libere no navegador ou informe o endereço abaixo.'
            : 'Não foi possível obter sua localização. Tente de novo ou informe o endereço abaixo.',
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }

  function limparGps() {
    atualizar({ latitude: null, longitude: null, precisao: null });
    setGps('parado');
  }

  const capturado = gps === 'ok' && dados.latitude !== null;

  return (
    <>
      <Titulo titulo="Onde o animal está?" subtitulo="Quanto mais precisa a localização, mais rápido chegamos." />

      <Button
        type="button"
        variant="outline"
        onClick={capturado ? limparGps : usarGps}
        disabled={gps === 'buscando'}
        aria-pressed={capturado}
        className={cn(
          'h-auto w-full justify-start gap-4 rounded-xl p-4 text-left whitespace-normal',
          capturado ? 'border-primary bg-secondary hover:bg-secondary' : 'bg-card hover:border-primary/50 hover:bg-card',
        )}
      >
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg',
            capturado ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary',
          )}
        >
          {gps === 'buscando' ? <Spinner /> : capturado ? <Check className="size-5" /> : <MapPin className="size-5" />}
        </span>
        <span className="min-w-0 flex-1 leading-snug">
          <span className="block text-sm font-semibold text-foreground">
            {gps === 'buscando' ? 'Obtendo localização…' : capturado ? 'Localização capturada' : 'Usar localização atual (GPS)'}
          </span>
          <span className="block text-xs font-normal text-muted-foreground">
            {capturado ? `Precisão de ${dados.precisao ?? '?'} m · toque para remover` : 'Precisão até 100m · Recomendado'}
          </span>
        </span>
      </Button>
      {gps === 'erro' && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {erroGps}
        </p>
      )}

      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden>
        <Separator className="flex-1" />
        ou informe manualmente
        <Separator className="flex-1" />
      </div>

      <div className="space-y-5">
        <div>
          <Rotulo htmlFor="endereco">Endereço</Rotulo>
          <Input
            id="endereco"
            className={campoClasse}
            placeholder="Rua, número, bairro, município"
            autoComplete="street-address"
            maxLength={255}
            value={dados.endereco}
            onChange={(e) => atualizar({ endereco: e.target.value })}
          />
        </div>
        <div>
          <Rotulo htmlFor="referencia">Ponto de referência</Rotulo>
          <Input
            id="referencia"
            className={campoClasse}
            placeholder="Ex: próximo ao mercado, embaixo da ponte…"
            maxLength={255}
            value={dados.pontoReferencia}
            onChange={(e) => atualizar({ pontoReferencia: e.target.value })}
          />
        </div>
      </div>
    </>
  );
}

export const passo1Valido = (d: DadosFormulario) => d.latitude !== null || d.endereco.trim().length > 0;

// ---------------------------------------------------------------------------
// Passo 2 — Detalhes do animal
// ---------------------------------------------------------------------------

const ESTADOS_SAUDE: { valor: SaudeStatus; rotulo: string; cor: string }[] = [
  { valor: 'FERIDO', rotulo: 'Ferido / machucado', cor: 'bg-destructive' },
  { valor: 'DOENTE', rotulo: 'Doente / debilitado', cor: 'bg-cta' },
  { valor: 'PRESO', rotulo: 'Preso / enredado', cor: 'bg-chart-3' },
  { valor: 'OBITO', rotulo: 'Sem vida', cor: 'bg-muted-foreground/60' },
  { valor: 'ORFAO', rotulo: 'Filhote órfão', cor: 'bg-primary' },
  { valor: 'INDEFINIDO', rotulo: 'Não sei avaliar', cor: 'bg-muted-foreground/60' },
];

export function PassoAnimal({ dados, atualizar }: { dados: DadosFormulario; atualizar: Atualizar }) {
  return (
    <>
      <Titulo titulo="Detalhes do animal" subtitulo="Não se preocupe se não souber o nome da espécie." />

      <p id="rotulo-tipo" className="mb-2 text-sm font-semibold text-foreground">
        Tipo de animal
      </p>
      <ToggleGroup
        type="single"
        aria-labelledby="rotulo-tipo"
        value={dados.categoria ?? ''}
        // valor vazio = clicou no item já selecionado; mantém a seleção
        onValueChange={(v) => v && atualizar({ categoria: v as CategoriaAnimal })}
        className="grid w-full grid-cols-3 gap-2.5"
      >
        {CATEGORIAS.map((c) => (
          <ToggleGroupItem key={c.valor} value={c.valor} className={cn(opcaoClasse, 'flex-col gap-1 rounded-xl px-2 py-3.5')}>
            <span className="text-2xl leading-none" aria-hidden>
              {c.icone}
            </span>
            <span className="text-xs font-medium text-foreground">{c.rotulo}</span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {dados.categoria && dados.categoria !== 'INDEFINIDO' && (
        <Input
          aria-label="Nome da espécie (opcional)"
          className={cn(campoClasse, 'mt-3')}
          placeholder="Nome da espécie (opcional) — ex: Gavião-carcará"
          maxLength={100}
          value={dados.especie}
          onChange={(e) => atualizar({ especie: e.target.value })}
        />
      )}

      <p id="rotulo-saude" className="mt-7 mb-2 text-sm font-semibold text-foreground">
        Estado de saúde aparente
      </p>
      <ToggleGroup
        type="single"
        orientation="vertical"
        aria-labelledby="rotulo-saude"
        value={dados.saude ?? ''}
        onValueChange={(v) => v && atualizar({ saude: v as SaudeStatus })}
        className="w-full gap-2"
      >
        {ESTADOS_SAUDE.map((s) => (
          <ToggleGroupItem
            key={s.valor}
            value={s.valor}
            className={cn(opcaoClasse, 'group w-full justify-start gap-3 rounded-lg px-4 py-2.5 font-normal')}
          >
            <span className={cn('size-2 shrink-0 rounded-full', s.cor)} aria-hidden />
            <span className="flex-1 text-left text-foreground">{s.rotulo}</span>
            <Check className="size-4 text-primary opacity-0 group-data-[state=on]:opacity-100" aria-hidden />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="mt-7">
        <Rotulo htmlFor="descricao" opcional>
          Descrição da situação
        </Rotulo>
        <Textarea
          id="descricao"
          rows={3}
          maxLength={255}
          className="min-h-24 resize-none rounded-lg bg-card px-4 py-3 text-[0.95rem] md:text-[0.95rem]"
          placeholder="Descreva o que você viu — comportamento, ferimentos visíveis, há quanto tempo…"
          value={dados.descricao}
          onChange={(e) => atualizar({ descricao: e.target.value })}
        />
      </div>

      <SeletorArquivos arquivos={dados.arquivos} onChange={(arquivos) => atualizar({ arquivos })} />
    </>
  );
}

export const passo2Valido = (d: DadosFormulario) => d.categoria !== null && d.saude !== null;

function SeletorArquivos({ arquivos, onChange }: { arquivos: File[]; onChange: (a: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [aviso, setAviso] = useState('');

  function adicionar(lista: FileList | null) {
    if (!lista) return;
    const novos: File[] = [];
    const problemas: string[] = [];
    for (const f of Array.from(lista)) {
      if (!MIDIA_TIPOS_ACEITOS.includes(f.type)) problemas.push(`${f.name}: formato não aceito`);
      else if (f.size > MIDIA_MAX_BYTES) problemas.push(`${f.name}: maior que 20 MB`);
      else novos.push(f);
    }
    const vagas = MIDIA_MAX_ARQUIVOS - arquivos.length;
    if (novos.length > vagas) problemas.push(`máximo de ${MIDIA_MAX_ARQUIVOS} arquivos`);
    onChange([...arquivos, ...novos.slice(0, Math.max(vagas, 0))]);
    setAviso(problemas.join(' · '));
    if (input.current) input.current.value = '';
  }

  return (
    <div className="mt-7">
      <p className="mb-2 text-sm font-semibold text-foreground">
        Fotos ou vídeos <span className="font-normal text-cta">(opcional · até {MIDIA_MAX_ARQUIVOS} arquivos)</span>
      </p>
      <div className="flex flex-wrap gap-2.5">
        {arquivos.map((f, i) => (
          <Miniatura
            key={`${f.name}-${f.size}-${f.lastModified}`}
            arquivo={f}
            onRemover={() => onChange(arquivos.filter((_, j) => j !== i))}
          />
        ))}
        {arquivos.length < MIDIA_MAX_ARQUIVOS && (
          <Button
            type="button"
            variant="outline"
            onClick={() => input.current?.click()}
            className="size-[72px] flex-col gap-0.5 rounded-xl bg-card font-normal text-muted-foreground hover:border-primary/50 hover:bg-card"
          >
            <Plus className="size-5" />
            <span className="text-[0.7rem]">Adicionar</span>
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        multiple
        accept={MIDIA_TIPOS_ACEITOS.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-label="Adicionar fotos ou vídeos"
        onChange={(e) => adicionar(e.target.files)}
      />
      {aviso && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {aviso}
        </p>
      )}
    </div>
  );
}

function Miniatura({ arquivo, onRemover }: { arquivo: File; onRemover: () => void }) {
  const midia = useRef<HTMLImageElement & HTMLVideoElement>(null);
  const video = arquivo.type.startsWith('video/');

  // A prévia usa uma URL blob: local; é liberada quando a miniatura sai da tela
  useEffect(() => {
    const url = URL.createObjectURL(arquivo);
    if (midia.current) midia.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [arquivo]);

  return (
    <div className="relative size-[72px] overflow-hidden rounded-xl border border-border bg-muted">
      {video ? (
        <video ref={midia} className="size-full object-cover" muted playsInline />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:), não passa pelo otimizador
        <img ref={midia} alt={arquivo.name} className="size-full object-cover" />
      )}
      {video && <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-[0.6rem] text-white">vídeo</span>}
      <Button
        type="button"
        size="icon-xs"
        onClick={onRemover}
        aria-label={`Remover ${arquivo.name}`}
        className="absolute top-1 right-1 size-5 rounded-full bg-black/60 text-white hover:bg-black/80"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Passo 3 — Seus dados de contato
// ---------------------------------------------------------------------------

export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PassoContato({ dados, atualizar }: { dados: DadosFormulario; atualizar: Atualizar }) {
  return (
    <>
      <Titulo titulo="Seus dados de contato" subtitulo="Para nossa equipe entrar em contato se precisar de mais informações." />

      <Label
        htmlFor="anonimo"
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors',
          dados.anonimo ? 'border-primary bg-secondary' : 'border-border bg-card',
        )}
      >
        <Checkbox
          id="anonimo"
          checked={dados.anonimo}
          onCheckedChange={(v) => atualizar({ anonimo: v === true })}
          className="mt-0.5 bg-card"
        />
        <span className="leading-snug">
          <span className="block text-sm font-semibold text-foreground">Quero permanecer anônimo</span>
          <span className="block text-xs font-normal text-muted-foreground">A ocorrência será registrada normalmente sem seus dados</span>
        </span>
      </Label>

      {!dados.anonimo && (
        <div className="mt-6 space-y-5">
          <div>
            <Rotulo htmlFor="nome">Nome completo</Rotulo>
            <Input
              id="nome"
              className={campoClasse}
              placeholder="Seu nome"
              autoComplete="name"
              maxLength={150}
              value={dados.nome}
              onChange={(e) => atualizar({ nome: e.target.value })}
            />
          </div>
          <div>
            <Rotulo htmlFor="telefone">Telefone / WhatsApp</Rotulo>
            <Input
              id="telefone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              className={campoClasse}
              placeholder="(00) 00000-0000"
              value={dados.telefone}
              onChange={(e) => atualizar({ telefone: mascaraTelefone(e.target.value) })}
            />
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3 rounded-xl bg-muted px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-4 shrink-0" aria-hidden />
        <p>Seus dados são protegidos e usados somente para fins de resgate. Não serão compartilhados com terceiros.</p>
      </div>
    </>
  );
}

export const telefoneValido = (t: string) => t.replace(/\D/g, '').length >= 10;
export const passo3Valido = (d: DadosFormulario) => d.anonimo || (d.nome.trim().length > 1 && telefoneValido(d.telefone));
