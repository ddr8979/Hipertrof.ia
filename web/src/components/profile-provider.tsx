"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/components/providers";

export function ProfileProvider() {
  const setProfile = useProfile((s) => s.setProfile);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!user) {
        setProfile(null);
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (cancelled) return;
      if (error) {
        if (error.code === "PGRST301" || error.code === "PGRST302") {
          router.replace("/login");
          return;
        }
        return;
      }
      setProfile(data);
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        router.replace("/login");
        return;
      }
      if (event === "SIGNED_IN" && session) load();
      if (event === "TOKEN_REFRESHED" && session) load();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [setProfile, router]);

  return null;
}