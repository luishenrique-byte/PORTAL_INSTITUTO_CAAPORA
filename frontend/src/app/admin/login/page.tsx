import type { Metadata } from 'next';
import Image from 'next/image';
import FormLogin from './_components/FormLogin';

export const metadata: Metadata = {
  title: 'Entrar | Painel Administrativo — Instituto Caapora',
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo-caapora.png"
            alt="Instituto Caapora"
            width={48}
            height={48}
            priority
            className="mb-5 h-12 w-auto"
          />
          <h1 className="font-heading text-2xl text-foreground md:text-3xl">
            Painel Administrativo
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Instituto Caapora — Acesso restrito
          </p>
        </div>

        <FormLogin />
      </div>
    </main>
  );
}
