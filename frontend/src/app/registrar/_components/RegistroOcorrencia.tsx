'use client';

import { useEffect, useState } from 'react';
import { ChevronRight, TriangleAlert } from 'lucide-react';
import {
  ApiError,
  enviarMidiaPublica,
  registrarOcorrenciaPublica,
  type OcorrenciaPublicaRequest,
} from '@/lib/api';
import {
  PassoAnimal,
  PassoContato,
  PassoLocalizacao,
  passo1Valido,
  passo2Valido,
  passo3Valido,
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

export function RegistroOcorrencia() {
  const [etapa, setEtapa] = useState(0);
  const [dados, setDados] = useState<DadosFormulario>(VAZIO);
  const [enviando, setEnviando] = useState<string | null>(null); // texto do progresso
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<ResultadoEnvio | null>(null);

  const atualizar = (parcial: Partial<DadosFormulario>) => setDados((d) => ({ ...d, ...parcial }));

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [etapa, resultado]);

  const validos = [passo1Valido(dados), passo2Valido(dados), passo3Valido(dados)];

  async function enviar() {
    setErro('');
    setEnviando('Enviando ocorrência…');
    let protocolo: string;
    try {
      protocolo = (await registrarOcorrenciaPublica(montarRequisicao(dados))).protocolo;
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Erro inesperado. Tente novamente.');
      setEnviando(null);
      return;
    }

    // A ocorrência já existe: falhas no upload não impedem o registro
    const falhas: string[] = [];
    for (const [i, arquivo] of dados.arquivos.entries()) {
      setEnviando(`Enviando arquivos (${i + 1} de ${dados.arquivos.length})…`);
      try {
        await enviarMidiaPublica(protocolo, arquivo);
      } catch {
        falhas.push(arquivo.name);
      }
    }

    setEnviando(null);
    setResultado({ protocolo, anonimo: dados.anonimo, falhas });
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validos[etapa] || enviando) return;
    if (etapa < 2) setEtapa(etapa + 1);
    else void enviar();
  }

  function recomecar() {
    setDados(VAZIO);
    setResultado(null);
    setErro('');
    setEtapa(0);
  }

  if (resultado) {
    return (
      <>
        <Cabecalho etapa={null} onVoltar={null} />
        <Sucesso resultado={resultado} onNova={recomecar} />
      </>
    );
  }

  const voltar = etapa > 0 && !enviando ? () => setEtapa(etapa - 1) : undefined;

  return (
    <>
      <Cabecalho etapa={etapa} onVoltar={etapa > 0 ? () => !enviando && setEtapa(etapa - 1) : null} />
      <main className="mx-auto max-w-xl px-5 pt-6 pb-16">
        <Stepper etapa={etapa} />
        <form onSubmit={onSubmit} noValidate>
          {etapa === 0 && <PassoLocalizacao dados={dados} atualizar={atualizar} />}
          {etapa === 1 && <PassoAnimal dados={dados} atualizar={atualizar} />}
          {etapa === 2 && <PassoContato dados={dados} atualizar={atualizar} />}

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
