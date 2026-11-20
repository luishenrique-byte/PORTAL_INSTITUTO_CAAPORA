import { redirect } from 'next/navigation';

// O Dashboard agora é a página inicial do painel (/admin); mantém o endereço antigo funcionando.
export default function DashboardAntigo() {
  redirect('/admin');
}
