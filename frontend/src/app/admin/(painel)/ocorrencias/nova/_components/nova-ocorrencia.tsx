'use client';

import { ArrowLeft, CircleAlert, Crosshair } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, type CategoriaAnimal, type SaudeStatus } from '@/lib/api';
import { CATEGORIAS, SAUDE, URGENCIAS } from '@/lib/ocorrencia';
import { ocorrencias, type GrauUrgencia } from '@/lib/painel';
import { Bloco, CabecalhoPagina } from '../../../_components/elementos';
import { SomentePerfis, useSessao } from '../../../_components/sessao';

const numero = (v: string) => {
  const n = Number(v.replace(',', '.'));
  return v.trim() && Number.isFinite(n) ? n : null;
};

export function NovaOcorrencia() {
  return (
    <SomentePerfis perfis={['ATENDENTE', 'COORDENADOR']}>
      <Formulario />
    </SomentePerfis>
  );
}

function Formulario() {
  const { usuario } = useSessao();
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [endereco, setEndereco] = useState('');
  const [referencia, setReferencia] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [categoria, setCategoria] = useState<CategoriaAnimal | ''>('');
  const [especie, setEspecie] = useState('');
  const [saude, setSaude] = useState<SaudeStatus | ''>('');
  const [urgencia, setUrgencia] = useState<GrauUrgencia | ''>('');
  const [descricao, setDescricao] = useState('');
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [anonimo, setAnonimo] = useState(false);

  const lat = numero(latitude);
  const lng = numero(longitude);
  const coordenadaInvalida =
    (latitude.trim() !== '' || longitude.trim() !== '') &&
    (lat === null || lng === null || Math.abs(lat) > 90 || Math.abs(lng) > 180);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    // Mesmas regras do OcorrenciaService.registrarManual
    if (!endereco.trim() && (lat === null || lng === null)) {
      setErro('Informe o endereço ou as coordenadas do local.');
      return;
    }
    if (coordenadaInvalida) {
      setErro('Coordenadas inválidas. Use o formato decimal, ex.: -12.9714 e -38.5014.');
      return;
    }
    if (!categoria || !saude || !urgencia) {
      setErro('Preencha o tipo de animal, o estado de saúde e o grau de urgência.');
      return;
    }

    setEnviando(true);
    try {
      const criada = await ocorrencias.registrarManual(
        {
          latitude: lat,
          longitude: lng,
          endereco: endereco.trim() || null,
          pontoReferencia: referencia.trim() || null,
          descricao: descricao.trim() || null,
          grauUrgencia: urgencia,
          origemRegistro: 'CADASTRO_MANUAL',
          reportante: { nome: anonimo ? null : nome.trim() || null, telefone: anonimo ? null : telefone.trim() || null, anonimo },
          animal: { especie: especie.trim() || null, categoriaAnimal: categoria, saudeStatus: saude },
        },
        usuario.id,
      );
      toast.success(`Ocorrência ${criada.protocolo} registrada.`);
      router.push(`/admin/ocorrencias/${criada.id}`);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível registrar.');
      setEnviando(false);
    }
  }

  return (
    <>
      <Link href="/admin/ocorrencias" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Ocorrências
      </Link>
      <CabecalhoPagina
        titulo="Nova ocorrência"
        descricao="Para chamados recebidos por telefone ou WhatsApp. O protocolo é gerado ao salvar."
      />

      <form onSubmit={enviar} className="max-w-3xl space-y-4" noValidate>
        {erro && (
          <Alert variant="destructive" role="alert">
            <CircleAlert />
            <AlertDescription>{erro}</AlertDescription>
          </Alert>
        )}

        <Bloco titulo="Local">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="endereco">Endereço</FieldLabel>
              <Input id="endereco" value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, número, bairro – cidade" />
            </Field>
            <Field>
              <FieldLabel htmlFor="referencia">Ponto de referência</FieldLabel>
              <Input id="referencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Opcional" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="latitude">Latitude</FieldLabel>
                <Input id="latitude" inputMode="decimal" value={latitude} onChange={(e) => setLatitude(e.target.value)} placeholder="-12.9714" aria-invalid={coordenadaInvalida || undefined} />
              </Field>
              <Field>
                <FieldLabel htmlFor="longitude">Longitude</FieldLabel>
                <Input id="longitude" inputMode="decimal" value={longitude} onChange={(e) => setLongitude(e.target.value)} placeholder="-38.5014" aria-invalid={coordenadaInvalida || undefined} />
              </Field>
            </div>
            <FieldDescription className="flex items-center gap-1.5">
              <Crosshair className="size-3.5" /> Informe o endereço, as coordenadas ou os dois. Só ocorrências com coordenadas aparecem no mapa de calor.
            </FieldDescription>
          </FieldGroup>
        </Bloco>

        <Bloco titulo="Animal">
          <FieldGroup className="gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="categoria">Tipo de animal *</FieldLabel>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaAnimal)}>
                  <SelectTrigger id="categoria" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => (
                      <SelectItem key={c.valor} value={c.valor}>
                        {c.valor === 'INDEFINIDO' ? 'Não identificado' : c.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="especie">Espécie</FieldLabel>
                <Input id="especie" value={especie} onChange={(e) => setEspecie(e.target.value)} placeholder="Ex.: Sagui-de-tufo-branco" />
              </Field>
              <Field>
                <FieldLabel htmlFor="saude">Estado de saúde *</FieldLabel>
                <Select value={saude} onValueChange={(v) => setSaude(v as SaudeStatus)}>
                  <SelectTrigger id="saude" className="w-full">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SAUDE.map((s) => (
                      <SelectItem key={s.valor} value={s.valor}>
                        {s.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="urgencia">Grau de urgência *</FieldLabel>
                <Select value={urgencia} onValueChange={(v) => setUrgencia(v as GrauUrgencia)}>
                  <SelectTrigger id="urgencia" className="w-full">
                    <SelectValue placeholder="Resultado da triagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...URGENCIAS].reverse().map((u) => (
                      <SelectItem key={u.valor} value={u.valor}>
                        {u.rotulo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor="descricao">Relato</FieldLabel>
              <Textarea id="descricao" rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="O que a pessoa contou sobre o animal e a situação" />
            </Field>
          </FieldGroup>
        </Bloco>

        <Bloco titulo="Comunicante">
          <FieldGroup className="gap-4">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={anonimo} onCheckedChange={(v) => setAnonimo(v === true)} />
              Pediu para não se identificar
            </label>
            {!anonimo && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor="nome">Nome</FieldLabel>
                  <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="off" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="telefone">Telefone</FieldLabel>
                  <Input id="telefone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(71) 99999-9999" autoComplete="off" />
                </Field>
              </div>
            )}
          </FieldGroup>
        </Bloco>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" asChild>
            <Link href="/admin/ocorrencias">Cancelar</Link>
          </Button>
          <Button type="submit" disabled={enviando} className="bg-cta text-cta-foreground hover:bg-cta/90">
            {enviando ? (
              <>
                <Spinner /> Registrando…
              </>
            ) : (
              'Registrar ocorrência'
            )}
          </Button>
        </div>
      </form>
    </>
  );
}
