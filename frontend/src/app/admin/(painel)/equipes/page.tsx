import type { Metadata } from 'next';
import EquipesDeCampo from './_components/EquipesDeCampo';

export const metadata: Metadata = {
  title: 'Equipes de Campo | Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function EquipesPage() {
  return <EquipesDeCampo />;
}
