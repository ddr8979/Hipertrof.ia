"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
import { 
  Plus, Search, Utensils, Egg, Flame, Beef, Sparkles, PlusCircle, 
  Check, Filter, X, Info, Apple, Heart, ChevronRight, HelpCircle
} from "lucide-react";
import { Toast } from "@/components/toast";

type Recipe = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  description?: string | null;
  category?: string | null;
  imageEmoji?: string | null;
  dietTypes?: string | null;
  prepMinutes?: number | null;
  difficulty?: string | null;
  servings?: number | null;
};

type Food = { name: string; calories: number; proteinG: number; carbsG: number; fatsG: number };
type MealLog = { id: string; calories: number; proteinG: number | null; carbsG: number | null; fatsG: number | null; recipe: Recipe | null };
type ToastType = { msg: string; type: "success" | "error" };

const CATEGORIES = [
  { value: "Todos", label: "🍽️ Todos" },
  { value: "desayuno", label: "🥣 Desayuno" },
  { value: "almuerzo", label: "🥩 Almuerzo" },
  { value: "cena", label: "🥗 Cena" },
  { value: "snack", label: "🥜 Snack" },
  { value: "postre", label: "🍫 Postre" }
];

const DIETS = [
  { value: "Todos", label: "🌎 Cualquier Dieta" },
  { value: "omnivoro", label: "🥩 Omnívoro" },
  { value: "vegetariano", label: "🥗 Vegetariano" },
  { value: "vegano", label: "🌱 Vegano" },
  { value: "sin_gluten", label: "🌾 Sin Gluten" }
];

