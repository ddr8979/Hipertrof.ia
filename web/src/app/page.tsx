"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { Toast } from "@/components/toast";

type ToastType = { msg: string; type: "success" | "error" };

export default function Landing() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastType | null>(null);
  const { user, refresh, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === "TRAINER" || user.role === "ADMIN" || user.role === "OWNER") {
        router.replace("/trainer");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login"
        ? { email, password }
        : { email, password, name: email.split("@")[0], role: "ATHLETE" };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        if (mode === "register" && res.status === 409) {
          const loginRes = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          if (!loginRes.ok) {
            setToast({ msg: "Email ya registrado. Verificá tu contraseña.", type: "error" });
            return;
          }
          await refresh();
          router.replace("/dashboard");
          return;
        }
        setToast({ msg: data.error ?? "Error al procesar", type: "error" });
        return;
      }

      await refresh();
      router.replace("/dashboard");
    } catch {
      setToast({ msg: "Error de conexión. Intenta de nuevo.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSocialLogin(provider: string) {
    setIsSubmitting(true);
    setToast({ msg: `Conectando con ${provider}...`, type: "success" });
    try {
      await new Promise(r => setTimeout(r, 600));
      const mockEmail = `${provider.toLowerCase()}-user@hypertrof.ia`;
      const mockPassword = "social-login-bypass-2026";

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: mockEmail, password: mockPassword, name: `${provider} Atleta`, role: "ATHLETE" }),
      });
      if (!res.ok) {
        const loginRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: mockEmail, password: mockPassword }),
        });
        if (!loginRes.ok) {
          setToast({ msg: `Error al conectar con ${provider}`, type: "error" });
          return;
        }
      }
      await refresh();
      router.replace("/dashboard");
    } catch {
      setToast({ msg: "Error de conexión social", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1209", zIndex: 9999 }}>
      <div className="spinner" />
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes bounceUp {
          0%, 100% { transform: translateY(0); opacity: 0.8; }
          50% { transform: translateY(-14px); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        /* ── LANDING ROOT CONTAINER ── */
        .landing-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          background: #0d1209;
        }

        /* Fixed background inside container */
        .lnd-bg-fixed {
          position: absolute;
          inset: 0;
          background-image: url('/background_cafe.png');
          background-size: cover;
          background-position: center top;
          background-repeat: no-repeat;
          z-index: 0;
        }
        .lnd-overlay-fixed {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.18) 0%,
            rgba(0,0,0,0.02) 30%,
            rgba(0,0,0,0.38) 72%,
            rgba(0,0,0,0.68) 100%
          );
          z-index: 1;
          pointer-events: none;
        }

        /* Scrollable container over the fixed background */
        .lnd-scroll-wrapper {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          z-index: 2;
        }

        /* ── Section 1: Hero ── */
        .lnd-hero {
          height: 100%;
          min-height: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          padding: 0 32px;
        }

        .lnd-brand {
          padding-top: max(env(safe-area-inset-top, 24px), 36px);
          display: flex;
          justify-content: center;
        }
        .lnd-brand-text {
          font-family: 'Playfair Display', 'Georgia', 'Garamond', 'Times New Roman', serif;
          font-size: 2.2rem;
          font-weight: 700;
          font-style: italic;
          color: rgba(255,255,255,0.97);
          letter-spacing: 0.06em;
          line-height: 1.3;
          text-shadow: 0 2px 0 rgba(0,0,0,0.25), 0 4px 28px rgba(0,0,0,0.6), 0 0 80px rgba(165,198,151,0.12);
          user-select: none;
          animation: fadeIn 0.6s ease both;
        }
        .lnd-brand-text em {
          font-style: italic;
          font-weight: 700;
          color: #a5c697;
          text-shadow: 0 2px 0 rgba(0,0,0,0.25), 0 4px 28px rgba(0,0,0,0.6), 0 0 40px rgba(165,198,151,0.5);
        }

        .lnd-headline {
          animation: fadeInUp 0.9s ease 0.2s both;
          padding-bottom: 24px;
        }
        .lnd-headline h1 {
          font-size: 2.05rem;
          font-weight: 900;
          line-height: 1.15;
          color: #ffffff;
          text-transform: uppercase;
          letter-spacing: -0.03em;
          margin: 0;
          text-shadow: 0 3px 24px rgba(0,0,0,0.7);
        }

        .lnd-arrows {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
          cursor: pointer;
          padding-bottom: max(env(safe-area-inset-bottom, 48px), 84px);
          animation: bounceUp 2.2s ease-in-out infinite;
          user-select: none;
        }
        .lnd-arrows svg + svg { margin-top: -20px; }

        /* ── Section 2: Login card ── */
        .lnd-card {
          min-height: 100%;
          scroll-snap-align: start;
          scroll-snap-stop: always;
          background: #eae6dd;
          border-top-left-radius: 40px;
          border-top-right-radius: 40px;
          padding: 40px 28px max(env(safe-area-inset-bottom, 24px), 40px);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 16px;
          box-shadow: 0 -20px 70px rgba(0,0,0,0.45);
        }

        .lnd-card-brand {
          text-align: center;
          font-family: 'Playfair Display', 'Georgia', 'Garamond', serif;
          font-size: clamp(1.7rem, 3.8vw, 2.3rem);
          font-weight: 700;
          font-style: italic;
          color: #2a3a24;
          letter-spacing: 0.05em;
          line-height: 1;
          margin-bottom: 2px;
        }
        .lnd-card-brand em { font-style: italic; font-weight: 700; color: #5a8a48; }

        .lnd-toggle {
          display: flex;
          background: #262921;
          border-radius: 99px;
          padding: 4px;
          width: max-content;
          margin: 0 auto;
        }
        .lnd-toggle button {
          padding: 10px 24px;
          border-radius: 99px;
          border: none;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.2s;
        }
        .lnd-toggle button.on  { background: #a5c697; color: #1a2217; }
        .lnd-toggle button.off { background: transparent; color: #7a9a6e; }

        .lnd-input {
          width: 100%;
          height: 58px;
          border-radius: 99px;
          border: 1.5px solid rgba(0,0,0,0.1);
          background: rgba(255,255,255,0.82);
          padding: 0 24px;
          font-size: 1rem;
          color: #1a2217;
          outline: none;
          font-weight: 500;
          box-sizing: border-box;
          -webkit-appearance: none;
          font-family: inherit;
        }
        .lnd-input:focus {
          border-color: #8fae82;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(143,174,130,0.2);
        }

        .lnd-btn {
          width: 100%;
          height: 60px;
          border-radius: 99px;
          background: #8fae82;
          color: #fff;
          font-size: 1rem;
          font-weight: 800;
          border: none;
          cursor: pointer;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          transition: background 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 28px rgba(143,174,130,0.45);
        }
        .lnd-btn:not(:disabled):hover { background: #7a9a6e; box-shadow: 0 6px 32px rgba(143,174,130,0.55); }
        .lnd-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .lnd-divider {
          display: flex; align-items: center; gap: 12px;
        }
        .lnd-divider-line { flex: 1; height: 1px; background: rgba(0,0,0,0.12); }
        .lnd-divider-text {
          font-size: 0.68rem; font-weight: 700; color: #8a8d85;
          letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap;
        }

        .lnd-socials { display: flex; justify-content: center; gap: 16px; }
        .lnd-social-btn {
          width: 58px; height: 58px; border-radius: 50%;
          border: 1.5px solid rgba(0,0,0,0.12); background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lnd-social-btn:hover  { box-shadow: 0 4px 20px rgba(0,0,0,0.14); }
        .lnd-social-btn:active { transform: scale(0.92); }
      `}</style>

      {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <div className="landing-container">
        {/* Fixed background behind the scroll view */}
        <div className="lnd-bg-fixed" />
        <div className="lnd-overlay-fixed" />

        {/* Scroll wrapper */}
        <div className="lnd-scroll-wrapper">

          {/* ── SECCIÓN 1: Hero ── */}
          <section className="lnd-hero">
            <div className="lnd-brand">
              <span className="lnd-brand-text">
                Hipertrof<em>.ia</em>
              </span>
            </div>

            <div style={{ flex: 1 }} />

            <div className="lnd-headline">
              <h1>
                Tu<br />
                entrenamiento<br />
                potenciado al<br />
                máximo.
              </h1>
            </div>

            <div
              className="lnd-arrows"
              onClick={() => document.getElementById("lnd-card")?.scrollIntoView({ behavior: "smooth" })}
            >
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="27" fill="rgba(165,198,151,0.22)" stroke="rgba(165,198,151,0.6)" strokeWidth="1.5"/>
                <path d="M18 31l10-10 10 10" stroke="#a5c697" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </section>

          {/* ── SECCIÓN 2: Card de login ── */}
          <section id="lnd-card" className="lnd-card">

            <div className="lnd-card-brand">
              Hipertrof<em>.ia</em>
            </div>

            <div className="lnd-toggle">
              <button type="button" onClick={() => setMode("register")} className={mode === "register" ? "on" : "off"}>
                Registrarse
              </button>
              <button type="button" onClick={() => setMode("login")} className={mode === "login" ? "on" : "off"}>
                Iniciar sesión
              </button>
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input
                className="lnd-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email"
                required
              />

              <div style={{ position: "relative" }}>
                <input
                  className="lnd-input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "register" ? "Crea tu contraseña" : "Tu contraseña"}
                  required
                  minLength={6}
                  style={{ paddingRight: 54 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 18, top: "50%",
                    transform: "translateY(-50%)", background: "none",
                    border: "none", color: "#6a7a65", cursor: "pointer",
                    padding: 0, display: "flex", alignItems: "center",
                  }}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>

              <button type="submit" disabled={isSubmitting} className="lnd-btn">
                {isSubmitting ? "Procesando..." : mode === "register" ? "Crear cuenta" : "Iniciar sesión"}
              </button>
            </form>

            <div className="lnd-divider">
              <div className="lnd-divider-line" />
              <span className="lnd-divider-text">
                {mode === "register" ? "O regístrate con" : "O inicia sesión con"}
              </span>
              <div className="lnd-divider-line" />
            </div>

            <div className="lnd-socials">
              <button type="button" className="lnd-social-btn" disabled={isSubmitting} onClick={() => handleSocialLogin("Apple")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.58 2.95-1.39z"/>
                </svg>
              </button>
              <button type="button" className="lnd-social-btn" disabled={isSubmitting} onClick={() => handleSocialLogin("Facebook")}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </button>
              <button type="button" className="lnd-social-btn" disabled={isSubmitting} onClick={() => handleSocialLogin("Google")}>
                <svg width="22" height="22" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </button>
            </div>

          </section>

        </div>
      </div>
    </>
  );
}
