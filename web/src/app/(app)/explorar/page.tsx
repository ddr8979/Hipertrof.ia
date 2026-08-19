"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Dumbbell,
  MessageCircle,
  UserPlus,
  UserCheck,
  Search,
  Compass,
  Globe,
  Users,
  Utensils,
  Heart,
  Send,
  Trash2,
  Star,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton, Avatar } from "@/components/ui/primitives";
import { EmptyState } from "@/components/ui/data";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useProfile } from "@/components/providers";
import { cn, vibrate } from "@/lib/utils";

type Author = {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  accent_color: string | null;
};

type FeedPost = {
  id: string;
  type: "workout" | "achievement" | "status" | "recipe" | "routine";
  scope: "global" | "friends" | "best_friends";
  caption: string | null;
  created_at: string;
  author: Author | null;
  workout: { name: string } | null;
  achievement: { code: string; name: string; description: string; icon: string } | null;
  recipe: { id: string; name: string; calories: number; protein_g: number; steps: string[] | null; step_titles: string[] | null; photos: string[] | null } | null;
  routine: { id: string; name: string; description: string | null; routine_exercises: { exercise_id: string | null; target_sets: number; exercise: { id: string; name: string } | null }[] } | null;
  likes: { user_id: string }[] | null;
  comments: { id: string; content: string; created_at: string; user: Author | null }[] | null;
};

const SCOPES = [
  { id: "global", label: "Global", icon: Globe },
  { id: "friends", label: "Amigos", icon: Users },
  { id: "best_friends", label: "Mejores amigos", icon: Star },
] as const;

export type PublishScope = (typeof SCOPES)[number]["id"];

