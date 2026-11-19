"use client";

import React, { useState } from "react";
import {
  MapPin,
  Phone,
  User,
  Paperclip,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Send,
  ShieldAlert,
  PawPrint,
  Navigation,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  OcorrenciaAdmin,
  CATEGORIA_LABEL,
  CONDICAO_LABEL,
  URGENCIA_CONFIG,
  STATUS_CONFIG,
  formatarDataHora,
} from "./ocorrencia-types";

interface Props {
  ocorrencia: OcorrenciaAdmin | null;
  open: boolean;
  onClose: () => void;
  onAdicionarObservacao: (ocorrenciaId: number, texto: string) => Promise<void>;
}

export function ModalDetalheOcorrencia({
  ocorrencia,
  open,
  onClose,
  onAdicionarObservacao,
}: Props) {
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);

  if (!ocorrencia) return null;

  const urg = URGENCIA_CONFIG[ocorrencia.urgencia] || URGENCIA_CONFIG.MEDIA;
  const st = STATUS_CONFIG[ocorrencia.status] || {
    label: ocorrencia.status,
    badgeClass: "bg-slate-100 text-slate-800",
  };

  const temCoordenadas =
    ocorrencia.localizacao.latitude != null &&
    ocorrencia.localizacao.longitude != null;

  const mapUrl = temCoordenadas
    ? `https://www.google.com/maps?q=${ocorrencia.localizacao.latitude},${ocorrencia.localizacao.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${ocorrencia.localizacao.enderecoReferencia}, ${ocorrencia.localizacao.bairro}, ${ocorrencia.localizacao.municipio}`
      )}`;

  async function handleSalvarObservacao(e: React.FormEvent) {
    e.preventDefault();
    if (!ocorrencia || !observacao.trim()) return;
    setEnviando(true);
    try {
      await onAdicionarObservacao(ocorrencia.id, observacao.trim());
      setObservacao("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Identificação */}
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded">
                Protocolo: {ocorrencia.protocolo}
              </span>
              <DialogTitle className="text-xl font-bold text-slate-900 mt-2">
                {ocorrencia.animal.nomePopular}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={urg.badgeClass}>
                Urgência {urg.label}
              </Badge>
              <Badge variant="outline" className={st.badgeClass}>
                {st.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-2 text-sm">
          {/* Bloco 1: Informações do Animal */}
          <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <PawPrint className="h-4 w-4 text-emerald-700" />
              Informações do Animal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Nome / Espécie</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.animal.nomePopular}
                  {ocorrencia.animal.especie ? ` (${ocorrencia.animal.especie})` : ""}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo de Animal</p>
                <p className="font-medium text-slate-900">
                  {CATEGORIA_LABEL[ocorrencia.animal.categoria] || ocorrencia.animal.categoria}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Condição Identificada</p>
                <p className="font-medium text-slate-900">
                  {CONDICAO_LABEL[ocorrencia.animal.condicao] || ocorrencia.animal.condicao}
                </p>
              </div>
            </div>
          </section>

          {/* Bloco 2: Localização e Coordenadas */}
          <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700" />
                Localização da Ocorrência
              </h3>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors"
              >
                <Navigation className="h-3.5 w-3.5" />
                Visualizar no mapa
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-3">
                <p className="text-xs text-slate-500">Endereço ou Referência</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.localizacao.enderecoReferencia}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Bairro</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.localizacao.bairro || "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Município</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.localizacao.municipio}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Coordenadas Geográficas</p>
                <p className="font-mono text-xs font-medium text-slate-800 mt-0.5">
                  {temCoordenadas
                    ? `${ocorrencia.localizacao.latitude}, ${ocorrencia.localizacao.longitude}`
                    : "Não capturadas"}
                </p>
              </div>
            </div>
          </section>

          {/* Bloco 3: Informações do Atendimento */}
          <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <ShieldAlert className="h-4 w-4 text-emerald-700" />
              Informações do Atendimento
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <User className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Comunicante</p>
                  <p className="font-medium text-slate-900">
                    {ocorrencia.comunicante?.nome || "Registro Interno / Anônimo"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Phone className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Telefone para Contato</p>
                  <p className="font-medium text-slate-900">
                    {ocorrencia.comunicante?.telefone || "Não informado"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Users className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Equipe Responsável</p>
                  <p className="font-medium text-slate-900">
                    {ocorrencia.equipeResponsavel?.nome || "Não atribuída"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Paperclip className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Arquivos / Fotos Anexadas</p>
                  <p className="font-medium text-slate-900">
                    {ocorrencia.quantidadeMidias}{" "}
                    {ocorrencia.quantidadeMidias === 1 ? "arquivo" : "arquivos"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Data de Abertura</p>
                  <p className="font-medium text-slate-900">
                    {formatarDataHora(ocorrencia.dataAbertura)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Última Atualização</p>
                  <p className="font-medium text-slate-900">
                    {formatarDataHora(ocorrencia.dataAtualizacao || ocorrencia.dataAbertura)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Bloco 4: Observações Internas e Histórico */}
          <section className="space-y-3">
            <h3 className="font-semibold text-slate-800">Observações Internas</h3>

            {ocorrencia.historico && ocorrencia.historico.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {ocorrencia.historico.map((h, idx) => (
                  <div
                    key={h.id ?? idx}
                    className="text-xs bg-white border border-slate-200 rounded-md p-2.5"
                  >
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span className="font-medium text-slate-700">
                        {h.responsavel || "Equipe Interna"}
                      </span>
                      <span>{formatarDataHora(h.dataHora)}</span>
                    </div>
                    <p className="text-slate-800">{h.observacao || h.descricao}</p>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleSalvarObservacao} className="space-y-2">
              <Textarea
                placeholder="Registre uma observação interna sobre o andamento do resgate..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={enviando || !observacao.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {enviando ? "Salvando..." : "Adicionar observação"}
                </Button>
              </div>
            </form>
          </section>
        </div>

        <DialogFooter className="border-t pt-3">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}