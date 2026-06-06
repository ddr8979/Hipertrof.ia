"use client";
// Auth context — manages session state client-side
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";

type SessionUser = { id: string; email: string; name: string | null; role: string; isApproved: boolean };

type AuthCtx = {
  user: SessionUser | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {}, logout: async () => {} });

const PUBLIC_PATHS = ["/", "/auth", "/pendiente"];
const APPROVED_ONLY = (path: string) => !PUBLIC_PATHS.some((p) => path === p || path.startsWith("/api"));

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refresh = async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/auth");
  };

  useEffect(() => { refresh(); }, []);

  // Redirect pending users away from protected pages
  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (user.role === "ADMIN" || user.role === "TRAINER" || user.role === "OWNER") return;
    if (!user.isApproved && pathname !== "/pendiente") {
      router.replace("/pendiente");
    }
  }, [user, loading, pathname, router]);

  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
