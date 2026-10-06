"use client";

import Image from "next/image";
import { useState } from "react";

const email = "contato@institutocaapora.org.br";

function RegisterLink({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <a
      href={`mailto:${email}?subject=Registro%20de%20ocorr%C3%AAncia`}
      className={className}
    >
      {children}
    </a>
  );
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <a className="flex items-center gap-2.5" href="#inicio" aria-label="Instituto Caaporã — início">
      {inverse ? (
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white">
          <Image src="/logo-caapora.png" alt="" width={456} height={547} className="h-7 w-7 object-contain" />
        </span>
      ) : (
        <Image src="/logo-caapora.png" alt="" width={456} height={547} priority className="h-10 w-10 object-contain" />
      )}
      <span className={inverse ? "font-semibold text-white" : "font-semibold text-[#1c2b1a]"} style={{ fontFamily: "Fraunces, serif" }}>
        Instituto Caapora
      </span>
    </a>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const labels = ["Sobre", "Como Funciona", "Impacto", "Contato"];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#d0c9b8] bg-[#f5f0e8]/90 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top)" }}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Brand />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Navegação principal">
          {labels.map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(" ", "-")}`} className="text-sm font-medium text-[#6b7c69] transition-colors hover:text-[#2d6a2f]" style={{ fontFamily: "Outfit, sans-serif" }}>
              {label}
            </a>
          ))}
          <a href={`mailto:${email}?subject=Acompanhar%20ocorr%C3%AAncia`} className="text-sm font-medium text-[#6b7c69] transition-colors hover:text-[#2d6a2f]" style={{ fontFamily: "Outfit, sans-serif" }}>
            Acompanhar
          </a>
        </nav>
        <RegisterLink className="hidden items-center gap-2 rounded-full bg-[#c8501a] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#a84016] md:inline-flex">
          Registrar Ocorrência
        </RegisterLink>
        <button className="p-2 text-[#1c2b1a] md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Fechar menu" : "Abrir menu"} aria-expanded={open}>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t border-[#d0c9b8] bg-[#f5f0e8] px-5 py-4 md:hidden">
          {labels.map((label) => (
            <a key={label} href={`#${label.toLowerCase().replace(" ", "-")}`} onClick={() => setOpen(false)} className="text-sm font-medium text-[#6b7c69] hover:text-[#2d6a2f]">{label}</a>
          ))}
          <a href={`mailto:${email}?subject=Acompanhar%20ocorr%C3%AAncia`} onClick={() => setOpen(false)} className="rounded-full border border-[#d0c9b8] px-5 py-3 text-center text-sm font-medium text-[#1c2b1a]">Acompanhar ocorrência</a>
          <RegisterLink className="rounded-full bg-[#c8501a] px-5 py-3 text-center text-sm font-semibold text-white">Registrar Ocorrência</RegisterLink>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-screen items-end overflow-hidden" style={{ paddingTop: "calc(4rem + env(safe-area-inset-top))" }}>
      <div className="absolute inset-0 bg-[#0f1a0e]">
        <Image src="/hero.jpg" alt="Animal em floresta tropical brasileira" fill priority sizes="100vw" className="h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1a0e] via-[#0f1a0e]/40 to-transparent" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-20 md:pb-28">
        <div className="max-w-2xl">
          <span className="fade-up mb-6 inline-block rounded-full bg-[#c8501a] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
            Proteção da Fauna Silvestre
          </span>
          <h1 className="fade-up fade-up-delay-1 mb-6 text-5xl leading-[1.05] font-light text-white md:text-7xl" style={{ fontFamily: "Fraunces, serif" }}>
            Cada animal<br /><em className="not-italic text-[#a8d5a2]">importa.</em>
          </h1>
          <p className="fade-up fade-up-delay-2 mb-10 max-w-lg text-lg leading-relaxed text-[#c8d8c4] md:text-xl" style={{ fontFamily: "Outfit, sans-serif" }}>
            O Instituto Caapora conecta a população à rede de resgate de animais silvestres. Avistou um animal em situação de risco? Registre agora — nossa equipe entra em ação.
          </p>
          <div className="fade-up fade-up-delay-3 flex flex-col gap-4 sm:flex-row">
            <RegisterLink className="inline-flex scale-100 items-center justify-center gap-2.5 rounded-full bg-[#c8501a] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#c8501a]/30 transition-all duration-200 hover:bg-[#a84016] active:scale-95">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
              Registrar Ocorrência
            </RegisterLink>
            <a href="#sobre" className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-4 text-base font-medium text-white transition-all duration-200 hover:bg-white/10" style={{ fontFamily: "Outfit, sans-serif" }}>
              Conhecer o Instituto
            </a>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#f5f0e8] to-transparent" />
    </section>
  );
}

const stats = [
  { value: "1.200+", label: "Animais resgatados" },
  { value: "47", label: "Municípios atendidos" },
  { value: "98%", label: "Taxa de resposta em 24h" },
  { value: "12", label: "Equipes de campo" },
];