export default function ExplorarPage() {
  const profile = useProfile((s) => s.profile);
  const qc = useQueryClient();
  const [caption, setCaption] = useState("");
  const [scope, setScope] = useState<PublishScope>("global");
  const [tab, setTab] = useState<"global" | "amigos" | "mejores" | "buscar">("global");
  const [search, setSearch] = useState("");
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [recipeSearch, setRecipeSearch] = useState("");
  const [recipeTab, setRecipeTab] = useState<"mine" | "catalog" | "routines">("mine");
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const shareRequested = searchParams.get("share") === "1";
  const [shareOpen, setShareOpen] = useState(shareRequested);
  const [viewRecipe, setViewRecipe] = useState<{
    id: string;
    name: string;
    calories: number;
    protein_g: number;
    steps: string[] | null;
    step_titles: string[] | null;
    photos: string[] | null;
  } | null>(null);
  const [pendingFollows, setPendingFollows] = useState<Set<string>>(new Set());
  const [bestEditOpen, setBestEditOpen] = useState(false);
  const [bestSearch, setBestSearch] = useState("");

  const { data: feed, isLoading } = useQuery({
    queryKey: ["feed", tab],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const me = user?.id;
      if (!me) return { posts: [] as FeedPost[], followingIds: new Set<string>() };

      const { data: rel } = await supabase
        .from("followers")
        .select("following_id, is_best_friend")
        .eq("follower_id", me);
      const followingIds = new Set((rel ?? []).map((r) => r.following_id));
      const bestIds = new Set(
        (rel ?? []).filter((r) => r.is_best_friend).map((r) => r.following_id)
      );

      let query = supabase
        .from("feed_posts")
        .select(
          "id, type, scope, caption, created_at, author:profiles!feed_posts_user_id_fkey(id, display_name, username, avatar_url, accent_color), workout:workouts(name), achievement:achievements(code, name, description, icon), recipe:recipes(id, name, calories, protein_g, steps, step_titles, photos), routine:routines(id, name, description, routine_exercises(exercise_id, target_sets, exercise:exercises(id, name))), likes:post_likes(user_id), comments:post_comments(id, content, created_at, user:profiles!post_comments_user_id_fkey(id, display_name, username, avatar_url, accent_color))"
        )
        .order("created_at", { ascending: false })
        .limit(60);

      if (tab === "global") {
        query = query.eq("scope", "global");
      } else if (tab === "mejores") {
        query = query.eq("scope", "best_friends").in(
          "user_id",
          bestIds.size ? [...bestIds, me] : [me]
        );
      } else {
        query = query.eq("scope", "friends").in(
          "user_id",
          followingIds.size ? [...followingIds, me] : [me]
        );
      }

      const { data } = await query;
      return { posts: (data ?? []) as unknown as FeedPost[], followingIds };
    },
  });

  const { data: bestFriends } = useQuery({
    queryKey: ["best_friends"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; accent_color: string | null }[];
      const { data: rel } = await supabase
        .from("followers")
        .select("following_id, profile:profiles!followers_following_id_fkey(id, display_name, username, avatar_url, accent_color)")
        .eq("follower_id", user.id)
        .eq("is_best_friend", true)
        .order("created_at", { ascending: false })
        .limit(20);
      return ((rel ?? []).map((r) => r.profile).filter(Boolean) as unknown) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; accent_color: string | null }[];
    },
  });

  const { data: following } = useQuery({
    queryKey: ["following"],
    queryFn: async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [] as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; accent_color: string | null; is_best_friend: boolean }[];
      const { data } = await supabase
        .from("followers")
        .select("following_id, is_best_friend, profile:profiles!followers_following_id_fkey(id, display_name, username, avatar_url, accent_color)")
        .eq("follower_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);
      return ((data ?? [])
        .filter((r) => r.profile)
        .map((r) => ({ ...r.profile, is_best_friend: r.is_best_friend })) as unknown) as { id: string; display_name: string | null; username: string | null; avatar_url: string | null; accent_color: string | null; is_best_friend: boolean }[];
    },
  });

  const { data: recipes } = useQuery({
    queryKey: ["recipes"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("recipes")
        .select("id, name, calories, protein_g, carbs_g, fats_g, category, steps, photos, user_id")
        .order("name")
        .limit(500);
      return (
        (data ?? []) as {
          id: string;
          name: string;
          calories: number;
          protein_g: number;
          carbs_g: number;
          fats_g: number;
          category: string | null;
          steps: string[] | null;
          photos: string[] | null;
          user_id: string | null;
        }[]
      );
    },
  });

  const myRecipes = (recipes ?? []).filter((r) => r.user_id === profile?.id);

  const { data: myRoutines } = useQuery({
    queryKey: ["my_routines_share"],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("routines")
        .select(
          "id, name, description, routine_exercises(exercise_id, target_sets, target_reps, exercise:exercises(name))"
        )
        .order("updated_at", { ascending: false });
      return (data ?? []) as {
        id: string;
        name: string;
        description: string | null;
        routine_exercises: {
          exercise_id: string | null;
          target_sets: number;
          target_reps: number | null;
          exercise: { name: string }[] | null;
        }[];
      }[];
    },
  });

  const { data: results } = useQuery({
    queryKey: ["search_profiles", search],
    queryFn: async () => {
      const q = search.trim().toLowerCase();
      if (!q) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, username, avatar_url, accent_color, streak_count, is_public_profile, followers:followers!followers_following_id_fkey(follower_id)"
        )
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(20);
      return (data ?? []) as unknown as {
        id: string;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
        accent_color: string | null;
        streak_count: number | null;
        is_public_profile: boolean;
        followers: { follower_id: string }[];
      }[];
    },
  });

  const { data: bestResults } = useQuery({
    queryKey: ["best_search", bestSearch],
    queryFn: async () => {
      const q = bestSearch.trim().toLowerCase();
      if (!q) return [];
      const supabase = createClient();
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, display_name, username, avatar_url, accent_color, streak_count, is_public_profile"
        )
        .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
        .limit(20);
      return (data ?? []) as unknown as {
        id: string;
        display_name: string | null;
        username: string | null;
        avatar_url: string | null;
        accent_color: string | null;
        streak_count: number | null;
        is_public_profile: boolean;
      }[];
    },
  });

  const toggleFollow = useMutation({
    mutationFn: async (targetId: string) => {
      const supabase = createClient();
      const { data: exists } = await supabase
        .from("followers")
        .select("follower_id")
        .eq("follower_id", profile!.id)
        .eq("following_id", targetId)
        .maybeSingle();
      if (exists) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", profile!.id)
          .eq("following_id", targetId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: profile!.id, following_id: targetId });
        if (error) throw new Error(error.message);
      }
    },
    onMutate: (targetId) => {
      setPendingFollows((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
    },
    onSuccess: (_data, targetId) => {
      void _data;
      setPendingFollows((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["search_profiles"] });
    },
    onError: (e, targetId) => {
      setPendingFollows((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
      toast("error", "No se pudo actualizar", e.message);
    },
  });

  const toggleBest = useMutation({
    mutationFn: async ({ targetId, want }: { targetId: string; want: boolean }) => {
      const supabase = createClient();
      const { data: existing } = await supabase
        .from("followers")
        .select("following_id")
        .eq("follower_id", profile!.id)
        .eq("following_id", targetId)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("followers")
          .update({ is_best_friend: want })
          .eq("follower_id", profile!.id)
          .eq("following_id", targetId);
        if (error) throw new Error(error.message);
      } else {
        const { error } = await supabase.from("followers").insert({
          follower_id: profile!.id,
          following_id: targetId,
          is_best_friend: true,
        });
        if (error) throw new Error(error.message);
      }
    },
    onSuccess: (_data, vars) => {
      void _data;
      qc.invalidateQueries({ queryKey: ["best_friends"] });
      qc.invalidateQueries({ queryKey: ["following"] });
      qc.invalidateQueries({ queryKey: ["feed"] });
      qc.invalidateQueries({ queryKey: ["is_best_friend"] });
      toast("success", vars.want ? "Agregado a mejores amigos" : "Quitado de mejores amigos");
    },
    onError: (e) => toast("error", "No se pudo actualizar", e.message),
  });

  const publish = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { error } = await supabase.from("feed_posts").insert({
        user_id: profile!.id,
        type: "status",
        scope,
        caption: caption.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setCaption("");
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast(
        "success",
        "Publicado",
        scope === "global"
          ? "Visible para toda la comunidad"
          : scope === "best_friends"
            ? "Visible solo para tus mejores amigos"
            : "Visible solo para tus amigos"
      );
    },
    onError: (e) => toast("error", "No se pudo publicar", e.message),
  });

  const shareRecipe = useMutation({
    mutationFn: async (recipeId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("feed_posts").insert({
        user_id: profile!.id,
        type: "recipe",
        scope,
        recipe_id: recipeId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setRecipeOpen(false);
      setRecipeSearch("");
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast("success", "Receta compartida");
    },
    onError: (e) => toast("error", "No se pudo compartir", e.message),
  });

  const shareRoutine = useMutation({
    mutationFn: async (routineId: string) => {
      const supabase = createClient();
      const { error: pub } = await supabase
        .from("routines")
        .update({ is_public: true })
        .eq("id", routineId);
      if (pub) throw new Error(pub.message);
      const { error } = await supabase.from("feed_posts").insert({
        user_id: profile!.id,
        type: "routine",
        scope,
        routine_id: routineId,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setRecipeOpen(false);
      setRecipeSearch("");
      qc.invalidateQueries({ queryKey: ["feed"] });
      toast("success", "Rutina compartida", "Cualquiera puede verla y usarla en su entrenamiento");
    },
    onError: (e) => toast("error", "No se pudo compartir la rutina", e.message),
  });

  const addComment = useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        user_id: profile!.id,
        content: commentText.trim(),
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      setCommentText("");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => toast("error", "No se pudo comentar", e.message),
  });

  useEffect(() => {
    if (!openComments) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`post-comments-${openComments}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "post_comments",
          filter: `post_id=eq.${openComments}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["feed"] });
        }
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [openComments, qc]);

  const toggleLike = useMutation({
    mutationFn: async ({ postId, liked }: { postId: string; liked: boolean }) => {
      const supabase = createClient();
      const { error } = liked
        ? await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", profile!.id)
        : await supabase.from("post_likes").insert({ post_id: postId, user_id: profile!.id });
      if (error) throw new Error(error.message);
    },
    onMutate: ({ postId, liked }) => {
      qc.setQueryData(["feed"], (old: { posts: FeedPost[] } | undefined) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  likes: liked
                    ? (p.likes ?? []).filter((l) => l.user_id !== profile?.id)
                    : [...(p.likes ?? []), { user_id: profile!.id }],
                }
              : p
          ),
        };
      });
    },
    onError: (e) => toast("error", "No se pudo actualizar el like", e.message),
    onSettled: () => qc.invalidateQueries({ queryKey: ["feed"] }),
  });

  const deletePost = useMutation({
    mutationFn: async (postId: string) => {
      const supabase = createClient();
      const { error } = await supabase.from("feed_posts").delete().eq("id", postId);
      if (error) throw new Error(error.message);
    },
    onMutate: () => vibrate(12),
    onSuccess: () => {
      toast("success", "Publicación eliminada");
      qc.invalidateQueries({ queryKey: ["feed"] });
    },
    onError: (e) => toast("error", "No se pudo eliminar", e.message),
  });

  const effectiveFollowing = (initial: boolean, id: string) =>
    pendingFollows.has(id) ? !initial : initial;

  const filteredRecipes = (recipes ?? []).filter(
    (r) =>
      !recipeSearch ||
      r.name.toLowerCase().includes(recipeSearch.toLowerCase()) ||
      (r.category ?? "").toLowerCase().includes(recipeSearch.toLowerCase())
  );

  const displayName = (a?: Author | null) =>
    a?.display_name || a?.username || "Atleta";

  const initial = (a?: Author | null) => (displayName(a)[0] ?? "A").toUpperCase();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Social</h1>
        <div className="flex w-full max-w-full overflow-x-auto rounded-xl bg-[var(--surface-2)] p-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(
            [
              { id: "global", label: "Global", color: null },
              { id: "amigos", label: "Amigos", color: "text-[#7c8cff]" },
              {
                id: "mejores",
                label: "Mejores amigos",
                color: "text-[#22c55e]",
                icon: Star,
              },
              { id: "buscar", label: "Buscar", color: null },
            ] as const
          ).map((t) => {
            const Icon = "icon" in t ? t.icon : null;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors sm:px-4",
                  tab === t.id
                    ? t.id === "mejores"
                      ? "bg-[#22c55e] text-white shadow-sm"
                      : "bg-[var(--accent)] text-[var(--accent-ink)] shadow-sm"
                    : cn(t.color ?? "text-[var(--muted)]", "hover:text-[var(--text)]")
                )}
              >
                {Icon && <Icon className="size-3.5" />}
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mejores amigos */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
          Mejores amigos
          <span className="ml-2 font-medium normal-case text-[var(--text-2)]">
            ({bestFriends?.length ?? 0})
          </span>
        </p>
        <button
          onClick={() => setBestEditOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-[#22c55e] hover:underline"
        >
          <UserPlus className="size-3.5" />
          Editar lista
        </button>
      </div>
      {(bestFriends?.length ?? 0) === 0 && (
        <p className="text-xs text-[var(--muted)]">
          Elegí a las personas que verán tus posts exclusivos. Solo vos y ellos los ven.
        </p>
      )}

      {tab !== "buscar" ? (
        <>
          <div className="card p-4">
            <Field label="">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Publicá algo: una sesión, un PR, una receta..."
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-sm focus:border-[var(--accent)] focus:outline-none"
              />
            </Field>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {SCOPES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors",
                      scope === s.id
                        ? s.id === "friends"
                          ? "bg-[#7c8cff] text-white"
                          : s.id === "best_friends"
                            ? "bg-[#22c55e] text-white"
                            : "bg-[var(--accent)] text-[var(--accent-ink)]"
                        : s.id === "friends"
                          ? "bg-[var(--surface-2)] text-[#7c8cff] hover:text-[#7c8cff]"
                          : s.id === "best_friends"
                            ? "bg-[var(--surface-2)] text-[#22c55e] hover:text-[#22c55e]"
                            : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)]"
                    )}
                  >
                    <s.icon className="size-3.5" />
                    {s.label}
                  </button>
                ))}
                <button
                  onClick={() => setRecipeOpen(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--surface-2)] px-2.5 py-1.5 text-xs font-semibold text-[var(--text-2)] transition-colors hover:text-[var(--text)]"
                >
                  <Utensils className="size-3.5" />
                  Compartir receta
                </button>
              </div>
              <span className="text-xs text-[var(--muted)]">{caption.length}/280</span>
              <Button
                variant="accent"
                size="sm"
                onClick={() => {
                  vibrate(14);
                  publish.mutate();
                }}
                disabled={!caption.trim() || publish.isPending}
              >
                <MessageCircle className="size-4" /> Publicar
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
              <Skeleton className="h-32" />
            </div>
          ) : (feed?.posts ?? []).length === 0 ? (
            <EmptyState
              icon={tab === "mejores" ? <Star className="size-6" /> : <Compass className="size-6" />}
              title={
                tab === "global"
                  ? "El feed global está vacío"
                  : tab === "mejores"
                    ? "Todavía no hay posts de tus mejores amigos"
                    : "Todavía no hay publicaciones de tus amigos"
              }
              description={
                tab === "global"
                  ? "Completá entrenamientos o publicá algo y va a aparecer acá."
                  : tab === "mejores"
                    ? "Agregá a tus personas favoritas y sus posts exclusivos van a aparecer acá."
                    : "Seguí atletas para ver su actividad acá."
              }
              action={
                tab === "mejores" ? (
                  <Button
                    variant="accent"
                    onClick={() => setBestEditOpen(true)}
                    className="bg-[#22c55e] text-white"
                  >
                    <UserPlus className="size-4" /> Editar mejores amigos
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="flex flex-col gap-3">
              {feed?.posts.map((p) => {
                const author = p.author;
                const isMine = author?.id === profile?.id;
                const following = effectiveFollowing(
                  feed.followingIds.has(author?.id ?? ""),
                  author?.id ?? ""
                );
                return (
                  <article key={p.id} className="card p-4">
                    <div className="flex items-center gap-3">
                      {author?.id ? (
                        <Link
                          href={`/perfil/${author.id}`}
                          className="shrink-0"
                          style={
                            author?.accent_color
                              ? { color: "var(--accent)" }
                              : undefined
                          }
                        >
                          <Avatar
                            src={author?.avatar_url}
                            alt={author ? displayName(author) : undefined}
                            initialsText={author ? displayName(author) : undefined}
                            className="rounded-xl font-bold"
                            size={40}
                          />
                        </Link>
                      ) : (
                        <Avatar
                          alt="Atleta"
                          initialsText="Atleta"
                          className="rounded-xl font-bold"
                          size={40}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        {author?.id ? (
                          <>
                            <Link
                              href={`/perfil/${author.id}`}
                              className="block break-words text-sm font-bold leading-snug hover:underline"
                            >
                              {displayName(author)}
                            </Link>
                            {author?.username && (
                              <Link
                                href={`/perfil/${author.id}`}
                                className="block break-words text-xs font-semibold text-[var(--muted)] hover:underline"
                              >
                                @{author.username}
                              </Link>
                            )}
                          </>
                        ) : (
                          <p className="break-words text-sm font-bold leading-snug">
                            {displayName(author)}
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted)]">
                          {formatDistanceToNow(new Date(p.created_at), { addSuffix: true, locale: es })}
                          {p.scope === "friends" && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5">
                              <Users className="size-3" /> amigos
                            </span>
                          )}
                          {p.scope === "best_friends" && (
                            <span className="ml-1.5 inline-flex items-center gap-0.5 font-semibold text-[#22c55e]">
                              <Star className="size-3 fill-current" /> mejores amigos
                            </span>
                          )}
                        </p>
                      </div>
                      {isMine && (
                        <button
                          onClick={() => deletePost.mutate(p.id)}
                          aria-label="Eliminar publicación"
                          className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                      {!isMine && author && (
                        <Button
                          variant={following ? "outline" : "accent"}
                          size="sm"
                          onClick={() => toggleFollow.mutate(author.id)}
                          disabled={pendingFollows.has(author.id)}
                        >
                          {following ? (
                            <>
                              <UserCheck className="size-4" /> Siguiendo
                            </>
                          ) : (
                            <>
                              <UserPlus className="size-4" /> Seguir
                            </>
                          )}
                        </Button>
                      )}
                    </div>

                    <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[var(--surface-2)]/50 px-3.5 py-3">
                      {p.type === "workout" && (
                        <Dumbbell className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      )}
                      {p.type === "achievement" && (
                        <Trophy className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      )}
                      {p.type === "recipe" && (
                        <Utensils className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      )}
                      {p.type === "routine" && (
                        <Dumbbell className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      )}
                      {p.type === "status" && (
                        <MessageCircle className="mt-0.5 size-4 shrink-0 text-[var(--accent)]" />
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        {p.type === "workout" && (
                          <p>
                            <strong>Completó un entrenamiento</strong>
                            {p.workout?.name ? `: ${p.workout.name}` : ""}
                          </p>
                        )}
                        {p.type === "achievement" && (
                          <p>
                            <strong>Desbloqueó el logro</strong>{" "}
                            {p.achievement?.name ?? ""}
                          </p>
                        )}
                        {p.type === "status" && <p>{p.caption}</p>}
                        {p.type === "routine" && p.routine && (
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p>
                                  <strong>Compartió una rutina:</strong>{" "}
                                  {p.routine.name}
                                </p>
                                {p.routine.description && (
                                  <p className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">
                                    {p.routine.description}
                                  </p>
                                )}
                                <p className="text-xs text-[var(--muted)]">
                                  {p.routine.routine_exercises?.length ?? 0}{" "}
                                  ejercicios
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/entrenar?routine=${p.routine!.id}`)
                                }
                              >
                                <Dumbbell className="size-4" /> Usar
                              </Button>
                            </div>
                          </div>
                        )}
                        {p.type === "recipe" && p.recipe && (
                          <div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p>
                                  <strong>Recomienda:</strong> {p.recipe.name}
                                </p>
                                <p className="text-xs text-[var(--muted)]">
                                  {p.recipe.calories} kcal · P{" "}
                                  {p.recipe.protein_g} g
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setViewRecipe(p.recipe!)}
                              >
                                Ver receta
                              </Button>
                            </div>
                            {p.recipe.steps?.length ? (
                              <ol className="mt-2.5 flex flex-col gap-1.5">
                                {p.recipe.steps.map((s, i) => (
                                  <li
                                    key={i}
                                    className="flex gap-2 rounded-lg bg-[var(--surface-2)]/50 px-2.5 py-1.5 text-xs"
                                  >
                                    <span className="mt-px flex size-4 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-[var(--accent-ink)]">
                                      {i + 1}
                                    </span>
                                    <span className="min-w-0">
                                      {p.recipe!.step_titles?.[i] && (
                                        <strong className="mr-1">
                                          {p.recipe!.step_titles[i]}
                                        </strong>
                                      )}
                                      {s}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            ) : p.caption ? (
                              <p className="mt-1.5 text-sm text-[var(--text-2)]">
                                {p.caption}
                              </p>
                            ) : null}
                            {p.recipe.photos?.find(Boolean) && (
                              <button
                                onClick={() => setViewRecipe(p.recipe!)}
                                className="mt-2.5 block w-full overflow-hidden rounded-xl"
                              >
                                <img
                                  src={p.recipe.photos.find(Boolean)!}
                                  alt=""
                                  className="h-40 w-full object-cover transition-colors"
                                />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between px-1">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            vibrate(10);
                            toggleLike.mutate({
                              postId: p.id,
                              liked: (p.likes ?? []).some((l) => l.user_id === profile?.id),
                            });
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold transition-colors active:scale-90",
                            (p.likes ?? []).some((l) => l.user_id === profile?.id)
                              ? "text-[var(--danger)]"
                              : "text-[var(--muted)] hover:text-[var(--text)]"
                          )}
                        >
                          <Heart
                            className={cn(
                              "size-4 transition-transform",
                              (p.likes ?? []).some((l) => l.user_id === profile?.id) &&
                                "animate-[pop_0.25s_cubic-bezier(0.16,1,0.3,1)] fill-current"
                            )}
                          />
                          {(p.likes ?? []).length > 0 && (
                            <span>{(p.likes ?? []).length}</span>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            vibrate(5);
                            setOpenComments(openComments === p.id ? null : p.id);
                            setCommentText("");
                          }}
                          className={cn(
                            "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold transition-colors",
                            openComments === p.id
                              ? "text-[var(--accent)]"
                              : "text-[var(--muted)] hover:text-[var(--text)]"
                          )}
                        >
                          <MessageCircle className="size-4" />
                          {(p.comments ?? []).length > 0 && (
                            <span>{(p.comments ?? []).length}</span>
                          )}
                        </button>
                      </div>
                      <span className="text-[11px] text-[var(--muted)]">
                        {(p.likes ?? []).length === 0
                          ? "Sé el primero en dar like"
                          : (p.likes ?? []).length === 1
                            ? "1 like"
                            : `${(p.likes ?? []).length} likes`}
                      </span>
                    </div>

                    {openComments === p.id && (
                      <div className="mt-2 border-t border-[var(--border)] pt-2">
                        <div className="flex max-h-52 flex-col gap-1.5 overflow-y-auto">
                          {(p.comments ?? []).length === 0 ? (
                            <p className="py-2 text-center text-xs text-[var(--muted)]">
                              Sin comentarios todavía. ¡Comentá vos!
                            </p>
                          ) : (
                            [...(p.comments ?? [])]
                              .sort(
                                (a, b) =>
                                  new Date(a.created_at).getTime() -
                                  new Date(b.created_at).getTime()
                              )
                              .map((c) => {
                              const ca = c.user;
                              return (
                                <div
                                  key={c.id}
                                  className="flex items-start gap-2 rounded-lg bg-[var(--surface-2)]/50 px-2.5 py-2"
                                >
                                  <Link href={`/perfil/${ca?.id ?? "#"}`}>
                                    <Avatar
                                      src={ca?.avatar_url}
                                      alt={ca ? displayName(ca) : undefined}
                                      initialsText={ca ? displayName(ca) : undefined}
                                      className="rounded-lg font-bold"
                                      size={26}
                                    />
                                  </Link>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold">
                                      {ca ? displayName(ca) : "Atleta"}
                                      <span className="ml-1.5 font-medium text-[var(--muted)]">
                                        {formatDistanceToNow(new Date(c.created_at), {
                                          addSuffix: true,
                                          locale: es,
                                        })}
                                      </span>
                                    </p>
                                    <p className="text-sm text-[var(--text-2)]">{c.content}</p>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <Input
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && commentText.trim()) {
                                addComment.mutate(p.id);
                              }
                            }}
                            placeholder="Escribí un comentario..."
                            className="h-9"
                          />
                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => addComment.mutate(p.id)}
                            disabled={!commentText.trim() || addComment.isPending}
                            aria-label="Enviar comentario"
                          >
                            <Send className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o username..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            {(results ?? []).length === 0 && search.trim() && (
              <p className="py-6 text-center text-sm text-[var(--muted)]">
                Sin resultados para «{search}»
              </p>
            )}
            {results?.map((u) => {
              const isMine = u.id === profile?.id;
              const following = effectiveFollowing(
                u.followers?.some((f) => f.follower_id === profile?.id) ?? false,
                u.id
              );
              return (
                <div key={u.id} className="card flex items-center gap-3 p-4">
                  <Link
                    href={`/perfil/${u.id}`}
                    className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[var(--surface-3)] font-display font-bold"
                  >
                    {u.avatar_url ? (
                      <img src={String(u.avatar_url)} alt="" className="size-full object-cover" />
                    ) : (
                      (u.display_name ?? u.username ?? "A")[0]?.toUpperCase()
                    )}
                  </Link>
                  <Link href={`/perfil/${u.id}`} className="min-w-0 flex-1 hover:underline">
                    <p className="truncate text-sm font-bold">
                      {u.display_name ?? u.username ?? "Atleta"}
                      {u.username && (
                        <span className="ml-1.5 font-semibold text-[var(--muted)]">
                          @{u.username}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {u.followers?.length ?? 0} seguidores · racha {u.streak_count ?? 0} días
                      {!u.is_public_profile && " · privado"}
                    </p>
                  </Link>
                  {!isMine && (
                    <Button
                      variant={following ? "outline" : "accent"}
                      size="sm"
                      onClick={() => toggleFollow.mutate(u.id)}
                      disabled={pendingFollows.has(u.id)}
                    >
                      {following ? (
                        <>
                          <UserCheck className="size-4" /> Siguiendo
                        </>
                      ) : (
                        <>
                          <UserPlus className="size-4" /> Seguir
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Dialog
        open={bestEditOpen}
        onClose={() => setBestEditOpen(false)}
        title="Editar mejores amigos"
      >
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 rounded-xl bg-[#22c55e]/10 px-3 py-2 text-xs leading-relaxed text-[#16a34a]">
            <Star className="size-4 shrink-0 fill-current" />
            Tus mejores amigos ven tus posts exclusivos con la estrella verde. Podés cambiar la
            lista cuando quieras.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={bestSearch}
              onChange={(e) => setBestSearch(e.target.value)}
              placeholder="Buscar personas para agregar…"
              className="pl-9"
            />
          </div>

          {bestSearch.trim() ? (
            <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto">
              {(bestResults ?? []).length === 0 && (
                <p className="py-3 text-center text-sm text-[var(--muted)]">
                  Sin resultados para "{bestSearch.trim()}"
                </p>
              )}
              {(bestResults ?? []).map((r) => {
                const isFollowing = (following ?? []).some((f) => f.id === r.id);
                const isBest = (following ?? []).some((f) => f.id === r.id && f.is_best_friend);
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]">
                    <Avatar
                      src={r.avatar_url}
                      size={36}
                      alt={r.display_name ?? r.username ?? "Atleta"}
                      initialsText={r.display_name ?? r.username ?? "A"}
                      className="rounded-full"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.display_name ?? r.username}</p>
                      <p className="truncate text-xs text-[var(--muted)]">@{r.username ?? "—"}</p>
                    </div>
                    <button
                      onClick={() =>
                        toggleBest.mutate({ targetId: r.id, want: !isBest })
                      }
                      disabled={toggleBest.isPending}
                      aria-label={isBest ? "Quitar de mejores amigos" : "Agregar a mejores amigos"}
                      className={cn(
                        "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
                        isBest
                          ? "bg-[#22c55e] text-white"
                          : isFollowing
                            ? "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[#22c55e]"
                            : "bg-[#22c55e]/10 text-[#16a34a] hover:bg-[#22c55e]/20"
                      )}
                    >
                      <Star className={cn("size-3.5", isBest && "fill-current")} />
                      {isBest ? "Quitar" : isFollowing ? "Mejor amigo" : "Agregar"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex max-h-64 flex-col gap-1.5 overflow-y-auto">
              <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                Personas que seguís
              </p>
              {(following ?? []).length === 0 && (
                <p className="py-3 text-center text-sm text-[var(--muted)]">
                  Todavía no seguís a nadie. Buscá arriba para agregar a alguien.
                </p>
              )}
              {(following ?? []).map((f) => (
                <div key={f.id} className="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-[var(--surface-2)]">
                  <Avatar
                    src={f.avatar_url}
                    size={36}
                    alt={f.display_name ?? f.username ?? "Atleta"}
                    initialsText={f.display_name ?? f.username ?? "A"}
                    className="rounded-full"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{f.display_name ?? f.username}</p>
                    <p className="truncate text-xs text-[var(--muted)]">@{f.username ?? "—"}</p>
                  </div>
                  <button
                    onClick={() => toggleBest.mutate({ targetId: f.id, want: !f.is_best_friend })}
                    disabled={toggleBest.isPending}
                    aria-label={f.is_best_friend ? "Quitar de mejores amigos" : "Agregar a mejores amigos"}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
                      f.is_best_friend
                        ? "bg-[#22c55e] text-white"
                        : "bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[#22c55e]"
                    )}
                  >
                    <Star className={cn("size-3.5", f.is_best_friend && "fill-current")} />
                    {f.is_best_friend ? "Quitar" : "Mejor amigo"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Dialog>

      <Dialog
        open={recipeOpen || shareOpen}
        onClose={() => {
          setRecipeOpen(false);
          setShareOpen(false);
          router.replace("/explorar", { scroll: false });
        }}
        title="Compartir en social"
      >
        <div className="flex flex-col gap-3">
          <div className="flex rounded-xl bg-[var(--surface-2)] p-1">
            {(
              [
                { id: "mine", label: `Recetas (${myRecipes.length})` },
                { id: "catalog", label: "Recetario" },
                { id: "routines", label: `Rutinas (${myRoutines?.length ?? 0})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setRecipeTab(t.id)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-sm font-semibold transition-colors",
                  recipeTab === t.id
                    ? "bg-[var(--surface)] text-[var(--text)] shadow-sm"
                    : "text-[var(--muted)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--muted)]" />
            <Input
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="flex max-h-80 flex-col gap-1.5 overflow-y-auto pr-1">
            {recipeTab === "routines" ? (
              <>
                {(myRoutines ?? [])
                  .filter(
                    (r) =>
                      !recipeSearch ||
                      r.name.toLowerCase().includes(recipeSearch.toLowerCase())
                  )
                  .slice(0, 24)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => shareRoutine.mutate(r.id)}
                      disabled={shareRoutine.isPending}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                    >
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)]">
                        <Dumbbell className="size-4 text-[var(--accent)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {r.routine_exercises?.length ?? 0} ejercicios
                          {r.description ? ` · ${r.description}` : ""}
                        </p>
                      </div>
                      <Dumbbell className="size-4 shrink-0 text-[var(--accent)]" />
                    </button>
                  ))}
                {(myRoutines ?? []).filter((r) => !recipeSearch || r.name.toLowerCase().includes(recipeSearch.toLowerCase())).length ===
                  0 && (
                  <p className="py-6 text-center text-sm text-[var(--muted)]">
                    {recipeSearch
                      ? `Sin rutinas para «${recipeSearch}»`
                      : "Todavía no creaste rutinas. Creálas desde Rutinas."}
                  </p>
                )}
              </>
            ) : (
              <>
                {(recipeTab === "mine" ? myRecipes : filteredRecipes)
                  .slice(0, 24)
                  .map((r) => (
                    <button
                      key={r.id}
                      onClick={() => shareRecipe.mutate(r.id)}
                      disabled={shareRecipe.isPending}
                      className="flex items-center gap-3 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-2)]"
                    >
                      {r.photos?.find(Boolean) ? (
                        <img
                          src={r.photos.find(Boolean)!}
                          alt=""
                          className="size-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-3)]">
                          <Utensils className="size-4 text-[var(--muted)]" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{r.name}</p>
                        <p className="text-xs text-[var(--muted)]">
                          {r.calories} kcal · P {r.protein_g} g
                          {r.category ? ` · ${r.category}` : ""}
                          {r.steps?.length ? ` · ${r.steps.length} pasos` : ""}
                        </p>
                      </div>
                      <Utensils className="size-4 shrink-0 text-[var(--accent)]" />
                    </button>
                  ))}
                {(recipeTab === "mine" ? myRecipes : filteredRecipes).length === 0 && (
                  <p className="py-6 text-center text-sm text-[var(--muted)]">
                    {recipeTab === "mine"
                      ? "Todavía no creaste recetas. Creálas desde Nutrición."
                      : `Sin recetas para «${recipeSearch}»`}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Dialog>

      {viewRecipe && (
        <Dialog open onClose={() => setViewRecipe(null)} title={viewRecipe.name}>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between rounded-xl bg-[var(--surface-2)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--text-2)]">Macros</p>
              <p className="text-sm font-bold tabular-nums">
                {viewRecipe.calories} kcal · P {viewRecipe.protein_g} g
              </p>
            </div>
            {viewRecipe.steps && viewRecipe.steps.length > 0 ? (
              <ol className="flex flex-col gap-2">
                {viewRecipe.steps.map((s, i) => {
                  const photo = viewRecipe.photos?.[i];
                  return (
                    <li
                      key={i}
                      className="flex gap-2.5 rounded-xl bg-[var(--surface-2)]/60 px-3 py-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[11px] font-bold text-[var(--accent-ink)]">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        {viewRecipe.step_titles?.[i] && (
                          <p className="text-sm font-bold">{viewRecipe.step_titles[i]}</p>
                        )}
                        <span className="text-[var(--text-2)]">{s}</span>
                        {photo && (
                          // eslint-disable-next-line @next/next/no-img-element
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
          </div>
        </Dialog>
      )}
    </div>
  );
}