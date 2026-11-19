import type { Metadata } from 'next';
import Dashboard from './_components/dashboard/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Dashboard />;
}
