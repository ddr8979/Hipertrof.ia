// Catálogos únicos del proyecto (usados por rutinas, ejercicios, trainer y calculadora)

export const MUSCLE_GROUPS = [
  "Pecho",
  "Espalda",
  "Hombros",
  "Brazos",
  "Antebrazos",
  "Piernas",
  "Abdomen",
  "Cardio",
  "Cuello",
] as const;

export const EQUIPMENTS = [
  "Peso Corporal",
  "Barra",
  "Barra Olímpica",
  "Barra EZ",
  "Barra Hexagonal",
  "Mancuernas",
  "Polea",
  "Multipower (Smith)",
  "Pesa Rusa (Kettlebell)",
  "Máquina de Palanca",
  "Asistido",
  "Bandas Elásticas",
  "Con Lastre",
  "Balón Medicinal",
  "Fitball",
  "Bosu",
  "Cuerda",
  "Trineo",
  "Rueda Abdominal",
  "Foam Roller",
  "Neumático",
  "Bicicleta Estática",
  "Elíptica",
  "Escaladora",
  "Ergómetro de Brazos",
  "SkiErg",
  "Martillo",
] as const;

export const ACTIVITY_LABELS: Record<string, string> = {
  sedentary: "Sedentario",
  light: "Ligero (1–3 días)",
  moderate: "Moderado (3–5 días)",
  very: "Alto (6–7 días)",
  extra: "Muy alto (2 sesiones/día)",
};

export const DIET_TYPES: Record<string, string> = {
  omnivoro: "Omnívoro",
  vegetariano: "Vegetariano",
  vegano: "Vegano",
  sin_gluten: "Sin gluten",
};

export const DIET_GOALS: Record<string, string> = {
  volumen: "Volumen",
  definicion: "Definición",
  mantenimiento: "Mantenimiento",
};
