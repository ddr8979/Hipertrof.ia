"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

const emptySubscribe = () => () => {};

export function VerifiedBadge({ size = 20, className }: { size?: number; className?: string }) {
  const [id] = useState(() => `vb-${Math.random().toString(36).slice(2, 8)}`);
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!mounted) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" className={cn("inline-block shrink-0", className)} aria-label="Verificado">
        <circle cx="12" cy="12" r="10" fill="#3897f0" />
        <path d="M7.6 12.4l2.9 2.9 6-6.1" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
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

export function ShimmerIcon({ 
  children, 
  className,
  duration = 3,
  intensity = 0.15
}: { 
  children: React.ReactNode; 
  className?: string;
  duration?: number;
  intensity?: number;
}) {
  const [id] = useState(() => `sh-${Math.random().toString(36).slice(2, 8)}`);
  return (
    <svg className={cn("inline-block", className)}>
      <defs>
        <linearGradient id={`${id}-shimmer`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity={1 - intensity} />
          <stop offset="50%" stopColor="currentColor" stopOpacity={1} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={1 - intensity} />
          <animate attributeName="x1" values="0%;100%;0%" dur={`${duration}s`} repeatCount="indefinite" />
          <animate attributeName="x2" values="100%;200%;100%" dur={`${duration}s`} repeatCount="indefinite" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id}-shimmer)`}>
        {children}
      </g>
    </svg>
  );
}

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
