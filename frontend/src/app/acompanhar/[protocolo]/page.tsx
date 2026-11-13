import type { Metadata } from 'next';
import { DetalheOcorrencia } from './_components/DetalheOcorrencia';

export const metadata: Metadata = {
  title: 'Detalhes da ocorrência | Instituto Caapora',
  // a página mostra dados de uma ocorrência específica: não deve ir para buscadores
  robots: { index: false, follow: false },
};

export default async function DetalhePage({ params }: { params: Promise<{ protocolo: string }> }) {
  const { protocolo } = await params;
  return (
    <div className="min-h-screen bg-background">
      <DetalheOcorrencia protocolo={decodeURIComponent(protocolo).toUpperCase()} />
    </div>
  );
}
