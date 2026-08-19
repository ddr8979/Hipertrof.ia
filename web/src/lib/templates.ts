export type TemplateExercise = {
  name: string;
  sets: number;
  reps: string;
  rest: number;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  description: string;
  level: string;
  daysPerWeek: number;
  durationMin: number;
  exercises: TemplateExercise[];
};

export const ROUTINE_TEMPLATES: RoutineTemplate[] = [
  {
    id: "fb-beginner",
    name: "Cuerpo Completo · Principiante",
    description:
      "El clásico full body: 3 días por semana, todos los patrones de movimiento, perfecto para arrancar con base.",
    level: "Principiante",
    daysPerWeek: 3,
    durationMin: 45,
    exercises: [
      { name: "Sentadilla en multipower (Smith)", sets: 3, reps: "10", rest: 90 },
      { name: "Press de banca en polea", sets: 3, reps: "10", rest: 90 },
      { name: "Jalón al pecho en polea", sets: 3, reps: "10", rest: 90 },
      { name: "Curl de bíceps con mancuernas", sets: 3, reps: "12", rest: 60 },
      { name: "Plancha completa", sets: 3, reps: "30s", rest: 60 },
    ],
  },
  {
    id: "ppl",
    name: "Push · Pull · Legs",
    description:
      "La división de entrenamiento más popular: 6 días de calidad, frecuencia 2 por grupo muscular.",
    level: "Intermedio",
    daysPerWeek: 6,
    durationMin: 60,
    exercises: [
      { name: "Press de banca en polea", sets: 4, reps: "8", rest: 120 },
      { name: "Push press con mancuernas", sets: 4, reps: "10", rest: 120 },
      { name: "Triceps fondos", sets: 3, reps: "12", rest: 60 },
      { name: "Dominadas", sets: 4, reps: "8", rest: 120 },
      { name: "Remo en barra T en máquina", sets: 4, reps: "10", rest: 90 },
      { name: "Curl con barra", sets: 3, reps: "12", rest: 60 },
      { name: "Sentadilla profunda", sets: 4, reps: "10", rest: 120 },
      { name: "Peso muerto en multipower (Smith)", sets: 4, reps: "10", rest: 120 },
      { name: "Elevación de talones en multipower (Smith)", sets: 4, reps: "15", rest: 60 },
    ],
  },
  {
    id: "strength-5x5",
    name: "Fuerza 5×5",
    description:
      "El programa clásico de fuerza: 5 series de 5 repeticiones en los levantamientos compuestos.",
    level: "Avanzado",
    daysPerWeek: 3,
    durationMin: 75,
    exercises: [
      { name: "Sentadilla profunda", sets: 5, reps: "5", rest: 180 },
      { name: "Press de banca en polea", sets: 5, reps: "5", rest: 180 },
      { name: "Peso muerto en multipower (Smith)", sets: 5, reps: "5", rest: 180 },
      { name: "Remo en barra T en máquina", sets: 5, reps: "5", rest: 180 },
      { name: "Curl con barra", sets: 3, reps: "8", rest: 120 },
    ],
  },
  {
    id: "upper-lower",
    name: "Torso / Pierna",
    description:
      "Upper-Lower clásico: 4 días por semana con frecuencia 2 y mucho volumen por sesión.",
    level: "Intermedio",
    daysPerWeek: 4,
    durationMin: 55,
    exercises: [
      { name: "Press de banca en polea", sets: 4, reps: "8", rest: 120 },
      { name: "Remo en barra T en máquina", sets: 4, reps: "8", rest: 120 },
      { name: "Push press con mancuernas", sets: 3, reps: "10", rest: 90 },
      { name: "Curl martillo con mancuernas", sets: 3, reps: "12", rest: 60 },
      { name: "Sentadilla profunda", sets: 4, reps: "10", rest: 120 },
      { name: "Peso muerto en multipower (Smith)", sets: 3, reps: "8", rest: 120 },
      { name: "Zancada con mancuernas", sets: 3, reps: "10", rest: 90 },
      { name: "Bicicleta abdominal", sets: 3, reps: "20", rest: 60 },
    ],
  },
];