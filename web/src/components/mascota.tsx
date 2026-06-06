"use client";
import React, { useState, useEffect } from "react";
import { MessageSquare, X } from "lucide-react";

type MascotaProps = {
  context: "dashboard" | "rutinas" | "calorias" | "nutricion";
};

const CONTEXT_MESSAGES = {
  dashboard: [
    "¡Hola! Recordá que la constancia le gana a la intensidad. ¡Cada día cuenta! 💪",
    "¡Tomá agua! Tu cuerpo necesita hidratarse para recuperar bien y rendir al máximo 💧",
    "El descanso es cuando tus músculos crecen. Asegurá dormir entre 7 y 8 horas hoy 😴",
    "Mantené el foco. La disciplina es hacer lo que debés, incluso cuando no tenés ganas 🎯"
  ],
  rutinas: [
    "¡A darle duro! Registrá tus series para ver tu progreso a lo largo del tiempo 📖",
    "El descanso entre series (1.5 a 3 min) es clave para mantener la fuerza y la sobrecarga progresiva ⏱️",
    "Concentrate en la técnica: el control en la fase excéntrica (bajada) estimula más hipertrofia 🏋️",
    "Si la última repetición te cuesta pero sale con buena técnica, estás en el rango óptimo (RIR 1-2) 🔥"
  ],
  calorias: [
    "¡Tu plan calórico está listo! Ajustar la comida a tu objetivo es el 70% del resultado 🍎",
    "No le temas a los carbohidratos, son la gasolina para tus entrenamientos intensos ⚡",
    "Si tu objetivo es perder grasa, priorizá alimentos con alta densidad de volumen y pocas calorías 🥗",
    "Para ganar músculo necesitás un leve superávit. ¡Asegurá comer suficiente! 📈"
  ],
  nutricion: [
    "¡La proteína es el bloque constructor de tus músculos! Apuntá a tu objetivo diario 🍗",
    "Comer limpio no significa comer aburrido. Condimentá tus comidas de forma saludable 🧂",
    "Una comida post-entrenamiento alta en proteínas y carbohidratos acelera tu recuperación 🍳",
    "La grasa saludable (palta, nueces, oliva) es vital para el equilibrio hormonal 🥑"
  ]
};

export function Mascota({ context }: MascotaProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const messages = CONTEXT_MESSAGES[context] || CONTEXT_MESSAGES.dashboard;
    const randomIdx = Math.floor(Math.random() * messages.length);
    setMessage(messages[randomIdx]);
  }, [context]);

  const handleMascotaClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "84px", // Above the bottom nav
        right: "16px",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        pointerEvents: "none"
      }}
    >
      {/* Speech Bubble */}
      {isOpen && (
        <div
          className="glass anim-fade"
          style={{
            pointerEvents: "auto",
            marginBottom: "8px",
            padding: "12px 14px",
            borderRadius: "16px 16px 2px 16px",
            border: "1.5px solid var(--brand)",
            maxWidth: "260px",
            fontSize: "0.82rem",
            color: "var(--text)",
            boxShadow: "0 8px 32px rgba(0,255,135,0.15)",
            background: "rgba(3, 5, 8, 0.95)",
            position: "relative",
            lineHeight: 1.4
          }}
        >
          <button
            onClick={() => setIsOpen(false)}
            style={{
              position: "absolute",
              top: "6px",
              right: "6px",
              background: "none",
              border: "none",
              color: "var(--muted)",
              cursor: "pointer",
              padding: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <X size={14} />
          </button>
          <p style={{ margin: "0 12px 0 0", fontWeight: 600 }}>{message}</p>
        </div>
      )}

      {/* Mascot Trigger Button */}
      <button
        onClick={handleMascotaClick}
        style={{
          pointerEvents: "auto",
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0, 255, 135, 0.4)",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          WebkitTapHighlightColor: "transparent",
          position: "relative"
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.08)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        <span style={{ fontSize: "1.5rem", userSelect: "none" }}>🤖</span>
        
        {/* Subtle glowing indicator badge if closed */}
        {!isOpen && (
          <span
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              backgroundColor: "#ff5e3a",
              border: "2px solid #030508",
              boxShadow: "0 0 8px #ff5e3a"
            }}
          />
        )}
      </button>
    </div>
  );
}
