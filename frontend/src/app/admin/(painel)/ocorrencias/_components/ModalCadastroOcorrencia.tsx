"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CategoriaAnimal,
  SaudeStatus,
  GrauUrgencia,
  OcorrenciaManualRequest,
  URGENCIA_CONFIG,
} from "./ocorrencia-types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSalvar: (dados: OcorrenciaManualRequest) => Promise<boolean>;
}

const TIPOS_ANIMAL: { value: CategoriaAnimal; label: string }[] = [
  { value: "AVE", label: "Aves" },
  { value: "MAMIFERO", label: "Mamíferos" },
  { value: "REPTIL", label: "Répteis" },
  { value: "ANFIBIO", label: "Anfíbios" },
  { value: "INDEFINIDO", label: "Outros" },
];

const CONDICOES_ANIMAL: { value: SaudeStatus; label: string }[] = [
  { value: "FERIDO", label: "Ferido" },
  { value: "DOENTE", label: "Debilitado" },
  { value: "ORFAO", label: "Órfão" },
  { value: "INDEFINIDO", label: "Saudável / Desconhecido" },
  { value: "OBITO", label: "Morto" },
  { value: "PRESO", label: "Preso / Encurralado" },
];

export function ModalCadastroOcorrencia({ open, onClose, onSalvar }: Props) {
  const [especie, setEspecie] = useState("");
  const [categoriaAnimal, setCategoriaAnimal] = useState<CategoriaAnimal>("AVE");
  const [saudeStatus, setSaudeStatus] = useState<SaudeStatus>("FERIDO");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [descricao, setDescricao] = useState("");
  const [grauUrgencia, setGrauUrgencia] = useState<GrauUrgencia>("MEDIA");
  const [nomeComunicante, setNomeComunicante] = useState("");
  const [telefoneComunicante, setTelefoneComunicante] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (!especie.trim()) {
      novosErros.especie = "Informe o nome ou espécie do animal.";
    }
    if (!endereco.trim()) {
      novosErros.endereco = "Informe o endereço ou ponto de referência.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function limparFormulario() {
    setEspecie("");
    setCategoriaAnimal("AVE");
    setSaudeStatus("FERIDO");
    setEndereco("");
    setBairro("");
    setMunicipio("");
    setDescricao("");
    setGrauUrgencia("MEDIA");
    setNomeComunicante("");
    setTelefoneComunicante("");
    setErros({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    const enderecoCompleto = [endereco.trim(), bairro.trim(), municipio.trim()]
      .filter(Boolean)
      .join(", ");

    const temComunicante = Boolean(nomeComunicante.trim() || telefoneComunicante.trim());

    const payload: OcorrenciaManualRequest = {
      endereco: enderecoCompleto,
      descricao: descricao.trim() || null,
      grauUrgencia,
      origemRegistro: "CADASTRO_MANUAL",
      reportante: temComunicante
        ? {
            nome: nomeComunicante.trim() || null,
            telefone: telefoneComunicante.trim() || null,
            anonimo: false,
          }
        : null,
      animal: {
        especie: especie.trim(),
        categoriaAnimal,
        saudeStatus,
      },
    };

    setSalvando(true);
    try {
      const sucesso = await onSalvar(payload);
      if (sucesso) {
        limparFormulario();
        onClose();
      }
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          limparFormulario();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            Cadastro Manual de Ocorrência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              A. Informações do Animal
            </legend>

            <div>
              <Label htmlFor="especie">
                Nome ou espécie <span className="text-red-600">*</span>
              </Label>
              <Input
                id="especie"
                placeholder="Ex: Coruja-buraqueira, Sagui, Jiboia..."
                value={especie}
                onChange={(e) => setEspecie(e.target.value)}
                className={erros.especie ? "border-red-500" : ""}
              />
              {erros.especie && (
                <p className="text-xs text-red-600 mt-1">{erros.especie}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoriaAnimal">Tipo do animal</Label>
                <select
                  id="categoriaAnimal"
                  value={categoriaAnimal}
                  onChange={(e) => setCategoriaAnimal(e.target.value as CategoriaAnimal)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {TIPOS_ANIMAL.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="saudeStatus">Condição do animal</Label>
                <select
                  id="saudeStatus"
                  value={saudeStatus}
                  onChange={(e) => setSaudeStatus(e.target.value as SaudeStatus)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {CONDICOES_ANIMAL.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              B. Localização
            </legend>

            <div>
              <Label htmlFor="endereco">
                Endereço ou ponto de referência <span className="text-red-600">*</span>
              </Label>
              <Input
                id="endereco"
                placeholder="Ex: Rua das Acácias, 120 - Próximo à praça"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                className={erros.endereco ? "border-red-500" : ""}
              />
              {erros.endereco && (
                <p className="text-xs text-red-600 mt-1">{erros.endereco}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Ex: Pituba"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="municipio">Município</Label>
                <Input
                  id="municipio"
                  placeholder="Ex: Salvador"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="descricao">Observações adicionais</Label>
              <Textarea
                id="descricao"
                rows={2}
                placeholder="Detalhes relatados no atendimento..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              C. Classificação da Urgência
            </legend>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {(Object.keys(URGENCIA_CONFIG) as GrauUrgencia[]).map((nivel) => {
                const cfg = URGENCIA_CONFIG[nivel];
                const selecionado = grauUrgencia === nivel;
                return (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setGrauUrgencia(nivel)}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border text-sm font-medium transition-all ${
                      selecionado
                        ? `${cfg.badgeClass} ring-2 ring-offset-1 ring-slate-400 font-semibold`
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${cfg.dotClass}`} />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              D. Dados do Comunicante (opcionais)
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeComunicante">Nome</Label>
                <Input
                  id="nomeComunicante"
                  placeholder="Nome completo"
                  value={nomeComunicante}
                  onChange={(e) => setNomeComunicante(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefoneComunicante">Telefone</Label>
                <Input
                  id="telefoneComunicante"
                  placeholder="(71) 99999-9999"
                  value={telefoneComunicante}
                  onChange={(e) => setTelefoneComunicante(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                limparFormulario();
                onClose();
              }}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={salvando}
              className="bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {salvando ? "Registrando..." : "Registrar ocorrência"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
