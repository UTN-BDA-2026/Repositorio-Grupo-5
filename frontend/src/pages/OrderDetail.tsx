import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import { Link, useParams } from "react-router-dom";

type OrderStatus = "PENDING" | "PAID" | "CANCELLED";

type OrderItem = {
  id: number;
  productId: number;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  product?: { id: number; name: string };
};

type Order = {
  id: number;
  status: OrderStatus;
  total: string | number;
  createdAt: string;
  items: OrderItem[];
};

const money = (v: any) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

function statusBadge(s: OrderStatus) {
  if (s === "PAID") return <span className="badge badge-success">Pagada</span>;
  if (s === "PENDING") return <span className="badge badge-warning">Pendiente</span>;
  return <span className="badge badge-danger">Cancelada</span>;
}

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<number | null>(null);

  async function load() {
    setError(null);
    setRefreshing(true);
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data);
    } catch {
      setError("No pude cargar el detalle");
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!order) return;
    if (order.status === "PENDING") {
      intervalRef.current = window.setInterval(() => {
        api.get(`/orders/${id}`).then((res) => setOrder(res.data)).catch(() => {});
      }, 3000);
    }
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [order?.status, id]);

  const computedTotal = useMemo(
    () => (order ? order.items.reduce((acc, it) => acc + money(it.subtotal), 0) : 0),
    [order]
  );

  if (error) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">❌</div>
          <p style={{ marginBottom: 16 }}>{error}</p>
          <button onClick={load} className="btn btn-primary">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <p>Cargando orden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to="/orders" className="muted" style={{ display: "inline-block", marginBottom: 16, fontSize: 14 }}>
        ← Volver a órdenes
      </Link>

      <div className="row-between" style={{ marginBottom: 40 }}>
        <div className="stack">
          <span className="title-eyebrow">Orden <span className="mono">#{order.id}</span></span>
          <h1 className="h1">Detalle de compra</h1>
        </div>
        <div className="row" style={{ gap: 12 }}>
          {statusBadge(order.status)}
          <button className="btn btn-ghost btn-sm" onClick={load} disabled={refreshing}>
            {refreshing ? "Recargando..." : "Recargar"}
          </button>
        </div>
      </div>

      <div className="grid-summary">
        <div className="stack-lg">
          <div className="card">
            <h3 className="h3" style={{ marginBottom: 16 }}>Items</h3>
            <div className="stack-lg">
              {order.items.map((it) => (
                <div key={it.id} className="row-between" style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                  <div className="stack" style={{ gap: 4 }}>
                    <span style={{ fontWeight: 500 }}>{it.product?.name ?? `Producto #${it.productId}`}</span>
                    <span className="muted" style={{ fontSize: 13 }}>
                      ${money(it.unitPrice).toLocaleString("es-AR")} × {it.quantity}
                    </span>
                  </div>
                  <span style={{ fontWeight: 600 }}>${money(it.subtotal).toLocaleString("es-AR")}</span>
                </div>
              ))}
            </div>
          </div>

          {order.status === "PENDING" && (
            <div className="alert alert-info">
              Esta orden está esperando confirmación de pago. Se actualizará automáticamente.
            </div>
          )}
        </div>

        <aside>
          <div className="card stack-lg" style={{ position: "sticky", top: 80 }}>
            <h3 className="h3">Resumen</h3>
            <div className="stack" style={{ gap: 8 }}>
              <div className="row-between">
                <span className="muted">Fecha</span>
                <span style={{ fontSize: 13 }}>
                  {new Date(order.createdAt).toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="row-between">
                <span className="muted">Items</span>
                <span>{order.items.length}</span>
              </div>
              <div className="row-between">
                <span className="muted">Estado</span>
                {statusBadge(order.status)}
              </div>
            </div>
            <div className="divider" />
            <div className="row-between" style={{ fontSize: 18, fontWeight: 700 }}>
              <span>Total</span>
              <span>${money(order.total).toLocaleString("es-AR")}</span>
            </div>
            {Math.abs(computedTotal - money(order.total)) > 0.01 && (
              <div className="muted" style={{ fontSize: 12 }}>
                Calculado por items: ${computedTotal.toLocaleString("es-AR")}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
