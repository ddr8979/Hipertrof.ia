// Iconos premium animados: verificado, brillo (shimmer) y anillo de resplandor.
"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

// Suscripción vacía para detectar montaje sin causar render en servidor.
const emptySubscribe = () => () => {};

/**
 * Insignia de cuenta verificada.
 * Renderiza una versión estática en el servidor y una con degradado/animación
 * tras el montaje, evitando desajustes de hidratación.
 */
export function VerifiedBadge({ size = 20, className }: { size?: number; className?: string }) {
  const [id] = useState(() => `vb-${Math.random().toString(36).slice(2, 8)}`);
  // mounted=true solo en cliente; evita diferencias SSR/cliente.
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const animationRef = useRef<number | undefined>(undefined);

  // Cancela cualquier animación pendiente al desmontar.
  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!mounted) {
    // Versión estática para SSR.
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={cn("inline-block shrink-0", className)} aria-label="Verificado">
        <circle cx="12" cy="12" r="10" fill="#3897f0" />
        <path d="M7.6 12.4l2.9 2.9 6-6.1" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    // Versión con degradado y anillo interior.
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("inline-block shrink-0", className)} aria-label="Verificado">
      <defs>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4dc7ff" />
          <stop offset="55%" stopColor="#3897f0" />
          <stop offset="100%" stopColor="#0e5ee8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${id}-grad)`} />
      <circle cx="12" cy="12" r="10.2" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
      <path
        d="M7.6 12.4l2.9 2.9 6-6.1"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Aplica un latido sutil a los iconos hijos sin alterar su color.
 * IMPORTANTE: antes se usaba un gradiente con `stop-color="currentColor"`,
 * que muchos navegadores NO resuelven dentro de `<stop>` y renderizan NEGRO.
 * Ahora se conserva el color real del icono y solo se anima su opacidad.
 * @param duration  Duración del ciclo en segundos.
 */
export function ShimmerIcon({
  children,
  className,
  duration = 3,
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  intensity?: number;
}) {
  return (
    <span
      className={cn("inline-block [&>svg]:block [&>svg]:size-full", className)}
      style={{ animation: `icon-shine ${duration}s ease-in-out infinite` }}
    >
      {children}
    </span>
  );
}

/**
 * Anillo con resplandor pulsante.
 * @param color         Color base del resplandor.
 * @param pulseDuration Duración del pulso en segundos.
 */
export function GlowRing({ 
  size = 20, 
  color = "currentColor", 
  className,
  pulseDuration = 2
}: { 
  size?: number; 
  color?: string; 
  className?: string;
  pulseDuration?: number;
}) {
  const [id] = useState(() => `gr-${Math.random().toString(36).slice(2, 8)}`);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={cn("inline-block shrink-0", className)}>
      <defs>
        <radialGradient id={`${id}-pulse`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="70%" stopColor={color} stopOpacity="0.05" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
          <animate attributeName="r" values="50%;70%;50%" dur={`${pulseDuration}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.4;0.8" dur={`${pulseDuration}s`} repeatCount="indefinite" />
        </radialGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill={`url(#${id}-pulse)`} />
    </svg>
  );
}