export default function NutricionPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [foodItems, setFoodItems] = useState<Food[]>([]);
  const [diary, setDiary] = useState<MealLog[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [recommendedRecipe, setRecommendedRecipe] = useState<Recipe | null>(null);
  const [totals, setTotals] = useState({ calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
  const [toast, setToast] = useState<ToastType | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"diario" | "crear">("diario");
  const [busy, setBusy] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [selectedDiet, setSelectedDiet] = useState("Todos");
  const [maxCalFilter, setMaxCalFilter] = useState("");

  // Create Form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCal, setNewCal] = useState("500");
  const [newProt, setNewProt] = useState("30");
  const [newCarb, setNewCarb] = useState("50");
  const [newFat, setNewFat] = useState("12");
  const [newCat, setNewCat] = useState("almuerzo");
  const [newEmoji, setNewEmoji] = useState("🍽️");

  // Detail Modal
  const [activeRecipeDetail, setActiveRecipeDetail] = useState<Recipe | null>(null);

  // UY Food Search
  const [foodSearch, setFoodSearch] = useState("");

  const load = useCallback(async () => {
    try {
      const [resRecipes, resFoods, resDiary, resProfile] = await Promise.all([
        fetch("/api/nutricion/recetas"),
        fetch(`/api/nutricion/alimentos?q=${encodeURIComponent(foodSearch)}`),
        fetch("/api/nutricion/diario"),
        fetch("/api/profile")
      ]);

      const dataRecipes = await resRecipes.json();
      const dataFoods = await resFoods.json();
      const dataDiary = await resDiary.json();
      const dataProfile = await resProfile.json();

      const allRecipes: Recipe[] = dataRecipes.recipes ?? [];
      setRecipes(allRecipes);
      setFoodItems(dataFoods.items ?? []);
      setDiary(dataDiary.logs ?? []);
      setTotals(dataDiary.totals ?? { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 });
      
      const prof = dataProfile.user?.profile ?? null;
      setProfile(prof);

      // Calcular recomendación inteligente
      if (prof && allRecipes.length > 0) {
        let filtered = [...allRecipes];

        // 1. Filtrar por dieta del perfil
        if (prof.dietType && prof.dietType !== "omnivoro") {
          filtered = filtered.filter(r => {
            try {
              const types = JSON.parse(r.dietTypes ?? "[]");
              return types.includes(prof.dietType);
            } catch { return true; }
          });
        }

        // 2. Filtrar por alimentos prohibidos (foodDislikes)
        let dislikes: string[] = [];
        if (prof.foodDislikes) {
          try { dislikes = JSON.parse(prof.foodDislikes); } catch {}
        }
        if (dislikes.length > 0) {
          filtered = filtered.filter(r => {
            const desc = (r.description ?? "").toLowerCase();
            const name = r.name.toLowerCase();
            return !dislikes.some(d => desc.includes(d.toLowerCase()) || name.includes(d.toLowerCase()));
          });
        }

        // 3. Scorear afinidades con ingredientes favoritos (foodLikes)
        let likes: string[] = [];
        if (prof.foodLikes) {
          try { likes = JSON.parse(prof.foodLikes); } catch {}
        }

        filtered.sort((a, b) => {
          let scoreA = 0;
          let scoreB = 0;

          likes.forEach(like => {
            const l = like.toLowerCase();
            if (a.name.toLowerCase().includes(l) || (a.description ?? "").toLowerCase().includes(l)) scoreA += 5;
            if (b.name.toLowerCase().includes(l) || (b.description ?? "").toLowerCase().includes(l)) scoreB += 5;
          });

          // Puntos por dietGoal
          if (prof.dietGoal === "definicion") {
            scoreA += (a.proteinG / (a.calories || 1)) * 100;
            scoreB += (b.proteinG / (b.calories || 1)) * 100;
          } else if (prof.dietGoal === "volumen") {
            scoreA += a.calories / 100;
            scoreB += b.calories / 100;
          }

          return scoreB - scoreA;
        });

        setRecommendedRecipe(filtered[0] || allRecipes[0]);
      } else if (allRecipes.length > 0) {
        setRecommendedRecipe(allRecipes[0]);
      }
    } catch (e) {
      console.error("Error cargando nutricion:", e);
    }
  }, [foodSearch]);

  useEffect(() => {
    load();
  }, [load]);

  async function createRecipe() {
    if (!newName.trim()) {
      setToast({ msg: "Escribí el nombre del plato", type: "error" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/nutricion/recetas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDesc,
          calories: Number(newCal),
          proteinG: Number(newProt),
          carbsG: Number(newCarb),
          fatsG: Number(newFat),
          category: newCat,
          imageEmoji: newEmoji
        }),
      });
      if (res.ok) {
        setToast({ msg: "Receta guardada con éxito ✅", type: "success" });
        setNewName("");
        setNewDesc("");
        setActiveSubTab("diario");
        await load();
      } else {
        setToast({ msg: "Error al guardar la receta", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  async function addToDiary(recipe: Recipe) {
    setBusy(true);
    try {
      const res = await fetch("/api/nutricion/diario", {
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
      if (res.ok) {
        setToast({ msg: `Comida "${recipe.name}" agregada ✅`, type: "success" });
        await load();
      } else {
        setToast({ msg: "Error al agregar al diario", type: "error" });
      }
    } finally {
      setBusy(false);
    }
  }

  // Filtrado de biblioteca
  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredRecipes = recipes.filter(r => {
    const qNorm = normalize(searchQuery);
    const matchesSearch = !searchQuery || normalize(r.name).includes(qNorm) || (r.description && normalize(r.description).includes(qNorm));
    const matchesCategory = selectedCategory === "Todos" || r.category === selectedCategory;
    
    let matchesDiet = true;
    if (selectedDiet !== "Todos") {
      try {
        const types: string[] = JSON.parse(r.dietTypes ?? "[]");
        matchesDiet = types.includes(selectedDiet);
      } catch { matchesDiet = false; }
    }

    const matchesCal = !maxCalFilter || r.calories <= Number(maxCalFilter);

    return matchesSearch && matchesCategory && matchesDiet && matchesCal;
  });

  return (
    <main className="page anim-fade">
      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <header style={{ marginBottom: 16 }}>
        <span className="badge badge-green" style={{ marginBottom: 6 }}>Módulo Nutrición</span>
        <h1 className="page-title grad-text" style={{ fontSize: "1.55rem" }}>Recetario & Alimentación</h1>
        <p className="page-sub" style={{ margin: 0, fontSize: "0.82rem" }}>Controlá tus macros y descubrí recetas personalizadas para vos</p>
      </header>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${activeSubTab === "diario" ? " active" : ""}`} onClick={() => setActiveSubTab("diario")}>
          🍽️ Mi Diario y Recetas
        </button>
        <button className={`tab-btn${activeSubTab === "crear" ? " active" : ""}`} onClick={() => setActiveSubTab("crear")}>
          ➕ Crear Receta
        </button>
      </div>

      {activeSubTab === "diario" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Macronutrientes Acumulados */}
          <div className="glass card" style={{ padding: 16 }}>
            <p className="section-title" style={{ margin: "0 0 12px" }}>Macros Consumidos Hoy</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[
                { label: "Calorías", val: `${totals.calories} kcal`, color: "var(--brand)" },
                { label: "Proteína", val: `${totals.proteinG}g`, color: "var(--brand2)" },
                { label: "Carbos", val: `${totals.carbsG}g`, color: "var(--brand3)" },
                { label: "Grasas", val: `${totals.fatsG}g`, color: "var(--warn)" }
              ].map(m => (
                <div key={m.label} style={{
                  padding: "10px 4px", borderRadius: "var(--radius-xs)", textAlign: "center",
                  background: "rgba(255,255,255,0.015)", border: "1px solid var(--border)"
                }}>
                  <p style={{ margin: 0, fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{m.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: "0.95rem", fontWeight: 900, color: m.color }}>{m.val}</p>
                </div>
              ))}
            </div>
            
            {/* Progress line */}
            {profile?.tdeeKcal && (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text2)", marginBottom: 4, fontWeight: 700 }}>
                  <span>Progreso Calórico</span>
                  <span>{totals.calories} / {profile.tdeeKcal} kcal</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (totals.calories / profile.tdeeKcal) * 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          {/* Recomendación Inteligente */}
          {recommendedRecipe && (
            <div className="glass card" style={{
              border: "1.5px solid rgba(0, 255, 135, 0.25)",
              background: "linear-gradient(135deg, rgba(0,255,135,0.04) 0%, rgba(255,255,255,0.01) 100%)",
              boxShadow: "0 8px 32px -4px rgba(0,255,135,0.05)",
              position: "relative",
              overflow: "hidden"
            }}>
              <div style={{ position: "absolute", right: 14, top: 14 }}>
                <span className="badge badge-green" style={{ display: "flex", gap: 4, height: 26, fontSize: "0.68rem" }}><Sparkles size={11} /> RECOMENDADO</span>
              </div>
              
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
                <span style={{ fontSize: "2.4rem", flexShrink: 0 }}>{recommendedRecipe.imageEmoji ?? "🍽️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--brand)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>Recomendación para tu objetivo</p>
                  <h3 style={{ margin: "2px 0 4px", fontSize: "1.05rem", fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{recommendedRecipe.name}</h3>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text2)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {recommendedRecipe.description ?? "Una deliciosa receta adaptada a tus requerimientos nutricionales del perfil."}
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12, borderTop: "1px dashed var(--border)", paddingTop: 12, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text)" }}>{recommendedRecipe.calories} kcal</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 6 }}>
                    P {recommendedRecipe.proteinG}g · C {recommendedRecipe.carbsG}g · G {recommendedRecipe.fatsG}g
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button type="button" onClick={() => setActiveRecipeDetail(recommendedRecipe)} className="btn btn-ghost btn-xs" style={{ height: 32, padding: "0 10px" }}>
                    Técnica
                  </button>
                  <button type="button" onClick={() => addToDiary(recommendedRecipe)} className="btn btn-primary btn-xs" style={{ height: 32, padding: "0 10px" }} disabled={busy}>
                    + Comer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Diario de Hoy */}
          <div>
            <p className="section-title">Comidas Ingeridas Hoy</p>
            {diary.length === 0 ? (
              <div className="empty-state glass" style={{ padding: "26px 16px" }}>
                <div className="empty-state-icon" style={{ background: "rgba(255,255,255,0.03)", width: 48, height: 48, fontSize: "1.4rem" }}>🍽️</div>
                <p className="empty-title">Sin comidas cargadas hoy</p>
                <p className="empty-sub">Buscá una receta abajo y agregala a tu diario de alimentación.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {diary.map(d => (
                  <div key={d.id} className="list-item" style={{ padding: "10px 14px", margin: 0 }}>
                    <div style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0 }}>
                      <Egg size={16} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {d.recipe?.name ?? "Alimento libre"}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text2)" }}>
                        P {d.proteinG ?? 0}g · C {d.carbsG ?? 0}g · G {d.fatsG ?? 0}g
                      </p>
                    </div>
                    <span className="badge badge-green" style={{ height: 22, fontSize: "0.68rem" }}>{d.calories} kcal</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biblioteca de Recetas */}
          <div>
            <p className="section-title">Biblioteca de Recetas Inteligente</p>
            
            {/* Buscador & Chips */}
            <div className="glass card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input className="input" style={{ minHeight: 44, height: 44, fontSize: "0.88rem", paddingLeft: 40 }}
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Buscar receta (ej: avena, pollo, pasta)..." />
                <Search size={16} color="var(--muted)" style={{ position: "absolute", left: 14 }} />
              </div>
              
              {/* Categorías scroll horizontal */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
                {CATEGORIES.map(c => (
                  <button key={c.value} type="button" onClick={() => setSelectedCategory(c.value)} className={`chip ${selectedCategory === c.value ? "active" : ""}`}
                    style={{ flexShrink: 0, height: 32, fontSize: "0.75rem", padding: "0 12px" }}>
                    {c.label}
                  </button>
                ))}
              </div>

              {/* Dietas scroll horizontal */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
                {DIETS.map(d => (
                  <button key={d.value} type="button" onClick={() => setSelectedDiet(d.value)} className={`chip ${selectedDiet === d.value ? "active" : ""}`}
                    style={{ flexShrink: 0, height: 32, fontSize: "0.75rem", padding: "0 12px", borderStyle: "dashed" }}>
                    {d.label}
                  </button>
                ))}
              </div>
              
              {/* Max Calories Input */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Filter size={13} color="var(--muted)" />
                <span style={{ fontSize: "0.75rem", color: "var(--text2)", fontWeight: 700 }}>Máx. calorías:</span>
                <input className="input" type="number" style={{ minHeight: 32, height: 32, width: 90, fontSize: "0.8rem", padding: "0 8px", borderRadius: 8 }}
                  value={maxCalFilter} onChange={e => setMaxCalFilter(e.target.value)} placeholder="Ej: 600" />
              </div>
            </div>

            {/* Recetas Grid */}
            {filteredRecipes.length === 0 ? (
              <div className="empty-state glass">
                <HelpCircle size={24} color="var(--muted)" />
                <p className="empty-title">Sin recetas</p>
                <p className="empty-sub">No hay recetas que cumplan con los filtros de búsqueda seleccionados.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {filteredRecipes.slice(0, 40).map(recipe => (
                  <div key={recipe.id} className="glass card-sm" style={{
                    display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 10,
                    border: "1px solid var(--border)", position: "relative"
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: "1.8rem" }}>{recipe.imageEmoji ?? "🍽️"}</span>
                      <div style={{ minWidth: 0 }}>
                        <h4 style={{ margin: 0, fontWeight: 900, fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={recipe.name}>{recipe.name}</h4>
                        <span style={{ fontSize: "0.72rem", color: "var(--muted)", textTransform: "capitalize" }}>{recipe.category}</span>
                      </div>
                    </div>

                    <div>
                      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 800, color: "var(--brand)" }}>{recipe.calories} kcal</p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "var(--text2)", fontWeight: 500 }}>
                        P {recipe.proteinG}g · C {recipe.carbsG}g · G {recipe.fatsG}g
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                      <button type="button" onClick={() => setActiveRecipeDetail(recipe)} className="btn btn-ghost btn-xs" style={{ flex: 1, minHeight: 30, height: 30, padding: 0 }}>
                        Detalle
                      </button>
                      <button type="button" onClick={() => addToDiary(recipe)} className="btn btn-primary btn-xs" style={{ flex: 1, minHeight: 30, height: 30, padding: 0 }} disabled={busy}>
                        Comer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Buscador de Alimentos UY */}
          <div className="glass card" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Apple size={16} color="var(--brand2)" />
              <p className="section-title" style={{ margin: 0 }}>Base de Alimentos UY (Carga rápida)</p>
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <input className="input" placeholder="Buscar dulce de leche, manteca, etc..." value={foodSearch} onChange={(e) => setFoodSearch(e.target.value)} style={{ minHeight: 44, height: 44, fontSize: "0.88rem" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {foodItems.length === 0 ? (
                <p style={{ fontSize: "0.78rem", color: "var(--muted)", textAlign: "center", padding: "10px 0", margin: 0 }}>
                  No se encontraron alimentos en la base uruguaya.
                </p>
              ) : (
                foodItems.slice(0, 5).map((f) => (
                  <div className="glass card-sm" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-xs)" }} key={f.name}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ margin: 0, fontSize: "0.7rem", color: "var(--text2)" }}>
                        P {f.proteinG}g · C {f.carbsG}g · G {f.fatsG}g
                      </p>
                    </div>
                    <button type="button" onClick={() => {
                      addToDiary({
                        id: "",
                        name: f.name,
                        calories: f.calories,
                        proteinG: f.proteinG,
                        carbsG: f.carbsG,
                        fatsG: f.fatsG
                      });
                    }} className="badge badge-blue" style={{ height: 24, cursor: "pointer", border: "none" }}>
                      + {f.calories} kcal
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* CREAR RECETA PERSONALIZADA TAB */}
      {activeSubTab === "crear" && (
        <div className="anim-fade glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <PlusCircle size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Crear Nueva Receta Personalizada</p>
          </div>

          <div className="field">
            <label className="label">Nombre del plato</label>
            <input className="input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Omelette especial con jamón" style={{ minHeight: 52 }} required />
          </div>

          <div className="field">
            <label className="label">Instrucciones / Descripción</label>
            <textarea className="input" value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Cómo prepararla, ingredientes necesarios, etc..." rows={3} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div className="field">
              <label className="label">Categoría</label>
              <select className="input" value={newCat} onChange={e => setNewCat(e.target.value)} style={{ minHeight: 52 }}>
                <option value="desayuno">🥣 Desayuno</option>
                <option value="almuerzo">🥩 Almuerzo</option>
                <option value="cena">🥗 Cena</option>
                <option value="snack">🥜 Snack</option>
                <option value="postre">🍫 Postre</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Emoji Representativo</label>
              <input className="input" value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="Ej: 🥗 o 🍳" style={{ minHeight: 52, textAlign: "center" }} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "Calorías", val: newCal, set: setNewCal, pl: "500" },
              { label: "Prots (g)", val: newProt, set: setNewProt, pl: "30" },
              { label: "Carbs (g)", val: newCarb, set: setNewCarb, pl: "50" },
              { label: "Grasas (g)", val: newFat, set: setNewFat, pl: "12" }
            ].map(f => (
              <div key={f.label} className="field">
                <label className="label" style={{ fontSize: "0.6rem" }}>{f.label}</label>
                <input className="input" type="number" value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.pl} style={{ minHeight: 48, padding: "0 6px", fontSize: "0.95rem", textAlign: "center", fontWeight: 800 }} required />
              </div>
            ))}
          </div>

          <button onClick={createRecipe} className="btn btn-primary btn-full" disabled={busy} style={{ minHeight: 56, fontSize: "1rem", fontWeight: 800, marginTop: 8 }}>
            {busy ? "Guardando..." : "Guardar receta"}
          </button>
        </div>
      )}

      {/* ── DETALLE DE RECETA MODAL ── */}
      {activeRecipeDetail && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 16
        }} onClick={() => setActiveRecipeDetail(null)}>
          <div className="glass card" style={{
            width: "100%", maxWidth: 420, background: "#0c0f1d", display: "flex", flexDirection: "column", gap: 14, maxHeight: "85dvh", overflowY: "auto"
          }} onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start", borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
              <span style={{ fontSize: "3rem" }}>{activeRecipeDetail.imageEmoji ?? "🍽️"}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <span className="badge badge-purple" style={{ textTransform: "uppercase", fontSize: "0.62rem", height: 18 }}>{activeRecipeDetail.category}</span>
                <h3 style={{ margin: "4px 0 0", fontWeight: 900, fontSize: "1.15rem", color: "var(--brand)" }}>{activeRecipeDetail.name}</h3>
              </div>
              <button type="button" onClick={() => setActiveRecipeDetail(null)} className="btn-icon-sm btn-ghost" style={{ width: 32, height: 32, minHeight: 32, borderRadius: "50%", padding: 0, border: "none", background: "rgba(255,255,255,0.05)" }}>
                <X size={16} />
              </button>
            </div>

            {/* Macros stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
              {[
                { label: "Calorías", val: `${activeRecipeDetail.calories} kcal`, color: "var(--brand)" },
                { label: "Proteínas", val: `${activeRecipeDetail.proteinG}g`, color: "var(--brand2)" },
                { label: "Carbos", val: `${activeRecipeDetail.carbsG}g`, color: "var(--brand3)" },
                { label: "Grasas", val: `${activeRecipeDetail.fatsG}g`, color: "var(--warn)" }
              ].map(m => (
                <div key={m.label} style={{ background: "rgba(255,255,255,0.02)", padding: "6px 2px", borderRadius: 8, border: "1px solid var(--border)" }}>
                  <p style={{ margin: 0, fontSize: "0.55rem", color: "var(--muted)", fontWeight: 700, textTransform: "uppercase" }}>{m.label}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.85rem", fontWeight: 900, color: m.color }}>{m.val}</p>
                </div>
              ))}
            </div>

            {/* Metadatos (Tiempos, Dificultad, Porciones) */}
            <div style={{ display: "flex", gap: 10, justifyContent: "space-between", background: "rgba(255,255,255,0.01)", padding: 8, borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.78rem", color: "var(--text2)" }}>
              <span>⏱️ Prep: {activeRecipeDetail.prepMinutes ?? 10} min</span>
              <span>🔥 Dif: {activeRecipeDetail.difficulty ?? "fácil"}</span>
              <span>🍽️ Servings: {activeRecipeDetail.servings ?? 1} porc.</span>
            </div>

            {/* Instrucciones / Preparación */}
            <div>
              <p style={{ margin: "0 0 6px", fontWeight: 800, fontSize: "0.85rem", color: "var(--text)", textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center", gap: 4 }}>
                <Info size={12} /> Preparación & Técnica
              </p>
              <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text2)" }}>
                {activeRecipeDetail.description || "No hay instrucciones cargadas para esta receta. Mezcla los ingredientes y controla tus macronutrientes correspondientes."}
              </p>
            </div>

            {/* Acciones */}
            <div style={{ display: "flex", gap: 10, marginTop: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <button type="button" onClick={() => setActiveRecipeDetail(null)} className="btn btn-ghost" style={{ flex: 1, minHeight: 48, height: 48, fontSize: "0.9rem" }}>
                Cerrar
              </button>
              <button type="button" onClick={() => {
                addToDiary(activeRecipeDetail);
                setActiveRecipeDetail(null);
              }} className="btn btn-primary" style={{ flex: 2, minHeight: 48, height: 48, fontSize: "0.95rem", fontWeight: 900 }} disabled={busy}>
                + Añadir a mi diario
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
