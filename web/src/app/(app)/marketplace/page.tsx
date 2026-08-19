"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Store, GraduationCap, Check, BadgeCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";

type Course = {
  id: string;
  title: string;
  description: string | null;
  price_uyu: number;
  status: string;
  trainer: { id: string; display_name: string | null; username: string | null } | null;
  enrollments: { athlete_id: string }[];
};

export default function MarketplacePage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("courses")
        .select(
          "id, title, description, price_uyu, status, trainer:profiles!courses_trainer_id_fkey(id, display_name, username), enrollments:course_enrollments(athlete_id)"
        )
        .eq("status", "published")
        .order("created_at", { ascending: false });
      return (data ?? []) as unknown as Course[];
    },
  });

  const enroll = useMutation({
    mutationFn: async (courseId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("course_enrollments").insert({
        course_id: courseId,
        athlete_id: profile!.id,
        paid: false,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["marketplace"] });
      toast("success", "Inscripción registrada");
    },
    onError: (e) => toast("error", "No se pudo inscribir", e.message),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
        <p className="mt-1 text-sm text-[var(--text-2)]">Cursos y programas de entrenadores verificados</p>
      </div>

      {(courses ?? []).length === 0 ? (
        <EmptyState
          icon={<Store className="size-6" />}
          title="El marketplace está vacío"
          description="Cuando los entrenadores publiquen cursos, aparecen acá."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses?.map((c) => {
            const isMine = c.trainer?.id === profile?.id;
            const enrolled = c.enrollments?.some((e) => e.athlete_id === profile?.id);
            return (
              <div key={c.id} className="card card-hover flex flex-col gap-3 p-5">
                <span className="flex size-11 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]">
                  <GraduationCap className="size-5" />
                </span>
                <div>
                  <h3 className="font-display text-lg font-bold tracking-tight leading-tight">
                    {c.title}
                  </h3>
                  <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[var(--text-2)]">
                    {c.description ?? "Sin descripción"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-[var(--surface-3)] font-display text-xs font-bold">
                    {(c.trainer?.display_name ?? "?")[0]?.toUpperCase()}
                  </span>
                  <span className="truncate font-semibold">
                    {c.trainer?.display_name ?? "Entrenador"}
                  </span>
                  <BadgeCheck className="size-4 shrink-0 text-[var(--success)]" />
                </div>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <span className="font-display text-xl font-bold">
                    ${c.price_uyu.toLocaleString("es-UY")}
                    <span className="text-xs font-semibold text-[var(--text-2)]"> UYU</span>
                  </span>
                  {isMine ? (
                    <span className="text-xs font-semibold text-[var(--muted)]">Es tuyo</span>
                  ) : enrolled ? (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--success-soft)] px-3 py-2 text-xs font-bold text-[var(--success)]">
                      <Check className="size-4" /> Inscripto
                    </span>
                  ) : (
                    <Button variant="accent" size="sm" onClick={() => enroll.mutate(c.id)} disabled={enroll.isPending}>
                      Inscribirme
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
