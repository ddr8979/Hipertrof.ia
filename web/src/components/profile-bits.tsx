"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Music4, Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export type SocialHandles = {
  instagram_handle?: string | null;
  tiktok_handle?: string | null;
  twitter_handle?: string | null;
  spotify_handle?: string | null;
};

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function TikTikIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function SpotifyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export function VerifiedBadge({ size = 16 }: { size?: number }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="inline-block shrink-0 align-baseline"
      aria-label="Verificado"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4dc7ff" />
          <stop offset="0.55" stopColor="#3897f0" />
          <stop offset="1" stopColor="#0e5ee8" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill={`url(#${id})`} />
      <circle cx="12" cy="12" r="10.2" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="0.8" />
      <path
        d="M12 1.6c.9 0 1.74.34 2.37.96l1.06 1.05 1.5-.18c.93-.11 1.8.55 1.9 1.48l.18 1.5 1.05 1.06c.62.63.96 1.47.96 2.37s-.34 1.74-.96 2.37l-1.05 1.06-.18 1.5c-.1.93-.97 1.59-1.9 1.48l-1.5-.18-1.06 1.05c-.63.62-1.47.96-2.37.96s-1.74-.34-2.37-.96l-1.06-1.05-1.5.18c-.93.11-1.8-.55-1.9-1.48l-.18-1.5-1.05-1.06A3.37 3.37 0 0 1 1.6 12c0-.9.34-1.74.96-2.37l1.05-1.06.18-1.5c.1-.93.97-1.59 1.9-1.48l1.5.18 1.06-1.05A3.37 3.37 0 0 1 12 1.6Z"
        fill="rgba(0,0,0,0.16)"
      />
      <circle cx="12" cy="12" r="8.6" fill="rgba(255,255,255,0.14)" />
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

const SOCIAL_DEFS = [
  {
    key: "instagram_handle",
    label: "Instagram",
    url: (h: string) => `https://instagram.com/${h}`,
    bg: "linear-gradient(45deg,#f09433 0%,#e6683c 25%,#dc2743 50%,#cc2366 75%,#bc1888 100%)",
    icon: (cls?: string) => <InstagramIcon className={cls} />,
  },
  {
    key: "tiktok_handle",
    label: "TikTok",
    url: (h: string) => `https://tiktok.com/@${h}`,
    bg: "#111111",
    icon: (cls?: string) => <TikTikIcon className={cls} />,
  },
  {
    key: "twitter_handle",
    label: "X",
    url: (h: string) => `https://x.com/${h}`,
    bg: "#000000",
    icon: (cls?: string) => <XIcon className={cls} />,
  },
  {
    key: "spotify_handle",
    label: "Spotify",
    url: (h: string) => `https://open.spotify.com/user/${h}`,
    bg: "#1db954",
    icon: (cls?: string) => <SpotifyIcon className={cls} />,
  },
] as const;

export function SocialCircles({
  handles,
  className,
}: {
  handles: SocialHandles | null | undefined;
  className?: string;
}) {
  if (!handles) return null;
  const list = SOCIAL_DEFS.filter((d) => handles[d.key]);
  if (!list.length) return null;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {list.map((d) => {
        const h = String(handles[d.key]);
        return (
          <a
            key={d.key}
            href={d.url(h)}
            target="_blank"
            rel="noopener noreferrer"
            title={`${d.label}: @${h}`}
            className="flex size-10 items-center justify-center rounded-full text-white shadow-md transition-transform hover:scale-105 active:scale-95"
            style={{ background: d.bg }}
          >
            {d.icon("size-5")}
          </a>
        );
      })}
    </div>
  );
}

export function ProfileTrackPlayer({
  name,
  artist,
  previewUrl,
  className,
}: {
  name: string | null | undefined;
  artist: string | null | undefined;
  previewUrl: string | null | undefined;
  className?: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  if (!name || !previewUrl) return null;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      void a.play();
      setPlaying(true);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5",
        className
      )}
    >
      <button
        onClick={toggle}
        aria-label={playing ? "Pausar tema" : "Reproducir tema"}
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--accent-ink)] shadow transition-transform active:scale-90"
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        {artist && <p className="truncate text-xs text-[var(--muted)]">{artist}</p>}
      </div>
      <Music4 className="size-4 shrink-0 text-[var(--muted)]" />
      <audio
        ref={audioRef}
        src={previewUrl}
        preload="none"
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
      />
    </div>
  );
}