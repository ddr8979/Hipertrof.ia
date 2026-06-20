"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { ArrowLeft, Send, Sparkles } from "lucide-react";
import Link from "next/link";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu coach de Inteligencia Artificial de hypertrof.ia. 🏋️\n\n¿En qué puedo ayudarte hoy? Podés preguntarme sobre técnicas de ejercicios, volumen de entrenamiento, cálculo de calorías o distribución de macros.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth");
  }, [user, loading, router]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = input.trim();
    setInput("");
    const newMessages = [...messages, { role: "user" as const, content: userMsg }];
    setMessages(newMessages);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setMessages((prev) => [...prev, data.message]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Disculpa, ha ocurrido un error al procesar tu consulta. Por favor intenta de nuevo.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No se pudo conectar con el servidor. Revisa tu conexión a internet.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80dvh" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <main className="page anim-fade" style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 84px)", paddingBottom: 10 }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <Link
          href="/dashboard"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            width: 40,
            height: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text)",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "1.45rem", display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={18} color="#a855f7" style={{ filter: "drop-shadow(0 0 4px #a855f7)" }} /> Coach IA
          </h1>
          <p className="page-sub" style={{ margin: 0, fontSize: "0.75rem" }}>Entrenador Personal y Asesor Nutricional Inteligente</p>
        </div>
      </header>

      {/* Messages Box */}
      <div 
        className="glass"
        style={{
          flex: 1,
          overflowY: "auto",
          borderRadius: "var(--radius)",
          padding: "16px 14px",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          background: "rgba(3, 5, 8, 0.6)",
          marginBottom: 12
        }}
      >
        {messages.map((m, idx) => {
          const isUser = m.role === "user";
          return (
            <div 
              key={idx}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                width: "100%"
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 14px",
                  borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                  fontSize: "0.86rem",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  color: isUser ? "#030508" : "var(--text)",
                  background: isUser 
                    ? "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)" 
                    : "rgba(255,255,255,0.04)",
                  border: isUser ? "none" : "1px solid var(--border)",
                  boxShadow: isUser ? "0 4px 14px rgba(0,255,135,0.25)" : "none"
                }}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start", width: "100%" }}>
            <div
              style={{
                padding: "12px 18px",
                borderRadius: "16px 16px 16px 2px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                display: "flex",
                gap: 4,
                alignItems: "center"
              }}
            >
              <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: "bounce 1s infinite alternate" }} />
              <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: "bounce 1s infinite alternate 0.2s" }} />
              <span className="dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#a855f7", animation: "bounce 1s infinite alternate 0.4s" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} style={{ display: "flex", gap: 10, position: "relative" }}>
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pregúntale a tu entrenador IA..."
          disabled={sending}
          style={{
            flex: 1,
            minHeight: 48,
            height: 48,
            borderRadius: 14,
            fontSize: "0.9rem",
            paddingRight: 50,
            background: "rgba(255,255,255,0.04)"
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          style={{
            position: "absolute",
            right: 6,
            top: 6,
            width: 36,
            height: 36,
            borderRadius: 10,
            background: input.trim() ? "linear-gradient(135deg, var(--brand) 0%, var(--brand2) 100%)" : "rgba(255,255,255,0.02)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: input.trim() ? "#000" : "var(--muted)",
            cursor: input.trim() ? "pointer" : "default",
            transition: "all 150ms"
          }}
        >
          <Send size={15} />
        </button>
      </form>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }
      `}</style>
    </main>
  );
}
