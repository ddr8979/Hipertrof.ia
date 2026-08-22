"use client";

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { startOfDay, endOfDay, format, addDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  Utensils,
  Plus,
  Search,
  Trash2,
  Flame,
  Beef,
  Wheat,
  Droplet,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  BookOpen,
  BookOpenText,
  ImagePlus,
  Pencil,
  Share2,
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { cn } from "@/lib/utils";

type Recipe = {
  id: string;
  name: string;
  description: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  category: string | null;
  prep_minutes: number | null;
  tags: string | null;
  diet_types: string | null;
  user_id: string | null;
  steps: string[] | null;
  step_titles: string[] | null;
  photos: string[] | null;
};

type MealLog = {
  id: string;
  recipe_id: string | null;
  name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  notes: string | null;
  eaten_at: string;
};

const MEAL_KEYS = ["Desayuno", "Almuerzo", "Merienda", "Cena", "Snack"] as const;

const RESTRICTION_TAGS: Record<string, string[]> = {
  gluten: ["gluten"],
  lactosa: ["queso", "leche", "yogur", "crema", "manteca"],
  huevo: ["huevo"],
  mani: ["mani"],
  frutos_secos: ["frutos-secos", "nuez", "almendra", "mani"],
  mariscos: ["pescado", "salmon", "atun", "camarones", "pulpo", "calamar"],
  carne: ["carne", "lomo", "carne-molida", "chorizo", "panceta", "milanesa"],
  cerdo: ["cerdo", "chorizo", "panceta"],
};

type DailyEntry = {
  entry_date: string;
  closed_at: string | null;
  name: string | null;
};

const WEEKDAYS = [
  { id: 0, label: "Domingo" },
  { id: 1, label: "Lunes" },
  { id: 2, label: "Martes" },
  { id: 3, label: "Miércoles" },
  { id: 4, label: "Jueves" },
  { id: 5, label: "Viernes" },
  { id: 6, label: "Sábado" },
] as const;

function weekdayLabel(date: string): string {
  return WEEKDAYS[new Date(`${date}T12:00:00`).getDay()]?.label ?? "Día";
}

const MACRO_COLORS = {
  protein: "text-[#ef4444]",
  carbs: "text-[#eab308]",
  fats: "text-[#22c55e]",
} as const;

function MacroText({
  p,
  c,
  g,
  className,
}: {
  p?: number | null;
  c?: number | null;
  g?: number | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] font-bold leading-none tracking-wide",
        className
      )}
    >
      {p != null && (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", MACRO_COLORS.protein)}>
          <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
          <span className="opacity-90">Proteína</span>
          <span className="tabular-nums">{Math.round(p)}g</span>
        </span>
      )}
      {c != null && (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", MACRO_COLORS.carbs)}>
          <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
          <span className="opacity-90">Carbohidratos</span>
          <span className="tabular-nums">{Math.round(c)}g</span>
        </span>
      )}
      {g != null && (
        <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", MACRO_COLORS.fats)}>
          <span className="size-1.5 shrink-0 rounded-full bg-current opacity-80" aria-hidden />
          <span className="opacity-90">Grasas</span>
          <span className="tabular-nums">{Math.round(g)}g</span>
        </span>
      )}
    </span>
  );
}

function lastOccurrence(weekdayIndex: number, ref: Date) {
  const diff = (ref.getDay() - weekdayIndex + 7) % 7;
  return format(addDays(ref, -diff), "yyyy-MM-dd");
}

