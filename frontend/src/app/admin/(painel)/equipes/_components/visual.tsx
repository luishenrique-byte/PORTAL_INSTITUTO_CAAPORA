// Pequenas peças visuais reaproveitadas no card e no modal das equipes.
import { Badge } from '@/components/ui/badge';
import type { EquipeStatus, OcorrenciaInterna } from '@/lib/api';
import { rotuloCategoria } from '@/lib/ocorrencia';
import { cn } from '@/lib/utils';

const STATUS_EQUIPE: Record<EquipeStatus, { rotulo: string; classe: string; ponto: string }> = {
  DISPONIVEL: { rotulo: 'Disponível', classe: 'bg-[#e4f2e1] text-[#22622a]', ponto: 'bg-[#2f9e44]' },
  OCUPADO: { rotulo: 'Ocupada', classe: 'bg-[#fbe6e4] text-[#a3261b]', ponto: 'bg-[#d92d20]' },
};

export const rotuloStatusEquipe = (s: EquipeStatus) => STATUS_EQUIPE[s].rotulo;

export function BadgeStatusEquipe({ status, className }: { status: EquipeStatus; className?: string }) {
  const s = STATUS_EQUIPE[status];
  return (
    <Badge className={cn('h-6 gap-1.5 rounded-full px-2.5 text-xs font-semibold', s.classe, className)}>
      <span className={cn('size-2 rounded-full', s.ponto)} aria-hidden />
      {s.rotulo}
    </Badge>
  );
}

// "Sagui-de-tufos-brancos" (ou a categoria, quando a espécie não foi informada)
export function nomeAnimal(o: OcorrenciaInterna) {
  return o.animal?.especie?.trim() || rotuloCategoria(o.animal?.categoriaAnimal ?? null);
}

// A ocorrência ainda não tem campo de bairro: usamos o ponto de referência ou o endereço
export function localOcorrencia(o: OcorrenciaInterna) {
  return o.pontoReferencia?.trim() || o.endereco?.trim() || 'Local por GPS';
}

// "(71) 98001-0001" enquanto a pessoa digita
export function mascaraTelefone(valor: string) {
  const d = valor.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export const plural = (n: number, singular: string, pluralForma: string) =>
  `${n} ${n === 1 ? singular : pluralForma}`;
