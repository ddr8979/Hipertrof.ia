"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { 
  BookOpen, Search, Dumbbell, ArrowLeft, Eye, EyeOff, Info, HelpCircle, ChevronDown, ChevronUp
} from "lucide-react";
import { GLOSARIO_ITEMS, GlosarioItem } from "@/lib/glosario-data";

type ExerciseData = {
  id: string;
  name: string;
  muscleGroup: string | null;
  equipment: string | null;
  instructions: string | null;
  gifUrl: string | null;
};

const MUSCLE_GROUPS = [
  "Pecho", "Espalda", "Hombros", 
  "Brazos (Bíceps/Tríceps)", "Antebrazos", 
  "Piernas (Muslos)", "Piernas (Pantorrillas)", "Abdomen/Cintura", "Cardio"
];

const EQUIPMENTS = [
  "Peso Corporal", "Barra", "Mancuernas", "Polea", 
  "Discos", "Bandas Elásticas", "Máquina", "Multipower (Smith)", "Pesa Rusa (Kettlebell)", "Balón Medicinal", "Otro"
];

const GLOSARIO_CATEGORIES = ["Todos", "Entrenamiento", "Músculos", "Nutrición", "Equipamiento"];

export default function EjerciciosPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [activeTab, setActiveTab] = useState<"ejercicios" | "glosario">("ejercicios");
  
  // Ejercicios State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Glosario State
  const [glossaryQuery, setGlossaryQuery] = useState("");
  const [selectedGlossaryCategory, setSelectedGlossaryCategory] = useState("Todos");
  const [expandedGlossaryTerm, setExpandedGlossaryTerm] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/auth");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await fetch("/api/exercises");
        const data = await res.json();
        setExercises(data.exercises ?? []);
      } catch (err) {
        console.error("Error al cargar los ejercicios:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      fetchExercises();
    }
  }, [user]);

  const normalize = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const filteredExercises = exercises.filter((ex) => {
    const searchNorm = normalize(searchQuery);
    const matchesSearch = !searchQuery || normalize(ex.name).includes(searchNorm) || (ex.instructions && normalize(ex.instructions).includes(searchNorm));
    const matchesMuscle = !selectedMuscle || ex.muscleGroup === selectedMuscle;
    const matchesEquipment = !selectedEquipment || ex.equipment === selectedEquipment;
    return matchesSearch && matchesMuscle && matchesEquipment;
  });

  const filteredGlossary = GLOSARIO_ITEMS.filter((item) => {
    const queryNorm = normalize(glossaryQuery);
    const matchesSearch = !glossaryQuery || 
      normalize(item.term).includes(queryNorm) || 
      normalize(item.definition).includes(queryNorm);
    const matchesCategory = selectedGlossaryCategory === "Todos" || item.category === selectedGlossaryCategory;
    return matchesSearch && matchesCategory;
  });

  if (authLoading || loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page anim-fade">
      {/* Cabecera */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button 
          onClick={() => router.back()}
          className="btn-icon-sm btn-ghost"
          style={{ border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="page-title grad-text" style={{ fontSize: "1.5rem", margin: 0 }}>Glosario y Ejercicios</h1>
          <p className="page-sub" style={{ margin: 0, fontSize: "0.8rem" }}>Aprende la técnica y el vocabulario de entrenamiento</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar" style={{ marginBottom: 16 }}>
        <button className={`tab-btn${activeTab === "ejercicios" ? " active" : ""}`} onClick={() => setActiveTab("ejercicios")}>
          🏋️ Ejercicios
        </button>
        <button className={`tab-btn${activeTab === "glosario" ? " active" : ""}`} onClick={() => setActiveTab("glosario")}>
          📖 Glosario Fit
        </button>
      </div>

      {/* ── SECCIÓN EJERCICIOS ─────────────────────────────────────────── */}
      {activeTab === "ejercicios" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Buscador y Filtros */}
          <div className="glass card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input"
                style={{ minHeight: 44, height: 44, fontSize: "0.9rem", paddingLeft: 40 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o técnica..."
              />
              <Search size={16} color="var(--muted)" style={{ position: "absolute", left: 14 }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <select 
                className="input" 
                style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", flex: 1 }}
                value={selectedMuscle}
                onChange={(e) => setSelectedMuscle(e.target.value)}
              >
                <option value="">Todos los músculos</option>
                {MUSCLE_GROUPS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select 
                className="input" 
                style={{ minHeight: 38, height: 38, padding: "0 10px", fontSize: "0.8rem", flex: 1 }}
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
              >
                <option value="">Todo equipamiento</option>
                {EQUIPMENTS.map((eq) => (
                  <option key={eq} value={eq}>{eq}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Resultados Ejercicios */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredExercises.map((ex) => {
              const isExpanded = expandedId === ex.id;
              return (
                <div 
                  key={ex.id}
                  className="glass card"
                  style={{ 
                    padding: "14px 16px", 
                    border: isExpanded ? "1px solid rgba(0, 255, 135, 0.3)" : "1px solid var(--border)",
                    boxShadow: isExpanded ? "0 4px 20px rgba(0, 255, 135, 0.08)" : "none",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div 
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                    onClick={() => setExpandedId(isExpanded ? null : ex.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: isExpanded ? "var(--brand)" : "var(--text)" }}>{ex.name}</h3>
                      <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
                        <span className="badge badge-green" style={{ fontSize: "0.6rem", height: 18, padding: "0 6px" }}>{ex.muscleGroup}</span>
                        <span className="badge badge-blue" style={{ fontSize: "0.6rem", height: 18, padding: "0 6px" }}>{ex.equipment}</span>
                      </div>
                    </div>
                    <button 
                      className="btn-icon-sm"
                      style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      {isExpanded ? <EyeOff size={18} color="var(--brand)" /> : <Eye size={18} color="var(--muted)" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="anim-fade" style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                      {ex.gifUrl && (
                        <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                          <img 
                            src={ex.gifUrl} 
                            alt={ex.name} 
                            style={{ width: "100%", height: "auto", display: "block" }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400";
                            }}
                          />
                        </div>
                      )}
                      <div>
                        <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--muted)", fontWeight: 800, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                          <Info size={12} /> Instrucciones de Ejecución
                        </h4>
                        <p style={{ fontSize: "0.82rem", lineHeight: 1.5, color: "var(--text2)", margin: 0 }}>
                          {ex.instructions || "No hay instrucciones cargadas para este ejercicio."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredExercises.length === 0 && (
              <div className="empty-state glass">
                <HelpCircle size={28} color="var(--muted)" />
                <p className="empty-title">No encontramos ese ejercicio</p>
                <p className="empty-sub">Prueba con otras palabras o limpia los filtros de músculo y equipamiento.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SECCIÓN GLOSARIO ─────────────────────────────────────────── */}
      {activeTab === "glosario" && (
        <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Buscador Glosario */}
          <div className="glass card" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10, marginBottom: 4 }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <input
                className="input"
                style={{ minHeight: 44, height: 44, fontSize: "0.9rem", paddingLeft: 40 }}
                value={glossaryQuery}
                onChange={(e) => setGlossaryQuery(e.target.value)}
                placeholder="Buscar término o significado (ej: RIR, calorías)..."
              />
              <Search size={16} color="var(--muted)" style={{ position: "absolute", left: 14 }} />
            </div>
            
            {/* Categorías de Glosario */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
              {GLOSARIO_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedGlossaryCategory(cat)}
                  className={`chip ${selectedGlossaryCategory === cat ? "active" : ""}`}
                  style={{
                    flexShrink: 0,
                    padding: "6px 12px",
                    fontSize: "0.75rem",
                    border: selectedGlossaryCategory === cat ? "1.5px solid var(--brand)" : "1px solid var(--border)",
                    background: selectedGlossaryCategory === cat ? "rgba(0, 255, 135, 0.1)" : "transparent",
                    color: selectedGlossaryCategory === cat ? "var(--brand)" : "var(--text2)",
                    borderRadius: 99,
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Resultados Glosario */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filteredGlossary.map((item) => {
              const isExpanded = expandedGlossaryTerm === item.term;
              const categoryColors: Record<string, string> = {
                Entrenamiento: "var(--brand2)",
                Músculos: "var(--brand3)",
                Nutrición: "var(--warn)",
                Equipamiento: "var(--info)"
              };
              const catColor = categoryColors[item.category] || "var(--text2)";

              return (
                <div
                  key={item.term}
                  className="glass card"
                  style={{
                    padding: "14px 16px",
                    border: isExpanded ? `1.5px solid ${catColor}55` : "1px solid var(--border)",
                    boxShadow: isExpanded ? `0 4px 20px ${catColor}08` : "none",
                    transition: "all 0.2s ease",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedGlossaryTerm(isExpanded ? null : item.term)}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ margin: 0, fontWeight: 900, fontSize: "0.98rem", color: isExpanded ? catColor : "var(--text)" }}>
                        {item.term}
                      </h3>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span 
                          className="badge" 
                          style={{ 
                            fontSize: "0.6rem", 
                            height: 18, 
                            padding: "0 6px",
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            border: `1px solid ${catColor}33`
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn-icon-sm"
                      style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    >
                      {isExpanded ? <ChevronUp size={18} color={catColor} /> : <ChevronDown size={18} color="var(--muted)" />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="anim-fade" style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "0.85rem", lineHeight: 1.5, color: "var(--text2)", margin: 0 }}>
                        {item.definition}
                      </p>
                      {item.example && (
                        <div style={{ 
                          marginTop: 10, 
                          padding: 10, 
                          borderRadius: "var(--radius-xs)", 
                          background: "rgba(255,255,255,0.01)", 
                          borderLeft: `3px solid ${catColor}77`,
                          fontSize: "0.78rem",
                          color: "var(--muted)",
                          fontStyle: "italic"
                        }}>
                          <strong style={{ fontStyle: "normal", color: "var(--text)", display: "block", marginBottom: 2 }}>Ejemplo práctico:</strong>
                          {item.example}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredGlossary.length === 0 && (
              <div className="empty-state glass">
                <HelpCircle size={28} color="var(--muted)" />
                <p className="empty-title">No encontramos ese término</p>
                <p className="empty-sub">Prueba buscando otra palabra técnica o selecciona otra categoría.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