export default function NutricionPage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mealKey, setMealKey] = useState<(typeof MEAL_KEYS)[number]>("Almuerzo");
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [recipeCat, setRecipeCat] = useState("desayuno");
  const RECIPE_CATS = [
    { id: "desayuno", label: "Desayuno" },
    { id: "almuerzo", label: "Almuerzo" },
    { id: "cena", label: "Cena" },
    { id: "snack", label: "Snack" },
    { id: "postre", label: "Postre" },
  ] as const;
  const [day, setDay] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const dayDate = new Date(`${day}T12:00:00`);
  const [recipeFormOpen, setRecipeFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [addDayOpen, setAddDayOpen] = useState(false);
  const [viewCookbookRecipe, setViewCookbookRecipe] = useState<Recipe | null>(null);

  const { data: myRecipes } = useQuery({
    queryKey: ["my_recipes"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("recipes")
        .select("id, name, calories, protein_g, carbs_g, fats_g, category, steps, step_titles, photos, user_id")
        .eq("user_id", profile!.id)
        .order("created_at", { ascending: false });
      return (data ?? []) as Recipe[];
    },
  });

  const deleteRecipe = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("recipes").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_recipes"] });
      toast("success", "Receta eliminada");
    },
    onError: (e) => toast("error", "No se pudo eliminar", e.message),
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ["meal_logs", day],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("meal_logs")
        .select("id, recipe_id, name, calories, protein_g, carbs_g, fats_g, notes, eaten_at")
        .gte("eaten_at", `${day}T00:00:00`)
        .lte("eaten_at", `${day}T23:59:59`)
        .order("eaten_at", { ascending: true });
      return (data ?? []) as MealLog[];
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("recipes")
        .select("id, name, description, calories, protein_g, carbs_g, fats_g, category, prep_minutes, tags, diet_types")
        .order("name")
        .limit(500);
      return (data ?? []) as Recipe[];
    },
  });

  const { data: trainerRecipes } = useQuery({
    queryKey: ["assigned_recipes"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as {
        id: string;
        recipe: Recipe | null;
        trainer: { display_name: string | null } | null;
      }[];
      const { data } = await supabase
        .from("assigned_recipes")
        .select("id, recipe:recipes(id, name, calories, protein_g, carbs_g, fats_g, category, steps, step_titles, photos), trainer:profiles!assigned_recipes_trainer_id_fkey(display_name)")
        .eq("athlete_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as {
        id: string;
        recipe: Recipe | null;
        trainer: { display_name: string | null } | null;
      }[];
    },
  });

  const { data: dailyEntries } = useQuery({
    queryKey: ["daily_entries"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("daily_entries")
        .select("entry_date, closed_at, name")
        .order("entry_date", { ascending: false })
        .limit(30);
      return (data ?? []) as DailyEntry[];
    },
  });

  const { data: weekLogs } = useQuery({
    queryKey: ["meal_logs", "week"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("meal_logs")
        .select("id, calories, protein_g, eaten_at")
        .gte("eaten_at", format(addDays(new Date(), -30), "yyyy-MM-dd"))
        .order("eaten_at", { ascending: true });
      return (data ?? []) as { id: string; calories: number; protein_g: number; eaten_at: string }[];
    },
  });

  const logsByDate = useMemo(() => {
    const map = new Map<string, { calories: number; protein: number }>();
    for (const l of weekLogs ?? []) {
      const d = format(new Date(l.eaten_at), "yyyy-MM-dd");
      const cur = map.get(d) ?? { calories: 0, protein: 0 };
      cur.calories += l.calories;
      cur.protein += l.protein_g;
      map.set(d, cur);
    }
    return map;
  }, [weekLogs]);

  const addDay = useMutation({
    mutationFn: async ({ weekday, date }: { weekday: string; date: string }) => {
      const supabase = createClient();
      const { error } = await supabase.from("daily_entries").upsert(
        {
          user_id: profile!.id,
          entry_date: date,
          name: weekday,
        },
        { onConflict: "user_id,entry_date" }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_entries"] });
      setDay(vars.date);
      setAddDayOpen(false);
      toast("success", `${vars.weekday} agregado al diario`);
    },
    onError: (e) => toast("error", "No se pudo agregar el día", e.message),
  });

  const deleteDay = useMutation({
    mutationFn: async (date: string) => {
      const supabase = createClient();
      const { error: e1 } = await supabase
        .from("meal_logs")
        .delete()
        .eq("user_id", profile!.id)
        .gte("eaten_at", `${date}T00:00:00`)
        .lt("eaten_at", `${date}T23:59:59.999`);
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase.from("daily_entries").delete().eq("user_id", profile!.id).eq("entry_date", date);
      if (e2) throw new Error(e2.message);
    },
    onSuccess: (_d, date) => {
      qc.invalidateQueries({ queryKey: ["daily_entries"] });
      qc.invalidateQueries({ queryKey: ["meal_logs"] });
      if (day === date) setDay(todayStr);
      toast("success", "Día eliminado");
    },
    onError: (e) => toast("error", "No se pudo borrar el día", e.message),
  });

  const { data: pastLogs } = useQuery({
    queryKey: ["meal_logs", "past"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("meal_logs")
        .select("id, recipe_id, name, calories, protein_g, carbs_g, fats_g, notes, eaten_at")
        .gte("eaten_at", format(new Date(Date.now() - 14 * 86400000), "yyyy-MM-dd"))
        .lt("eaten_at", startOfDay(new Date()).toISOString())
        .order("eaten_at", { ascending: true });
      return (data ?? []) as MealLog[];
    },
  });

  const closeDay = useMutation({
    mutationFn: async ({ date, close }: { date: string; close: boolean }) => {
      const supabase = createClient();
      const { error } = await supabase.from("daily_entries").upsert(
        {
          user_id: profile!.id,
          entry_date: date,
          closed_at: close ? new Date().toISOString() : null,
        },
        { onConflict: "user_id,entry_date" }
      );
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["daily_entries"] });
      toast("success", vars.close ? "Día culminado" : "Día reabierto");
    },
    onError: (e) => toast("error", "No se pudo actualizar el día", e.message),
  });

  const addMeal = useMutation({
    mutationFn: async (m: {
      recipe_id?: string | null;
      name: string;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fats_g: number;
    }) => {
      const supabase = createClient();
      const { error } = await supabase.from("meal_logs").insert({
        user_id: profile!.id,
        recipe_id: m.recipe_id ?? null,
        name: m.name,
        calories: m.calories,
        protein_g: m.protein_g,
        carbs_g: m.carbs_g,
        fats_g: m.fats_g,
        notes: mealKey,
        eaten_at: `${day}T12:00:00`,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal_logs"] });
      toast("success", "Comida agregada");
    },
    onError: (e) => toast("error", "No se pudo agregar", e.message),
  });

  const removeMeal = useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("meal_logs").delete().eq("id", id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meal_logs"] });
      toast("success", "Comida eliminada");
    },
    onError: (e) => toast("error", "No se pudo eliminar", e.message),
  });

  const totals = useMemo(
    () =>
      (logs ?? []).reduce<{ kcal: number; protein: number; carbs: number; fats: number }>(
        (a, m) => ({
          kcal: a.kcal + m.calories,
          protein: a.protein + m.protein_g,
          carbs: a.carbs + m.carbs_g,
          fats: a.fats + m.fats_g,
        }),
        { kcal: 0, protein: 0, carbs: 0, fats: 0 }
      ),
    [logs]
  );

  const targets = useMemo(() => {
    const tdee = profile?.tdee_kcal ?? 2500;
    const goalAdj =
      profile?.diet_goal === "volumen" ? 300 : profile?.diet_goal === "definicion" ? -500 : 0;
    const kcal = Math.max(1200, tdee + goalAdj);
    const weight = Number(profile?.weight_kg ?? 75);
    const protein = Math.round(weight * 2);
    const fats = Math.round(weight * 0.9);
    const carbs = Math.max(0, Math.round((kcal - protein * 4 - fats * 9) / 4));
    return { kcal, protein, fats, carbs };
  }, [profile]);

  const restrictions = useMemo(() => {
    const raw = profile?.food_restrictions;
    return Array.isArray(raw) ? raw.map(String) : [];
  }, [profile?.food_restrictions]);

  const dietType = String(profile?.diet_type ?? "omnivoro");

  const allowed = useMemo(() => {
    return (recipes ?? []).filter((r) => {
      const diets = (r.diet_types ?? "").split(",").map((x) => x.trim());
      if (dietType !== "omnivoro" && !diets.includes(dietType)) return false;
      const tags = (r.tags ?? "").split(",").map((x) => x.trim());
      for (const res of restrictions) {
        const hits = RESTRICTION_TAGS[res] ?? [];
        if (hits.some((t) => tags.includes(t))) return false;
      }
      return true;
    });
  }, [recipes, dietType, restrictions]);

  const suggestions = useMemo(() => {
    const prefs = profile?.food_preferences;
    const prefTags = Array.isArray(prefs) ? prefs.map(String) : [];
    const todayIds = new Set((logs ?? []).map((l) => l.recipe_id).filter(Boolean));
    return allowed
      .filter((r) => !todayIds.has(r.id))
      .map((r) => {
        const tags = (r.tags ?? "").split(",").map((x) => x.trim());
        const score = prefTags.length ? tags.filter((t) => prefTags.includes(t)).length : 0;
        return { r, score };
      })
      .filter((x) => prefTags.length ? x.score > 0 : true)
      .sort((a, b) => (prefTags.length ? b.score - a.score : b.r.protein_g - a.r.protein_g))
      .slice(0, 4)
      .map((x) => x.r);
  }, [allowed, profile?.food_preferences, logs]);

  const cookbook = useMemo(() => {
    const cat = recipeCat;
    return allowed
      .filter((r) => r.category === cat)
      .sort((a, b) => b.protein_g - a.protein_g);
  }, [allowed, recipeCat]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return allowed
      .filter(
        (r) =>
          !q ||
          r.name.toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q)
      )
      .slice(0, 24);
  }, [allowed, search]);

  const byMeal = useMemo(() => {
    const map = new Map<string, MealLog[]>();
    for (const l of logs ?? []) {
      const k = l.notes ?? "Snack";
      map.set(k, [...(map.get(k) ?? []), l]);
    }
    return map;
  }, [logs]);

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const closedToday =
    dailyEntries?.some((e) => e.entry_date === day && e.closed_at) ?? false;
  const currentDay = (dailyEntries ?? []).find((e) => e.entry_date === day);

  const pastByDate = useMemo(() => {
    const map = new Map<string, MealLog[]>();
    for (const l of pastLogs ?? []) {
      const d = format(new Date(l.eaten_at), "yyyy-MM-dd");
      map.set(d, [...(map.get(d) ?? []), l]);
    }
    return map;
  }, [pastLogs]);

  const entryDates = useMemo(() => {
    const closed = new Set(
      (dailyEntries ?? [])
        .filter((e) => e.closed_at)
        .map((e) => e.entry_date)
    );
    return [...closed].filter(
      (d) => pastByDate.has(d) || (d === todayStr && (logs ?? []).length > 0)
    );
  }, [dailyEntries, pastByDate, todayStr, logs]);

  function progress(consumed: number, target: number) {
    return Math.min(100, Math.round((consumed / target) * 100));
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const rest = targets.kcal - totals.kcal;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Nutrición</h1>
          <div className="mt-1 flex items-center gap-1">
            <button
              onClick={() => setDay(format(addDays(dayDate, -1), "yyyy-MM-dd"))}
              className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              aria-label="Día anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="min-w-40 text-center text-sm font-semibold text-[var(--text-2)]">
              {currentDay?.name ?? weekdayLabel(day)}
              {day === todayStr ? " · Hoy" : ""}
              {currentDay?.closed_at && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs text-[var(--accent)]">
                  <Check className="size-3" /> culminado
                </span>
              )}
            </p>
            <button
              onClick={() =>
                day < todayStr && setDay(format(addDays(dayDate, 1), "yyyy-MM-dd"))
              }
              disabled={day >= todayStr}
              className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30"
              aria-label="Día siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddDayOpen(true)}>
            <Plus className="size-4" /> Agregar día
          </Button>
          <Button variant="accent" onClick={() => setPickerOpen(true)}>
            <Plus className="size-4" /> Agregar comida
          </Button>
        </div>
      </div>

      {/* Días del diario */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display font-bold tracking-tight">Mi semana</h2>
          <button
            onClick={() => setAddDayOpen(true)}
            className="text-xs font-bold text-[var(--accent)] hover:underline"
          >
            + Agregar día
          </button>
        </div>
        {(dailyEntries ?? []).length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Empezá tu diario: agregá un día de la semana y registrá tus comidas.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(dailyEntries ?? []).map((e) => {
              const sums = logsByDate.get(e.entry_date);
              const isSel = e.entry_date === day;
              return (
                <div
                  key={e.entry_date}
                  onClick={() => setDay(e.entry_date)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(ev) => ev.key === "Enter" && setDay(e.entry_date)}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors",
                    isSel
                      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                      : "bg-[var(--surface-2)]/60 hover:bg-[var(--surface-2)]"
                  )}
                >
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-bold", isSel && "text-[var(--accent-ink)]")}>
                      {e.name ?? weekdayLabel(e.entry_date)}
                    </p>
                    <p className={cn("text-xs", isSel ? "text-[var(--accent-ink)]/70" : "text-[var(--muted)]")}>
                      {e.closed_at ? "culminado" : sums ? `${sums.calories ?? 0} kcal` : "sin comidas"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-right">
                      <p className={cn("font-display text-sm font-bold", isSel && "text-[var(--accent-ink)]")}>
                        {sums?.calories ?? 0} kcal
                      </p>
                      {sums?.protein ? (
                        <MacroText p={sums.protein} className={cn(isSel && "!text-[var(--accent-ink)]/80")} />
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deleteDay.mutate(e.entry_date);
                      }}
                      disabled={deleteDay.isPending}
                      aria-label={`Borrar ${e.name ?? weekdayLabel(e.entry_date)}`}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors",
                        isSel
                          ? "text-[var(--accent-ink)]/60 hover:bg-black/10 hover:text-[var(--accent-ink)]"
                          : "text-[var(--muted)] hover:bg-[var(--danger)]/10 hover:text-[var(--danger)]"
                      )}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Agregar día */}
      <Dialog
        open={addDayOpen}
        onClose={() => setAddDayOpen(false)}
        title="Agregar día al diario"
        footer={
          <div className="flex w-full justify-end">
            <Button variant="ghost" onClick={() => setAddDayOpen(false)}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[var(--text-2)]">
            Elegí un día de la semana y registrá todas sus comidas.
          </p>
          {WEEKDAYS.map((w) => {
            const date = lastOccurrence(w.id, new Date());
            const used = (dailyEntries ?? []).some((e) => e.entry_date === date);
            return (
              <button
                key={w.id}
                onClick={() => addDay.mutate({ weekday: w.label, date })}
                disabled={addDay.isPending}
                className="flex items-center justify-between rounded-xl bg-[var(--surface-2)]/60 px-4 py-3 text-left transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                <span className="text-sm font-bold">{w.label}</span>
                <span className="text-xs text-[var(--muted)]">{used ? "ya está en el diario" : "agregar al diario"}</span>
              </button>
            );
          })}
        </div>
      </Dialog>

      {/* Calorías del día */}
      <div className="card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="size-5 text-[var(--accent)]" />
            <span className="font-display text-2xl font-bold tabular-nums">
              {totals.kcal}
              <span className="text-sm font-semibold text-[var(--text-2)]">
                {" "}
                / {targets.kcal} kcal
              </span>
            </span>
          </div>
          <span className="text-xs font-semibold text-[var(--muted)]">
            {rest > 0 ? `${rest} kcal restantes` : `+${Math.abs(rest)} kcal`}
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${progress(totals.kcal, targets.kcal)}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            {
              icon: Beef,
              label: "Proteína",
              value: totals.protein,
              target: targets.protein,
              color: "text-[#ef4444]",
              bar: "bg-[#ef4444]",
            },
            {
              icon: Wheat,
              label: "Carbohidratos",
              value: totals.carbs,
              target: targets.carbs,
              color: "text-[#eab308]",
              bar: "bg-[#eab308]",
            },
            {
              icon: Droplet,
              label: "Grasas",
              value: totals.fats,
              target: targets.fats,
              color: "text-[#22c55e]",
              bar: "bg-[#22c55e]",
            },
          ].map((m) => (
            <div
              key={m.label}
              className="flex flex-col items-center rounded-xl bg-[var(--surface-2)] p-3 text-center min-w-0"
            >
              <div className="flex w-full items-center justify-center gap-1.5 text-[10px] font-semibold uppercase leading-tight tracking-wide">
                <m.icon className={cn("size-3.5 shrink-0", m.color)} />
                <span className={cn("leading-tight truncate", m.color)}>{m.label}</span>
              </div>
              <p className="mt-1.5 font-display text-lg font-bold tabular-nums truncate">
                {m.value}
                <span className="text-xs text-[var(--text-2)]"> / {m.target} g</span>
              </p>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                <div
                  className={cn("h-full rounded-full", m.bar)}
                  style={{ width: `${progress(m.value, m.target)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col items-stretch gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-2)]">
            {closedToday
              ? "Día culminado: quedó guardado en tu historial"
              : "Al culminar el día, el resumen queda en tu historial"}
          </p>
          <Button
            variant={closedToday ? "outline" : "accent"}
            size="sm"
            onClick={() =>
              closeDay.mutate({ date: day, close: !closedToday })
            }
            disabled={closeDay.isPending}
            className="shrink-0 whitespace-nowrap"
          >
            <Check className="size-4" />
            {closedToday ? "Reabrir día" : "Culminar día"}
          </Button>
        </div>
      </div>

      {/* Diario por comida */}
      {(logs ?? []).length === 0 ? (
        <EmptyState
          icon={<Utensils className="size-6" />}
          title={
            day === todayStr
              ? "Hoy no registraste comidas"
              : format(dayDate, "EEEE d 'de' MMMM") + " sin comidas"
          }
          description={
            day === todayStr
              ? "Agregá tus comidas del día y seguí calorías y macros."
              : "Podés completar ese día retrocediendo en el diario."
          }
          action={
            <Button variant="accent" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" /> Agregar comida
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          {MEAL_KEYS.filter((k) => byMeal.has(k)).map((k) => {
            const meals = byMeal.get(k)!;
            const kcal = meals.reduce((a, m) => a + m.calories, 0);
            return (
              <section key={k} className="card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display font-bold tracking-tight">{k}</h2>
                  <span className="text-xs font-semibold text-[var(--muted)]">{kcal} kcal</span>
                </div>
                <div className="flex flex-col gap-2">
                  {meals.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{m.name}</p>
                        <MacroText p={m.protein_g} c={m.carbs_g} g={m.fats_g} />
                      </div>
                      <span className="text-sm font-bold tabular-nums">{m.calories} kcal</span>
                      <button
                        onClick={() => removeMeal.mutate(m.id)}
                        className="text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Sugerencias según preferencias */}
      {suggestions.length > 0 && (
        <section className="card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-4 text-[var(--accent)]" />
            <h2 className="font-display font-bold tracking-tight">
              Sugerencias para vos
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {Array.isArray(profile?.food_preferences) &&
              (profile?.food_preferences as unknown[]).length
                ? "según tus gustos"
                : "las más proteicas"}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {suggestions.map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  addMeal.mutate({
                    recipe_id: r.id,
                    name: r.name,
                    calories: r.calories,
                    protein_g: r.protein_g,
                    carbs_g: r.carbs_g,
                    fats_g: r.fats_g,
                  })
                }
                className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <MacroText p={r.protein_g} c={r.carbs_g} g={r.fats_g} />
                </div>
                <Plus className="size-4 shrink-0 text-[var(--accent)]" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Mis recetas */}
      <section className="card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-[var(--accent)]" />
            <h2 className="font-display font-bold tracking-tight">Mis recetas</h2>
          </div>
          <Button
            variant="accent"
            size="sm"
            onClick={() => {
              setEditingRecipe(null);
              setRecipeFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Nueva receta
          </Button>
        </div>
        {!myRecipes || myRecipes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Creá tus recetas con pasos y fotos. Después podés compartirlas en Social.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {myRecipes.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
              >
                {r.photos?.find(Boolean) ? (
                  <img
                    src={r.photos.find(Boolean)!}
                    alt=""
                    className="size-11 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)]">
                    <Utensils className="size-4 text-[var(--muted)]" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.calories} kcal · P {r.protein_g} g
                    {r.steps?.length ? ` · ${r.steps.length} pasos` : ""}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingRecipe(r);
                    setRecipeFormOpen(true);
                  }}
                  aria-label="Editar receta"
                  className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  <Pencil className="size-4" />
                </button>
                <Link
                  href="/social"
                  aria-label="Compartir receta"
                  className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--accent)]"
                >
                  <Share2 className="size-4" />
                </Link>
                <button
                  onClick={() => deleteRecipe.mutate(r.id)}
                  aria-label="Eliminar receta"
                  className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recetario */}
      <section className="card p-4">
        <div className="mb-3 flex items-center gap-2">
          <BookOpenText className="size-4 text-[var(--accent)]" />
          <h2 className="font-display font-bold tracking-tight">Recetario</h2>
        </div>
        {(trainerRecipes ?? []).length > 0 && (
          <div className="mb-4 flex flex-col gap-2 rounded-xl bg-[var(--accent-soft)]/40 p-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
              Recetas de tu entrenador
            </p>
            {trainerRecipes?.map((t) =>
              t.recipe ? (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.recipe.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {t.recipe.calories} kcal · por {t.trainer?.display_name ?? "tu entrenador"}
                    </p>
                    <MacroText
                      p={t.recipe.protein_g}
                      c={t.recipe.carbs_g}
                      g={t.recipe.fats_g}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewCookbookRecipe(t.recipe!)}
                  >
                    Ver receta
                  </Button>
                  <button
                    onClick={() =>
                      addMeal.mutate({
                        recipe_id: t.recipe!.id,
                        name: t.recipe!.name,
                        calories: t.recipe!.calories,
                        protein_g: t.recipe!.protein_g,
                        carbs_g: t.recipe!.carbs_g,
                        fats_g: t.recipe!.fats_g,
                      })
                    }
                    aria-label={`Agregar ${t.recipe.name} a la comida`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] transition-transform active:scale-90"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}
        <div className="mb-3 flex flex-wrap gap-1.5">
          {RECIPE_CATS.map((k) => {
            const count = allowed.filter((r) => r.category === k.id).length;
            return (
              <button
                key={k.id}
                onClick={() => setRecipeCat(k.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  recipeCat === k.id
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                )}
              >
                {k.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    recipeCat === k.id
                      ? "bg-[var(--accent-ink)]/15"
                      : "bg-[var(--surface-3)]"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        {cookbook.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Sin recetas de {recipeCat} que puedas comer.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {cookbook.map((r) => (
              <div
                key={r.id}
                className="rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
              >
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {r.calories} kcal
                      {r.prep_minutes ? ` · ${r.prep_minutes} min` : ""}
                      {r.steps?.length ? ` · ${r.steps.length} pasos` : ""}
                    </p>
                    <MacroText p={r.protein_g} c={r.carbs_g} g={r.fats_g} />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewCookbookRecipe(r)}
                  >
                    Ver receta
                  </Button>
                  <button
                    onClick={() =>
                      addMeal.mutate({
                        recipe_id: r.id,
                        name: r.name,
                        calories: r.calories,
                        protein_g: r.protein_g,
                        carbs_g: r.carbs_g,
                        fats_g: r.fats_g,
                      })
                    }
                    aria-label={`Agregar ${r.name} a la comida`}
                    className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[var(--accent-ink)] transition-transform active:scale-90"
                  >
                    <Plus className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Ver receta del recetario */}
      <Dialog
        open={!!viewCookbookRecipe}
        onClose={() => setViewCookbookRecipe(null)}
        title={viewCookbookRecipe?.name ?? ""}
      >
        {viewCookbookRecipe && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-2)]">Macros</p>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">
                  {viewCookbookRecipe.calories} kcal
                </p>
                <MacroText
                  p={viewCookbookRecipe.protein_g}
                  c={viewCookbookRecipe.carbs_g}
                  g={viewCookbookRecipe.fats_g}
                />
              </div>
            </div>
            {viewCookbookRecipe.steps?.length ? (
              <ol className="flex flex-col gap-2">
                {viewCookbookRecipe.steps.map((s, i) => {
                  const photo = viewCookbookRecipe.photos?.[i];
                  return (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {viewCookbookRecipe.step_titles?.[i] && (
                          <p className="text-sm font-bold">
                            {viewCookbookRecipe.step_titles[i]}
                          </p>
                        )}
                        <span className="whitespace-pre-wrap text-[var(--text-2)]">{s}</span>
                        {photo && (
                          <img
                            src={photo}
                            alt=""
                            className="mt-2 max-h-44 w-full rounded-xl object-cover"
                          />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <p className="text-sm text-[var(--muted)]">
                Esta receta no tiene pasos documentados.
              </p>
            )}
            <Button
              variant="accent"
              onClick={() => {
                addMeal.mutate({
                  recipe_id: viewCookbookRecipe.id,
                  name: viewCookbookRecipe.name,
                  calories: viewCookbookRecipe.calories,
                  protein_g: viewCookbookRecipe.protein_g,
                  carbs_g: viewCookbookRecipe.carbs_g,
                  fats_g: viewCookbookRecipe.fats_g,
                });
                setViewCookbookRecipe(null);
              }}
            >
              <Plus className="size-4" /> Agregar a mi comida
            </Button>
          </div>
        )}
      </Dialog>

      {/* Historial de días culminados */}
      {entryDates.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="font-display text-lg font-bold tracking-tight">
            Historial de días
          </h2>
          {entryDates.map((d) => {
            const meals = pastByDate.get(d) ?? (d === todayStr ? (logs ?? []) : []);
            const kcal = meals.reduce((a, m) => a + m.calories, 0);
            const protein = meals.reduce((a, m) => a + m.protein_g, 0);
            const open = expandedDay === d;
            return (
              <div key={d} className="card p-4">
                <button
                  onClick={() => setExpandedDay(open ? null : d)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="font-display font-bold tracking-tight">
                      {format(new Date(`${d}T12:00:00`), "EEEE d 'de' MMMM")}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {meals.length} comidas
                    </p>
                    <MacroText p={protein} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg font-bold tabular-nums">
                      {kcal} kcal
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-[var(--muted)] transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </div>
                </button>
                {open && (
                  <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3">
                    {meals.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{m.name}</p>
                          <p className="text-xs text-[var(--muted)]">{m.notes ?? "Snack"}</p>
                          <MacroText p={m.protein_g} c={m.carbs_g} g={m.fats_g} />
                        </div>
                        <span className="text-sm font-bold tabular-nums">
                          {m.calories} kcal
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}

      {/* Picker de recetas */}
      <Dialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Agregar comida"
        footer={
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {MEAL_KEYS.map((k) => (
                <button
                  key={k}
                  onClick={() => setMealKey(k)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    mealKey === k
                      ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                      : "text-[var(--text-2)] hover:bg-[var(--surface-2)]"
                  )}
                >
                  {k}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => setPickerOpen(false)}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar receta o categoría..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
            {filtered.map((r) => (
              <button
                key={r.id}
                onClick={() =>
                  addMeal.mutate({
                    recipe_id: r.id,
                    name: r.name,
                    calories: r.calories,
                    protein_g: r.protein_g,
                    carbs_g: r.carbs_g,
                    fats_g: r.fats_g,
                  })
                }
                className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {r.calories} kcal{r.category ? ` · ${r.category}` : ""}
                  </p>
                  <MacroText p={r.protein_g} c={r.carbs_g} g={r.fats_g} />
                </div>
                <Plus className="size-4 shrink-0 text-[var(--accent)]" />
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--muted)]">
                Sin resultados para «{search}»
              </p>
            )}
          </div>
        </div>
      </Dialog>

      {/* Agregado manual */}
      <Dialog
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Comida manual"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => setManualOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="accent"
              form="manual-meal-form"
              type="submit"
              disabled={addMeal.isPending}
            >
              Agregar
            </Button>
          </div>
        }
      >
        <ManualMealForm
          onSave={(m) => addMeal.mutate(m, { onSuccess: () => setManualOpen(false) })}
        />
      </Dialog>

      {/* Form de receta propia */}
      <MyRecipeForm
        open={recipeFormOpen}
        onClose={() => setRecipeFormOpen(false)}
        editing={editingRecipe}
      />
    </div>
  );
}

function ManualMealForm({
  onSave,
}: {
  onSave: (m: {
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
  }) => void;
}) {
  const [name, setName] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fats, setFats] = useState("");

  return (
    <form
      id="manual-meal-form"
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          name: name.trim(),
          calories: Math.max(0, Number(kcal) || 0),
          protein_g: Math.max(0, Number(protein) || 0),
          carbs_g: Math.max(0, Number(carbs) || 0),
          fats_g: Math.max(0, Number(fats) || 0),
        });
      }}
    >
      <Field label="Nombre">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Pechuga con arroz"
          required
          autoFocus
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Calorías">
          <Input
            type="number"
            inputMode="numeric"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="450"
            required
          />
        </Field>
        <Field label="Proteína (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="35"
          />
        </Field>
        <Field label="Carbos (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="50"
          />
        </Field>
        <Field label="Grasas (g)">
          <Input
            type="number"
            inputMode="decimal"
            value={fats}
            onChange={(e) => setFats(e.target.value)}
            placeholder="12"
          />
        </Field>
      </div>
    </form>
  );
}

function MyRecipeForm({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Recipe | null;
}) {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const [name, setName] = useState(editing?.name ?? "");
  const [category, setCategory] = useState(editing?.category ?? "snack");
  const [calories, setCalories] = useState(editing ? String(editing.calories) : "");
  const [protein, setProtein] = useState(editing ? String(editing.protein_g) : "");
  const [carbs, setCarbs] = useState(editing ? String(editing.carbs_g) : "");
  const [fats, setFats] = useState(editing ? String(editing.fats_g) : "");
  const [steps, setSteps] = useState<{ title: string; text: string; photo: string | null }[]>(
    editing?.steps?.length
      ? editing.steps.map((s, i) => ({
          title: editing.step_titles?.[i] ?? "",
          text: s,
          photo: editing.photos?.[i] || null,
        }))
      : [{ title: "", text: "", photo: null }]
  );
  const [uploadingStep, setUploadingStep] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [prevEditing, setPrevEditing] = useState(editing);

  if (editing !== prevEditing) {
    setPrevEditing(editing);
    setName(editing?.name ?? "");
    setCategory(editing?.category ?? "snack");
    setCalories(editing ? String(editing.calories) : "");
    setProtein(editing ? String(editing.protein_g) : "");
    setCarbs(editing ? String(editing.carbs_g) : "");
    setFats(editing ? String(editing.fats_g) : "");
    setSteps(
      editing?.steps?.length
        ? editing.steps.map((s, i) => ({
            title: editing.step_titles?.[i] ?? "",
            text: s,
            photo: editing.photos?.[i] || null,
          }))
        : [{ title: "", text: "", photo: null }]
    );
  }

  const RECIPE_CATS = [
    { id: "desayuno", label: "Desayuno" },
    { id: "almuerzo", label: "Almuerzo" },
    { id: "cena", label: "Cena" },
    { id: "snack", label: "Snack" },
    { id: "postre", label: "Postre" },
  ];

  async function handleStepPhoto(i: number, file: File | null) {
    if (!file || !profile) return;
    setUploadingStep(i);
    try {
      const supabase = createClient();
      const path = `${profile.id}/${crypto.randomUUID()}.${file.name.split(".").pop() ?? "jpg"}`;
      const { error } = await supabase.storage
        .from("recipe-photos")
        .upload(path, file, { cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      const { data } = supabase.storage.from("recipe-photos").getPublicUrl(path);
      setSteps((prev) => prev.map((s, j) => (j === i ? { ...s, photo: data.publicUrl } : s)));
    } catch (e) {
      toast("error", "No se pudo subir la foto", (e as Error).message);
    } finally {
      setUploadingStep(null);
    }
  }

  async function handleSave() {
    if (!profile) return;
    if (!name.trim()) {
      toast("error", "Falta el nombre");
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: name.trim(),
        category,
        calories: Number(calories) || 0,
        protein_g: Number(protein) || 0,
        carbs_g: Number(carbs) || 0,
        fats_g: Number(fats) || 0,
        steps: steps.map((s) => s.text.trim()),
        step_titles: steps.map((s) => s.title.trim()),
        photos: steps.map((s) => s.photo ?? ""),
      };
      const { error } = editing
        ? await supabase.from("recipes").update(payload).eq("id", editing.id)
        : await supabase.from("recipes").insert({ ...payload, user_id: profile.id });
      if (error) throw new Error(error.message);
      qc.invalidateQueries({ queryKey: ["my_recipes"] });
      qc.invalidateQueries({ queryKey: ["recipes"] });
      toast("success", editing ? "Receta actualizada" : "Receta creada");
      onClose();
    } catch (e) {
      toast("error", "No se pudo guardar", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? "Editar receta" : "Nueva receta"}
      footer={
        <div className="flex w-full items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="accent" onClick={handleSave} loading={saving}>
            <Check className="size-4" /> Guardar
          </Button>
        </div>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSave();
        }}
        className="flex flex-col gap-3"
      >
        <Field label="Nombre" hint="Ej: Torta de avena y banana">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Mi receta"
            autoFocus
          />
        </Field>
        <Field label="Categoría">
          <div className="flex flex-wrap gap-1.5">
            {RECIPE_CATS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  category === c.id
                    ? "bg-[var(--accent)] text-[var(--accent-ink)]"
                    : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-4 gap-2">
          <Field label="Kcal">
            <Input
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="P (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="C (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
            />
          </Field>
          <Field label="G (g)">
            <Input
              type="number"
              inputMode="decimal"
              value={fats}
              onChange={(e) => setFats(e.target.value)}
              placeholder="0"
            />
          </Field>
        </div>

        <Field label="Pasos" hint="Documentá la preparación paso a paso, cada paso puede llevar su foto">
          <div className="flex flex-col gap-2">
            {steps.map((step, i) => (
              <div key={i} className="rounded-xl border border-[var(--border)] p-2.5">
                <div className="flex items-start gap-2">
                  <span className="mt-2.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <input
                      value={step.title}
                      onChange={(e) =>
                        setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))
                      }
                      placeholder={`Título del paso ${i + 1} (ej: Picar la cebolla)`}
                      className="mb-1.5 w-full rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm font-semibold outline-none transition-colors placeholder:font-normal placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                    />
                    <textarea
                      value={step.text}
                      onChange={(e) =>
                        setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))
                      }
                      rows={2}
                      placeholder={`Descripción del paso ${i + 1}...`}
                      className="w-full resize-none rounded-xl border border-[var(--border)] bg-transparent px-3 py-2 text-sm outline-none transition-colors placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                    />
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <button
                      type="button"
                      onClick={() =>
                        setSteps((prev) => {
                          if (i === 0) return prev;
                          const next = [...prev];
                          [next[i - 1], next[i]] = [next[i], next[i - 1]];
                          return next;
                        })
                      }
                      disabled={i === 0}
                      aria-label="Mover paso arriba"
                      className="mt-2 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4 rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSteps((prev) => {
                          if (i === prev.length - 1) return prev;
                          const next = [...prev];
                          [next[i], next[i + 1]] = [next[i + 1], next[i]];
                          return next;
                        })
                      }
                      disabled={i === steps.length - 1}
                      aria-label="Mover paso abajo"
                      className="mt-2 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-30"
                    >
                      <ChevronRight className="size-4 rotate-90" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSteps((prev) => prev.filter((_, j) => j !== i))}
                      aria-label="Quitar paso"
                      className="mt-2 rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {step.photo && (
                    <img src={step.photo} alt="" className="size-12 rounded-lg object-cover" />
                  )}
                  <label className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-bold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-3)]">
                    <ImagePlus className="size-3.5" />
                    {step.photo ? "Cambiar foto" : "Foto del paso"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        void handleStepPhoto(i, e.target.files?.[0] ?? null)
                      }
                    />
                  </label>
                  {uploadingStep === i && (
                    <span className="text-xs text-[var(--muted)]">Subiendo...</span>
                  )}
                  {step.photo && (
                    <button
                      type="button"
                      onClick={() =>
                        setSteps((prev) => prev.map((x, j) => (j === i ? { ...x, photo: null } : x)))
                      }
                      className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:text-[var(--danger)]"
                      aria-label="Quitar foto del paso"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSteps((prev) => [...prev, { title: "", text: "", photo: null }])}
            >
              <Plus className="size-4" /> Agregar paso
            </Button>
          </div>
        </Field>
      </form>
    </Dialog>
  );
}
