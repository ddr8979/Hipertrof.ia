"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Minus, Plus, Play, Square } from "lucide-react";
import { useWorkoutStore } from "@/lib/workout-store";
import { Button } from "@/components/ui/button";
import { cn, formatDuration } from "@/lib/utils";

let alarmCtx: AudioContext | null = null;
let alarmTimer: ReturnType<typeof setInterval> | null = null;
let alarmCycleCount = 0;
const MAX_ALARM_CYCLES = 3; // ~10 segundos

function startAlarmLoop() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!alarmCtx) alarmCtx = new Ctx();
    if (alarmCtx.state === "suspended") void alarmCtx.resume();
    if (alarmTimer) return;
    alarmCycleCount = 0;
    const beep = () => {
      if (!alarmCtx) return;
      [0, 0.35, 0.7].forEach((at, i) => {
        const osc = alarmCtx!.createOscillator();
        const gain = alarmCtx!.createGain();
        osc.type = "sine";
        osc.frequency.value = i === 2 ? 1174.66 : 880;
        gain.gain.setValueAtTime(0.0001, alarmCtx!.currentTime + at);
        gain.gain.exponentialRampToValueAtTime(0.35, alarmCtx!.currentTime + at + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, alarmCtx!.currentTime + at + 0.18);
        osc.connect(gain);
        gain.connect(alarmCtx!.destination);
        osc.start(alarmCtx!.currentTime + at);
        osc.stop(alarmCtx!.currentTime + at + 0.2);
      });
      alarmCycleCount++;
      if (alarmCycleCount >= MAX_ALARM_CYCLES) {
        stopAlarmLoop();
      }
    };
    beep();
    alarmTimer = setInterval(beep, 3500);
  } catch {
    /* audio no disponible */
  }
}

function stopAlarmLoop() {
  if (alarmTimer) {
    clearInterval(alarmTimer);
    alarmTimer = null;
  }
  if (alarmCtx) {
    void alarmCtx.close().catch(() => {});
    alarmCtx = null;
  }
  alarmCycleCount = 0;
}

export function RestTimer() {
  const pathname = usePathname();
  const router = useRouter();
  const restEndsAt = useWorkoutStore((s) => s.restEndsAt);
  const restTotal = useWorkoutStore((s) => s.restTotal);
  const restExerciseKey = useWorkoutStore((s) => s.restExerciseKey);
  const draft = useWorkoutStore((s) => s.draft);
  const adjustRest = useWorkoutStore((s) => s.adjustRest);
  const stopRest = useWorkoutStore((s) => s.stopRest);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (restEndsAt === null) return;
    let raf = 0;
    let last = 0;
    const tick = (t: number) => {
      if (t - last >= 250) {
        last = t;
        setNow(Date.now());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [restEndsAt]);

  const done = restEndsAt !== null && now >= restEndsAt;

  useEffect(() => {
    if (done && restEndsAt !== null) {
      // Ignorar rests ya expirados al montar (ej. recarga con restEndsAt viejo)
      if (restEndsAt <= Date.now()) {
        stopRest();
        return;
      }
      startAlarmLoop();
      navigator.vibrate?.([400, 150, 400, 150, 400]);
    } else {
      stopAlarmLoop();
    }
  }, [done, restEndsAt]);

  useEffect(
    () => () => {
      stopAlarmLoop();
    },
    []
  );

  useEffect(() => {
    if (restEndsAt === null) return;
    let wl: { release: () => Promise<void> } | null = null;
    let active = true;
    void (async () => {
      try {
        const lock = await (
          navigator as unknown as {
            wakeLock: {
              request: (t: string) => Promise<{ release: () => Promise<void> }>;
            };
          }
        ).wakeLock.request("screen");
        if (active) wl = lock;
      } catch {
        /* sin wake lock */
      }
    })();
    return () => {
      active = false;
      void wl?.release().catch(() => {});
    };
  }, [restEndsAt]);

  if (restEndsAt === null) return null;

  const remainingMs = Math.max(0, restEndsAt - now);
  const remaining = Math.ceil(remainingMs / 1000);
  const total = Math.max(1, restTotal ?? 90);
  const pct = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const exerciseName = draft?.exercises.find((e) => e.key === restExerciseKey)?.name;
  const inSession = pathname?.startsWith("/entrenar") ?? false;

  // Solo renderizar la barra completa en /entrenar; en otras rutas no mostrar UI (alarma sigue sonando)
  if (!inSession) return null;

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--surface)]/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur animate-[slide-up_0.25s_cubic-bezier(0.16,1,0.3,1)_both]",
        done && "animate-[rest-done_0.8s_ease-in-out_2]"
      )}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              done ? "bg-[var(--accent)]" : "bg-[var(--accent)]"
            )}
            style={{ width: `${done ? 100 : pct}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "text-xs font-semibold uppercase tracking-wider",
                done ? "text-[var(--accent)]" : "text-[var(--muted)]"
              )}
            >
              {done ? "Descanso terminado" : "Descanso"}
            </p>
            <p className="truncate text-sm font-semibold text-[var(--text-2)]">
              {done
                ? "El sonido se corta al presionar DETENER"
                : exerciseName
                  ? `Tras ${exerciseName}`
                  : "Descansá entre series"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!done && (
              <button
                onClick={() => adjustRest(-15)}
                aria-label="Quitar 15 segundos"
                className="flex size-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Minus className="size-4" />
              </button>
            )}
            <span
              className={cn(
                "min-w-24 text-center font-display text-3xl font-bold tabular-nums tracking-tight",
                done && "text-[var(--accent)]"
              )}
            >
              {done ? "¡Listo!" : formatDuration(remaining)}
            </span>
            {!done && (
              <button
                onClick={() => adjustRest(15)}
                aria-label="Agregar 15 segundos"
                className="flex size-9 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                <Plus className="size-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {done && !inSession && draft && (
              <Button variant="accent" size="sm" onClick={() => router.push("/entrenar")}>
                <Play className="size-4" /> Continuar entrenando
              </Button>
            )}
            {done && inSession && (
              <Button variant="accent" size="sm" onClick={stopRest}>
                <Play className="size-4" /> Comenzar serie
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={stopRest}
            >
              <Square className="size-4" /> Silenciar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}