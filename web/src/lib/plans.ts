/** Identificadores de los planes de suscripción disponibles. */
export type Plan = "free" | "plus" | "deluxe";

/**
 * Definición de los planes mostrados en la UI.
 * `accent` es el color de marca y `popular` marca el plan destacado.
 */
export const PLANS: {
  id: Plan;
  name: string;
  priceUyu: number;
  features: string[];
  accent: string;
  popular?: boolean;
}[] = [
  {
    id: "free",
    name: "Free",
    priceUyu: 0,
    features: [
      "Diario de cargas ilimitado",
      "Rutinas y plantillas",
      "Nutrición con recetas",
      "Social y mensajes",
      "Perfil personalizable",
    ],
    accent: "#a0c499",
  },
  {
    id: "plus",
    name: "Plus",
    priceUyu: 499,
    features: [
      "Todo lo de Free",
      "Registrarte como personal trainer",
      "Gestionar alumnos y asignar rutinas",
      "Editar rutinas de tus alumnos",
      "Vender cursos en el marketplace",
      "Seguimiento de progreso de clientes",
    ],
    accent: "#8fb6e0",
    popular: true,
  },
  {
    id: "deluxe",
    name: "Deluxe",
    priceUyu: 999,
    features: [
      "Todo lo de Plus",
      "Sin límite de alumnos",
      "Análisis avanzado de progreso",
      "Badge Deluxe exclusivo en tu perfil",
      "Soporte prioritario",
      "Nuevas funciones premium primero",
    ],
    accent: "#e8c489",
  },
];

/** Devuelve el nombre legible del plan; cae a "Free" si el id no existe. */
export function planLabel(p: Plan): string {
  const f = PLANS.find((x) => x.id === p);
  return f?.name ?? "Free";
}