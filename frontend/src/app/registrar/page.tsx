import type { Metadata } from 'next';
import { RegistroOcorrencia } from './_components/RegistroOcorrencia';

export const metadata: Metadata = {
  title: 'Registrar ocorrência | Instituto Caapora',
  description:
    'Informe onde está o animal silvestre que precisa de ajuda. Leva menos de 2 minutos.',
};

export default function RegistrarPage() {
  return (
    <div className="min-h-screen bg-background">
      <RegistroOcorrencia />
    </div>
  );
}
