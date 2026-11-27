"use client";

import React, { useEffect, useState } from "react";
import {
  MapPin,
  Phone,
  User,
  Users,
  Calendar,
  FileText,
  Paperclip,
  History,
  ExternalLink,
  PawPrint,
  ShieldAlert,
  Navigation,
  MessageSquarePlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { API_URL } from "@/lib/api";
import { obterToken } from "@/lib/sessao";
import {
  OcorrenciaAdmin,
  HistoricoItem,
  EquipeOption,
  OcorrenciaStatus,
  GrauUrgencia,
  CATEGORIA_LABEL,
  SAUDE_LABEL,
  URGENCIA_CONFIG,
  STATUS_CONFIG,
  STATUS_ENCERRADOS,
  STATUS_ORDEM,
  extrairLocalizacao,
  formatarDataHora,
} from "./ocorrencia-types";

interface ModalDetalheOcorrenciaProps {
  ocorrencia: OcorrenciaAdmin | null;
  funcionarioId: number;
  open: boolean;
  onClose: () => void;
  onAtualizado: () => Promise<void>;
}

function lerObservacoesLocais(ocorrenciaId: number): string[] {
  try {
    const bruto = localStorage.getItem(`caapora.obs.${ocorrenciaId}`);
    return bruto ? JSON.parse(bruto) : [];
  } catch {
    return [];
  }
}

export function ModalDetalheOcorrencia({
  ocorrencia,
  funcionarioId,
  open,
  onClose,
  onAtualizado,
}: ModalDetalheOcorrenciaProps) {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [equipes, setEquipes] = useState<EquipeOption[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  const [salvandoAcao, setSalvandoAcao] = useState(false);
  const [observacaoInterna, setObservacaoInterna] = useState("");
  const [obsPorOcorrencia, setObsPorOcorrencia] = useState<Record<number, string[]>>({});

  const ocorrenciaId = ocorrencia?.id;

  useEffect(() => {
    if (!open || !ocorrenciaId) return;
    let ativo = true;

    async function carregarDadosModal() {
      setCarregandoHistorico(true);
      try {
        const token = obterToken();
        const headers: Record<string, string> = token
          ? { Authorization: `Bearer ${token}` }
          : {};

        const [resHist, resEq] = await Promise.all([
          fetch(`${API_URL}/ocorrencias/${ocorrenciaId}/historico`, {
            headers,
            cache: "no-store",
          }),
          fetch(`${API_URL}/equipes`, {
            headers,
            cache: "no-store",
          }),
        ]);

        if (resHist.ok && ativo) {
          setHistorico(await resHist.json());
        }
        if (resEq.ok && ativo) {
          setEquipes(await resEq.json());
        }
      } catch {
        // Silencia erro de rede secundário
      } finally {
        if (ativo) setCarregandoHistorico(false);
      }
    }

    carregarDadosModal();
    return () => {
      ativo = false;
    };
  }, [open, ocorrenciaId]);

  if (!ocorrencia) return null;

  const observacoesSalvas =
    obsPorOcorrencia[ocorrencia.id] ?? lerObservacoesLocais(ocorrencia.id);

  const urgencia = URGENCIA_CONFIG[ocorrencia.grauUrgencia] || URGENCIA_CONFIG.MEDIA;
  const status = STATUS_CONFIG[ocorrencia.ocorrenciaStatus] || {
    label: ocorrencia.ocorrenciaStatus,
    badgeClass: "bg-slate-100 text-slate-800 border-slate-200",
  };

  const indiceStatusAtual = STATUS_ORDEM.indexOf(ocorrencia.ocorrenciaStatus);
  const proximosStatus = STATUS_ORDEM.filter((_, idx) => idx > indiceStatusAtual);

  const temCoordenadas =
    typeof ocorrencia.latitude === "number" && typeof ocorrencia.longitude === "number";
  const mapUrl = temCoordenadas
    ? `https://www.google.com/maps?q=${ocorrencia.latitude},${ocorrencia.longitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        ocorrencia.endereco || ""
      )}`;

  const { bairro, municipio } = extrairLocalizacao(ocorrencia.endereco);
  const listaHistorico = historico.length > 0 ? historico : ocorrencia.historico || [];
  const ultimaAtualizacao =
    listaHistorico.length > 0
      ? listaHistorico[listaHistorico.length - 1].dataHora
      : ocorrencia.dataHoraRegistro;

  async function lerMensagemErro(res: Response, fallback: string): Promise<string> {
    try {
      const corpo = await res.json();
      return corpo.erro || Object.values(corpo)[0] || fallback;
    } catch {
      return fallback;
    }
  }

  async function handleAlterarStatus(novoStatus: OcorrenciaStatus) {
    if (!novoStatus) return;
    const token = obterToken();
    setSalvandoAcao(true);
    try {
      const res = await fetch(`${API_URL}/ocorrencias/${ocorrencia!.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: novoStatus,
          responsavelId: funcionarioId,
        }),
      });
      if (!res.ok) {
        toast.error(await lerMensagemErro(res, "Não foi possível atualizar o status."));
        return;
      }
      toast.success(`Status atualizado para "${STATUS_CONFIG[novoStatus].label}".`);
      await onAtualizado();
    } catch {
      toast.error("Erro de comunicação ao atualizar status.");
    } finally {
      setSalvandoAcao(false);
    }
  }

  async function handleAlterarUrgencia(novaUrgencia: GrauUrgencia) {
    if (!novaUrgencia || novaUrgencia === ocorrencia!.grauUrgencia) return;
    const token = obterToken();
    setSalvandoAcao(true);
    try {
      const res = await fetch(
        `${API_URL}/ocorrencias/${ocorrencia!.id}/urgencia?urgencia=${novaUrgencia}&funcionarioId=${funcionarioId}`,
        {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        toast.error(await lerMensagemErro(res, "Não foi possível alterar a urgência."));
        return;
      }
      toast.success(`Urgência atualizada para "${URGENCIA_CONFIG[novaUrgencia].label}".`);
      await onAtualizado();
    } catch {
      toast.error("Erro de comunicação ao alterar urgência.");
    } finally {
      setSalvandoAcao(false);
    }
  }

  async function handleAtribuirEquipe(equipeIdStr: string) {
    const equipeId = Number(equipeIdStr);
    if (!equipeId || equipeId === ocorrencia!.equipe?.id) return;
    const token = obterToken();
    setSalvandoAcao(true);
    try {
      const res = await fetch(
        `${API_URL}/ocorrencias/${ocorrencia!.id}/equipe?equipeId=${equipeId}&funcionarioId=${funcionarioId}`,
        {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      if (!res.ok) {
        toast.error(await lerMensagemErro(res, "Não foi possível atribuir a equipe."));
        return;
      }
      toast.success("Equipe atribuída com sucesso!");
      await onAtualizado();
    } catch {
      toast.error("Erro de comunicação ao atribuir equipe.");
    } finally {
      setSalvandoAcao(false);
    }
  }

  function handleAdicionarObservacao() {
    const texto = observacaoInterna.trim();
    if (!texto) return;
    const novaLista = [
      ...observacoesSalvas,
      `${formatarDataHora(new Date().toISOString())} — ${texto}`,
    ];
    setObsPorOcorrencia((prev) => ({ ...prev, [ocorrencia!.id]: novaLista }));
    setObservacaoInterna("");
    try {
      localStorage.setItem(`caapora.obs.${ocorrencia!.id}`, JSON.stringify(novaLista));
    } catch {
      // ignora erro de quota
    }
    toast.success("Observação interna adicionada.");
  }

  const animalNome =
    ocorrencia.animal?.especie ||
    (ocorrencia.animal?.categoriaAnimal
      ? CATEGORIA_LABEL[ocorrencia.animal.categoriaAnimal]
      : "Animal não identificado");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                {ocorrencia.protocolo}
              </p>
              <DialogTitle className="text-xl font-bold text-slate-900 mt-0.5">
                {animalNome}
              </DialogTitle>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={urgencia.badgeClass}>
                {urgencia.label}
              </Badge>
              <Badge variant="outline" className={status.badgeClass}>
                {status.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2 text-sm">
          {!STATUS_ENCERRADOS.includes(ocorrencia.ocorrenciaStatus) && (
            <section className="bg-emerald-50/70 rounded-lg p-4 border border-emerald-200 space-y-3">
              <h3 className="font-semibold text-emerald-950 text-xs uppercase tracking-wider">
                Atualizar Atendimento
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Avançar Status
                  </label>
                  <select
                    value=""
                    disabled={salvandoAcao || proximosStatus.length === 0}
                    onChange={(e) => handleAlterarStatus(e.target.value as OcorrenciaStatus)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  >
                    <option value="">{status.label} (atual)</option>
                    {proximosStatus.map((st) => (
                      <option key={st} value={st}>
                        → {STATUS_CONFIG[st].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Nível de Urgência
                  </label>
                  <select
                    value={ocorrencia.grauUrgencia}
                    disabled={salvandoAcao}
                    onChange={(e) => handleAlterarUrgencia(e.target.value as GrauUrgencia)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  >
                    {(Object.keys(URGENCIA_CONFIG) as GrauUrgencia[]).map((nivel) => (
                      <option key={nivel} value={nivel}>
                        {URGENCIA_CONFIG[nivel].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Equipe Responsável
                  </label>
                  <select
                    value={ocorrencia.equipe?.id ?? ""}
                    disabled={salvandoAcao}
                    onChange={(e) => handleAtribuirEquipe(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-sm"
                  >
                    <option value="">
                      {ocorrencia.equipe?.nome || "Selecionar equipe..."}
                    </option>
                    {/* Uma equipe pode atender várias ocorrências: as ocupadas também aparecem, depois das livres */}
                    {[...equipes]
                      .sort((a, b) => Number(a.status !== "DISPONIVEL") - Number(b.status !== "DISPONIVEL"))
                      .map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.nome} ({eq.status === "DISPONIVEL" ? "Livre" : "Já em atendimento"})
                        </option>
                      ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    A mesma equipe pode ficar com mais de uma ocorrência.
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
              <PawPrint className="h-4 w-4 text-emerald-700" />
              Informações do Animal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">Nome e espécie</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.animal?.especie || "Não identificada"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Tipo do animal</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.animal?.categoriaAnimal
                    ? CATEGORIA_LABEL[ocorrencia.animal.categoriaAnimal]
                    : "Não informado"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Condição identificada</p>
                <p className="font-medium text-slate-900">
                  {ocorrencia.animal?.saudeStatus
                    ? SAUDE_LABEL[ocorrencia.animal.saudeStatus]
                    : "Não informada"}
                </p>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-700" />
                Localização
              </h3>
              <p className="text-slate-700">
                <span className="text-slate-500">Endereço / Ref.:</span>{" "}
                {ocorrencia.endereco || "Não informado"}
                {ocorrencia.pontoReferencia ? ` (${ocorrencia.pontoReferencia})` : ""}
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Bairro:</span> {bairro}
              </p>
              <p className="text-slate-700">
                <span className="text-slate-500">Município:</span> {municipio}
              </p>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5" />
                {temCoordenadas
                  ? `Coordenadas: ${ocorrencia.latitude?.toFixed(6)}, ${ocorrencia.longitude?.toFixed(6)}`
                  : "Coordenadas geográficas não informadas"}
              </p>
              {(ocorrencia.endereco || temCoordenadas) && (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:underline pt-1"
                >
                  Visualizar localização no mapa <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-emerald-700" />
                Informações do Atendimento
              </h3>
              <p className="text-slate-700 flex items-center gap-2">
                <User className="h-4 w-4 text-slate-400" />
                Comunicante:{" "}
                <span className="font-medium">
                  {ocorrencia.reportante?.anonimo
                    ? "Anônimo"
                    : ocorrencia.reportante?.nome || "Não informado"}
                </span>
              </p>
              <p className="text-slate-700 flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                Telefone:{" "}
                <span className="font-medium">
                  {ocorrencia.reportante?.telefone || "Não informado"}
                </span>
              </p>
              <p className="text-slate-700 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-slate-400" />
                Arquivos anexados:{" "}
                <span className="font-medium">{ocorrencia.midias?.length || 0}</span>
              </p>
              <p className="text-slate-700 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-400" />
                Equipe responsável:{" "}
                <span className="font-medium">
                  {ocorrencia.equipe?.nome || "Não atribuída"}
                </span>
              </p>
              <p className="text-slate-700 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400" />
                Abertura:{" "}
                <span className="font-medium">
                  {formatarDataHora(ocorrencia.dataHoraRegistro)}
                </span>
              </p>
              <p className="text-slate-700 flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                Última atualização:{" "}
                <span className="font-medium">{formatarDataHora(ultimaAtualizacao)}</span>
              </p>
            </div>
          </section>

          {ocorrencia.descricao && (
            <section className="border border-slate-200 rounded-lg p-4 space-y-1.5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-700" />
                Descrição do Relato
              </h3>
              <p className="text-slate-700 whitespace-pre-line">{ocorrencia.descricao}</p>
            </section>
          )}

          {ocorrencia.midias && ocorrencia.midias.length > 0 && (
            <section className="border border-slate-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-emerald-700" />
                Evidências Anexadas ({ocorrencia.midias.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {ocorrencia.midias.map((midia, idx) =>
                  midia.url ? (
                    <a
                      key={midia.id || idx}
                      href={midia.url.startsWith("http") ? midia.url : `${API_URL}${midia.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-800"
                    >
                      {midia.tipoMidia || `Arquivo ${idx + 1}`} <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span
                      key={midia.id || idx}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-slate-100 text-xs font-medium text-slate-600"
                    >
                      {midia.tipoMidia || `Arquivo ${idx + 1}`}
                    </span>
                  )
                )}
              </div>
            </section>
          )}

          <section className="border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <MessageSquarePlus className="h-4 w-4 text-emerald-700" />
              Observações Internas
            </h3>
            {observacoesSalvas.length > 0 && (
              <ul className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3 rounded-md border border-slate-200">
                {observacoesSalvas.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Textarea
                rows={2}
                placeholder="Adicionar observação interna da equipe..."
                value={observacaoInterna}
                onChange={(e) => setObservacaoInterna(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAdicionarObservacao}
                disabled={!observacaoInterna.trim()}
                className="self-end"
              >
                Adicionar
              </Button>
            </div>
          </section>

          <section className="border border-slate-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <History className="h-4 w-4 text-emerald-700" />
              Histórico de Atualizações
            </h3>
            {carregandoHistorico && listaHistorico.length === 0 ? (
              <p className="text-xs text-slate-500">Carregando histórico...</p>
            ) : listaHistorico.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum evento registrado além da abertura.</p>
            ) : (
              <ol className="relative border-l border-emerald-200 ml-2 space-y-3">
                {listaHistorico.map((item) => {
                  const statusItem = STATUS_CONFIG[item.statusMovimentacao];
                  return (
                    <li key={item.id} className="ml-4">
                      <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-white" />
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <p className="font-medium text-slate-800">
                          {statusItem ? statusItem.label : item.statusMovimentacao}
                        </p>
                        <time className="text-xs text-slate-500">
                          {formatarDataHora(item.dataHora)}
                        </time>
                      </div>
                      {item.responsavelNome && (
                        <p className="text-xs text-slate-500">Por: {item.responsavelNome}</p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
