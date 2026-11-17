'use client';

import { Download, Printer } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { CategoriaAnimal, OcorrenciaStatus } from '@/lib/api';
import {
  duracao,
  fimDoDia,
  inicioDoDia,
  rotuloCategoria,
  rotuloStatus,
  rotuloUrgencia,
} from '@/lib/ocorrencia';
import { equipes, relatorios, type Contagem, type GrauUrgencia, type Relatorio } from '@/lib/painel';
import { Aviso, Bloco, CabecalhoPagina } from '../../_components/elementos';
import { SomentePerfis } from '../../_components/sessao';
import { useConsulta } from '../../_components/usar-consulta';

const TODAS = 'todas';
const fmtNumero = new Intl.NumberFormat('pt-BR');
const fmtData = new Intl.DateTimeFormat('pt-BR');

const paraInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function mesAtual() {
  const hoje = new Date();
  return { de: paraInput(new Date(hoje.getFullYear(), hoje.getMonth(), 1)), ate: paraInput(hoje) };
}

export function Relatorios() {
  return (
    <SomentePerfis perfis={['ATENDENTE', 'COORDENADOR']}>
      <Conteudo />
    </SomentePerfis>
  );
}

function Conteudo() {
  const [periodo, setPeriodo] = useState(mesAtual);
  const [equipe, setEquipe] = useState(TODAS);
  const listaEquipes = useConsulta('equipes', (signal) => equipes.listar(signal));

  const invalido = Boolean(periodo.de && periodo.ate && periodo.de > periodo.ate);
  const consulta = useConsulta(JSON.stringify([periodo, equipe, invalido]), (signal) =>
    invalido
      ? Promise.resolve(null)
      : relatorios.gerar(
          {
            inicio: inicioDoDia(periodo.de),
            fim: fimDoDia(periodo.ate),
            equipeId: equipe === TODAS ? null : Number(equipe),
          },
          signal,
        ),
  );

  const nomeEquipe = listaEquipes.dados?.find((e) => String(e.id) === equipe)?.nome;
  const descricaoPeriodo = [
    periodo.de ? fmtData.format(new Date(`${periodo.de}T00:00`)) : 'início',
    periodo.ate ? fmtData.format(new Date(`${periodo.ate}T00:00`)) : 'hoje',
  ].join(' a ');

  return (
    <>
      <CabecalhoPagina titulo="Relatórios" descricao="Indicadores de um período para acompanhamento interno e prestação de contas aos órgãos ambientais.">
        <Button variant="outline" onClick={() => consulta.dados && exportarCsv(consulta.dados, descricaoPeriodo, nomeEquipe)} disabled={!consulta.dados}>
          <Download /> CSV
        </Button>
        <Button variant="outline" onClick={() => window.print()} disabled={!consulta.dados}>
          <Printer /> Imprimir
        </Button>
      </CabecalhoPagina>

      <div className="mb-5 flex flex-wrap items-end gap-3 print:hidden">
        <label className="text-xs text-muted-foreground">
          De
          <Input type="date" value={periodo.de} onChange={(e) => setPeriodo((p) => ({ ...p, de: e.target.value }))} className="mt-1 bg-card" />
        </label>
        <label className="text-xs text-muted-foreground">
          Até
          <Input type="date" value={periodo.ate} onChange={(e) => setPeriodo((p) => ({ ...p, ate: e.target.value }))} className="mt-1 bg-card" />
        </label>
        <label className="text-xs text-muted-foreground">
          Equipe
          <Select value={equipe} onValueChange={setEquipe}>
            <SelectTrigger className="mt-1 w-48 bg-card">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODAS}>Todas as equipes</SelectItem>
              {listaEquipes.dados?.map((e) => (
                <SelectItem key={e.id} value={String(e.id)}>
                  {e.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <Button variant="ghost" onClick={() => { setPeriodo({ de: '', ate: '' }); setEquipe(TODAS); }}>
          Todo o período
        </Button>
      </div>

      <p className="mb-4 hidden text-sm print:block">
        Período: {descricaoPeriodo}
        {nomeEquipe ? ` · ${nomeEquipe}` : ''}
      </p>

      {invalido ? (
        <Aviso titulo="Período inválido" texto="A data inicial não pode ser depois da data final." />
      ) : consulta.erro && !consulta.dados ? (
        <Aviso titulo="Não foi possível gerar o relatório" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      ) : !consulta.dados ? (
        <div className="space-y-4">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : (
        <Resultado r={consulta.dados} />
      )}
    </>
  );
}

function Resultado({ r }: { r: Relatorio }) {
  const numeros = [
    { rotulo: 'Ocorrências', valor: fmtNumero.format(r.totalOcorrencias) },
    { rotulo: 'Concluídas', valor: fmtNumero.format(r.concluidas) },
    { rotulo: 'Taxa de conclusão', valor: `${r.taxaConclusao.toLocaleString('pt-BR')}%` },
    { rotulo: 'Tempo médio até a triagem', valor: duracao(r.tempoMedioRespostaMinutos) },
    { rotulo: 'Tempo médio até a conclusão', valor: duracao(r.tempoMedioConclusaoMinutos) },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {numeros.map((n) => (
          <div key={n.rotulo} className="rounded-xl border border-border/70 bg-card px-4 py-3.5 break-inside-avoid">
            <p className="text-xs text-muted-foreground">{n.rotulo}</p>
            <p className="mt-1 font-heading text-2xl text-foreground tabular-nums">{n.valor}</p>
          </div>
        ))}
      </div>

      {r.totalOcorrencias === 0 && (
        <p className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">Nenhuma ocorrência registrada neste período.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Distribuicao titulo="Por status" itens={r.porStatus} rotulo={(v) => rotuloStatus(v as OcorrenciaStatus)} total={r.totalOcorrencias} />
        <Distribuicao titulo="Por grau de urgência" itens={[...r.porGrauUrgencia].reverse()} rotulo={(v) => rotuloUrgencia(v as GrauUrgencia)} total={r.totalOcorrencias} />
        <Distribuicao titulo="Por tipo de animal" itens={r.porCategoriaAnimal} rotulo={(v) => rotuloCategoria(v as CategoriaAnimal)} total={r.totalOcorrencias} />
        <Distribuicao titulo="Por equipe" itens={r.porEquipe} rotulo={(v) => v} total={r.totalOcorrencias} vazio="Nenhuma ocorrência com equipe designada." />
      </div>
      <p className="text-xs text-muted-foreground">
        Tempo até a triagem: do registro até a primeira movimentação da central. Ocorrências que ainda não chegaram à etapa ficam fora da média.
      </p>
    </div>
  );
}

function Distribuicao({
  titulo,
  itens,
  rotulo,
  total,
  vazio,
}: {
  titulo: string;
  itens: Contagem[];
  rotulo: (v: string) => string;
  total: number;
  vazio?: string;
}) {
  const maior = Math.max(1, ...itens.map((i) => i.quantidade));
  return (
    <Bloco titulo={titulo} className="break-inside-avoid">
      {itens.length === 0 ? (
        <p className="text-sm text-muted-foreground">{vazio ?? 'Sem dados.'}</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {itens.map((i) => (
              <tr key={i.rotulo}>
                <td className="w-36 py-1.5 pr-3 text-foreground">{rotulo(i.rotulo)}</td>
                <td className="py-1.5">
                  <div className="h-2 rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary/70" style={{ width: `${(i.quantidade / maior) * 100}%` }} />
                  </div>
                </td>
                <td className="w-10 py-1.5 pl-3 text-right font-medium tabular-nums">{i.quantidade}</td>
                <td className="w-14 py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                  {total ? `${Math.round((i.quantidade / total) * 100)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Bloco>
  );
}

function exportarCsv(r: Relatorio, periodo: string, equipe?: string) {
  const linhas: (string | number)[][] = [
    ['Relatório de ocorrências - Instituto Caapora'],
    ['Período', periodo],
    ['Equipe', equipe ?? 'Todas'],
    [],
    ['Indicador', 'Valor'],
    ['Ocorrências', r.totalOcorrencias],
    ['Concluídas', r.concluidas],
    ['Taxa de conclusão (%)', r.taxaConclusao],
    ['Tempo médio até a triagem (min)', r.tempoMedioRespostaMinutos ?? ''],
    ['Tempo médio até a conclusão (min)', r.tempoMedioConclusaoMinutos ?? ''],
  ];
  const secao = (titulo: string, itens: Contagem[], rotulo: (v: string) => string) => {
    linhas.push([], [titulo, 'Quantidade'], ...itens.map((i) => [rotulo(i.rotulo), i.quantidade]));
  };
  secao('Status', r.porStatus, (v) => rotuloStatus(v as OcorrenciaStatus));
  secao('Urgência', r.porGrauUrgencia, (v) => rotuloUrgencia(v as GrauUrgencia));
  secao('Tipo de animal', r.porCategoriaAnimal, (v) => rotuloCategoria(v as CategoriaAnimal));
  secao('Equipe', r.porEquipe, (v) => v);

  // ";" e BOM para o Excel em português abrir com acentos e colunas certas
  const csv = '﻿' + linhas.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio-caapora-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
