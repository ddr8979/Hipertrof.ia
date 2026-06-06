"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Home, Dumbbell, BookOpen, Apple, Users, User } from "lucide-react";

export function BottomNav() {
  const path = usePathname();
  const { user } = useAuth();
  if (!user) return null;

  const isTrainer = user.role === "TRAINER" || user.role === "ADMIN" || user.role === "OWNER";

  const links = isTrainer
    ? [
        { href: "/dashboard", label: "Inicio", Icon: Home },
        { href: "/trainer",   label: "Alumnos", Icon: Users },
        { href: "/ejercicios", label: "Manual", Icon: BookOpen },
        { href: "/perfil",    label: "Perfil", Icon: User },
      ]
    : [
        { href: "/dashboard", label: "Inicio", Icon: Home },
        { href: "/rutinas",   label: "Mi entreno", Icon: Dumbbell },
        { href: "/ejercicios", label: "Manual", Icon: BookOpen },
        { href: "/calorias",  label: "¿Qué comer?", Icon: Apple },
        { href: "/perfil",    label: "Perfil", Icon: User },
      ];

  return (
    <nav className="bottom-nav">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
        return (
          <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}`}>
            <span className="nav-icon">
              <l.Icon size={20} strokeWidth={active ? 2.4 : 1.8} />
            </span>
            <span className="nav-label">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// TopBar se elimina — app 100% mobile sin barra superior
export function TopBar() { return null; }
