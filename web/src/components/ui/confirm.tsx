// Diálogo reutilizable de confirmación para acciones destructivas.
"use client";

import { Info as AlertCircle, Trash as Trash2 } from "@phosphor-icons/react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Eliminar",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  busy?: boolean;
}) {
  if (!open) return null;
  return (
    <Dialog open onClose={onClose} title={title}>
      <div className="flex flex-col gap-3">
        <AlertCircle className="mx-auto size-10 text-[var(--danger)]" />
        <p className="text-center text-sm text-[var(--text-2)]">{message}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} className="flex-1" disabled={busy}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirm} className="flex-1" loading={busy}>
            <Trash2 className="size-4" /> {confirmLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
