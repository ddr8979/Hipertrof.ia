"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";
import { Home, Dumbbell, BookOpen, Apple, Users, User, Shield } from "lucide-react";

export function BottomNav() {
  const path = usePathname();
  const { user } = useAuth();
  if (!user || !user.isApproved) return null;

  const isTrainer = user.role === "TRAINER" || user.role === "ADMIN" || user.role === "OWNER";
  const isOwnerOrAdmin = user.role === "ADMIN" || user.role === "OWNER";

  const links = isTrainer
    ? [
        { href: "/dashboard", label: "Inicio", Icon: Home },
        { href: "/trainer",   label: "Alumnos", Icon: Users },
        ...(isOwnerOrAdmin ? [{ href: "/admin", label: "Admin", Icon: Shield }] : []),
        { href: "/ejercicios", label: "Manual", Icon: BookOpen },
        { href: "/perfil",    label: "Perfil", Icon: User },
      ]
    : [
        { href: "/dashboard", label: "Inicio", Icon: Home },
        { href: "/rutinas",   label: "Mi entreno", Icon: Dumbbell },
        { href: "/ejercicios", label: "Manual", Icon: BookOpen },
        { href: "/calorias",  label: "Nutrición", Icon: Apple },
        { href: "/perfil",    label: "Perfil", Icon: User },
      ];

  return (
    <nav className="bottom-nav">
      {links.map((l) => {
        const active = path ? (path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href))) : false;
        return (
          <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}`}>
            <span className="nav-icon">
              <l.Icon size={21} strokeWidth={active ? 2.0 : 1.5} />
            </span>
            <span className="nav-label" style={{ marginTop: 2, fontSize: "0.65rem", fontWeight: 700 }}>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function TopBar() { return null; }
