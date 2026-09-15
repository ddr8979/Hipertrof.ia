"use client";

/**
 * trainer-invite-dialog.tsx
 * Modal para que un entrenador genere un link/código de invitación para sus
 * alumnos, con QR (api.qrserver.com), copiado al portapapeles y Web Share.
 */

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, QrCode, RefreshCw, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

/** Construye la URL del QR apuntando al generador externo. */
function qrSrc(link: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data=${encodeURIComponent(link)}`;
}

// Base pública de la app usada para armar el link de invitación.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hypertrofia.vercel.app";

/** Diálogo de generación y compartición de invitaciones de entrenador. */
export function TrainerInviteDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Crea una nueva invitación en el backend y guarda el código devuelto.
  const generate = useCallback(async () => {
    setLoading(true);
    setCode(null);
    setCopied(false);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("create_trainer_invite", {
        p_note: null,
        p_expires_days: 30,
        p_max_uses: null,
      });
      if (error) throw new Error(error.message);
      const row = (Array.isArray(data) ? data[0] : data) as { code?: string } | null;
      if (!row?.code) throw new Error("No se generó el código");
      setCode(row.code);
    } catch (e) {
      toast("error", "No se pudo generar el link", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Al abrir el diálogo genera una invitación; al cerrarlo limpia el estado.
  useEffect(() => {
    if (!open) {
      setCode(null);
      setLink("");
      setCopied(false);
      return;
    }
    void generate();
  }, [open, generate]);

  // Arma el link definitivo una vez que hay código.
  useEffect(() => {
    if (code) setLink(`${APP_URL}/entrenadores?invite=${code}`);
  }, [code]);

  /** Copia el link al portapapeles y muestra feedback temporal. */
  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("error", "No se pudo copiar", "Copiá el código manualmente");
    }
  }

  /** Comparte el link vía Web Share API o, si no está disponible, lo copia. */
  async function shareLink() {
    if (!link) return;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Invitación de entrenamiento",
          text: `Sumate como mi alumno en Hypertrof.ia. Código: ${code}`,
          url: link,
        });
        return;
      } catch {
        return;
      }
    }
    void copyLink();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Invitar alumno">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--text-2)]">
          Compartí este link o mostrá el QR. Tu alumno lo abre, inicia sesión y
          acepta la invitación para quedar vinculado.
        </p>

        {loading ? (
          <div className="flex flex-col items-center gap-3 py-10 text-[var(--muted)]">
            <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <p className="text-sm">Generando invitación…</p>
          </div>
        ) : code ? (
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrSrc(link)}
                alt="QR de invitación"
                width={240}
                height={240}
                className="size-60"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Código
              </span>
              <span className="font-display text-2xl font-bold tracking-[0.3em]">
                {code}
              </span>
            </div>
            <div className="w-full break-all rounded-xl bg-[var(--surface-2)] px-3 py-2 text-center text-xs text-[var(--muted)]">
              {link}
            </div>
            <div className="flex w-full gap-2">
              <Button variant="accent" className="flex-1" onClick={shareLink}>
                <Share2 className="size-4" /> Compartir
              </Button>
              <Button variant="outline" className="flex-1" onClick={copyLink}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
            <p className="text-center text-xs text-[var(--muted)]">
              Válido 30 días · podés generar uno nuevo cuando quieras
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <QrCode className="size-8 text-[var(--muted)]" />
            <p className="text-sm text-[var(--muted)]">
              No se pudo generar la invitación.
            </p>
            <Button variant="outline" onClick={() => void generate()}>
              <RefreshCw className="size-4" /> Reintentar
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}