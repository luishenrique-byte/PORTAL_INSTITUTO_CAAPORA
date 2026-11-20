import type { Metadata } from 'next';
import PainelProvisorio from './_components/PainelProvisorio';

export const metadata: Metadata = {
  title: 'Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

// Provisório: destino do login até o dashboard ser construído.
export default function AdminPage() {
  return <PainelProvisorio />;
}
