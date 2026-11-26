import PainelShell from './_components/PainelShell';

// Casca da área restrita: sidebar fixa + área onde as páginas internas são renderizadas.
// A tela de login fica fora deste grupo e, por isso, não mostra a sidebar.
export default function PainelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PainelShell>{children}</PainelShell>;
}
