// "Mr Mancuernas": mascota de hypertrof.ia.
// Un personaje-mancuerna con cara que parpadea, flota, habla por globo de
// diálogo y cambia de ánimo/animación cada vez que volvés al inicio.
// Estilo geométrico y limpio (Hevy/Fitia), SIN sombras negras ni glow.
"use client";

import { useEffect, useMemo, useState } from "react";
import { Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";

/** Frases que dice Mr Mancuernas en la interfaz. */
const TIPS = [
  "¡Dale que hoy rompés un PR! 💪",
  "Una serie más y sos imparable 🔥",
  "¿Hidrataste? El agua no se negocia 💧",
  "La constancia le gana al talento 📈",
  "El músculo crece descansando 😴",
  "Registrá tus series, el progreso no se acuerda solo 📝",
  "Hoy es buen día para subir 2,5 kg 🏋️",
  "Estirar también entrena 🧘",
  "No te saltees el calentamiento 🚀",
  "Proteína en cada comida 🍗",
  "El dolor de hoy es la fuerza de mañana 💥",
  "Menos scroll, más sentadillas 🍑",
  "Técnica primero, peso después 🎯",
  "El mejor momento para empezar es ahora ⏱️",
];

/** Frases de bienvenida según la hora del día. */
function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Animaciones disponibles; se elige una al azar en cada montaje. */
const VARIANTS = ["mr-bounce", "mr-tilt", "mr-wave", "mr-hop", "mr-sway"] as const;

/** Ojos abiertos (con brillito) del personaje. */
function EyesOpen() {
  return (
    <>
      <circle cx="89" cy="73" r="5.4" fill="var(--accent-ink)" />
      <circle cx="111" cy="73" r="5.4" fill="var(--accent-ink)" />
      <circle cx="90.6" cy="71.2" r="1.7" fill="#fff" />
      <circle cx="112.6" cy="71.2" r="1.7" fill="#fff" />
    </>
  );
}

/**
 * Cuerpo SVG del personaje (mancuerna con cara). `blink` cierra los ojos.
 * Usa el acento del usuario, así que se personaliza con el tema.
 */
function MascotSvg({ blink, className }: { blink: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 200 152"
      className={className}
      role="img"
      aria-label="Mr Mancuernas"
    >
      {/* Sombra de contacto suave (no negra dura) */}
      <ellipse cx="100" cy="143" rx="44" ry="6" fill="var(--text)" opacity="0.07" />

      {/* Placas laterales */}
      <rect x="14" y="42" width="30" height="68" rx="15" fill="var(--text)" opacity="0.9" />
      <rect x="156" y="42" width="30" height="68" rx="15" fill="var(--text)" opacity="0.9" />
      {/* Marca de peso en las placas */}
      <rect x="24" y="64" width="10" height="24" rx="5" fill="var(--accent)" />
      <rect x="166" y="64" width="10" height="24" rx="5" fill="var(--accent)" />

      {/* Barra */}
      <rect x="40" y="67" width="120" height="18" rx="9" fill="var(--text)" opacity="0.9" />

      {/* Cara (placa central) */}
      <rect x="65" y="45" width="70" height="62" rx="24" fill="var(--accent)" />
      <rect x="65" y="45" width="70" height="62" rx="24" fill="#fff" opacity="0.06" />
      {/* Brillo superior */}
      <ellipse cx="86" cy="60" rx="13" ry="7" fill="#fff" opacity="0.3" />

      {/* Ojos */}
      {blink ? (
        <>
          <rect x="83" y="72" width="12" height="3.4" rx="1.7" fill="var(--accent-ink)" />
          <rect x="105" y="72" width="12" height="3.4" rx="1.7" fill="var(--accent-ink)" />
        </>
      ) : (
        <EyesOpen />
      )}

      {/* Sonrisa */}
      <path
        d="M88 88 q12 12 24 0"
        stroke="var(--accent-ink)"
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
      />

      {/* Mejillas */}
      <ellipse cx="80" cy="85" rx="4.5" ry="3" fill="var(--danger)" opacity="0.25" />
      <ellipse cx="120" cy="85" rx="4.5" ry="3" fill="var(--danger)" opacity="0.25" />
    </svg>
  );
}

/** Hook interno: parpadeo aleatorio + variante de animación por montaje. */
function useBlink() {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    let alive = true;
    const loop = () => {
      t = setTimeout(
        () => {
          if (!alive) return;
          setBlink(true);
          setTimeout(() => alive && setBlink(false), 130);
          loop();
        },
        1600 + Math.random() * 3200
      );
    };
    loop();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, []);
  return blink;
}

