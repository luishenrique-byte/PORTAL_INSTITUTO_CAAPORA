"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Plus,
  MapPin,
  Users,
  Calendar,
  FilterX,
  Eye,
  PawPrint,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { API_URL } from "@/lib/api";
import { encerrarSessao, obterToken } from "@/lib/sessao";
import {
  OcorrenciaAdmin,
  OcorrenciaManualRequest,
  CATEGORIA_LABEL,
  URGENCIA_CONFIG,
  STATUS_CONFIG,
  extrairLocalizacao,
  formatarDataHora,
} from "./_components/ocorrencia-types";
import { ModalDetalheOcorrencia } from "./_components/ModalDetalheOcorrencia";
import { ModalCadastroOcorrencia } from "./_components/ModalCadastroOcorrencia";

export default function GerenciamentoOcorrenciasPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [funcionarioId, setFuncionarioId] = useState<number>(1);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaAdmin[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState<"cards" | "tabela">("cards");
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [filtroUrgencia, setFiltroUrgencia] = useState("TODAS");
  const [filtroMunicipio, setFiltroMunicipio] = useState("TODOS");
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<number | null>(null);
  const [modalCadastroAberto, setModalCadastroAberto] = useState(false);

  useEffect(() => {
    const t = obterToken();
    if (!t) {
      router.replace("/admin/login");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no navegador
    setToken(t);

    try {
      const payload = JSON.parse(atob(t.split(".")[1]));
      const emailLogado = payload?.sub;
      if (emailLogado) {
        fetch(`${API_URL}/funcionarios`, {
          headers: { Authorization: `Bearer ${t}` },
          cache: "no-store",
        })
          .then((res) => (res.ok ? res.json() : []))
          .then((lista: { id: number; email?: string }[]) => {
            const encontrado = lista.find(
              (f) => f.email?.toLowerCase() === String(emailLogado).toLowerCase()
            );
            if (encontrado?.id) setFuncionarioId(encontrado.id);
          })
          .catch(() => {});
      }
    } catch {
      // mantém fallback id = 1
    }
  }, [router]);

  const sessaoExpirada = useCallback(() => {
    encerrarSessao();
    router.replace("/admin/login");
  }, [router]);

  const buscarOcorrencias = useCallback(
    async (t: string, signal?: AbortSignal) => {
      const res = await fetch(`${API_URL}/ocorrencias/filtro`, {
        headers: { Authorization: `Bearer ${t}` },
        cache: "no-store",
        signal,
      });
      if (res.status === 401 || res.status === 403) {
        sessaoExpirada();
        return null;
      }
      if (!res.ok) throw new Error();
      const dados = await res.json();
      return (Array.isArray(dados) ? dados : dados.content || []) as OcorrenciaAdmin[];
    },
    [sessaoExpirada]
  );

  useEffect(() => {
    if (!token) return;
    const controle = new AbortController();

    buscarOcorrencias(token, controle.signal)
      .then((lista) => {
        if (lista) setOcorrencias(lista);
      })
      .catch(() => {
        if (!controle.signal.aborted) {
          toast.error("Não foi possível carregar as ocorrências.");
        }
      })
      .finally(() => {
        if (!controle.signal.aborted) setCarregando(false);
      });

    return () => controle.abort();
  }, [token, buscarOcorrencias]);

  const carregarOcorrencias = useCallback(async () => {
    const t = obterToken();
    if (!t) {
      sessaoExpirada();
      return;
    }
    setCarregando(true);
    try {
      const lista = await buscarOcorrencias(t);
      if (lista) setOcorrencias(lista);
    } catch {
      toast.error("Não foi possível carregar as ocorrências.");
    } finally {
      setCarregando(false);
    }
  }, [buscarOcorrencias, sessaoExpirada]);

  async function handleSalvarOcorrencia(dados: OcorrenciaManualRequest): Promise<boolean> {
    const t = obterToken();
    try {
      const res = await fetch(`${API_URL}/ocorrencias/manual?funcionarioId=${funcionarioId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify(dados),
      });
      if (!res.ok) {
        let mensagem = "Erro ao registrar a ocorrência.";
        try {
          const erroJson = await res.json();
          mensagem = erroJson.erro || Object.values(erroJson)[0] || mensagem;
        } catch {}
        toast.error(String(mensagem));
        return false;
      }
      const criada: OcorrenciaAdmin = await res.json();
      toast.success(`Ocorrência registrada com sucesso! Protocolo: ${criada.protocolo}`);
      await carregarOcorrencias();
      return true;
    } catch {
      toast.error("Erro de comunicação com o servidor.");
      return false;
    }
  }

  const municipiosDisponiveis = useMemo(() => {
    const setMunicipios = new Set<string>();
    ocorrencias.forEach((oc) => {
      const { municipio } = extrairLocalizacao(oc.endereco);
      if (municipio && municipio !== "Não informado") {
        setMunicipios.add(municipio);
      }
    });
    return Array.from(setMunicipios).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ocorrencias]);

  const ocorrenciasFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return ocorrencias.filter((oc) => {
      if (filtroStatus !== "TODOS" && oc.ocorrenciaStatus !== filtroStatus) return false;
      if (filtroUrgencia !== "TODAS" && oc.grauUrgencia !== filtroUrgencia) return false;
      if (filtroMunicipio !== "TODOS") {
        const { municipio } = extrairLocalizacao(oc.endereco);
        if (municipio !== filtroMunicipio) return false;
      }
      if (!termo) return true;
      const texto = [
        oc.protocolo,
        oc.animal?.especie,
        oc.animal?.categoriaAnimal ? CATEGORIA_LABEL[oc.animal.categoriaAnimal] : "",
        oc.endereco,
        oc.pontoReferencia,
        oc.equipe?.nome,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(termo);
    });
  }, [ocorrencias, busca, filtroStatus, filtroUrgencia, filtroMunicipio]);

  const ocorrenciaSelecionada = useMemo(
    () => ocorrencias.find((oc) => oc.id === ocorrenciaSelecionadaId) ?? null,
    [ocorrencias, ocorrenciaSelecionadaId]
  );

  function limparFiltros() {
    setBusca("");
    setFiltroStatus("TODOS");
    setFiltroUrgencia("TODAS");
    setFiltroMunicipio("TODOS");
  }

  if (!token) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background">
        <Spinner className="size-6 text-primary" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto max-w-6xl px-5 py-8 md:py-10 space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Painel
        </Link>

        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-bold text-slate-900">
              Ocorrências
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {carregando
                ? "Carregando registros..."
                : `${ocorrenciasFiltradas.length} ${
                    ocorrenciasFiltradas.length === 1
                      ? "resultado encontrado"
                      : "resultados encontrados"
                  }`}
            </p>
          </div>
          <Button
            onClick={() => setModalCadastroAberto(true)}
            className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Cadastro manual
          </Button>
        </header>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Pesquisar por protocolo, animal ou localização..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Filtrar por status"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="TODOS">Todos os status</option>
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por urgência"
                value={filtroUrgencia}
                onChange={(e) => setFiltroUrgencia(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="TODAS">Todas urgências</option>
                {Object.entries(URGENCIA_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>
                    {cfg.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filtrar por município"
                value={filtroMunicipio}
                onChange={(e) => setFiltroMunicipio(e.target.value)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
              >
                <option value="TODOS">Todos municípios</option>
                {municipiosDisponiveis.map((mun) => (
                  <option key={mun} value={mun}>
                    {mun}
                  </option>
                ))}
              </select>

              {(busca ||
                filtroStatus !== "TODOS" ||
                filtroUrgencia !== "TODAS" ||
                filtroMunicipio !== "TODOS") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={limparFiltros}
                  className="text-slate-600 gap-1.5"
                >
                  <FilterX className="h-4 w-4" />
                  Limpar
                </Button>
              )}

              <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 ml-auto">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("cards")}
                  className={`p-1.5 rounded-md transition-colors ${
                    modoVisualizacao === "cards"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Visualização em cards"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("tabela")}
                  className={`p-1.5 rounded-md transition-colors ${
                    modoVisualizacao === "tabela"
                      ? "bg-white text-emerald-700 shadow-xs"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                  title="Visualização em tabela"
                >
                  <TableIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {carregando ? (
          <div className="text-center py-12 text-slate-500">Carregando ocorrências...</div>
        ) : ocorrenciasFiltradas.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-2">
            <p className="font-medium text-slate-800">Nenhuma ocorrência encontrada</p>
            <p className="text-sm text-slate-500">
              Tente ajustar os filtros ou registre um novo chamado.
            </p>
          </div>
        ) : modoVisualizacao === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {ocorrenciasFiltradas.map((oc) => {
              const urg = URGENCIA_CONFIG[oc.grauUrgencia] || URGENCIA_CONFIG.MEDIA;
              const st = STATUS_CONFIG[oc.ocorrenciaStatus] || {
                label: oc.ocorrenciaStatus,
                badgeClass: "bg-slate-100 text-slate-800",
              };
              const tipoAnimal = oc.animal?.categoriaAnimal
                ? CATEGORIA_LABEL[oc.animal.categoriaAnimal]
                : "Não informado";
              const animalNome = oc.animal?.especie || tipoAnimal;
              const { bairro, municipio } = extrairLocalizacao(oc.endereco);

              return (
                <div
                  key={oc.id}
                  onClick={() => setOcorrenciaSelecionadaId(oc.id)}
                  className={`bg-white rounded-xl border border-slate-200 ${urg.borderClass} p-4 hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {oc.protocolo}
                      </span>
                      <Badge variant="outline" className={urg.badgeClass}>
                        {urg.label}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 text-base line-clamp-1">
                        {animalNome}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <PawPrint className="h-3 w-3 text-slate-400" />
                        {tipoAnimal}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 flex items-start gap-1.5 line-clamp-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {bairro !== "Não informado" || municipio !== "Não informado"
                          ? `${bairro} — ${municipio}`
                          : oc.endereco || "Localização via GPS"}
                      </span>
                    </p>

                    {oc.equipe?.nome && (
                      <p className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>Equipe: {oc.equipe.nome}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <Badge variant="outline" className={st.badgeClass}>
                      {st.label}
                    </Badge>
                    <span className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatarDataHora(oc.dataHoraRegistro)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
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
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ocorrenciasFiltradas.map((oc) => {
                  const urg = URGENCIA_CONFIG[oc.grauUrgencia] || URGENCIA_CONFIG.MEDIA;
                  const st = STATUS_CONFIG[oc.ocorrenciaStatus] || {
                    label: oc.ocorrenciaStatus,
                    badgeClass: "bg-slate-100 text-slate-800",
                  };
                  const animalNome =
                    oc.animal?.especie ||
                    (oc.animal?.categoriaAnimal
                      ? CATEGORIA_LABEL[oc.animal.categoriaAnimal]
                      : "Não identificado");

                  return (
                    <TableRow
                      key={oc.id}
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => setOcorrenciaSelecionadaId(oc.id)}
                    >
                      <TableCell className="font-mono text-xs font-semibold text-emerald-700">
                        {oc.protocolo}
                      </TableCell>
                      <TableCell className="font-medium text-slate-900">{animalNome}</TableCell>
                      <TableCell className="text-slate-600 max-w-xs truncate">
                        {oc.endereco || "Localização GPS"}
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
                      <TableCell className="text-slate-600">{oc.equipe?.nome || "—"}</TableCell>
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        {formatarDataHora(oc.dataHoraRegistro)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOcorrenciaSelecionadaId(oc.id);
                          }}
                        >
                          <Eye className="h-4 w-4 text-slate-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <ModalDetalheOcorrencia
          ocorrencia={ocorrenciaSelecionada}
          funcionarioId={funcionarioId}
          open={Boolean(ocorrenciaSelecionada)}
          onClose={() => setOcorrenciaSelecionadaId(null)}
          onAtualizado={carregarOcorrencias}
        />

        <ModalCadastroOcorrencia
          open={modalCadastroAberto}
          onClose={() => setModalCadastroAberto(false)}
          onSalvar={handleSalvarOcorrencia}
        />
      </div>
    </main>
  );
}
