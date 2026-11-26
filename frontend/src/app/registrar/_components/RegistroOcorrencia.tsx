'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import { ApiError, registrarOcorrenciaPublica, type OcorrenciaPublicaRequest } from '@/lib/api';
import {
  PassoAnimal,
  PassoContato,
  PassoLocalizacao,
  passo1Valido,
  passo2Valido,
  passo3Valido,
  temFoto,
  type DadosFormulario,
} from './passos';
import { Sucesso, type ResultadoEnvio } from './Sucesso';
import { Cabecalho, Erro, Rodape, Stepper } from './ui';

const VAZIO: DadosFormulario = {
  latitude: null,
  longitude: null,
  precisao: null,
  endereco: '',
  pontoReferencia: '',
  categoria: null,
  especie: '',
  saude: null,
  descricao: '',
  arquivos: [],
  anonimo: false,
  nome: '',
  telefone: '',
};

const texto = (v: string) => v.trim() || null;

function montarRequisicao(d: DadosFormulario): OcorrenciaPublicaRequest {
  return {
    latitude: d.latitude,
    longitude: d.longitude,
    endereco: texto(d.endereco),
    pontoReferencia: texto(d.pontoReferencia),
    descricao: texto(d.descricao),
    origemRegistro: 'APP_PUBLICO',
    reportante: d.anonimo
      ? { anonimo: true }
      : { anonimo: false, nome: texto(d.nome), telefone: texto(d.telefone) },
    animal: {
      especie: d.categoria === 'INDEFINIDO' ? null : texto(d.especie),
      categoriaAnimal: d.categoria!,
      saudeStatus: d.saude!,
    },
  };
}

// Texto do aviso junto ao botão quando a etapa está incompleta
function resumoPendencias(etapa: number, d: DadosFormulario): string {
  if (etapa === 0) return 'Use o GPS ou digite o endereço para continuar.';
  if (etapa === 2) return 'Marque "Quero permanecer anônimo" ou informe nome e telefone.';
  const faltas = [
    d.categoria === null && 'o tipo de animal',
    d.saude === null && 'o estado de saúde',
    !temFoto(d.arquivos) && 'pelo menos uma foto',
  ].filter(Boolean) as string[];
  const lista = faltas.length > 1 ? `${faltas.slice(0, -1).join(', ')} e ${faltas.at(-1)}` : faltas[0];
  return `Para continuar, informe ${lista}.`;
}

export function RegistroOcorrencia() {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState<DadosFormulario>(VAZIO);
  const [enviando, setEnviando] = useState<string | null>(null); // texto do progresso
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);
  // Clicou em Continuar/Enviar com algo faltando: passa a mostrar os avisos da etapa
  const [tentou, setTentou] = useState(false);

  const atualizar = (parcial: Partial<DadosFormulario>) => setDados((d) => ({ ...d, ...parcial }));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etapa, resultado]);

  const validos = [passo1Valido(dados), passo2Valido(dados), passo3Valido(dados)];

  function irPara(nova: number) {
    setTentou(false);
    setEtapa(nova);
  }

  async function enviar() {
    setErro('');
    setEnviando(
      dados.arquivos.length === 1 ? 'Enviando ocorrência e foto…' : 'Enviando ocorrência e arquivos…',
    );
    try {
      // Ocorrência e fotos vão juntas: ou fica tudo registrado, ou nada
      const { protocolo } = await registrarOcorrenciaPublica(montarRequisicao(dados), dados.arquivos);
      setResultado({ protocolo, anonimo: dados.anonimo });
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setEnviando(null);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (!validos[etapa]) {
      setTentou(true);
      // leva a pessoa até o primeiro campo que falta
      requestAnimationFrame(() =>
        document.querySelector('[data-pendente]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
      return;
    }
    if (etapa < 2) irPara(etapa + 1);
    else void enviar();
  }

  function recomecar() {
    setDados(VAZIO);
    setResultado(null);
    setErro('');
    irPara(0);
  }

  if (resultado) {
    return (
      <>
        <Cabecalho etapa={null} onVoltar={null} />
        <Sucesso resultado={resultado} onNova={recomecar} />
      </>
    );
  }

  const voltar = etapa > 0 && !enviando ? () => irPara(etapa - 1) : undefined;

  return (
    <>
      <Cabecalho etapa={etapa} onVoltar={etapa > 0 ? () => !enviando && irPara(etapa - 1) : null} />
      <main className="mx-auto max-w-xl px-5 pt-6 pb-16">
        <Stepper etapa={etapa} />
        <form onSubmit={onSubmit} noValidate>
          {etapa === 0 && <PassoLocalizacao dados={dados} atualizar={atualizar} />}
          {etapa === 1 && <PassoAnimal dados={dados} atualizar={atualizar} mostrarErros={tentou} />}
          {etapa === 2 && <PassoContato dados={dados} atualizar={atualizar} />}

          {tentou && !validos[etapa] && <Erro>{resumoPendencias(etapa, dados)}</Erro>}
          {erro && <Erro>{erro}</Erro>}

          <Rodape
            etapa={etapa}
            onVoltar={voltar}
            podeAvancar={validos[etapa]}
            carregando={!!enviando}
            destaque={etapa === 2}
            rotulo={
              etapa < 2 ? (
                <>
                  Continuar <ChevronRight />
                </>
              ) : enviando ? (
                enviando
              ) : (
                <>
                  <TriangleAlert /> Enviar ocorrência
                </>
              )
            }
          />
        </form>
      </main>
    </>
  );
}
