'use client';

import 'leaflet/dist/leaflet.css';
import { Info, RotateCw } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapaLeaflet, LayerGroup } from 'leaflet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { URGENCIAS } from '@/lib/ocorrencia';
import { dashboard, type GrauUrgencia, type PontoMapa } from '@/lib/painel';
import { Aviso, Bloco, CabecalhoPagina, COR_URGENCIA } from '../../_components/elementos';
import { SomentePerfis } from '../../_components/sessao';
import { useConsulta } from '../../_components/usar-consulta';

const PERIODOS = [
  { dias: '30', rotulo: 'Últimos 30 dias' },
  { dias: '90', rotulo: 'Últimos 90 dias' },
  { dias: '180', rotulo: 'Últimos 6 meses' },
  { dias: '365', rotulo: 'Último ano' },
];

// Sem pontos, o mapa abre em Salvador (área de atuação do instituto)
const CENTRO_PADRAO: [number, number] = [-12.9714, -38.5014];

// Casos mais graves pesam mais na mancha de calor
const PESO: Record<GrauUrgencia, number> = { BAIXA: 0.4, MEDIA: 0.6, ALTA: 0.85, CRITICA: 1 };

// Escala de uma cor só (laranja da marca), do claro ao escuro
const ESCALA: [number, string][] = [
  [0.2, '#f6dcb0'],
  [0.45, '#eaa15a'],
  [0.7, '#c8501a'],
  [1, '#7a2a0c'],
];
const GRADIENTE = Object.fromEntries(ESCALA);

export function MapaCalor() {
  return (
    <SomentePerfis perfis={['ATENDENTE', 'COORDENADOR']}>
      <Conteudo />
    </SomentePerfis>
  );
}

