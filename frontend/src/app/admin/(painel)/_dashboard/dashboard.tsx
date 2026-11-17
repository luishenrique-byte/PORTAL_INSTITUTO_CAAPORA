'use client';

import { RotateCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ETAPAS_OCORRENCIA, rotuloMes } from '@/lib/ocorrencia';
import { dashboard, ocorrencias, type Contagem, type Ocorrencia } from '@/lib/painel';
import { Aviso, Bloco, CabecalhoPagina, ICONE_STATUS } from '../_components/elementos';
import { useSessao } from '../_components/sessao';
import { useConsulta } from '../_components/usar-consulta';

const fmtNumero = new Intl.NumberFormat('pt-BR');
const fmtPct = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

const PERIODOS = [
  { valor: '3', rotulo: 'Últimos 3 meses' },
  { valor: '6', rotulo: 'Últimos 6 meses' },
  { valor: '12', rotulo: 'Últimos 12 meses' },
  { valor: 'tudo', rotulo: 'Todo o período' },
] as const;

type Periodo = (typeof PERIODOS)[number]['valor'];

// Início do período alinhado com /dashboard/por-mes (primeiro dia do mês mais antigo)
function inicioPeriodo(meses: number) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - (meses - 1));
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-01T00:00:00`;
}

const anoMes = (iso: string) => iso.slice(0, 7); // "2026-10-03T..." -> "2026-10"

// Mesmo arredondamento do DashboardService.porcentagem (uma casa decimal)
const porcentagem = (parte: number, total: number) => (total === 0 ? 0 : Math.round((parte * 1000) / total) / 10);

// Os endpoints /dashboard/resumo, /por-status e /por-categoria não recebem período.
// Para respeitar o filtro, os indicadores saem da lista de /ocorrencias/filtro?inicio=...,
// com as mesmas regras do DashboardService.
function calcular(lista: Ocorrencia[], porMes: Contagem[]) {
  const concluidas = lista.filter((o) => o.ocorrenciaStatus === 'CONCLUIDO');
  const total = lista.length;

  const contarPorMes = (itens: Ocorrencia[]) =>
    itens.reduce<Record<string, number>>((acc, o) => {
      const m = anoMes(o.dataHoraRegistro);
      acc[m] = (acc[m] ?? 0) + 1;
      return acc;
    }, {});
  const concluidasMes = contarPorMes(concluidas);
  // Resgate realizado = ocorrência concluída que teve equipe de campo designada
  const resgatesMes = contarPorMes(concluidas.filter((o) => o.equipe));

  const categoria = (o: Ocorrencia) => o.animal?.categoriaAnimal ?? 'INDEFINIDO';
  const grupos = ANIMAIS.map((g) => ({
    ...g,
    quantidade: lista.filter((o) => g.categorias.includes(categoria(o))).length,
  }));

  return {
    resumo: {
      total,
      emAberto: total - concluidas.length,
      concluidas: concluidas.length,
      criticas: lista.filter((o) => o.ocorrenciaStatus !== 'CONCLUIDO' && o.grauUrgencia === 'CRITICA').length,
      taxa: porcentagem(concluidas.length, total),
    },
    mensal: porMes.map((m) => ({
      mes: rotuloMes(m.rotulo),
      registradas: m.quantidade,
      concluidas: concluidasMes[m.rotulo] ?? 0,
      resgates: resgatesMes[m.rotulo] ?? 0,
    })),
    animais: grupos,
    status: ETAPAS_OCORRENCIA.map((e) => ({
      ...e,
      quantidade: lista.filter((o) => o.ocorrenciaStatus === e.status).length,
    })),
  };
}

type Indicadores = ReturnType<typeof calcular>;

export function Dashboard() {
  const { perfil } = useSessao();
  const router = useRouter();
  const [periodo, setPeriodo] = useState<Periodo>('6');

  // Equipe de campo não acessa /dashboard (403 no backend): vai direto para a fila
  const semAcesso = perfil === 'EQUIPE_CAMPO';
  useEffect(() => {
    if (semAcesso) router.replace('/admin/ocorrencias');
  }, [semAcesso, router]);

  const meses = periodo === 'tudo' ? 12 : Number(periodo);
  const consulta = useConsulta(`dashboard-${periodo}`, async (signal) => {
    if (semAcesso) return null;
    const [lista, porMes] = await Promise.all([
      ocorrencias.filtrar({ inicio: periodo === 'tudo' ? null : inicioPeriodo(meses) }, signal),
      dashboard.porMes(meses, signal),
    ]);
    return calcular(lista, porMes);
  });

  if (semAcesso) return null;

  const dados = consulta.dados ?? undefined;
  const rotuloPeriodo = periodo === 'tudo' ? 'Registradas desde o início' : `Registradas nos últimos ${meses} meses`;

  return (
    <>
      <CabecalhoPagina titulo="Dashboard" descricao="Visão geral das ocorrências, atendimentos e resgates do instituto.">
        <Select value={periodo} onValueChange={(v) => setPeriodo(v as Periodo)}>
          <SelectTrigger className="w-44 bg-card" aria-label="Período de referência">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.valor} value={p.valor}>
                {p.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={consulta.recarregar} disabled={consulta.carregando} aria-label="Atualizar dados">
          <RotateCw className={consulta.carregando ? 'animate-spin' : undefined} />
        </Button>
      </CabecalhoPagina>

      {consulta.erro && !dados ? (
        <Aviso
          titulo="Não foi possível carregar os indicadores"
          texto={consulta.erro}
          acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }}
        />
      ) : (
        <div className={`space-y-4 transition-opacity ${consulta.carregando && dados ? 'opacity-60' : ''}`}>
          <Cards dados={dados} periodo={rotuloPeriodo} />

          <div className="grid gap-4 xl:grid-cols-5">
            <Bloco className="xl:col-span-3" titulo="Ocorrências por mês">
              {dados ? <GraficoMensal dados={dados.mensal} /> : <Skeleton className="h-72 w-full" />}
            </Bloco>
            <Bloco className="xl:col-span-2" titulo="Ocorrências por tipo de animal">
              {dados ? <GraficoAnimais dados={dados.animais} /> : <Skeleton className="h-72 w-full" />}
            </Bloco>
          </div>

          <div className="grid gap-4 xl:grid-cols-5">
            <Bloco className="xl:col-span-3" titulo="Resgates realizados por mês">
              {dados ? <GraficoResgates dados={dados.mensal} /> : <Skeleton className="h-64 w-full" />}
            </Bloco>
            <Bloco className="xl:col-span-2" titulo="Ocorrências por status">
              {dados ? <IndicadoresStatus dados={dados.status} total={dados.resumo.total} /> : <Skeleton className="h-64 w-full" />}
            </Bloco>
          </div>
        </div>
      )}
    </>
  );
}

// ---------- 2.2 Cards ----------

function Cards({ dados, periodo }: { dados?: Indicadores; periodo: string }) {
  if (!dados) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-[7.25rem] rounded-xl" />
        ))}
      </div>
    );
  }
  const r = dados.resumo;
  const cards = [
    { titulo: 'Total de ocorrências', valor: fmtNumero.format(r.total), descricao: periodo },
    { titulo: 'Em aberto', valor: fmtNumero.format(r.emAberto), descricao: `${fmtNumero.format(r.concluidas)} encerradas` },
    {
      titulo: 'Urgência crítica',
      valor: fmtNumero.format(r.criticas),
      descricao: r.criticas ? 'Precisam de atendimento imediato' : 'Nenhum caso crítico em aberto',
      alerta: r.criticas > 0,
    },
    { titulo: 'Taxa de conclusão', valor: fmtPct(r.taxa), descricao: `${fmtNumero.format(r.concluidas)} de ${fmtNumero.format(r.total)} concluídas` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      {cards.map((c) => (
        <div
          key={c.titulo}
          className={`rounded-xl border bg-card px-5 py-4 ${c.alerta ? 'border-destructive/40' : 'border-border/70'}`}
        >
          <p className="text-sm text-muted-foreground">{c.titulo}</p>
          <p className={`mt-1 font-heading text-3xl tabular-nums ${c.alerta ? 'text-destructive' : 'text-foreground'}`}>
            {c.valor}
          </p>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">{c.descricao}</p>
        </div>
      ))}
    </div>
  );
}

function SemDados({ altura }: { altura: string }) {
  return (
    <div className={`flex items-center justify-center text-sm text-muted-foreground ${altura}`}>
      Nenhuma ocorrência no período selecionado.
    </div>
  );
}

// ---------- 2.3 Linhas: registradas x concluídas ----------

const configMensal = {
  registradas: { label: 'Registradas', color: '#3b6ea5' },
  concluidas: { label: 'Concluídas', color: '#2d6a2f' },
} satisfies ChartConfig;

function GraficoMensal({ dados }: { dados: Indicadores['mensal'] }) {
  if (!dados.some((d) => d.registradas)) return <SemDados altura="h-72" />;
  return (
    <ChartContainer config={configMensal} className="aspect-auto h-72 w-full xl:h-full xl:min-h-72">
      <LineChart data={dados} margin={{ left: -16, right: 12, top: 8 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
        <ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltipContent indicator="line" />} />
        <ChartLegend verticalAlign="top" content={<ChartLegendContent className="justify-end pt-0 pb-4" />} />
        {(['registradas', 'concluidas'] as const).map((serie) => (
          <Line
            key={serie}
            dataKey={serie}
            type="monotone"
            stroke={`var(--color-${serie})`}
            strokeWidth={2}
            dot={{ r: 3.5, fill: `var(--color-${serie})`, strokeWidth: 0 }}
            activeDot={{ r: 5.5, stroke: 'var(--card)', strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ChartContainer>
  );
}

// ---------- 2.4 Rosca por tipo de animal ----------

// Cores validadas para daltonismo (protan/deutan/tritan); a legenda sempre traz nome e %
const ANIMAIS = [
  { chave: 'aves', rotulo: 'Aves', categorias: ['AVE'], cor: '#2d6a2f' },
  { chave: 'mamiferos', rotulo: 'Mamíferos', categorias: ['MAMIFERO'], cor: '#d4a017' },
  { chave: 'repteis', rotulo: 'Répteis', categorias: ['REPTIL'], cor: '#3b6ea5' },
  { chave: 'anfibios', rotulo: 'Anfíbios', categorias: ['ANFIBIO'], cor: '#c8501a' },
  { chave: 'outros', rotulo: 'Outros', categorias: ['PEIXE', 'INDEFINIDO'], cor: '#8a5a9e' },
];

const configAnimais = Object.fromEntries(
  ANIMAIS.map((a) => [a.chave, { label: a.rotulo, color: a.cor }]),
) satisfies ChartConfig;

function GraficoAnimais({ dados }: { dados: Indicadores['animais'] }) {
  const total = dados.reduce((s, d) => s + d.quantidade, 0);
  if (!total) return <SemDados altura="h-72" />;

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col 2xl:flex-row">
      <ChartContainer config={configAnimais} className="relative aspect-square h-52 shrink-0">
        <PieChart>
          <ChartTooltip content={<ChartTooltipContent nameKey="chave" hideLabel />} />
          <Pie
            data={dados.filter((d) => d.quantidade > 0)}
            dataKey="quantidade"
            nameKey="chave"
            innerRadius="62%"
            outerRadius="100%"
            stroke="var(--card)"
            strokeWidth={2}
          >
            {dados
              .filter((d) => d.quantidade > 0)
              .map((d) => (
                <Cell key={d.chave} fill={d.cor} />
              ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
        {dados.map((d) => (
          <li key={d.chave} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: d.cor }} aria-hidden />
            <span className="flex-1 text-foreground">{d.rotulo}</span>
            <span className="text-muted-foreground tabular-nums">{fmtNumero.format(d.quantidade)}</span>
            <span className="w-14 text-right font-medium text-foreground tabular-nums">
              {fmtPct(porcentagem(d.quantidade, total))}
            </span>
          </li>
        ))}
        <li className="flex items-center gap-2.5 border-t border-border/60 pt-2 text-muted-foreground">
          <span className="size-2.5 shrink-0" aria-hidden />
          <span className="flex-1">Total</span>
          <span className="tabular-nums">{fmtNumero.format(total)}</span>
          <span className="w-14" />
        </li>
      </ul>
    </div>
  );
}

// ---------- 2.5 Barras verticais de resgates ----------

const configResgates = { resgates: { label: 'Resgates', color: 'var(--chart-2)' } } satisfies ChartConfig;

function GraficoResgates({ dados }: { dados: Indicadores['mensal'] }) {
  if (!dados.some((d) => d.registradas)) return <SemDados altura="h-64" />;
  return (
    <>
      <ChartContainer config={configResgates} className="aspect-auto h-64 w-full">
        <BarChart data={dados} margin={{ left: -16, right: 12, top: 16 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} />
          <ChartTooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltipContent />} />
          <Bar dataKey="resgates" fill="var(--color-resgates)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ChartContainer>
      <p className="mt-2 text-xs text-muted-foreground">
        Ocorrências concluídas com equipe de campo designada, pelo mês de registro.
      </p>
    </>
  );
}

// ---------- 2.6 Barras de progresso por status ----------

function IndicadoresStatus({ dados, total }: { dados: Indicadores['status']; total: number }) {
  return (
    <ul className="space-y-4">
      {dados.map((s) => {
        const Icone = ICONE_STATUS[s.status];
        const pct = porcentagem(s.quantidade, total);
        return (
          <li key={s.status}>
            <div className="mb-1.5 flex items-center gap-2 text-sm">
              <Icone className="size-4 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-foreground">{s.rotulo}</span>
              <span className="font-medium text-foreground tabular-nums">{fmtNumero.format(s.quantidade)}</span>
              <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">{fmtPct(pct)}</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label={s.rotulo}
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-[width] duration-500 ${s.status === 'CONCLUIDO' ? 'bg-primary' : 'bg-primary/55'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
