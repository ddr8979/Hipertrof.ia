"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { Plus, Search, BookOpen, Utensils, Egg, Flame, Beef, Sparkles, PlusCircle } from "lucide-react";

type Recipe = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
};
type Food = { name: string; calories: number; proteinG: number; carbsG: number; fatsG: number };
type MealLog = { id: string; calories: number; proteinG: number | null; carbsG: number | null; fatsG: number | null; recipe: Recipe | null };

export default function NutricionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<Food[]>([]);
  const [diary, setDiary] = useState<MealLog[]>([]);
  const [totals, setTotals] = useState({ calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
  
  // Forms
  const [name, setName] = useState("Bowl de pollo y arroz");
  const [calories, setCalories] = useState("620");
  const [proteinG, setProteinG] = useState("42");
  const [carbsG, setCarbsG] = useState("70");
  const [fatsG, setFatsG] = useState("18");
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [feedback, setFeedback] = useState("");

  const load = useCallback(async () => {
    const [resRecipes, resFoods, resDiary] = await Promise.all([
      fetch("/api/nutricion/recetas"),
      fetch(`/api/nutricion/alimentos?q=${encodeURIComponent(foodSearch)}`),
      fetch("/api/nutricion/diario"),
    ]);

    const dataRecipes = (await resRecipes.json()) as { recipes: Recipe[] };
    const dataFoods = (await resFoods.json()) as { items: Food[] };
    const dataDiary = (await resDiary.json()) as { logs: MealLog[]; totals: typeof totals };

    setRecipes(dataRecipes.recipes ?? []);
    setFoodItems(dataFoods.items ?? []);
    setDiary(dataDiary.logs ?? []);
    setTotals(dataDiary.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
  }, [foodSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function createRecipe() {
    await fetch("/api/nutricion/recetas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name,
        calories: Number(calories),
        proteinG: Number(proteinG),
        carbsG: Number(carbsG),
        fatsG: Number(fatsG),
      }),
    });
    setFeedback("Receta guardada ✅");
    setTimeout(() => setFeedback(""), 1500);
    await load();
  }

  async function addToDiary() {
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return;
    await fetch("/api/nutricion/diario", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recipeId: recipe.id,
        calories: recipe.calories,
        proteinG: recipe.proteinG,
        carbsG: recipe.carbsG,
        fatsG: recipe.fatsG,
      }),
    });
    setFeedback("Comida agregada al diario ✅");
    setTimeout(() => setFeedback(""), 1500);
    await load();
  }

  return (
    <main className="page anim-fade">
      <header style={{ marginBottom: 20 }}>
        <span className="badge badge-green" style={{ marginBottom: 6 }}>Módulo Nutrición</span>
        <h1 className="page-title">Diario & Recetas</h1>
        <p className="page-sub" style={{ margin: 0 }}>Cargá tus comidas y controlá tus macronutrientes del día</p>
      </header>

      {/* Totals Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="stat-card glass" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1, color: "var(--brand)" }}>
            <Flame size={72} />
          </div>
          <span className="stat-label">Calorías Hoy</span>
          <span className="stat-value" style={{ color: "var(--brand)" }}>{totals.calories} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text2)" }}>kcal</span></span>
        </div>
        <div className="stat-card glass" style={{ position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: -10, bottom: -10, opacity: 0.1, color: "var(--brand2)" }}>
            <Beef size={72} />
          </div>
          <span className="stat-label">Proteínas</span>
          <span className="stat-value" style={{ color: "var(--brand2)" }}>{totals.proteinG}g</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        <div className="stat-card glass" style={{ padding: "14px 16px", border: "1px solid var(--border)" }}>
          <span className="stat-label" style={{ fontSize: "0.65rem" }}>Carbohidratos</span>
          <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--text)", letterSpacing: "-0.02em" }}>{totals.carbsG}g</span>
        </div>
        <div className="stat-card glass" style={{ padding: "14px 16px", border: "1px solid var(--border)" }}>
          <span className="stat-label" style={{ fontSize: "0.65rem" }}>Grasas Totales</span>
          <span style={{ fontSize: "1.45rem", fontWeight: 900, color: "var(--text2)", letterSpacing: "-0.02em" }}>{totals.fatsG}g</span>
        </div>
      </div>

      {/* Forms Section */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        
        {/* Guardar Receta Form */}
        <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Utensils size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Crear Nueva Receta</p>
          </div>

          <div className="field">
            <label className="label">Nombre del plato</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Bowl de pollo y arroz" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="field">
              <label className="label">Calorías (kcal)</label>
              <input className="input" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="Ej. 600" />
            </div>
            <div className="field">
              <label className="label">Proteínas (g)</label>
              <input className="input" type="number" value={proteinG} onChange={(e) => setProteinG(e.target.value)} placeholder="Ej. 40" />
            </div>
            <div className="field">
              <label className="label">Carbohidratos (g)</label>
              <input className="input" type="number" value={carbsG} onChange={(e) => setCarbsG(e.target.value)} placeholder="Ej. 65" />
            </div>
            <div className="field">
              <label className="label">Grasas (g)</label>
              <input className="input" type="number" value={fatsG} onChange={(e) => setFatsG(e.target.value)} placeholder="Ej. 15" />
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={createRecipe}>
            Guardar Receta
          </button>
        </div>

        {/* Añadir al diario form */}
        <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={18} color="var(--brand2)" />
            <p className="section-title" style={{ margin: 0 }}>Cargar al Diario de Hoy</p>
          </div>

          <div className="field">
            <label className="label">Elegí una receta guardada</label>
            <select className="input" value={selectedRecipeId} onChange={(e) => setSelectedRecipeId(e.target.value)}>
              <option value="">Seleccionar receta...</option>
              {recipes.map((r) => (
                <option value={r.id} key={r.id}>
                  {r.name} ({r.calories} kcal)
                </option>
              ))}
            </select>
          </div>

          <button className="btn btn-ghost btn-full" onClick={addToDiary} disabled={!selectedRecipeId}>
            Agregar al Diario
          </button>
        </div>

        {feedback && (
          <p className="anim-fade" style={{ fontSize: "0.85rem", color: "var(--brand)", fontWeight: 700, textAlign: "center", margin: 0 }}>
            {feedback}
          </p>
        )}

        {/* Diario de alimentación */}
        <div>
          <p className="section-title">Diario de Alimentación de Hoy</p>
          {diary.length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-state-icon">
                <Utensils size={28} />
              </div>
              <p className="empty-title">Sin comidas hoy</p>
              <p className="empty-sub">Cargá una receta arriba para ver el total acumulado de macros.</p>
            </div>
          ) : (
            diary.map((d) => (
              <div key={d.id} className="list-item">
                <div style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: "rgba(0,255,135,0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--brand)",
                  flexShrink: 0
                }}>
                  <Egg size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {d.recipe?.name ?? "Carga manual"}
                  </p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "var(--text2)" }}>
                    P {d.proteinG ?? 0}g / C {d.carbsG ?? 0}g / G {d.fatsG ?? 0}g
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <span className="badge badge-green" style={{ fontWeight: 800 }}>
                    {d.calories} kcal
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Base de alimentos UY */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Search size={16} color="var(--brand2)" />
            <p className="section-title" style={{ margin: 0 }}>Base de Alimentos UY</p>
          </div>
          <div className="field" style={{ marginBottom: 12 }}>
            <input className="input" placeholder="Buscar alimento uruguayo (ej. dulce de leche)..." value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {foodItems.length === 0 ? (
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", textAlign: "center", padding: "10px 0" }}>
                No se encontraron alimentos en la base uruguaya.
              </p>
            ) : (
              foodItems.map((f) => (
                <div className="glass card-sm" style={{ display: "flex", alignItems: "center", justifyContent: "between", gap: 12, border: "1px solid var(--border)" }} key={f.name}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem" }}>{f.name}</p>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text2)" }}>
                      P {f.proteinG}g / C {f.carbsG}g / G {f.fatsG}g
                    </p>
                  </div>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <span className="badge badge-blue">{f.calories} kcal</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </main>
  );
}
