import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

function formatDate(s?: string) {
  if (!s) return "Sin datos";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

function initials(email: string) {
  return email.slice(0, 2).toUpperCase();
}

export default function Me() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">🔒</div>
          <p style={{ marginBottom: 16 }}>No estás logueado</p>
          <Link to="/" className="btn btn-primary">Iniciar sesión</Link>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "ADMIN";

  return (
    <div className="container page">
      <div className="row-between" style={{ marginBottom: 40 }}>
        <div className="stack">
          <span className="title-eyebrow">Cuenta</span>
          <h1 className="h1">Mi perfil</h1>
        </div>
      </div>

      <div className="grid-summary">
        {/* PERFIL */}
        <div className="card stack-lg">
          <div className="row" style={{ gap: 20 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 999,
                background: "var(--primary)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              {initials(user.email)}
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <h2 className="h2">{user.email}</h2>
              {isAdmin ? (
                <span className="badge badge-primary">🛡 Administrador</span>
              ) : (
                <span className="badge">👤 Usuario</span>
              )}
            </div>
          </div>

          <div className="divider" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <DataRow label="User ID" value={String(user.id)} mono />
            <DataRow label="Puntos" value={String(user.points ?? 0)} />
            <DataRow label="Creado" value={formatDate(user.createdAt)} />
            <DataRow label="Actualizado" value={formatDate(user.updatedAt)} />
          </div>
        </div>

        {/* ACCIONES */}
        <div className="card stack">
          <h3 className="h3" style={{ marginBottom: 8 }}>Accesos rápidos</h3>
          <QuickLink to="/products" icon="🛍" title="Catálogo" sub="Explorar productos" />
          <QuickLink to="/cart" icon="🧺" title="Carrito" sub="Ver lo que vas a comprar" />
          <QuickLink to="/orders" icon="📦" title="Mis órdenes" sub="Historial de compras" />
          {isAdmin && (
            <QuickLink
              to="/admin/products"
              icon="🛠"
              title="Panel Admin"
              sub="Gestionar productos"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function DataRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <span className="muted" style={{ fontSize: 12 }}>{label}</span>
      <span className={mono ? "mono" : ""} style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function QuickLink({ to, icon, title, sub }: { to: string; icon: string; title: string; sub: string }) {
  return (
    <Link
      to={to}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: "var(--r-md)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        background: "var(--surface)",
        transition: "background 0.15s, border-color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface-2)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border-strong)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.background = "var(--surface)";
        (e.currentTarget as HTMLAnchorElement).style.borderColor = "var(--border)";
      }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div className="stack" style={{ gap: 2 }}>
        <span style={{ fontSize: 14, fontWeight: 500 }}>{title}</span>
        <span className="muted" style={{ fontSize: 12 }}>{sub}</span>
      </div>
      <span style={{ marginLeft: "auto", color: "var(--text-faint)" }}>→</span>
    </Link>
  );
}
