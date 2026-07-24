export type Sex = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "very"
  | "extra";

export type CaloriesInput = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activity: ActivityLevel;
};

export type CaloriesResult = {
  bmrKcal: number;
  tdeeKcal: number;
  activityFactor: number;
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

function round(n: number) {
  return Math.round(n);
}

function assertFinitePositive(name: string, value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a finite positive number`);
  }
}

/**
 * Mifflin-St Jeor estimate.
 * Returns BMR (basal) and TDEE (maintenance estimate).
 */
export function mifflinStJeor(input: CaloriesInput): CaloriesResult {
  assertFinitePositive("ageYears", input.ageYears);
  assertFinitePositive("heightCm", input.heightCm);
  assertFinitePositive("weightKg", input.weightKg);

  const factor = ACTIVITY_FACTORS[input.activity];
  if (!Number.isFinite(factor)) throw new Error("Invalid activity level");

  // Mifflin-St Jeor formula:
  // Men: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5
  // Women: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) - 161
  const bmr =
    input.sex === "male"
      ? 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears + 5
      : 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears - 161;

  const tdee = bmr * factor;

  return {
    bmrKcal: round(bmr),
    tdeeKcal: round(tdee),
    activityFactor: factor,
  };
}

export const activityOptions: Array<{
  value: ActivityLevel;
  label: string;
  factor: number;
}> = [
  { value: "sedentary", label: "Sedentario (poco o nada de ejercicio)", factor: ACTIVITY_FACTORS.sedentary },
  { value: "light", label: "Ligero (1–3 días/semana)", factor: ACTIVITY_FACTORS.light },
  { value: "moderate", label: "Moderado (3–5 días/semana)", factor: ACTIVITY_FACTORS.moderate },
  { value: "very", label: "Alto (6–7 días/semana)", factor: ACTIVITY_FACTORS.very },
  { value: "extra", label: "Muy alto (doble sesión / trabajo físico)", factor: ACTIVITY_FACTORS.extra },
];
