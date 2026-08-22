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
  // Thumb JPG del mismo exercisedb (mucho más liviano, se ve instantáneo como poster)
  const poster = remote ? remote.replace(/\.gif$/, ".jpg") : null;

  const [mode, setMode] = useState<Mode>(() => {
    if (local && canPlayWebM()) return "video";
    if (remote) return "img";
    return "fallback";
  });
  const [webmOk, setWebmOk] = useState(false);
  const [imgOk, setImgOk] = useState(false);
  const [visible, setVisible] = useState(eager ?? false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Lazy: solo autoplay / cargar cuando entra en viewport (eager lo evita)
  useEffect(() => {
    if (eager || mode !== "video") return;
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [eager, mode]);

  // Pausar video cuando sale de viewport (ahorro batería + CPU), reanudar al volver
  useEffect(() => {
    if (mode !== "video" || !videoRef.current || typeof IntersectionObserver === "undefined") return;
    const v = videoRef.current;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            v.play().catch(() => {});
          } else {
            v.pause();
          }
        }
      },
      { threshold: 0.1 }
    );
    io.observe(v);
    return () => io.disconnect();
  }, [mode, webmOk]);

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
      >
        {/* Poster JPG mientras el video carga — evita flash blanco y div más grande que gif */}
        {poster && !webmOk && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={poster}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            className={cn("absolute inset-0 size-full", objectFit, "opacity-60 blur-[0.5px]")}
          />
        )}
        {visible ? (
          <video
            ref={videoRef}
            src={local}
            poster={poster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            preload={eager ? "auto" : "metadata"}
            onCanPlay={() => setWebmOk(true)}
            onError={handleVideoError}
            className={cn(
              "relative size-full transition-opacity duration-500 ease-out will-change-[opacity]",
              objectFit,
              webmOk ? "opacity-100" : "opacity-0",
              videoClassName
            )}
            style={{ contentVisibility: "auto" } as React.CSSProperties}
          />
        ) : (
          // Placeholder antes de que el observer dispare (evita layout shift)
          // eslint-disable-next-line @next/next/no-img-element
          poster ? <img src={poster} alt="" aria-hidden className={cn("size-full", objectFit, "opacity-60")} /> : null
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
            "relative size-full transition-opacity duration-500 ease-out",
            objectFit,
            imgOk ? "opacity-100" : "opacity-0",
            imgClassName
          )}
          style={{ contentVisibility: "auto" } as React.CSSProperties}
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