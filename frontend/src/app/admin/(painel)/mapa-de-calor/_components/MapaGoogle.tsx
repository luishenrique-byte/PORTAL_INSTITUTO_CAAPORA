'use client';

import { useCallback, useEffect, useRef } from 'react';
import { APIProvider, Map as MapaBase, useMap } from '@vis.gl/react-google-maps';
import { GoogleMapsOverlay } from '@deck.gl/google-maps';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { pesoDaUrgencia, type PontoMapa } from './pontos';

// O Google chama esta função global quando a chave é recusada (inválida, restrita, sem faturamento)
declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

const CENTRO_INICIAL: google.maps.LatLngLiteral = { lat: -12.97, lng: -38.51 };
const ZOOM_INICIAL = 11;
const ZOOM_PONTO_UNICO = 14;
const ZOOM_MAXIMO_ENQUADRAMENTO = 16;
const MENSAGEM_FALHA = 'O Google Maps não pôde ser carregado. Verifique a chave e as restrições dela.';

interface MapaGoogleProps {
  pontos: PontoMapa[];
  // Conjunto do período inteiro: só ele define o enquadramento da câmera (o filtro de urgência não)
  enquadrar: PontoMapa[];
  chave: string;
  aoFalhar: (mensagem: string) => void;
}

export default function MapaGoogle({ pontos, enquadrar, chave, aoFalhar }: MapaGoogleProps) {
  // Guarda a callback mais recente sem recriar o handler do APIProvider a cada render
  const aoFalharRef = useRef(aoFalhar);
  const falhouRef = useRef(false);

  useEffect(() => {
    aoFalharRef.current = aoFalhar;
  }, [aoFalhar]);

  // Avisa a tela uma única vez, venha a falha do carregamento ou da autenticação
  const reportarFalha = useCallback(() => {
    if (falhouRef.current) return;
    falhouRef.current = true;
    aoFalharRef.current(MENSAGEM_FALHA);
  }, []);

  useEffect(() => {
    const anterior = window.gm_authFailure;
    window.gm_authFailure = () => {
      reportarFalha();
      anterior?.();
    };
    return () => {
      window.gm_authFailure = anterior;
    };
  }, [reportarFalha]);

  return (
    <APIProvider apiKey={chave} onError={reportarFalha}>
      <MapaBase
        className="h-full w-full"
        defaultCenter={CENTRO_INICIAL}
        defaultZoom={ZOOM_INICIAL}
        gestureHandling="cooperative"
        disableDefaultUI
        zoomControl
      >
        <CamadaDeCalor pontos={pontos} />
        <Enquadramento pontos={enquadrar} />
      </MapaBase>
    </APIProvider>
  );
}

// Mancha de calor do deck.gl desenhada sobre o mapa raster do Google
function CamadaDeCalor({ pontos }: { pontos: PontoMapa[] }) {
  const mapa = useMap();
  const overlayRef = useRef<GoogleMapsOverlay | null>(null);
  // Pontos atuais, para o overlay já nascer com eles se for criado depois da chegada dos dados
  const pontosRef = useRef(pontos);

  useEffect(() => {
    pontosRef.current = pontos;
  }, [pontos]);

  // Cria o overlay uma vez por instância de mapa e o descarta ao desmontar.
  // Só o cria com o tipo de renderização já definido: com o tipo indefinido, o
  // GoogleMapsOverlay.setMap registra um listener próprio que nem setMap(null) nem
  // finalize() removem, e um overlay já descartado voltaria a desenhar no mapa.
  useEffect(() => {
    if (!mapa) return;
    const { UNINITIALIZED } = google.maps.RenderingType;
    let overlay: GoogleMapsOverlay | null = null;
    let ouvinte: google.maps.MapsEventListener | null = null;

    const criar = () => {
      overlay = new GoogleMapsOverlay({ layers: [criarCamada(pontosRef.current)] });
      overlay.setMap(mapa);
      overlayRef.current = overlay;
    };

    if (mapa.getRenderingType() !== UNINITIALIZED) {
      criar();
    } else {
      ouvinte = mapa.addListener('renderingtype_changed', () => {
        if (mapa.getRenderingType() === UNINITIALIZED) return;
        ouvinte?.remove();
        ouvinte = null;
        criar();
      });
    }

    return () => {
      ouvinte?.remove();
      if (overlay) {
        overlay.setMap(null);
        overlay.finalize();
      }
      overlayRef.current = null;
    };
  }, [mapa]);

  // Troca só as camadas quando chega um novo conjunto de pontos
  useEffect(() => {
    overlayRef.current?.setProps({ layers: [criarCamada(pontos)] });
  }, [pontos]);

  return null;
}

function criarCamada(pontos: PontoMapa[]) {
  return new HeatmapLayer<PontoMapa>({
    id: 'calor-ocorrencias',
    data: pontos,
    getPosition: (p) => [p.longitude, p.latitude],
    getWeight: (p) => pesoDaUrgencia(p.grauUrgencia),
    radiusPixels: 40,
    intensity: 1,
    threshold: 0.05,
  });
}

// Enquadra o conjunto do período a cada nova carga (o filtro de urgência não reenquadra);
// sem pontos, volta à vista inicial
function Enquadramento({ pontos }: { pontos: PontoMapa[] }) {
  const mapa = useMap();

  useEffect(() => {
    if (!mapa) return;

    if (pontos.length === 0) {
      mapa.setCenter(CENTRO_INICIAL);
      mapa.setZoom(ZOOM_INICIAL);
      return;
    }

    const limites = new google.maps.LatLngBounds();
    for (const p of pontos) {
      limites.extend({ lat: p.latitude, lng: p.longitude });
    }

    // Um ponto só (ou todos no mesmo lugar) gera limites de área zero: fitBounds daria zoom máximo
    const ne = limites.getNorthEast();
    const so = limites.getSouthWest();
    if (ne.equals(so)) {
      mapa.setCenter(ne);
      mapa.setZoom(ZOOM_PONTO_UNICO);
      return;
    }

    mapa.fitBounds(limites);

    // Pontos a poucos metros um do outro também fariam o fitBounds chegar ao zoom máximo
    const ouvinte = mapa.addListener('idle', () => {
      ouvinte.remove();
      const zoom = mapa.getZoom();
      if (zoom !== undefined && zoom > ZOOM_MAXIMO_ENQUADRAMENTO) mapa.setZoom(ZOOM_MAXIMO_ENQUADRAMENTO);
    });
    return () => ouvinte.remove();
  }, [mapa, pontos]);

  return null;
}
