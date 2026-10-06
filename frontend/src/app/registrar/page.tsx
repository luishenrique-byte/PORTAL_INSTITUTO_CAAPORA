import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-24">
      <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-8 text-center shadow-lg sm:p-12">
        <span className="mb-6 inline-flex rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
          Em desenvolvimento
        </span>
        <h1 className="mb-4 text-4xl font-light text-foreground sm:text-5xl">
          Registrar ocorrência
        </h1>
        <p className="mb-8 text-muted-foreground">
          Estamos preparando o formulário de registro. Em breve você poderá
          informar os dados do animal e o local onde ele precisa de ajuda.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-[#245525]"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  );
}
