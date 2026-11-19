"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  MapPin,
  Users,
  Calendar,
  FilterX,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OcorrenciaAdmin,
  NovaOcorrenciaPayload,
  CATEGORIA_LABEL,
  URGENCIA_CONFIG,
  STATUS_CONFIG,
  formatarDataHora,
} from "./_components/ocorrencia-types";
import { ModalDetalheOcorrencia } from "./_components/ModalDetalheOcorrencia";
import { ModalCadastroOcorrencia } from "./_components/ModalCadastroOcorrencia";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function GerenciamentoOcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Modo de visualização (Cards ou Tabela) preservando filtros
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "tabela">("cards");

  // Pesquisa e Filtros
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroUrgencia, setFiltroUrgencia] = useState("TODAS");
  const [filtroMunicipio, setFiltroMunicipio] = useState("TODOS");

  // Modais
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState<OcorrenciaAdmin | null>(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  function getAuthHeaders() {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("token") || sessionStorage.getItem("token")
        : null;
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async function carregarOcorrencias() {
    setCarregando(true);
    try {
      const res = await fetch(`${API_BASE}/api/ocorrencias`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Falha ao carregar ocorrências.");
      const data = await res.json();

      const listaNormalizada: OcorrenciaAdmin[] = (
        Array.isArray(data) ? data : data.content || []
      ).map((item: any) => ({
        id: item.id,
        protocolo: item.protocolo,
        animal: {
          nomePopular: item.animal?.nomePopular || item.nomeAnimal || "Não identificado",
          especie: item.animal?.especie || item.especie,
          categoria: item.animal?.categoria || item.categoriaAnimal || "OUTROS",
          condicao: item.animal?.condicao || item.condicaoAnimal || "DESCONHECIDO",
        },
        localizacao: {
          enderecoReferencia:
            item.enderecoReferencia || item.localizacao?.enderecoReferencia || "Não informado",
          bairro: item.bairro || item.localizacao?.bairro || "",
          municipio: item.municipio || item.localizacao?.municipio || "Não informado",
          latitude: item.latitude ?? item.localizacao?.latitude ?? null,
          longitude: item.longitude ?? item.localizacao?.longitude ?? null,
        },
        urgencia: item.urgencia || item.grauUrgencia || "MEDIA",
        status: item.status || "ABERTA",
        equipeResponsavel: item.equipeResponsavel || item.equipe || null,
        comunicante: item.reportante || item.comunicante || null,
        quantidadeMidias: item.quantidadeMidias ?? item.midias?.length ?? 0,
        dataAbertura: item.dataAbertura || item.criadoEm || new Date().toISOString(),
        dataAtualizacao: item.dataAtualizacao || item.atualizadoEm,
        historico: item.historico || [],
      }));

      setOcorrencias(listaNormalizada);
    } catch (err: any) {
      toast.error(err.message || "Erro ao buscar ocorrências no servidor.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarOcorrencias();
  }, []);

  const municipiosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    ocorrencias.forEach((o) => {
      if (o.localizacao.municipio) set.add(o.localizacao.municipio);
    });
    return Array.from(set).sort();
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return ocorrencias.filter((o) => {
      const matchBusca =
        !termo ||
        o.protocolo.toLowerCase().includes(termo) ||
        o.animal.nomePopular.toLowerCase().includes(termo) ||
        o.localizacao.enderecoReferencia.toLowerCase().includes(termo) ||
        o.localizacao.bairro.toLowerCase().includes(termo) ||
        o.localizacao.municipio.toLowerCase().includes(termo);

      const matchStatus = filtroStatus === "TODOS" || o.status === filtroStatus;
      const matchUrgencia = filtroUrgencia === "TODAS" || o.urgencia === filtroUrgencia;
      const matchMunicipio =
        filtroMunicipio === "TODOS" || o.localizacao.municipio === filtroMunicipio;

      return matchBusca && matchStatus && matchUrgencia && matchMunicipio;
    });
  }, [ocorrencias, busca, filtroStatus, filtroUrgencia, filtroMunicipio]);

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("TODOS");
    setFiltroUrgencia("TODAS");
    setFiltroMunicipio("TODOS");
  }

  async function handleCadastrarOcorrencia(payload: NovaOcorrenciaPayload) {
    try {
      const res = await fetch(`${API_BASE}/api/ocorrencias`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          animal: {
            nomePopular: payload.nomeAnimal,
            categoria: payload.categoriaAnimal,
            condicao: payload.condicaoAnimal,
          },
          enderecoReferencia: payload.enderecoReferencia,
          bairro: payload.bairro,
          municipio: payload.municipio,
          grauUrgencia: payload.urgencia,
          reportante:
            payload.nomeComunicante || payload.telefoneComunicante
              ? {
                  nome: payload.nomeComunicante,
                  telefone: payload.telefoneComunicante,
                }
              : null,
          origemRegistro: "INTERNO",
        }),
      });

      if (!res.ok) {
        const erroTexto = await res.text();
        throw new Error(erroTexto || "Não foi possível registrar a ocorrência.");
      }

      const criada = await res.json();
      toast.success(
        `Ocorrência registrada com sucesso! Protocolo: ${criada.protocolo || "Gerado"}`
      );
      await carregarOcorrencias();
    } catch (err: any) {
      toast.error(err.message || "Erro ao registrar ocorrência.");
      throw err;
    }
  }

  async function handleAdicionarObservacao(ocorrenciaId: number, texto: string) {
    try {
      const res = await fetch(`${API_BASE}/api/ocorrencias/${ocorrenciaId}/observacoes`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ observacao: texto }),
      });

      if (!res.ok) throw new Error("Erro ao salvar observação interna.");

      toast.success("Observação interna registrada!");
      await carregarOcorrencias();

      setOcorrenciaSelecionada((prev) =>
        prev
          ? {
              ...prev,
              dataAtualizacao: new Date().toISOString(),
              historico: [
                ...(prev.historico || []),
                {
                  observacao: texto,
                  dataHora: new Date().toISOString(),
                  responsavel: "Você",
                },
              ],
            }
          : null
      );
    } catch (err: any) {
      toast.error(err.message || "Falha ao adicionar observação.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Barra Superior de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Gerenciamento de Ocorrências</h2>
          <p className="text-sm text-slate-500">
            Consulte, filtre, acompanhe e registre atendimentos de resgate de fauna silvestre.
          </p>
        </div>

        <Button
          onClick={() => setModalCadastroAberto(true)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Ocorrência
        </Button>
      </div>

      {/* Barra de Pesquisa, Filtros e Alternância de Visualização */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Campo de Pesquisa */}
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Pesquisar por protocolo, nome do animal ou localização..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filtro Status */}
          <select
            aria-label="Filtrar por status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="TODOS">Status: Todos</option>
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Filtro Urgência */}
          <select
            aria-label="Filtrar por urgência"
            value={filtroUrgencia}
            onChange={(e) => setFiltroUrgencia(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="TODAS">Urgência: Todas</option>
            {Object.entries(URGENCIA_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>

          {/* Filtro Município */}
          <select
            aria-label="Filtrar por município"
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700"
          >
            <option value="TODOS">Município: Todos</option>
            {municipiosDisponiveis.map((mun) => (
              <option key={mun} value={mun}>
                {mun}
              </option>
            ))}
          </select>

          {/* Alternância Cards / Tabela */}
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 self-start">
            <button
              type="button"
              onClick={() => setModoVisualizacao("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                modoVisualizacao === "cards"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao("tabela")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                modoVisualizacao === "tabela"
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="h-4 w-4" />
              Tabela
            </button>
          </div>
        </div>

        {/* Rodapé da barra de filtros */}
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Exibindo <strong>{ocorrenciasFiltradas.length}</strong> de{" "}
            <strong>{ocorrencias.length}</strong> ocorrências
          </span>
          {(busca ||
            filtroStatus !== "TODOS" ||
            filtroUrgencia !== "TODAS" ||
            filtroMunicipio !== "TODOS") && (
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1 text-emerald-700 hover:underline font-medium"
            >
              <FilterX className="h-3.5 w-3.5" />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Listagem */}
      {carregando ? (
        <div className="text-center py-16 text-slate-500">Carregando ocorrências...</div>
      ) : ocorrenciasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
          <p className="font-semibold text-slate-700">Nenhuma ocorrência encontrada</p>
          <p className="text-sm text-slate-500">
            Ajuste os filtros de pesquisa ou cadastre uma nova ocorrência.
          </p>
        </div>
      ) : modoVisualizacao === "cards" ? (
        /* VISUALIZAÇÃO EM CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ocorrenciasFiltradas.map((oc) => {
            const urg = URGENCIA_CONFIG[oc.urgencia] || URGENCIA_CONFIG.MEDIA;
            const st = STATUS_CONFIG[oc.status] || {
              label: oc.status,
              badgeClass: "bg-slate-100 text-slate-800",
            };

            return (
              <div
                key={oc.id}
                onClick={() => setOcorrenciaSelecionada(oc)}
                className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-4 ${urg.borderClass}`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-mono font-semibold text-slate-500">
                      #{oc.protocolo}
                    </span>
                    <div className="flex flex-wrap gap-1.5 justify-end">
                      <Badge variant="outline" className={urg.badgeClass}>
                        {urg.label}
                      </Badge>
                      <Badge variant="outline" className={st.badgeClass}>
                        {st.label}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {oc.animal.nomePopular}
                    </h3>
                    <span className="inline-block text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                      {CATEGORIA_LABEL[oc.animal.categoria] || oc.animal.categoria}
                    </span>
                  </div>

                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      {oc.localizacao.bairro ? `${oc.localizacao.bairro}, ` : ""}
                      {oc.localizacao.municipio}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5 truncate max-w-[55%]">
                    <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {oc.equipeResponsavel?.nome || "Sem equipe"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {formatarDataHora(oc.dataAbertura)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISUALIZAÇÃO EM TABELA */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Protocolo</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Urgência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Equipe</TableHead>
                <TableHead>Aberto em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ocorrenciasFiltradas.map((oc) => {
                const urg = URGENCIA_CONFIG[oc.urgencia] || URGENCIA_CONFIG.MEDIA;
                const st = STATUS_CONFIG[oc.status] || {
                  label: oc.status,
                  badgeClass: "bg-slate-100 text-slate-800",
                };

                return (
                  <TableRow
                    key={oc.id}
                    onClick={() => setOcorrenciaSelecionada(oc)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <TableCell className="font-mono text-xs font-semibold">
                      {oc.protocolo}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{oc.animal.nomePopular}</div>
                      <div className="text-xs text-slate-500">
                        {CATEGORIA_LABEL[oc.animal.categoria] || oc.animal.categoria}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-700">
                      {oc.localizacao.bairro ? `${oc.localizacao.bairro} - ` : ""}
                      {oc.localizacao.municipio}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={urg.badgeClass}>
                        {urg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={st.badgeClass}>
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      {oc.equipeResponsavel?.nome || "Não atribuída"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {formatarDataHora(oc.dataAbertura)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOcorrenciaSelecionada(oc);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Detalhamento */}
      <ModalDetalheOcorrencia
        ocorrencia={ocorrenciaSelecionada}
        open={!!ocorrenciaSelecionada}
        onClose={() => setOcorrenciaSelecionada(null)}
        onAdicionarObservacao={handleAdicionarObservacao}
      />

      {/* Modal de Cadastro Manual */}
      <ModalCadastroOcorrencia
        open={modalCadastroAberto}
        onClose={() => setModalCadastroAberto(false)}
        onSalvar={handleCadastrarOcorrencia}
      />
    </div>
  );
}