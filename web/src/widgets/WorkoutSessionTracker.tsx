"use client";
import React, { useState, useEffect } from "react";
import { useWorkoutStore, SetType } from "@/entities/workout/model/workoutStore";
import { 
  Check, Plus, Trash2, Clock, Dumbbell, MoreVertical, Eye, Search, X 
} from "lucide-react";

type ExerciseItem = {
  id: string;
  name: string;
  gifUrl: string | null;
  muscleGroup: string | null;
  equipment: string | null;
};

export function WorkoutSessionTracker() {
  const {
    isActive,
    startTime,
    exercises,
    startWorkout,
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    toggleSet,
    cycleSetType,
    updateSet,
    updateNotes,
    endWorkout,
    cancelWorkout
  } = useWorkoutStore();

  const [elapsedSec, setElapsedSec] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [dbExercises, setDbExercises] = useState<ExerciseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewGif, setPreviewGif] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");

  // Timer tick
  useEffect(() => {
    if (!isActive || !startTime) return;
    const interval = setInterval(() => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      setElapsedSec(Math.floor((now - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, startTime]);

  // Load exercises catalog for picker
  useEffect(() => {
    fetch("/api/exercises")
      .then((r) => r.json())
      .then((d) => setDbExercises(d.exercises ?? []));
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins}m`;
    }
    return `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;
  };

  // Calculate total volume and completed sets
  let totalVolumeKg = 0;
  let completedSetsCount = 0;

  exercises.forEach((ex) => {
    let normalIndex = 1;
    ex.sets.forEach((set) => {
      if (set.completed) {
        completedSetsCount++;
        totalVolumeKg += (set.weight || 0) * (set.reps || 0);
      }
    });
  });

  const getSetBadgeLabel = (set: { type: SetType }, indexInExercise: number, normalCounter: number) => {
    if (set.type === "W") return { label: "W", bg: "rgba(255, 149, 0, 0.18)", color: "#ff9500", border: "rgba(255, 149, 0, 0.4)" };
    if (set.type === "F") return { label: "F", bg: "rgba(255, 59, 48, 0.18)", color: "#ff3b30", border: "rgba(255, 59, 48, 0.4)" };
    if (set.type === "D") return { label: "D", bg: "rgba(175, 82, 222, 0.18)", color: "#af52de", border: "rgba(175, 82, 222, 0.4)" };
    return { label: String(normalCounter), bg: "rgba(255, 255, 255, 0.08)", color: "var(--text)", border: "var(--border)" };
  };

  const filteredPickerExercises = dbExercises.filter((ex) => {
    if (!searchQuery) return true;
    return ex.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isActive && exercises.length === 0) {
    return (
      <div 
        className="glass card" 
        style={{ 
          padding: 24, 
          textAlign: "center", 
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center", 
          gap: 16,
          background: "linear-gradient(135deg, rgba(143,174,130,0.06), rgba(255,255,255,0.7))",
          border: "1.5px dashed var(--brand)" 
        }}
      >
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(143,174,130,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Dumbbell size={28} color="var(--brand2)" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem" }}>Diario de Cargas Activo</h3>
          <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text2)" }}>
            Registrá tus series en tiempo real con temporizador, sobrecarga progresiva y tipos de serie (W, F, D).
          </p>
        </div>
        <button 
          onClick={startWorkout} 
          className="btn btn-primary btn-full"
          style={{ fontSize: "1rem", fontWeight: 800 }}
        >
          <Plus size={18} /> Iniciar Sesión de Entreno
        </button>
      </div>
    );
  }

  return (
    <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── TOP ACTION HEADER BAR ────────────────────────────────────── */}
      <div 
        className="glass"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "12px 16px",
          borderRadius: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 8px 32px rgba(0,0,0,0.06)",
          background: "rgba(255, 255, 255, 0.95)",
          border: "1px solid var(--border2)"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#34c759", boxShadow: "0 0 8px #34c759" }} />
            <h2 style={{ margin: 0, fontWeight: 900, fontSize: "1.1rem" }}>Entreno en Vivo</h2>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 4, fontSize: "0.76rem", color: "var(--text2)", fontWeight: 700 }}>
            <span>⏱ {formatTimer(elapsedSec)}</span>
            <span>🏋️ {totalVolumeKg.toLocaleString()} kg</span>
            <span>✅ {completedSetsCount} series</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={cancelWorkout}
            className="btn btn-ghost btn-xs"
            style={{ color: "var(--danger)", border: "1px solid rgba(255,59,48,0.2)" }}
          >
            Cancelar
          </button>
          <button
            onClick={() => endWorkout()}
            className="btn btn-primary btn-xs"
            style={{ background: "#007aff", color: "#fff", fontWeight: 900, padding: "0 16px" }}
          >
            Terminar
          </button>
        </div>
      </div>

      {/* ── EXERCISES LIST ─────────────────────────────────────────────── */}
      {exercises.map((ex) => {
        let normalCounter = 0;

        return (
          <div 
            key={ex.exerciseId} 
            className="glass card"
            style={{ 
              padding: 16, 
              borderRadius: 20, 
              display: "flex", 
              flexDirection: "column", 
              gap: 12,
              border: "1px solid var(--border)" 
            }}
          >
            {/* Header Exercise Row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {ex.gifUrl && (
                  <button
                    type="button"
                    onClick={() => { setPreviewGif(ex.gifUrl!); setPreviewName(ex.name); }}
                    style={{ background: "rgba(143,174,130,0.15)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                  >
                    <Eye size={18} color="var(--brand2)" />
                  </button>
                )}
                <div>
                  <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.05rem", color: "var(--text)" }}>{ex.name}</h3>
                </div>
              </div>

              <button
                type="button"
                onClick={() => removeExercise(ex.exerciseId)}
                className="btn-icon-sm btn-ghost"
                style={{ border: "none", color: "var(--muted)" }}
                title="Eliminar ejercicio"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Notes Input */}
            <input
              className="input"
              style={{ minHeight: 38, height: 38, fontSize: "0.82rem", background: "rgba(0,0,0,0.02)", border: "1px solid var(--border)" }}
              placeholder="Agregar notas aquí..."
              value={ex.notes || ""}
              onChange={(e) => updateNotes(ex.exerciseId, e.target.value)}
            />

            {/* Rest Timer Banner */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", color: "#007aff", fontWeight: 700 }}>
              <Clock size={14} />
              <span>Descanso: 1min 30s</span>
            </div>

            {/* Sets Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Table Header */}
              <div style={{ display: "grid", gridTemplateColumns: "50px 1fr 70px 70px 44px", gap: 6, padding: "0 4px", fontSize: "0.68rem", fontWeight: 900, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", alignItems: "center" }}>
                <span>SERIE</span>
                <span>ANTERIOR</span>
                <span style={{ textAlign: "center" }}>KG</span>
                <span style={{ textAlign: "center" }}>REPS</span>
                <span style={{ textAlign: "center" }}>✓</span>
              </div>

              {/* Table Rows */}
              {ex.sets.map((set, setIdx) => {
                if (set.type === "N") {
                  normalCounter++;
                }
                const badge = getSetBadgeLabel(set, setIdx, normalCounter);

                return (
                  <div
                    key={set.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "50px 1fr 70px 70px 44px",
                      gap: 6,
                      alignItems: "center",
                      padding: "6px",
                      borderRadius: 12,
                      background: set.completed ? "rgba(52, 199, 89, 0.12)" : "rgba(0,0,0,0.02)",
                      border: set.completed ? "1px solid rgba(52, 199, 89, 0.3)" : "1px solid var(--border)",
                      transition: "all 150ms ease"
                    }}
                  >
                    {/* SERIE BADGE (Clickable cycle: N -> W -> F -> D) */}
                    <button
                      type="button"
                      onClick={() => cycleSetType(ex.exerciseId, set.id)}
                      style={{
                        width: 38,
                        height: 32,
                        borderRadius: 8,
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        fontSize: "0.85rem",
                        fontWeight: 900,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 100ms ease"
                      }}
                      title="Haz clic para cambiar tipo: Normal (1,2..), W (Warmup/Aproximación), F (Fallida), D (Drop)"
                    >
                      {badge.label}
                    </button>

                    {/* ANTERIOR */}
                    <span style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {set.previous || "—"}
                    </span>

                    {/* KG INPUT */}
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      className="input"
                      style={{
                        minHeight: 36,
                        height: 36,
                        padding: "0 6px",
                        textAlign: "center",
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        background: set.completed ? "rgba(255,255,255,0.9)" : "#ffffff"
                      }}
                      value={set.weight || ""}
                      onChange={(e) => updateSet(ex.exerciseId, set.id, { weight: Number(e.target.value) })}
                    />

                    {/* REPS INPUT */}
                    <input
                      type="number"
                      min="0"
                      className="input"
                      style={{
                        minHeight: 36,
                        height: 36,
                        padding: "0 6px",
                        textAlign: "center",
                        fontSize: "0.9rem",
                        fontWeight: 800,
                        background: set.completed ? "rgba(255,255,255,0.9)" : "#ffffff"
                      }}
                      value={set.reps || ""}
                      onChange={(e) => updateSet(ex.exerciseId, set.id, { reps: Number(e.target.value) })}
                    />

                    {/* CHECKBOX OK BUTTON */}
                    <button
                      type="button"
                      onClick={() => toggleSet(ex.exerciseId, set.id)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        border: "none",
                        background: set.completed ? "#34c759" : "rgba(0,0,0,0.08)",
                        color: set.completed ? "#ffffff" : "var(--muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: set.completed ? "0 2px 10px rgba(52,199,89,0.35)" : "none",
                        transition: "all 150ms ease"
                      }}
                    >
                      <Check size={20} strokeWidth={set.completed ? 3 : 2} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Set Button */}
            <button
              type="button"
              onClick={() => addSet(ex.exerciseId)}
              className="btn btn-ghost btn-sm btn-full"
              style={{ marginTop: 4, fontSize: "0.85rem", fontWeight: 800 }}
            >
              <Plus size={16} /> Agregar Serie
            </button>
          </div>
        );
      })}

      {/* ── ADD EXERCISE BUTTON ─────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => setShowExercisePicker(true)}
        className="btn btn-primary btn-full"
        style={{ minHeight: 52, fontSize: "1rem", fontWeight: 900, borderRadius: 16 }}
      >
        <Plus size={20} /> Agregar Ejercicio
      </button>

      {/* ── EXERCISE PICKER MODAL ─────────────────────────────────────── */}
      {showExercisePicker && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9990,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center"
          }}
          onClick={() => setShowExercisePicker(false)}
        >
          <div
            className="glass"
            style={{
              width: "100%",
              maxWidth: 520,
              maxHeight: "85dvh",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              background: "#ffffff"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: "1.15rem" }}>Seleccionar Ejercicio</h3>
              <button
                type="button"
                onClick={() => setShowExercisePicker(false)}
                className="btn-icon-sm btn-ghost"
                style={{ border: "none" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <input
                className="input"
                style={{ paddingLeft: 40 }}
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search size={16} color="var(--muted)" style={{ position: "absolute", left: 14, top: 18 }} />
            </div>

            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, flex: 1, paddingRight: 4 }}>
              {filteredPickerExercises.slice(0, 30).map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => {
                    addExercise({ exerciseId: ex.id, name: ex.name, gifUrl: ex.gifUrl });
                    setShowExercisePicker(false);
                  }}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer"
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem" }}>{ex.name}</p>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--muted)" }}>{ex.muscleGroup} · {ex.equipment}</p>
                  </div>
                  <Plus size={18} color="var(--brand2)" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PREVIEW GIF MODAL ─────────────────────────────────────────── */}
      {previewGif && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 9999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 16
          }}
          onClick={() => setPreviewGif(null)}
        >
          <div className="glass card" style={{ width: "100%", maxWidth: 360, background: "#ffffff", padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ fontWeight: 900, fontSize: "1.1rem", margin: "0 0 12px", color: "var(--text)" }}>{previewName}</p>
            <div style={{ background: "#000", borderRadius: 14, overflow: "hidden", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {previewGif.endsWith(".webm") ? (
                <video src={previewGif} autoPlay loop muted playsInline style={{ width: "100%", height: "auto", display: "block" }} />
              ) : (
                <img src={previewGif} alt={previewName} style={{ width: "100%", height: "auto", display: "block" }} />
              )}
            </div>
            <button onClick={() => setPreviewGif(null)} className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 14 }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
