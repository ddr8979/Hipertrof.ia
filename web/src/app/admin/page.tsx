"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import {
  Shield,
  Search,
  Trash2,
  Check,
  X,
  Users,
  UserCheck,
  UserX,
  UserMinus,
  ArrowLeft,
  Filter,
  RefreshCw
} from "lucide-react";

type UserType = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isApproved: boolean;
  createdAt: string;
};

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserType[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isOwnerOrAdmin = user?.role === "ADMIN" || user?.role === "OWNER";

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace("/auth");
      } else if (!isOwnerOrAdmin) {
        router.replace("/dashboard");
      }
    }
  }, [user, loading, isOwnerOrAdmin, router]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users ?? []);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOwnerOrAdmin) {
      fetchUsers();
    }
  }, [isOwnerOrAdmin]);

  const handleToggleApproval = async (userId: string, currentApproved: boolean) => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, approved: !currentApproved })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: data.user.isApproved } : u));
      }
    } catch (err) {
      console.error("Error al actualizar aprobación:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: data.user.role } : u));
      }
    } catch (err) {
      console.error("Error al cambiar rol:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setDeletingId(null);
      }
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
    }
  };

  if (loading || !user || !isOwnerOrAdmin) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div className="spinner" />
      </div>
    );
  }

  // Filtered Users list
  const filteredUsers = users.filter(u => {
    const matchesSearch =
      (u.name?.toLowerCase() ?? "").includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "ALL" ? true : u.role === roleFilter;

    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "APPROVED"
        ? u.isApproved
        : !u.isApproved;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate statistics
  const totalCount = users.length;
  const pendingCount = users.filter(u => !u.isApproved).length;
  const trainersCount = users.filter(u => u.role === "TRAINER" || u.role === "OWNER" || u.role === "ADMIN").length;
  const athletesCount = users.filter(u => u.role === "ATHLETE").length;

  return (
    <main className="page" style={{ paddingTop: 24, paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        <button
          onClick={() => router.push("/dashboard")}
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
        </button>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: 900, margin: 0, letterSpacing: "-0.03em" }}>
            Control Panel
          </h1>
          <p style={{ margin: 0, fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600 }}>
            Gestión global de accesos y permisos
          </p>
        </div>
        <button
          onClick={fetchUsers}
          style={{
            background: "none",
            border: "none",
            color: "var(--muted)",
            marginLeft: "auto",
            cursor: "pointer",
            padding: 8
          }}
        >
          <RefreshCw size={18} className={loadingUsers ? "anim-spin" : ""} />
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
        <div className="stat-card glass" style={{ padding: "10px 8px", textAlign: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, display: "block" }}>Total</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--text)" }}>{totalCount}</span>
        </div>
        <div className="stat-card glass" style={{ padding: "10px 8px", textAlign: "center", border: pendingCount > 0 ? "1px solid rgba(255,179,0,0.3)" : "1px solid var(--border)" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, display: "block" }}>Pendientes</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: pendingCount > 0 ? "#ffb300" : "var(--text)" }}>{pendingCount}</span>
        </div>
        <div className="stat-card glass" style={{ padding: "10px 8px", textAlign: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, display: "block" }}>Trainers</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--brand2)" }}>{trainersCount}</span>
        </div>
        <div className="stat-card glass" style={{ padding: "10px 8px", textAlign: "center" }}>
          <span style={{ fontSize: "0.65rem", color: "var(--muted)", fontWeight: 700, display: "block" }}>Atletas</span>
          <span style={{ fontSize: "1.3rem", fontWeight: 900, color: "var(--brand)" }}>{athletesCount}</span>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ position: "relative", marginBottom: 16 }}>
        <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)" }}>
          <Search size={16} />
        </span>
        <input
          type="text"
          placeholder="Buscar por nombre o correo..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "12px 14px 12px 42px",
            color: "var(--text)",
            fontSize: "0.9rem",
            outline: "none"
          }}
        />
      </div>

      {/* Filter Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
        {/* Roles Chips */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
          {["ALL", "ATHLETE", "TRAINER", "ADMIN", "OWNER"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              style={{
                background: roleFilter === r ? "var(--text)" : "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 12px",
                color: roleFilter === r ? "#000" : "var(--text2)",
                fontSize: "0.75rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {r === "ALL" ? "Todos" : r === "ATHLETE" ? "Atletas" : r === "TRAINER" ? "Trainers" : r === "ADMIN" ? "Admins" : "Owners"}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: "flex", gap: 6 }}>
          {["ALL", "APPROVED", "PENDING"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                flex: 1,
                background: statusFilter === s ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.02)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                padding: "6px 10px",
                color: statusFilter === s ? "var(--brand)" : "var(--muted)",
                fontSize: "0.72rem",
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {s === "ALL" ? "Todos los estados" : s === "APPROVED" ? "Aprobados" : "Pendientes"}
            </button>
          ))}
        </div>
      </div>

      {/* Users List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {loadingUsers ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
            <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 600 }}>No se encontraron usuarios</p>
            <p style={{ margin: "4px 0 0", fontSize: "0.75rem" }}>Probá modificando los filtros de búsqueda</p>
          </div>
        ) : (
          filteredUsers.map(u => {
            const isSelf = u.id === user.id;
            const initials = (u.name ?? u.email)[0].toUpperCase();

            // Gradient based on role
            const gradient =
              u.role === "OWNER"
                ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
                : u.role === "ADMIN"
                ? "linear-gradient(135deg, #3b82f6, #8b5cf6)"
                : u.role === "TRAINER"
                ? "linear-gradient(135deg, #10b981, #3b82f6)"
                : "linear-gradient(135deg, #f59e0b, #ec4899)";

            return (
              <div
                key={u.id}
                className="glass card"
                style={{
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  border: u.isApproved ? "1px solid var(--border)" : "1px solid rgba(255,179,0,0.25)"
                }}
              >
                {/* Top: Avatar & Basic Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      color: "#fff",
                      fontSize: "0.95rem",
                      flexShrink: 0
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.88rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                        {u.name ?? "Sin nombre"}
                      </p>
                      {isSelf && (
                        <span className="badge badge-blue" style={{ fontSize: "0.6rem", padding: "0 6px", height: 16 }}>
                          Tú
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "var(--muted)" }}>{u.email}</p>
                  </div>

                  {/* Approve/Reject Button (Skip for self) */}
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleApproval(u.id, u.isApproved)}
                      disabled={updatingId === u.id}
                      style={{
                        background: u.isApproved ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                        border: u.isApproved ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
                        borderRadius: 10,
                        width: 32,
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: u.isApproved ? "#10b981" : "#ef4444",
                        cursor: "pointer",
                        flexShrink: 0
                      }}
                      title={u.isApproved ? "Revocar Aprobación" : "Aprobar Usuario"}
                    >
                      {u.isApproved ? <Check size={16} /> : <X size={16} />}
                    </button>
                  )}
                </div>

                {/* Bottom Settings & Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                  {/* Role dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                    <span style={{ fontSize: "0.68rem", color: "var(--muted)", fontWeight: 600 }}>Rol:</span>
                    <select
                      value={u.role}
                      onChange={e => handleChangeRole(u.id, e.target.value)}
                      disabled={isSelf || updatingId === u.id}
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        padding: "4px 8px",
                        color: "var(--text)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        outline: "none"
                      }}
                    >
                      <option value="ATHLETE">Atleta</option>
                      <option value="TRAINER">Trainer</option>
                      <option value="ADMIN">Admin</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </div>

                  {/* Status Badge */}
                  <span
                    className={`badge ${u.isApproved ? "badge-blue" : "badge-orange"}`}
                    style={{ fontSize: "0.65rem", padding: "2px 8px", background: u.isApproved ? "rgba(0,255,135,0.08)" : "rgba(255,179,0,0.08)", color: u.isApproved ? "var(--brand)" : "#ffb300" }}
                  >
                    {u.isApproved ? "Aprobado" : "Pendiente"}
                  </span>

                  {/* Delete Button */}
                  {!isSelf && (
                    <div style={{ position: "relative" }}>
                      {deletingId === u.id ? (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            style={{
                              background: "var(--danger)",
                              border: "none",
                              borderRadius: 8,
                              padding: "4px 8px",
                              color: "#fff",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            Eliminar
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            style={{
                              background: "rgba(255,255,255,0.08)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              padding: "4px 8px",
                              color: "var(--text2)",
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              cursor: "pointer"
                            }}
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingId(u.id)}
                          style={{
                            background: "rgba(239,68,68,0.06)",
                            border: "1px solid rgba(239,68,68,0.15)",
                            borderRadius: 8,
                            width: 28,
                            height: 28,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ef4444",
                            cursor: "pointer"
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
