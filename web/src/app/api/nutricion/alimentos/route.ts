import { NextResponse } from "next/server";

const foodsUY = [
  { name: "Asado magro", calories: 250, proteinG: 26, carbsG: 0, fatsG: 17 },
  { name: "Milanesa de pollo", calories: 290, proteinG: 24, carbsG: 10, fatsG: 16 },
  { name: "Arroz cocido", calories: 130, proteinG: 2, carbsG: 28, fatsG: 0 },
  { name: "Yerba mate (infusion)", calories: 2, proteinG: 0, carbsG: 0, fatsG: 0 },
  { name: "Dulce de leche", calories: 315, proteinG: 6, carbsG: 55, fatsG: 8 },
  { name: "Chivito al plato", calories: 620, proteinG: 45, carbsG: 30, fatsG: 34 },
  { name: "Huevo", calories: 155, proteinG: 13, carbsG: 1, fatsG: 11 },
  { name: "Avena", calories: 390, proteinG: 17, carbsG: 66, fatsG: 7 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").toLowerCase().trim();

  const items = q ? foodsUY.filter((f) => f.name.toLowerCase().includes(q)) : foodsUY;
  return NextResponse.json({ items });
}

