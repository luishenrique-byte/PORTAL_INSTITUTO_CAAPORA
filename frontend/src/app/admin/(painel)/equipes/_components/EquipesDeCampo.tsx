'use client';

import { useEffect, useState } from 'react';
import { Plus, RotateCw, UserPlus, Users, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiError, listarEquipesResumo, type EquipeResumo } from '@/lib/api';
import { ehCoordenador, useSessaoPainel } from '../../_components/UsuarioContexto';
import { CardEquipe } from './CardEquipe';
import { ModalEquipe } from './ModalEquipe';
import { NovaEquipe } from './NovaEquipe';
import { NovoFuncionario } from './NovoFuncionario';
import { plural } from './visual';

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; equipes: EquipeResumo[] }
  | { tipo: 'erro'; mensagem: string };

export default function EquipesDeCampo() {
  const { token, usuario, sair: sessaoExpirada } = useSessaoPainel();
  const coordenador = ehCoordenador(usuario);
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' });
  const [recarga, setRecarga] = useState(0);
  const [selecionada, setSelecionada] = useState<EquipeResumo | null>(null);
  const [novaAberta, setNovaAberta] = useState(false);
  const [funcionarioAberto, setFuncionarioAberto] = useState(false);

  useEffect(() => {
    const controle = new AbortController();
    listarEquipesResumo(token, controle.signal)
      .then((equipes) => setEstado({ tipo: 'ok', equipes }))
      .catch((e) => {
        if (controle.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) return sessaoExpirada();
        setEstado({ tipo: 'erro', mensagem: e instanceof ApiError ? e.message : 'Erro inesperado.' });
      });
    return () => controle.abort();
  }, [token, recarga, sessaoExpirada]);

  const recarregar = () => setRecarga((r) => r + 1);
  const equipes = estado.tipo === 'ok' ? estado.equipes : [];

  return (
    <>
      <div className="mx-auto max-w-5xl px-5 py-8 md:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-heading text-3xl text-foreground md:text-4xl">Equipes de Campo</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {estado.tipo === 'ok' ? <Subtitulo equipes={estado.equipes} /> : 'Carregando equipes…'}
            </p>
          </div>
          {coordenador && (
            <div className="flex flex-wrap gap-2">
              <Button
                size="lg"
                variant="outline"
                className="h-11 rounded-xl px-4 text-sm font-semibold"
                onClick={() => setFuncionarioAberto(true)}
              >
                <UserPlus /> Novo funcionário
              </Button>
              <Button size="lg" className="h-11 rounded-xl px-4 text-sm font-semibold" onClick={() => setNovaAberta(true)}>
                <Plus /> Nova equipe
              </Button>
            </div>
          )}
        </header>

        <section className="mt-8" aria-label="Equipes">
          {estado.tipo === 'carregando' && (
            <div className="grid gap-4 md:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          )}

          {estado.tipo === 'erro' && (
            <Aviso Icone={WifiOff} titulo="Não foi possível carregar as equipes" texto={estado.mensagem}>
              <Button
                variant="outline"
                onClick={() => {
                  setEstado({ tipo: 'carregando' });
                  recarregar();
                }}
              >
                <RotateCw /> Tentar de novo
              </Button>
            </Aviso>
          )}

          {estado.tipo === 'ok' && estado.equipes.length === 0 && (
            <Aviso
              Icone={Users}
              titulo="Nenhuma equipe cadastrada"
              texto={coordenador ? 'Cadastre a primeira equipe de campo pelo botão “Nova equipe”.' : 'A coordenação ainda não cadastrou equipes.'}
            />
          )}

          {estado.tipo === 'ok' && estado.equipes.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {estado.equipes.map((equipe) => (
                <CardEquipe key={equipe.id} equipe={equipe} onAbrir={() => setSelecionada(equipe)} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ModalEquipe
        equipe={selecionada}
        equipes={equipes}
        onFechar={() => {
          setSelecionada(null);
          recarregar(); // os números do card podem ter mudado enquanto o modal estava aberto
        }}
      />
      <NovoFuncionario
        aberto={funcionarioAberto}
        token={token}
        equipes={equipes}
        onFechar={() => setFuncionarioAberto(false)}
        onCriado={recarregar}
        onSessaoExpirada={sessaoExpirada}
      />
      <NovaEquipe
        aberto={novaAberta}
        token={token}
        onFechar={() => setNovaAberta(false)}
        onCriada={recarregar}
        onSessaoExpirada={sessaoExpirada}
      />
    </>
  );
}

// "2 de 4 equipes disponíveis · 44 ocorrências em andamento"
function Subtitulo({ equipes }: { equipes: EquipeResumo[] }) {
  const disponiveis = equipes.filter((e) => e.status === 'DISPONIVEL').length;
  const emAndamento = equipes.reduce((soma, e) => soma + e.emCampo, 0);
  const total = equipes.length;
  return (
    <>
      {disponiveis} de {total} {total === 1 ? 'equipe disponível' : 'equipes disponíveis'} ·{' '}
      {plural(emAndamento, 'ocorrência em andamento', 'ocorrências em andamento')}
    </>
  );
}

function Aviso({
  Icone,
  titulo,
  texto,
  children,
}: {
  Icone: typeof Users;
  titulo: string;
  texto: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-12 text-center">
      <Icone className="size-8 text-muted-foreground" aria-hidden />
      <p className="mt-3 font-heading text-lg text-foreground">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}
