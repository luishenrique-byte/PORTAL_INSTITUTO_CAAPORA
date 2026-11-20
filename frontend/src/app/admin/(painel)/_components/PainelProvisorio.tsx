// Provisório: conteúdo do Dashboard até ele ser construído.
// A navegação e a guarda de sessão ficam no layout do painel.
export default function PainelProvisorio() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 md:py-10">
      <h1 className="font-heading text-3xl text-foreground md:text-4xl">Dashboard</h1>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Você está conectado. O dashboard ainda está em construção.
      </p>
    </div>
  );
}
