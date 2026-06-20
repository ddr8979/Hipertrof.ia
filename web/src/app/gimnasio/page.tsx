"use client";

import React, { useEffect, useState } from "react";
import { QrCode, Phone, UserPlus } from "lucide-react";


type Membership = {
  id: string;
  status: "ACTIVE" | "PENDING" | "OVERDUE" | "BLOCKED";
  athlete: { id: string; email: string };
};

type GymPayload = {
  gym: { name: string };
  memberships: Membership[];
};

export default function GimnasioPage() {
  const [payload, setPayload] = useState<GymPayload | null>(null);
  const [email, setEmail] = useState("socio@demo.com");
  const [status, setStatus] = useState<Membership["status"]>("ACTIVE");
  const [checkinMessage, setCheckinMessage] = useState("");
  const [checkinColor, setCheckinColor] = useState<"green" | "red" | "">("");

  async function load() {
    const res = await fetch("/api/gimnasio/membresias");
    const data = (await res.json()) as GymPayload;
    setPayload(data);
  }

  useEffect(() => {
    load();
  }, []);

  async function addMembership() {
    await fetch("/api/gimnasio/membresias", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, status }),
    });
    await load();
  }

  async function doCheckin(membershipId: string) {
    const res = await fetch("/api/gimnasio/checkin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ membershipId }),
    });
    const data = (await res.json()) as { message: string; color: string };
    setCheckinMessage(`${data.message} (${data.color})`);
    setCheckinColor(data.color === "green" ? "green" : "red");
  }

  async function sendReminder(userId: string) {
    await fetch("/api/whatsapp/recordatorios", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        userId,
        phone: "+59800000000",
        message: "Recordatorio: tu cuota vence pronto",
      }),
    });
    setCheckinMessage("Recordatorio WhatsApp simulado enviado.");
  }

  return (
    <main className="page anim-fade">
      <header style={{ marginBottom: 20 }}>
        <span className="badge badge-blue" style={{ marginBottom: 6 }}>Módulo Gimnasio</span>
        <h1 className="page-title">Gestión de Socios</h1>
        <p className="page-sub" style={{ margin: 0 }}>Check-in por código QR, control de membresías y recordatorios</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Alta Socio Form */}
        <div className="glass card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <UserPlus size={18} color="var(--brand)" />
            <p className="section-title" style={{ margin: 0 }}>Alta / Actualizar Socio</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 12 }}>
            <div className="field">
              <label className="label">Email del socio</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="socio@correo.com" />
            </div>
            <div className="field">
              <label className="label">Estado Membresía</label>
              <select
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as Membership["status"])}
              >
                <option value="ACTIVE">ACTIVO (Verde)</option>
                <option value="PENDING">PENDIENTE (Amarillo)</option>
                <option value="OVERDUE">VENCIDO (Rojo)</option>
                <option value="BLOCKED">BLOQUEADO (Rojo)</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={addMembership}>
            Registrar Socio / Membresía
          </button>
        </div>

        {checkinMessage && (
          <div className="anim-fade" style={{
            padding: 14,
            borderRadius: "var(--radius-sm)",
            background: checkinColor === "green" ? "rgba(0,255,135,0.12)" : "rgba(255,71,87,0.12)",
            border: checkinColor === "green" ? "1px solid rgba(0,255,135,0.3)" : "1px solid rgba(255,71,87,0.3)",
            color: checkinColor === "green" ? "var(--brand)" : "var(--danger)",
            fontSize: "0.88rem",
            fontWeight: 700,
            textAlign: "center"
          }}>
            {checkinMessage}
          </div>
        )}

        {/* Member list */}
        <div>
          <p className="section-title">Listado de Membresías Activas</p>
          {payload?.memberships.length === 0 ? (
            <div className="empty-state glass">
              <div className="empty-state-icon">
                <QrCode size={28} />
              </div>
              <p className="empty-title">Sin membresías registradas</p>
              <p className="empty-sub">Ingresá los datos del primer socio en el formulario superior.</p>
            </div>
          ) : (
            payload?.memberships.map((m) => {
              const statusBadges: Record<string, React.ReactElement> = {
                ACTIVE: <span className="badge badge-green">Activo</span>,
                PENDING: <span className="badge badge-warn">Pendiente</span>,
                OVERDUE: <span className="badge badge-red">Vencido</span>,
                BLOCKED: <span className="badge badge-red">Bloqueado</span>,
              };

              return (
                <div key={m.id} className="glass card" style={{ marginBottom: 12, padding: "16px" }}>
                  <div style={{ display: "flex", justifyContent: "between", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 800, fontSize: "0.95rem", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {m.athlete.email}
                      </p>
                      <p style={{ margin: "4px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: m.status === "ACTIVE" ? "var(--brand)" : m.status === "PENDING" ? "var(--warn)" : "var(--danger)"
                        }} />
                        <span style={{ fontSize: "0.78rem", color: "var(--text2)", fontWeight: 600 }}>Semáforo QR</span>
                      </p>
                    </div>
                    <div style={{ flexShrink: 0 }}>
                      {statusBadges[m.status]}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 14, borderTop: "1.5px solid var(--border)", paddingTop: 14 }}>
                    <button
                      className="btn btn-ghost btn-xs btn-full"
                      onClick={() => doCheckin(m.id)}
                      style={{ height: 36 }}
                    >
                      <QrCode size={14} /> Simular Escaneo QR
                    </button>
                    <button
                      className="btn btn-ghost btn-xs btn-full"
                      onClick={() => sendReminder(m.athlete.id)}
                      style={{ height: 36, borderColor: "rgba(0,198,255,0.2)", color: "var(--brand2)" }}
                    >
                      <Phone size={14} /> Enviar Recordatorio
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
