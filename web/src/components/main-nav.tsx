import Link from "next/link";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/calorias", label: "Calorias" },
  { href: "/rutinas", label: "Rutinas" },
  { href: "/nutricion", label: "Nutricion" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/gimnasio", label: "Gimnasio" },
];

export function MainNav() {
  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-8">
        <span className="mr-2 text-xs font-bold tracking-[0.2em] text-[#00ff41]">HIPERTROF.IA</span>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-full border border-white/20 px-3 py-1.5 text-sm text-zinc-100 hover:border-[#00ff41]/60 hover:text-[#00ff41]"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

