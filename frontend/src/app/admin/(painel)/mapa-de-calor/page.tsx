import type { Metadata } from 'next';
import MapaDeCalor from './_components/MapaDeCalor';

export const metadata: Metadata = {
  title: 'Mapa de Calor | Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function MapaDeCalorPage() {
  return <MapaDeCalor />;
}