/**
 * Mr Mancuernas solo (sin texto). `variant` fija la animación; si no se pasa,
 * se elige una al azar en cada montaje.
 */
export function MrMancuernas({
  size = 96,
  className,
  variant,
  animated = true,
}: {
  size?: number;
  className?: string;
  variant?: string;
  animated?: boolean;
}) {
  const blink = useBlink();
  const [auto] = useState(
    () => VARIANTS[Math.floor(Math.random() * VARIANTS.length)]
  );
  const anim = animated ? (variant ?? auto) : undefined;
  return (
    <div
      className={cn("inline-block shrink-0", anim, className)}
      style={{ width: size, height: size * 0.76 }}
    >
      <MascotSvg blink={blink} className="size-full" />
    </div>
  );
}

/**
 * Tarjeta de Mr Mancuernas: personaje + globo de diálogo que rota frases.
 * Se usa en el inicio; cada visita elige una animación y una frase distintas.
 */
export function MrMancuernasCard({ className }: { className?: string }) {
  const start = useMemo(() => Math.floor(Math.random() * TIPS.length), []);
  const [i, setI] = useState(start);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MrMancuernas size={72} />
      <div className="relative min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-sm)]">
        <span className="absolute -left-1.5 top-1/2 size-3 -translate-y-1/2 rotate-45 border-b border-l border-[var(--border)] bg-[var(--surface)]" />
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)]">
          {greeting()}
        </p>
        <p
          key={i}
          className="animate-fade-up text-sm font-semibold leading-snug text-[var(--text-2)]"
        >
          {TIPS[i]}
        </p>
      </div>
    </div>
  );
}

/**
 * Mascota de las pantallas de autenticación (login/registro): personaje en
 * un bocadillo con frases rotativas.
 */
const AUTH_PHRASES: Record<"login" | "registro", string[]> = {
  login: [
    "¡Entrá! Tu PR te está esperando 💪",
    "Hoy se entrena, mañana se jacta 😎",
    "¿Seguimos esa racha?",
  ],
  registro: [
    "¡Bienvenido al equipo! 🎉",
    "Creá la cuenta y arrancamos",
    "Tu yo del futuro te va a agradecer",
  ],
};

export function Mascot({ mode }: { mode: "login" | "registro" }) {
  const phrases = AUTH_PHRASES[mode];
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % phrases.length), 4200);
    return () => clearInterval(t);
  }, [phrases.length]);

  return (
    <div className="mb-4 flex flex-col items-center gap-3" aria-hidden="true">
      <MrMancuernas size={104} />
      <div
        key={i}
        className="relative animate-fade-up rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-sm font-semibold leading-snug text-[var(--text-2)] shadow-[var(--shadow-sm)]"
      >
        <span className="absolute left-1/2 -top-1.5 size-3 -translate-x-1/2 rotate-45 border-l border-t border-[var(--border)] bg-[var(--surface)]" />
        {phrases[i]}
      </div>
    </div>
  );
}

/** Icono de mancuerna: usa el icono nativo de Lucide (limpio, consistente). */
export function DumbbellIcon({
  size = 40,
  className = "",
  animated = false,
}: {
  size?: number;
  className?: string;
  animated?: boolean;
}) {
  return (
    <Dumbbell
      size={size}
      strokeWidth={1.8}
      className={className + (animated ? " animate-db-float" : "")}
    />
  );
}
