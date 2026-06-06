"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./auth-provider";

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={active ? 0 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12L12 3l9 9" />
      <path d="M9 21V12h6v9" />
      <path d="M3 12v9h18V12" strokeWidth={active ? 0 : 1.8} />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 6c0-1.1.9-2 2-2h7a2 2 0 0 1 2 2v13l-4.5-2.7L4 19V6Z"
        fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.8} />
      <path d="M2 6c0-1.1.9-2 2-2h7a2 2 0 0 1 2 2v13l-4.5-2.7L4 19V6Z"
        fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
      <path d="M22 6c0-1.1-.9-2-2-2h-7a2 2 0 0 0-2 2v13l4.5-2.7L20 19V6Z"
        fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.8} />
      <path d="M22 6c0-1.1-.9-2-2-2h-7a2 2 0 0 0-2 2v13l4.5-2.7L20 19V6Z"
        fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
    </svg>
  );
}

function CalcIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="3" fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.8} />
      <rect x="4" y="2" width="16" height="20" rx="3" fill="none" stroke="currentColor" strokeWidth={active ? 2 : 1.8} />
      <path d="M8 8h8M8 12h4M8 16h4M16 16h-4" stroke={active ? "#030508" : "currentColor"} strokeWidth="1.5" />
      <rect x="7" y="5.5" width="10" height="3" rx="1" fill={active ? "#030508" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth="1.3" />
    </svg>
  );
}

function UsersIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.8} />
      <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth={active ? 2 : 1.8} fill="none" />
      <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7" />
      <path d="M19 8c1.1 0 2 .9 2 2s-.9 2-2 2" />
      <path d="M22 21c0-2.8-1.7-5-3.8-6" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" fill={active ? "currentColor" : "none"} strokeWidth={active ? 0 : 1.8} />
      <circle cx="12" cy="8" r="5" stroke="currentColor" strokeWidth={active ? 2 : 1.8} fill="none" />
      <path d="M3 21c0-5 4-8 9-8s9 3 9 8" />
    </svg>
  );
}

export function BottomNav() {
  const path = usePathname();
  const { user, logout } = useAuth();
  if (!user) return null;

  const isTrainer = user.role === "TRAINER" || user.role === "ADMIN";

  const links = [
    { href: "/dashboard", label: "Inicio", Icon: HomeIcon },
    { href: "/rutinas",   label: "Mi entreno", Icon: BookIcon },
    { href: "/calorias",  label: "¿Qué comer?", Icon: CalcIcon },
    ...(isTrainer ? [{ href: "/trainer", label: "Mi profe", Icon: UsersIcon }] : []),
    { href: "/perfil",    label: "Perfil", Icon: ProfileIcon },
  ];

  return (
    <nav className="bottom-nav">
      {links.map((l) => {
        const active = path === l.href || (l.href !== "/dashboard" && path.startsWith(l.href));
        return (
          <Link key={l.href} href={l.href} className={`nav-link${active ? " active" : ""}`}>
            <span className="nav-icon">
              <l.Icon active={active} />
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