function Stats() {
  return (
    <section className="bg-[#2d6a2f] py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 text-center md:grid-cols-4">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div className="mb-1 text-4xl font-semibold text-white md:text-5xl" style={{ fontFamily: "Fraunces, serif" }}>{value}</div>
            <div className="text-sm font-medium text-[#a8d5a2]" style={{ fontFamily: "Outfit, sans-serif" }}>{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="sobre" className="bg-[#f5f0e8] py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-5 md:grid-cols-2">
        <div>
          <span className="mb-4 block text-xs font-semibold tracking-widest text-[#2d6a2f] uppercase" style={{ fontFamily: "Outfit, sans-serif" }}>Quem somos</span>
          <h2 className="mb-6 text-4xl leading-tight font-light text-[#1c2b1a] md:text-5xl" style={{ fontFamily: "Fraunces, serif" }}>Guardiões da fauna<br /><em>brasileira</em></h2>
          <p className="mb-5 leading-relaxed text-[#4a5e48]" style={{ fontFamily: "Outfit, sans-serif" }}>
            O Instituto Caapora é uma organização sem fins lucrativos dedicada ao resgate, reabilitação e reinserção de animais silvestres brasileiros. Atuamos em parceria com o IBAMA, INEMA e prefeituras regionais.
          </p>
          <p className="mb-8 leading-relaxed text-[#4a5e48]" style={{ fontFamily: "Outfit, sans-serif" }}>
            Nossa plataforma digital aproxima a população das equipes de resgate, reduzindo o tempo de resposta e aumentando as chances de sobrevivência dos animais em situação de vulnerabilidade.
          </p>
          <div className="flex flex-wrap gap-3">
            {["IBAMA parceiro", "INEMA", "Fauna silvestre", "Resgate humanizado"].map((tag) => (
              <span key={tag} className="rounded-full border border-[#c2d9be] bg-[#e8f0e4] px-3 py-1.5 text-xs font-medium text-[#2d6a2f]" style={{ fontFamily: "Outfit, sans-serif" }}>{tag}</span>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#c2d9be]">
            <Image src="/floresta.jpg" alt="Floresta amazônica exuberante" fill sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 max-w-[200px] rounded-2xl border border-[#d0c9b8] bg-white p-5 shadow-xl">
            <div className="mb-1 text-3xl" aria-hidden="true">🦜</div>
            <p className="text-sm font-semibold text-[#1c2b1a]" style={{ fontFamily: "Outfit, sans-serif" }}>+40 espécies</p>
            <p className="text-xs text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>atendidas em 2024</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const steps = [
  { icon: "📍", title: "Localize o animal", desc: "Use GPS automático ou informe manualmente o endereço e ponto de referência onde o animal foi encontrado." },
  { icon: "📋", title: "Descreva a situação", desc: "Selecione o tipo de animal (se conhecido) e relate o estado de saúde. Fotos e vídeos são opcionais mas ajudam muito." },
  { icon: "📞", title: "Seus dados de contato", desc: "Informe nome e telefone/WhatsApp para que nossa equipe possa entrar em contato se necessário." },
  { icon: "✅", title: "Protocolo gerado", desc: "Você recebe um número de protocolo para acompanhar o andamento do resgate em tempo real." },
];

function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#ede8dd] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-16 text-center">
          <span className="mb-4 block text-xs font-semibold tracking-widest text-[#2d6a2f] uppercase" style={{ fontFamily: "Outfit, sans-serif" }}>Processo simplificado</span>
          <h2 className="text-4xl font-light text-[#1c2b1a] md:text-5xl" style={{ fontFamily: "Fraunces, serif" }}>Como registrar uma ocorrência</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="group relative rounded-2xl border border-[#d0c9b8] bg-white p-7 transition-colors duration-300 hover:border-[#2d6a2f]/40">
              <div className="absolute top-5 right-5 text-xs font-bold text-[#d0c9b8]" style={{ fontFamily: "Fraunces, serif" }}>0{index + 1}</div>
              <div className="mb-5 text-3xl" aria-hidden="true">{step.icon}</div>
              <h3 className="mb-3 text-lg leading-snug font-semibold text-[#1c2b1a]" style={{ fontFamily: "Fraunces, serif" }}>{step.title}</h3>
              <p className="text-sm leading-relaxed text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WildlifeGallery() {
  const impactItems = [
    "Fauna nativa da Mata Atlântica e Cerrado",
    "Atendimento 24h via sistema digital",
    "Rastreamento por protocolo único",
    "Dados compartilhados com órgãos ambientais",
  ];

  return (
    <section id="impacto" className="bg-[#f5f0e8] py-24">
      <div className="mx-auto max-w-6xl px-5">
        <div className="grid items-center gap-16 md:grid-cols-2">
          <div className="relative order-2 md:order-1">
            <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-[#c2d9be]">
              <Image src="/fauna.jpg" alt="Macaco em habitat natural" fill sizes="(max-width: 768px) 100vw, 50vw" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -top-4 -right-4 rounded-2xl bg-[#2d6a2f] px-5 py-4 text-center text-white shadow-lg">
              <div className="text-2xl font-semibold" style={{ fontFamily: "Fraunces, serif" }}>72h</div>
              <div className="text-xs text-[#a8d5a2]" style={{ fontFamily: "Outfit, sans-serif" }}>tempo médio<br />de resgate</div>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <span className="mb-4 block text-xs font-semibold tracking-widest text-[#2d6a2f] uppercase" style={{ fontFamily: "Outfit, sans-serif" }}>Nosso impacto</span>
            <h2 className="mb-6 text-4xl leading-tight font-light text-[#1c2b1a] md:text-5xl" style={{ fontFamily: "Fraunces, serif" }}>A fauna silvestre<br />precisa de <em>você</em></h2>
            <p className="mb-6 leading-relaxed text-[#4a5e48]" style={{ fontFamily: "Outfit, sans-serif" }}>
              Atropelamentos, queimadas, tráfico ilegal e perda de habitat colocam em risco milhares de animais silvestres todos os anos. A rapidez no reporte é fundamental para aumentar as chances de sobrevivência.
            </p>
            <ul className="space-y-4" style={{ fontFamily: "Outfit, sans-serif" }}>
              {impactItems.map((item) => (
                <li key={item} className="flex items-start gap-3 text-[#4a5e48]">
                  <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e8f0e4]">
                    <svg className="h-3 w-3 text-[#2d6a2f]" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" /></svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="registrar" className="bg-[#1c2b1a] py-24">
      <div className="mx-auto max-w-3xl px-5 text-center">
        <div className="mb-6 text-5xl" aria-hidden="true">🦉</div>
        <h2 className="mb-6 text-4xl leading-tight font-light text-white md:text-6xl" style={{ fontFamily: "Fraunces, serif" }}>Avistou um animal<br />em situação de risco?</h2>
        <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[#a8d5a2]" style={{ fontFamily: "Outfit, sans-serif" }}>
          Não espere. Cada minuto conta. Registre a ocorrência agora e nossa equipe de resgate será acionada imediatamente.
        </p>
        <RegisterLink className="mb-6 inline-flex scale-100 items-center gap-3 rounded-full bg-[#c8501a] px-10 py-5 text-lg font-bold text-white shadow-2xl shadow-[#c8501a]/40 transition-all duration-200 hover:bg-[#e06020] active:scale-95" >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
          Registrar Ocorrência Agora
        </RegisterLink>
        <p className="text-sm text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>Gratuito · Anônimo se preferir · Protocolo gerado na hora</p>
        <div className="mt-12 flex flex-col items-center justify-center gap-4 border-t border-[#2d6a2f]/40 pt-10 sm:flex-row">
          <div className="text-sm text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>Prefere ligar?</div>
          <a href="tel:08006409999" className="flex items-center gap-2 font-semibold text-[#a8d5a2] transition-colors hover:text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5Z" /></svg>
            0800 640-9999
          </a>
          <span className="hidden text-sm text-[#6b7c69] sm:block">·</span>
          <div className="text-sm text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>Atendimento 24h, gratuito</div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer id="contato" className="bg-[#111d10] py-14">
      <div className="mx-auto max-w-6xl px-5">
        <div className="mb-10 grid gap-10 border-b border-[#2d6a2f]/30 pb-10 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3"><Brand inverse /></div>
            <p className="text-sm leading-relaxed text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>Proteção e resgate da fauna silvestre brasileira desde 2015.</p>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-widest text-white uppercase" style={{ fontFamily: "Outfit, sans-serif" }}>Links</h4>
            <ul className="space-y-2 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
              {[["Sobre nós", "#sobre"], ["Como funciona", "#como-funciona"], ["Parceiros", "#impacto"], ["Transparência", "#impacto"], ["Voluntariado", `mailto:${email}?subject=Voluntariado`]].map(([label, href]) => (
                <li key={label}><a href={href} className="text-[#6b7c69] transition-colors hover:text-[#a8d5a2]">{label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-sm font-semibold tracking-widest text-white uppercase" style={{ fontFamily: "Outfit, sans-serif" }}>Contato</h4>
            <ul className="space-y-2 text-sm text-[#6b7c69]" style={{ fontFamily: "Outfit, sans-serif" }}>
              <li>📧 <a href={`mailto:${email}`}>{email}</a></li>
              <li>📞 <a href="tel:08006409999">0800 640-9999</a></li>
              <li>📍 Salvador, Bahia — Brasil</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 text-xs text-[#4a5e48] md:flex-row" style={{ fontFamily: "Outfit, sans-serif" }}>
          <p>© 2025 Instituto Caapora. Todos os direitos reservados.</p>
          <p>Parceiros: IBAMA · INEMA · Secretaria de Meio Ambiente</p>
          <a href="#contato" className="text-[#2d3a2c] opacity-40 transition-colors hover:text-[#6b7c69] hover:opacity-100" title="Acesso administrativo" aria-label="Acesso administrativo">⚙</a>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Nav />
      <Hero />
      <Stats />
      <About />
      <HowItWorks />
      <WildlifeGallery />
      <CTASection />
      <Footer />
    </div>
  );
}
