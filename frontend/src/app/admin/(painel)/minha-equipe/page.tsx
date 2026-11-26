import type { Metadata } from 'next';
import MinhaEquipe from './_components/MinhaEquipe';

export const metadata: Metadata = {
  title: 'Minha equipe | Painel — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function MinhaEquipePage() {
  return <MinhaEquipe />;
}
