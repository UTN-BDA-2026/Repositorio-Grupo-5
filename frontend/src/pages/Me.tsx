import { useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

function formatDate(s?: string) {
  if (!s) return "-";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function Me() {
  const { user } = useAuth();

  const roleLabel = useMemo(() => {
    if (!user) return "";
    return user.role === "ADMIN" ? "Administrador" : "Usuario";
  }, [user]);

  if (!user) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h2>Mi perfil</h2>
        <p>No estás logueado.</p>
        <Link to="/">Ir a login</Link>
      </div>
    );
  }

  const badgeStyle = (kind: "admin" | "user") => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #444",
    background: kind === "admin" ? "#221a00" : "#121212",
    fontSize: 12,
    opacity: 0.95,
  });

  const cardStyle = {
    border: "1px solid #444",
    borderRadius: 12,
    padding: 16,
    background: "#0f0f0f",
  } as const;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 12 }}>Mi perfil</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12 }}>
        {/* Perfil */}
        <div style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Email</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user.email}</div>
            </div>

            <span style={user.role === "ADMIN" ? badgeStyle("admin") : badgeStyle("user")}>
              {user.role === "ADMIN" ? "🛡️" : "👤"} {roleLabel}
            </span>
          </div>

          <hr style={{ border: 0, borderTop: "1px solid #333", margin: "14px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>User ID</div>
              <div style={{ fontWeight: 600 }}>{user.id}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Puntos</div>
              <div style={{ fontWeight: 600 }}>{user.points}</div>
            </div>

            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Creado</div>
              <div style={{ fontWeight: 600 }}>{formatDate(user.createdAt)}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>Actualizado</div>
              <div style={{ fontWeight: 600 }}>{formatDate(user.updatedAt)}</div>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Acciones rápidas</div>

          <div style={{ display: "grid", gap: 10 }}>
            <Link
              to="/products"
              style={{
                display: "block",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #444",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              🛒 Ver productos
            </Link>

            <Link
              to="/orders"
              style={{
                display: "block",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #444",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              📦 Mis órdenes
            </Link>

            <Link
              to="/cart"
              style={{
                display: "block",
                padding: 12,
                borderRadius: 10,
                border: "1px solid #444",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              🧺 Ir al carrito
            </Link>

            {user.role === "ADMIN" && (
              <Link
                to="/admin/products"
                style={{
                  display: "block",
                  padding: 12,
                  borderRadius: 10,
                  border: "1px solid #444",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                🛠️ Admin · Productos
              </Link>
            )}

          </div>

          <hr style={{ border: 0, borderTop: "1px solid #333", margin: "14px 0" }} />

          <div style={{ fontSize: 12, opacity: 0.75 }}>
            Tip: si querés que esto tenga foto/nombre, agregamos esos campos al modelo User y a `/auth/me`.
          </div>
        </div>
      </div>
    </div>
  );
}
