"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { exerciseGif, exerciseLocalWebm, cn } from "@/lib/utils";

type Mode = "video" | "img" | "fallback";

// iOS Safari < 17.4 no soporta WebM VP9. Detectamos soporte real en runtime.
let webmSupport: boolean | null = null;
function canPlayWebM(): boolean {
  if (webmSupport !== null) return webmSupport;
  if (typeof document === "undefined") return false;
  const v = document.createElement("video");
  const can = v.canPlayType('video/webm; codecs="vp9"');
  webmSupport = can === "probably" || can === "maybe";
  return webmSupport;
}

export function ExerciseMedia({
  url,
  alt,
  className,
  imgClassName,
  videoClassName,
  eager,
  contain = false,
}: {
  url: string | null | undefined;
  alt: string;
  className?: string;
  imgClassName?: string;
  videoClassName?: string;
  eager?: boolean;
  /** Si true usa object-contain (gif calza exacto sin recorte). Default: cover */
  contain?: boolean;
}) {
  const local = exerciseLocalWebm(url);
  const remote = exerciseGif(url);

  const [mode, setMode] = useState<Mode>(() => {
    if (local && canPlayWebM()) return "video";
    if (remote) return "img";
    return "fallback";
  });
  const [imgOk, setImgOk] = useState(false);
  // mount: el video se monta UNA vez al entrar en viewport (no se desmonta -> sin flicker al scrollear)
  const [mounted, setMounted] = useState(eager ?? false);
  // inView: reproduce solo cuando está en pantalla (pausa offscreen, ahorra batería)
  const [inView, setInView] = useState(eager ?? false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (mode !== "video") return;
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      queueMicrotask(() => {
        setMounted(true);
        setInView(true);
      });
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setMounted(true);
            setInView(true);
          } else {
            setInView(false);
          }
        }
      },
      { rootMargin: "200px", threshold: 0.05 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mode, eager]);

  // Reproducir/pausar según inView
  useEffect(() => {
    const v = videoRef.current;
    if (!v || mode !== "video" || !mounted) return;
    if (inView) {
      v.muted = true;
      void v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [inView, mode, mounted]);

  const handleVideoError = useCallback(() => {
    // Fallback a GIF remoto si el WebM falla (codec no soportado, archivo faltante, etc)
    if (remote) setMode("img");
    else setMode("fallback");
  }, [remote]);

  const objectFit = contain ? "object-contain" : "object-cover";

  if (mode === "video" && local) {
    return (
      <div
        ref={wrapRef}
        className={cn("relative size-full overflow-hidden bg-[var(--surface-2)]", className)}
        style={{ contentVisibility: "auto" } as React.CSSProperties}
      >
        {mounted ? (
          <video
            ref={videoRef}
            src={local}
            autoPlay={inView}
            muted
            loop
            playsInline
            preload={inView ? "auto" : "metadata"}
            onError={handleVideoError}
            className={cn("size-full", objectFit, videoClassName)}
          />
        ) : (
          <div className="size-full animate-pulse bg-[var(--surface-2)]" />
        )}
      </div>
    );
  }

  if (mode === "img" && remote) {
    return (
      <div className={cn("relative size-full overflow-hidden bg-[var(--surface-2)]", className)}>
        {/* Skeleton sutil mientras carga */}
        {!imgOk && <div className="absolute inset-0 animate-pulse bg-[var(--surface-2)]" />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={remote}
          alt={alt}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setImgOk(true)}
          onError={() => setMode("fallback")}
          className={cn(
            "relative size-full transition-opacity duration-300 ease-out",
            objectFit,
            imgOk ? "opacity-100" : "opacity-0",
            imgClassName
          )}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex size-full items-center justify-center bg-[var(--surface-3)]", className)}>
      <span className="font-display text-xl text-[var(--muted)]">{alt?.[0]?.toUpperCase() ?? "?"}</span>
    </div>
  );
}