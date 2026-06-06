"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";
import { ShoppingBag, Plus, BookOpen, Star, Sparkles, Tag, Check, Award } from "lucide-react";

type Course = {
  id: string;
  title: string;
  description: string | null;
  priceUyu: number;
  trainer: { email: string };
};
type Enrollment = { id: string; courseId: string; course: { title: string } };

export default function MarketplacePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [title, setTitle] = useState("Curso Full Hipertrofia 12 semanas");
  const [description, setDescription] = useState("Plan completo + videos + planillas");
  const [priceUyu, setPriceUyu] = useState("1000");
  const [feedback, setFeedback] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    const [resCourses, resEnroll] = await Promise.all([
      fetch("/api/marketplace/cursos"),
      fetch("/api/marketplace/inscripciones"),
    ]);
    const dataCourses = (await resCourses.json()) as { courses: Course[] };
    const dataEnroll = (await resEnroll.json()) as { enrollments: Enrollment[] };
    setCourses(dataCourses.courses ?? []);
    setEnrollments(dataEnroll.enrollments ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCourse() {
    await fetch("/api/marketplace/cursos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title, description, priceUyu: Number(priceUyu) }),
    });
    setFeedback("Curso publicado ✅");
    setTimeout(() => setFeedback(""), 2000);
    setShowCreate(false);
    await load();
  }

  async function buyCourse(courseId: string) {
    const res = await fetch("/api/marketplace/inscripciones", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courseId }),
    });
    const data = (await res.json()) as { message?: string };
    setFeedback(data.message ?? "Inscripción realizada ✅");
    setTimeout(() => setFeedback(""), 2000);
    await load();
  }

  const isEnrolled = (courseId: string) => enrollments.some(e => e.courseId === courseId);
  const avgPrice = courses.length
    ? Math.round(courses.reduce((a, c) => a + c.priceUyu, 0) / courses.length)
    : 0;

  return (
    <main className="page anim-fade">
      <header style={{ marginBottom: 20 }}>
        <span className="badge badge-warn" style={{ marginBottom: 6 }}>Marketplace</span>
        <h1 className="page-title">Cursos & Programas</h1>
        <p className="page-sub" style={{ margin: 0 }}>Comprá planes de entrenamiento de entrenadores certificados</p>
      </header>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
        <div className="stat-card glass">
          <span className="stat-label">Cursos</span>
          <span className="stat-value" style={{ color: "var(--warn)", fontSize: "1.7rem" }}>{courses.length}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Mis Compras</span>
          <span className="stat-value" style={{ color: "var(--brand)", fontSize: "1.7rem" }}>{enrollments.length}</span>
        </div>
        <div className="stat-card glass">
          <span className="stat-label">Precio Prom.</span>
          <span className="stat-value" style={{ color: "var(--brand2)", fontSize: "1.3rem" }}>${avgPrice}</span>
        </div>
      </div>

      {/* Publish Course Toggle */}
      <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Publicar Nuevo Curso</p>
          </div>
          <button
            className={`btn btn-xs ${showCreate ? "btn-danger" : "btn-ghost"}`}
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancelar" : "Crear curso"}
          </button>
        </div>

        {showCreate && (
          <div className="anim-fade" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="field">
              <label className="label">Título del curso</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Hipertrofia 12 semanas" />
            </div>
            <div className="field">
              <label className="label">Descripción breve</label>
              <textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="¿Qué incluye? Duración, objetivo, nivel..." rows={2} />
            </div>
            <div className="field">
              <label className="label">Precio en UYU</label>
              <input className="input" type="number" value={priceUyu} onChange={(e) => setPriceUyu(e.target.value)} placeholder="Ej. 1200" />
            </div>
            <button className="btn btn-primary btn-full" onClick={createCourse}>
              Publicar Curso en Marketplace
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div className="anim-fade" style={{ textAlign: "center", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "rgba(0,255,135,0.1)", border: "1px solid rgba(0,255,135,0.25)", color: "var(--brand)", fontWeight: 700, fontSize: "0.88rem", marginBottom: 16 }}>
          {feedback}
        </div>
      )}

      {/* Course List */}
      <div>
        <p className="section-title">Catálogo Disponible</p>
        {courses.length === 0 ? (
          <div className="empty-state glass">
            <div className="empty-state-icon">
              <ShoppingBag size={28} />
            </div>
            <p className="empty-title">Sin cursos publicados</p>
            <p className="empty-sub">Sé el primero en publicar un programa de entrenamiento para la comunidad.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {courses.map((c) => {
              const bought = isEnrolled(c.id);
              return (
                <div key={c.id} className="glass card" style={{ padding: "18px 16px", border: bought ? "1.5px solid rgba(0,255,135,0.2)" : "1px solid var(--border)" }}>
                  {bought && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                      <Check size={12} color="var(--brand)" />
                      <span style={{ fontSize: "0.68rem", color: "var(--brand)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em" }}>Comprado</span>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h2 style={{ margin: 0, fontWeight: 800, fontSize: "1rem", lineHeight: 1.3 }}>{c.title}</h2>
                      {c.description && (
                        <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "var(--text2)", lineHeight: 1.4 }}>{c.description}</p>
                      )}
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ margin: 0, fontWeight: 900, fontSize: "1.2rem", color: "var(--warn)", lineHeight: 1 }}>
                        ${c.priceUyu}
                      </p>
                      <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700 }}>UYU</p>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#a78bfa", fontSize: "0.7rem", fontWeight: 900, flexShrink: 0 }}>
                        {c.trainer.email[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)", fontWeight: 600 }}>{c.trainer.email}</span>
                    </div>
                    <button
                      className={`btn btn-xs ${bought ? "btn-ghost" : "btn-primary"}`}
                      style={{ height: 34, padding: "0 14px" }}
                      onClick={() => !bought && buyCourse(c.id)}
                      disabled={bought}
                    >
                      {bought ? "✓ Inscripto" : "Comprar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mis compras */}
      {enrollments.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Award size={16} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Mis Cursos Comprados</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {enrollments.map((e) => (
              <div key={e.id} className="list-item">
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(0,255,135,0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--brand)", flexShrink: 0 }}>
                  <BookOpen size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: "0.92rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.course.title}
                  </p>
                </div>
                <span className="badge badge-green">Activo</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
