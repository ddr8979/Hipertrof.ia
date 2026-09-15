import { redirect } from "next/navigation";

/**
 * Ruta heredada de Social.
 * Redirige a /explorar forzando la apertura del diálogo de compartir (?share=1),
 * para que los enlaces viejos sigan funcionando.
 */
export default function SocialPage() {
  redirect("/explorar?share=1");
}