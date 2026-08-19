"use client";

import { useMemo, useState } from "react";
import { BookOpenText, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { GLOSARIO_ITEMS, type GlosarioItem } from "@/lib/glosario-data";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Todos", "Entrenamiento", "Músculos", "Nutrición", "Equipamiento"] as const;
const CATEGORY_COLORS: Record<string, string> = {
  Entrenamiento: "bg-[var(--accent-soft)] text-[var(--accent)]",
  Músculos: "bg-[#7c8cff]/15 text-[#7c8cff]",
  Nutrición: "bg-[#22c55e]/15 text-[#22c55e]",
  Equipamiento: "bg-[#f59e0b]/15 text-[#f59e0b]",
};

export default function GlosarioPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("Todos");

  const items = useMemo(() => {
    const query = q.trim().toLowerCase();
    return GLOSARIO_ITEMS.filter((it) => {
      if (cat !== "Todos" && it.category !== cat) return false;
      if (!query) return true;
      return (
        it.term.toLowerCase().includes(query) ||
        it.definition.toLowerCase().includes(query) ||
        (it.example ?? "").toLowerCase().includes(query)
      );
    });
  }, [q, cat]);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col items-center gap-1.5 pb-1 text-center">
        <span className="flex size-10 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
          <BookOpenText className="size-5" />
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Diccionario de términos
        </h1>
        <p className="text-xs text-[var(--text-2)]">
          {GLOSARIO_ITEMS.length} términos de entrenamiento, músculos y nutrición explicados simple
        </p>
      </header>

      <div className="relative w-full">
        <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar término…"
          className="h-11 rounded-2xl pl-10 text-sm shadow-sm"
        />
      </div>

      <div className="flex w-full flex-wrap items-center justify-center gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-all",
              cat === c
                ? "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] shadow-[0_2px_8px_-2px_var(--accent-soft)]"
                : "border-[var(--border)] bg-[var(--surface-2)]/60 text-[var(--text-2)] hover:border-[var(--accent)]/40 hover:text-[var(--text)]"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-[var(--text-2)]">
            No se encontraron términos
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">Probá con otra búsqueda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((it) => (
            <GlosarioCard key={it.term} item={it} />
          ))}
        </div>
      )}
    </div>
  );
}

function GlosarioCard({ item }: { item: GlosarioItem }) {
  return (
    <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface-2)]/50 p-4 transition-colors hover:border-[var(--accent)]/30">
      <div className="flex items-start justify-between gap-3">
        <h2 className="min-w-0 font-display text-[15px] font-bold tracking-tight">
          {item.term}
        </h2>
        <span
          className={cn(
            "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold",
            CATEGORY_COLORS[item.category] ?? "bg-[var(--surface-2)] text-[var(--muted)]"
          )}
        >
          {item.category}
        </span>
      </div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-2)]">
        {item.definition}
      </p>
      {item.example && (
        <p className="mt-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--muted)]">
          <span className="font-bold text-[var(--accent)]">Ejemplo: </span>
          {item.example}
        </p>
      )}
    </article>
  );
}