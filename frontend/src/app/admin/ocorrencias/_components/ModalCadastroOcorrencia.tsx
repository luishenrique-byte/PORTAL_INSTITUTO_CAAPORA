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
import {
  CategoriaAnimal,
  CondicaoAnimal,
  GrauUrgencia,
  NovaOcorrenciaPayload,
  CATEGORIA_LABEL,
  CONDICAO_LABEL,
  URGENCIA_CONFIG,
} from "./ocorrencia-types";

interface Props {
  open: boolean;
  onClose: () => void;
  onSalvar: (dados: NovaOcorrenciaPayload) => Promise<void>;
}

const MUNICIPIOS_PADRAO = [
  "Salvador",
  "Lauro de Freitas",
  "Camaçari",
  "Simões Filho",
  "Dias d'Ávila",
  "Mata de São João",
  "Candeias",
  "Vera Cruz",
  "Itaparica",
  "Outro",
];

export function ModalCadastroOcorrencia({ open, onClose, onSalvar }: Props) {
  const [nomeAnimal, setNomeAnimal] = useState("");
  const [categoriaAnimal, setCategoriaAnimal] = useState<CategoriaAnimal>("AVE");
  const [condicaoAnimal, setCondicaoAnimal] = useState<CondicaoAnimal>("FERIDO");
  const [enderecoReferencia, setEnderecoReferencia] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("Salvador");
  const [urgencia, setUrgencia] = useState<GrauUrgencia>("MEDIA");
  const [nomeComunicante, setNomeComunicante] = useState("");
  const [telefoneComunicante, setTelefoneComunicante] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);

  function validar(): boolean {
    const novosErros: Record<string, string> = {};
    if (!nomeAnimal.trim()) {
      novosErros.nomeAnimal = "Informe o nome ou espécie do animal.";
    }
    if (!enderecoReferencia.trim()) {
      novosErros.enderecoReferencia = "Informe o endereço ou ponto de referência.";
    }
    if (!municipio.trim()) {
      novosErros.municipio = "Selecione o município.";
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  }

  function limparFormulario() {
    setNomeAnimal("");
    setCategoriaAnimal("AVE");
    setCondicaoAnimal("FERIDO");
    setEnderecoReferencia("");
    setBairro("");
    setMunicipio("Salvador");
    setUrgencia("MEDIA");
    setNomeComunicante("");
    setTelefoneComunicante("");
    setErros({});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validar()) return;

    setSalvando(true);
    try {
      await onSalvar({
        nomeAnimal: nomeAnimal.trim(),
        categoriaAnimal,
        condicaoAnimal,
        enderecoReferencia: enderecoReferencia.trim(),
        bairro: bairro.trim() || undefined,
        municipio,
        urgencia,
        nomeComunicante: nomeComunicante.trim() || undefined,
        telefoneComunicante: telefoneComunicante.trim() || undefined,
      });
      limparFormulario();
      onClose();
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
            Registrar Nova Ocorrência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* A. Informações do animal */}
          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              A. Informações do Animal
            </legend>

            <div>
              <Label htmlFor="nomeAnimal">
                Nome ou espécie <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nomeAnimal"
                placeholder="Ex: Coruja-buraqueira, Sagui, Jiboia..."
                value={nomeAnimal}
                onChange={(e) => setNomeAnimal(e.target.value)}
                className={erros.nomeAnimal ? "border-red-500" : ""}
              />
              {erros.nomeAnimal && (
                <p className="text-xs text-red-600 mt-1">{erros.nomeAnimal}</p>
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
                  {(Object.keys(CATEGORIA_LABEL) as CategoriaAnimal[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORIA_LABEL[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="condicaoAnimal">Condição do animal</Label>
                <select
                  id="condicaoAnimal"
                  value={condicaoAnimal}
                  onChange={(e) => setCondicaoAnimal(e.target.value as CondicaoAnimal)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {(Object.keys(CONDICAO_LABEL) as CondicaoAnimal[]).map((cond) => (
                    <option key={cond} value={cond}>
                      {CONDICAO_LABEL[cond]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* B. Localização */}
          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              B. Localização
            </legend>

            <div>
              <Label htmlFor="enderecoReferencia">
                Endereço ou ponto de referência <span className="text-red-600">*</span>
              </Label>
              <Input
                id="enderecoReferencia"
                placeholder="Ex: Rua das Acácias, nº 120, próximo à praça central"
                value={enderecoReferencia}
                onChange={(e) => setEnderecoReferencia(e.target.value)}
                className={erros.enderecoReferencia ? "border-red-500" : ""}
              />
              {erros.enderecoReferencia && (
                <p className="text-xs text-red-600 mt-1">{erros.enderecoReferencia}</p>
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
                <Label htmlFor="municipio">
                  Município <span className="text-red-600">*</span>
                </Label>
                <select
                  id="municipio"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  {MUNICIPIOS_PADRAO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </fieldset>

          {/* C. Classificação da urgência */}
          <fieldset className="space-y-2 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              C. Classificação da Urgência
            </legend>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              {(Object.keys(URGENCIA_CONFIG) as GrauUrgencia[]).map((nivel) => {
                const cfg = URGENCIA_CONFIG[nivel];
                const selecionado = urgencia === nivel;
                return (
                  <button
                    key={nivel}
                    type="button"
                    onClick={() => setUrgencia(nivel)}
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

          {/* D. Dados do comunicante */}
          <fieldset className="space-y-3 border border-slate-200 rounded-lg p-4">
            <legend className="text-sm font-semibold text-emerald-800 px-1">
              D. Dados do Comunicante (opcional)
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nomeComunicante">Nome do comunicante</Label>
                <Input
                  id="nomeComunicante"
                  placeholder="Nome completo"
                  value={nomeComunicante}
                  onChange={(e) => setNomeComunicante(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="telefoneComunicante">Telefone para contato</Label>
                <Input
                  id="telefoneComunicante"
                  placeholder="(71) 99999-9999"
                  value={telefoneComunicante}
                  onChange={(e) => setTelefoneComunicante(e.target.value)}
                />
              </div>
            </div>
          </fieldset>

          {/* E. Ações */}
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