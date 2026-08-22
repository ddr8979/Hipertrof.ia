export type Plan = "free" | "plus" | "deluxe";

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
    accent: "#a3e635",
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
    accent: "#3897f0",
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
    accent: "#f0b429",
  },
];

export function planLabel(p: Plan): string {
  const f = PLANS.find((x) => x.id === p);
  return f?.name ?? "Free";
}