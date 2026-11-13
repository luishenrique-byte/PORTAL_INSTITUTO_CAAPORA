import type { Metadata } from 'next';
import { BuscaProtocolo } from './_components/BuscaProtocolo';

export const metadata: Metadata = {
  title: 'Acompanhar ocorrência | Instituto Caapora',
  description: 'Consulte o andamento do resgate pelo número de protocolo.',
};

export default function AcompanharPage() {
  return (
    <div className="min-h-screen bg-background">
      <BuscaProtocolo />
    </div>
  );
}