function Conteudo() {
  const [dias, setDias] = useState('90');
  const [modo, setModo] = useState<'calor' | 'pontos'>('calor');
  const [urgencias, setUrgencias] = useState<GrauUrgencia[]>(URGENCIAS.map((u) => u.valor));

  const consulta = useConsulta(`mapa-${dias}`, (signal) => dashboard.mapaCalor(Number(dias), signal));
  const pontos = useMemo(
    () => (consulta.dados ?? []).filter((p) => urgencias.includes(p.grauUrgencia ?? 'MEDIA')),
    [consulta.dados, urgencias],
  );

  const contagem = URGENCIAS.map((u) => ({
    ...u,
    quantidade: (consulta.dados ?? []).filter((p) => p.grauUrgencia === u.valor).length,
  })).reverse();

  return (
    <>
      <CabecalhoPagina titulo="Mapa de calor" descricao="Onde as ocorrências se concentram, a partir da localização enviada por GPS.">
        <Select value={dias} onValueChange={setDias}>
          <SelectTrigger className="w-44 bg-card" aria-label="Período">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODOS.map((p) => (
              <SelectItem key={p.dias} value={p.dias}>
                {p.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={consulta.recarregar} aria-label="Atualizar mapa">
          <RotateCw className={consulta.carregando ? 'animate-spin' : undefined} />
        </Button>
      </CabecalhoPagina>

      {consulta.erro && !consulta.dados ? (
        <Aviso titulo="Não foi possível carregar o mapa" texto={consulta.erro} acao={{ rotulo: 'Tentar de novo', aoClicar: consulta.recarregar }} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_17rem]">
          <div className="relative overflow-hidden rounded-xl border border-border/70 bg-card">
            <Mapa pontos={pontos} modo={modo} />
            <div className="absolute top-3 right-3 z-[500] rounded-lg bg-card/95 p-1 shadow-sm">
              <ToggleGroup type="single" size="sm" value={modo} onValueChange={(v) => v && setModo(v as typeof modo)} aria-label="Visualização">
                <ToggleGroupItem value="calor">Calor</ToggleGroupItem>
                <ToggleGroupItem value="pontos">Pontos</ToggleGroupItem>
              </ToggleGroup>
            </div>
            {modo === 'calor' && pontos.length > 0 && (
              <div className="absolute bottom-3 left-3 z-[500] rounded-lg bg-card/95 px-3 py-2 text-xs shadow-sm">
                <p className="mb-1 text-muted-foreground">Concentração</p>
                <div className="h-2 w-36 rounded-full" style={{ background: `linear-gradient(to right, ${ESCALA.map(([, cor]) => cor).join(', ')})` }} />
                <div className="mt-0.5 flex justify-between text-muted-foreground">
                  <span>menor</span>
                  <span>maior</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Bloco titulo="Pontos no mapa">
              <p className="font-heading text-3xl text-foreground tabular-nums">{consulta.dados ? pontos.length : '—'}</p>
              <p className="text-xs text-muted-foreground">
                {consulta.dados && pontos.length !== consulta.dados.length
                  ? `de ${consulta.dados.length} no período`
                  : 'ocorrências com GPS no período'}
              </p>
            </Bloco>

            <Bloco titulo="Urgência">
              <ul className="space-y-1">
                {contagem.map((u) => {
                  const ativo = urgencias.includes(u.valor);
                  return (
                    <li key={u.valor}>
                      <button
                        type="button"
                        aria-pressed={ativo}
                        onClick={() =>
                          setUrgencias((atual) =>
                            ativo ? atual.filter((x) => x !== u.valor) : [...atual, u.valor],
                          )
                        }
                        className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted/60 ${ativo ? '' : 'opacity-45'}`}
                      >
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: COR_URGENCIA[u.valor] }} aria-hidden />
                        <span className="flex-1 text-left">{u.rotulo}</span>
                        <span className="text-muted-foreground tabular-nums">{u.quantidade}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Clique para mostrar ou esconder.</p>
            </Bloco>

            <p className="flex gap-2 px-1 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Ocorrências registradas só com endereço digitado, sem coordenadas, não aparecem no mapa.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Leaflet mexe direto no DOM e precisa de window: é carregado só no navegador
function Mapa({ pontos, modo }: { pontos: PontoMapa[]; modo: 'calor' | 'pontos' }) {
  const elemento = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaLeaflet | null>(null);
  const camada = useRef<LayerGroup | null>(null);
  const [pronto, setPronto] = useState(false);
  const enquadrado = useRef(false);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const L = (await import('leaflet')).default;
      // o plugin leaflet.heat se registra no L global
      (window as unknown as { L: typeof L }).L = L;
      await import('leaflet.heat');
      if (cancelado || !elemento.current || mapa.current) return;
      mapa.current = L.map(elemento.current, { zoomControl: true, attributionControl: true }).setView(CENTRO_PADRAO, 11);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(mapa.current);
      camada.current = L.layerGroup().addTo(mapa.current);
      setPronto(true);
    })();
    return () => {
      cancelado = true;
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    if (!pronto || !mapa.current || !camada.current) return;
    let cancelado = false;
    (async () => {
      const L = (await import('leaflet')).default;
      if (cancelado || !camada.current || !mapa.current) return;
      camada.current.clearLayers();
      if (modo === 'calor') {
        L.heatLayer(
          pontos.map((p) => [p.latitude, p.longitude, PESO[p.grauUrgencia ?? 'MEDIA']]),
          { radius: 28, blur: 22, max: 0.6, minOpacity: 0.5, gradient: GRADIENTE },
        ).addTo(camada.current);
      } else {
        for (const p of pontos) {
          L.circleMarker([p.latitude, p.longitude], {
            radius: 7,
            color: '#ffffff',
            weight: 2,
            fillColor: COR_URGENCIA[p.grauUrgencia ?? 'MEDIA'],
            fillOpacity: 0.9,
          })
            .bindTooltip(`Urgência ${URGENCIAS.find((u) => u.valor === p.grauUrgencia)?.rotulo.toLowerCase() ?? 'não definida'}`)
            .addTo(camada.current);
        }
      }
      // Enquadra os pontos só na primeira carga, para não tirar o zoom de quem está navegando
      if (pontos.length && !enquadrado.current) {
        mapa.current.fitBounds(L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude])), { padding: [40, 40], maxZoom: 14 });
        enquadrado.current = true;
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [pontos, modo, pronto]);

  return <div ref={elemento} className="h-[60vh] min-h-96 w-full lg:h-[calc(100dvh-13rem)]" aria-label="Mapa das ocorrências" role="region" />;
}
