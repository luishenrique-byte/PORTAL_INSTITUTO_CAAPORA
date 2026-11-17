'use client';

import { ImageIcon, MapPin, Plus, RotateCw, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { OcorrenciaStatus } from '@/lib/api';
import {
  ETAPAS_OCORRENCIA,
  URGENCIAS,
  dataRelativa,
  fimDoDia,
  inicioDoDia,
  rotuloCategoria,
} from '@/lib/ocorrencia';
import { equipes, ocorrencias, type GrauUrgencia, type Ocorrencia } from '@/lib/painel';
import { Aviso, CabecalhoPagina, SeloStatus, SeloUrgencia } from '../../_components/elementos';
import { useSessao } from '../../_components/sessao';
import { useConsulta } from '../../_components/usar-consulta';

const TODOS = 'todos';
const FILA = 'fila';

interface Filtros {
  status: string; // FILA = /ocorrencias (não concluídas), TODOS ou um OcorrenciaStatus
  urgencia: string;
  equipe: string;
  de: string;
  ate: string;
}

const INICIAL: Filtros = { status: FILA, urgencia: TODOS, equipe: TODOS, de: '', ate: '' };

const local = (o: Ocorrencia) => o.endereco ?? (o.latitude !== null ? 'Localização por GPS' : '—');

export function ListaOcorrencias() {
  const { pode } = useSessao();
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>(INICIAL);
  const [busca, setBusca] = useState('');

  const listaEquipes = useConsulta('equipes', (signal) => equipes.listar(signal));

  const apenasFila =
    filtros.status === FILA && filtros.urgencia === TODOS && filtros.equipe === TODOS && !filtros.de && !filtros.ate;

  const consulta = useConsulta(JSON.stringify(filtros), async (signal) => {
    // Sem filtros: a fila do backend já vem ordenada (mais urgente e mais antiga primeiro)
    if (apenasFila) return ocorrencias.ativas(signal);
    const lista = await ocorrencias.filtrar(
      {
        status: filtros.status === TODOS || filtros.status === FILA ? null : (filtros.status as OcorrenciaStatus),
        urgencia: filtros.urgencia === TODOS ? null : (filtros.urgencia as GrauUrgencia),
        equipeId: filtros.equipe === TODOS ? null : Number(filtros.equipe),
        inicio: inicioDoDia(filtros.de),
        fim: fimDoDia(filtros.ate),
      },
      signal,
    );
    return filtros.status === FILA ? lista.filter((o) => o.ocorrenciaStatus !== 'CONCLUIDO') : lista;
  });

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return consulta.dados ?? [];
    return (consulta.dados ?? []).filter((o) =>
      [o.protocolo, o.animal?.especie, o.endereco, o.pontoReferencia, o.equipe?.nome]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(termo)),
    );
  }, [consulta.dados, busca]);

  const alterar = (campo: keyof Filtros) => (valor: string) => setFiltros((f) => ({ ...f, [campo]: valor }));
  const filtrado = JSON.stringify(filtros) !== JSON.stringify(INICIAL) || busca;

  return (
    <>
      <CabecalhoPagina
        titulo="Ocorrências"
        descricao={
          apenasFila
            ? 'Fila de atendimento: casos em aberto, dos mais urgentes para os menos urgentes.'
            : 'Resultado dos filtros aplicados.'
        }
      >
        <Button variant="outline" size="icon" onClick={consulta.recarregar} aria-label="Atualizar lista">
          <RotateCw className={consulta.carregando ? 'animate-spin' : undefined} />
        </Button>
        {pode('ATENDENTE', 'COORDENADOR') && (
          <Button asChild className="bg-cta text-cta-foreground hover:bg-cta/90">
            <Link href="/admin/ocorrencias/nova">
              <Plus /> Nova ocorrência
            </Link>
          </Button>
        )}
      </CabecalhoPagina>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
        <div className="relative sm:col-span-2 lg:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Protocolo, espécie ou local"
            className="bg-card pl-9"
            aria-label="Buscar na lista"
          />
        </div>
        <Select value={filtros.status} onValueChange={alterar('status')}>
          <SelectTrigger className="w-full bg-card lg:w-44" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FILA}>Em aberto</SelectItem>
            <SelectItem value={TODOS}>Todos os status</SelectItem>
            {ETAPAS_OCORRENCIA.map((e) => (
              <SelectItem key={e.status} value={e.status}>
                {e.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtros.urgencia} onValueChange={alterar('urgencia')}>
          <SelectTrigger className="w-full bg-card lg:w-40" aria-label="Urgência">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Toda urgência</SelectItem>
            {[...URGENCIAS].reverse().map((u) => (
              <SelectItem key={u.valor} value={u.valor}>
                {u.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtros.equipe} onValueChange={alterar('equipe')}>
          <SelectTrigger className="w-full bg-card lg:w-44" aria-label="Equipe">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todas as equipes</SelectItem>
            {listaEquipes.dados?.map((e) => (
              <SelectItem key={e.id} value={String(e.id)}>
                {e.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
          <Input
            type="date"
            value={filtros.de}
            max={filtros.ate || undefined}
            onChange={(e) => alterar('de')(e.target.value)}
            className="bg-card"
            aria-label="Registradas a partir de"
          />
          <span className="text-sm text-muted-foreground">até</span>
          <Input
            type="date"
            value={filtros.ate}
            min={filtros.de || undefined}
            onChange={(e) => alterar('ate')(e.target.value)}
            className="bg-card"
            aria-label="Registradas até"
          />
        </div>
        {filtrado && (
          <Button
            variant="ghost"
            onClick={() => {
              setFiltros(INICIAL);
              setBusca('');
            }}
          >
            <X /> Limpar
          </Button>
        )}
      </div>

      {consulta.erro && !consulta.dados ? (
        <Aviso titulo="Não foi possível carregar as ocorrências" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      ) : !consulta.dados ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : visiveis.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50">
          <Aviso
            Icone={Search}
            titulo={apenasFila && !busca ? 'Nenhuma ocorrência em aberto' : 'Nenhuma ocorrência encontrada'}
            texto={apenasFila && !busca ? 'Todos os chamados foram concluídos.' : 'Ajuste os filtros ou a busca.'}
          />
        </div>
      ) : (
        <>
          <p className="mb-2 text-xs text-muted-foreground">
            {visiveis.length} {visiveis.length === 1 ? 'ocorrência' : 'ocorrências'}
          </p>

          {/* Tabela a partir de telas médias */}
          <div className="hidden overflow-hidden rounded-xl border border-border/70 bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border/70 bg-muted/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Protocolo</th>
                  <th className="px-4 py-2.5 font-medium">Animal</th>
                  <th className="hidden px-4 py-2.5 font-medium xl:table-cell">Local</th>
                  <th className="px-4 py-2.5 font-medium">Urgência</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Equipe</th>
                  <th className="px-4 py-2.5 text-right font-medium">Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {visiveis.map((o) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/admin/ocorrencias/${o.id}`)}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/ocorrencias/${o.id}`}
                        className="font-mono text-[0.8rem] font-medium text-foreground hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {o.protocolo}
                      </Link>
                      {o.origemRegistro === 'CADASTRO_MANUAL' && (
                        <span className="ml-2 text-[0.7rem] text-muted-foreground">manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-foreground">{rotuloCategoria(o.animal?.categoriaAnimal ?? null)}</span>
                      {o.animal?.especie && <span className="block text-xs text-muted-foreground">{o.animal.especie}</span>}
                    </td>
                    <td className="hidden max-w-56 px-4 py-3 xl:table-cell">
                      <span className="line-clamp-2 text-muted-foreground">{local(o)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SeloUrgencia urgencia={o.grauUrgencia} />
                    </td>
                    <td className="px-4 py-3">
                      <SeloStatus status={o.ocorrenciaStatus} />
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">{o.equipe?.nome ?? '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap text-muted-foreground">
                      {dataRelativa(o.dataHoraRegistro)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cartões no celular */}
          <ul className="space-y-2 md:hidden">
            {visiveis.map((o) => (
              <li key={o.id}>
                <Link href={`/admin/ocorrencias/${o.id}`} className="block rounded-xl border border-border/70 bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-[0.8rem] font-medium">{o.protocolo}</p>
                      <p className="mt-0.5 text-sm text-foreground">
                        {rotuloCategoria(o.animal?.categoriaAnimal ?? null)}
                        {o.animal?.especie && <span className="text-muted-foreground"> · {o.animal.especie}</span>}
                      </p>
                    </div>
                    <SeloUrgencia urgencia={o.grauUrgencia} />
                  </div>
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5 shrink-0" />
                    <span className="truncate">{local(o)}</span>
                  </p>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <SeloStatus status={o.ocorrenciaStatus} />
                    <span className="flex items-center gap-2 text-xs text-muted-foreground">
                      {o.midias.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <ImageIcon className="size-3.5" /> {o.midias.length}
                        </span>
                      )}
                      {dataRelativa(o.dataHoraRegistro)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
