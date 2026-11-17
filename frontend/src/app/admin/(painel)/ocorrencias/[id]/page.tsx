import { DetalheOcorrenciaPainel } from './_components/detalhe';

export default async function OcorrenciaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetalheOcorrenciaPainel id={Number(id)} />;
}
