'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERIODO_PADRAO_DIAS, hojeIso, ultimosDias, type Periodo } from './indicadores';

const OPCOES = [
  { valor: '30', rotulo: 'Últimos 30 dias' },
  { valor: String(PERIODO_PADRAO_DIAS), rotulo: 'Últimos 90 dias' },
  { valor: '180', rotulo: 'Últimos 6 meses' },
  { valor: '365', rotulo: 'Últimos 12 meses' },
  { valor: 'personalizado', rotulo: 'Personalizado' },
];

export function FiltroPeriodo({
  periodo,
  aoMudar,
  desabilitado,
}: {
  periodo: Periodo;
  aoMudar: (p: Periodo) => void;
  desabilitado?: boolean;
}) {
  const [opcao, setOpcao] = useState(String(PERIODO_PADRAO_DIAS));
  const [inicio, setInicio] = useState(periodo.inicio);
  const [fim, setFim] = useState(periodo.fim);

  const hoje = hojeIso();
  const invalido = !inicio || !fim || inicio > fim || fim > hoje;

  function escolher(valor: string) {
    setOpcao(valor);
    if (valor === 'personalizado') {
      setInicio(periodo.inicio);
      setFim(periodo.fim);
    } else {
      aoMudar(ultimosDias(Number(valor)));
    }
  }

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    if (!invalido) aoMudar({ inicio, fim });
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Select value={opcao} onValueChange={escolher} disabled={desabilitado}>
        <SelectTrigger className="w-44 bg-card" aria-label="Período de referência">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {OPCOES.map((o) => (
            <SelectItem key={o.valor} value={o.valor}>
              {o.rotulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {opcao === 'personalizado' && (
        <form onSubmit={aplicar} className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-muted-foreground">
            De
            <Input type="date" value={inicio} max={fim || hoje} onChange={(e) => setInicio(e.target.value)} className="mt-1 w-40 bg-card" />
          </label>
          <label className="text-xs text-muted-foreground">
            Até
            <Input type="date" value={fim} min={inicio} max={hoje} onChange={(e) => setFim(e.target.value)} className="mt-1 w-40 bg-card" />
          </label>
          <Button type="submit" disabled={invalido || desabilitado}>
            Aplicar
          </Button>
        </form>
      )}
    </div>
  );
}
