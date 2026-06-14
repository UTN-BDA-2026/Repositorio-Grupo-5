import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Link } from "react-router-dom";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

type Order = {
  id: number;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  items: any[];
};

type Filter = "ALL" | OrderStatus;

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function statusBadge(status: OrderStatus) {
  if (status === "PAID") return <span className="badge badge-success">Pagada</span>;
  if (status === "PENDING") return <span className="badge badge-warning">Pendiente</span>;
  return <span className="badge badge-danger">Cancelada</span>;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [payingId, setPayingId] = useState<number | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch {
      setError("No pude cargar tus órdenes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => (filter === "ALL" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const counts = useMemo(() => {
    const c = { ALL: orders.length, PENDING: 0, PAID: 0, CANCELLED: 0 };
    for (const o of orders) c[o.status] += 1;
    return c;
  }, [orders]);

  async function pay(orderId: number) {
    setPayingId(orderId);
    try {
      const res = await api.post("/payments/mercadopago/checkout", { orderId });
      const url = res.data?.init_point || res.data?.sandbox_init_point;
      if (!url) return alert("❌ No llegó init_point de MercadoPago");
      window.open(url, "_blank");
    } catch (e: any) {
      alert(`❌ No se pudo iniciar pago (${e?.response?.status ?? "error"})`);
    } finally {
      setPayingId(null);
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <p>Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="row-between" style={{ marginBottom: 40 }}>
        <div className="stack">
          <span className="title-eyebrow">Historial</span>
          <h1 className="h1">Mis órdenes</h1>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={load}>
          Recargar
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {/* FILTROS */}
      <div className="row" style={{ gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <FilterChip label="Todas" count={counts.ALL} active={filter === "ALL"} onClick={() => setFilter("ALL")} />
        <FilterChip label="Pendientes" count={counts.PENDING} active={filter === "PENDING"} onClick={() => setFilter("PENDING")} />
        <FilterChip label="Pagadas" count={counts.PAID} active={filter === "PAID"} onClick={() => setFilter("PAID")} />
        <FilterChip label="Canceladas" count={counts.CANCELLED} active={filter === "CANCELLED"} onClick={() => setFilter("CANCELLED")} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">📦</div>
          <p>No hay órdenes para mostrar</p>
        </div>
      ) : (
        <div className="card-flush">
          <table className="table">
            <thead>
              <tr>
                <th>Orden</th>
                <th>Fecha</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td><span className="mono">#{o.id}</span></td>
                  <td className="muted">{formatDate(o.createdAt)}</td>
                  <td>{o.items?.length ?? 0}</td>
                  <td style={{ fontWeight: 600 }}>${money(o.total).toLocaleString("es-AR")}</td>
                  <td>{statusBadge(o.status)}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
                      <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-sm">
                        Ver detalle
                      </Link>
                      {o.status === "PENDING" && (
                        <button
                          onClick={() => pay(o.id)}
                          disabled={payingId === o.id}
                          className="btn btn-primary btn-sm"
                        >
                          {payingId === o.id ? "Abriendo..." : "Pagar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        all: "unset",
        cursor: "pointer",
        padding: "8px 14px",
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 500,
        background: active ? "var(--primary)" : "var(--surface)",
        color: active ? "#fff" : "var(--text)",
        border: `1px solid ${active ? "var(--primary)" : "var(--border)"}`,
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {label}{" "}
      <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
    </button>
  );
}
