/**
 * (app)/page.tsx
 * Índice del grupo `(app)`: redirige al dashboard.
 */

import { redirect } from "next/navigation";

/** Redirección a /dashboard. */
export default function AppPage() {
  redirect("/dashboard");
}
