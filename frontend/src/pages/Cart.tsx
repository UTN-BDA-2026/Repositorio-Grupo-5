import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { Link, useNavigate } from "react-router-dom";

type AnyCartItem = any;

function toNumber(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeItems(raw: any): AnyCartItem[] {
  if (Array.isArray(raw)) return raw;
  if (raw?.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState<AnyCartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  async function loadCart() {
    setError(null);
    try {
      const res = await api.get("/cart");
      setItems(normalizeItems(res.data));
    } catch {
      setError("No pude cargar el carrito");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const total = useMemo(
    () =>
      items.reduce(
        (acc, it) =>
          acc + toNumber(it.quantity) * toNumber(it.product?.price ?? it.price),
        0
      ),
    [items]
  );

  async function setQuantity(productId: number, quantity: number) {
    try {
      await api.patch(`/cart/${productId}`, { quantity });
      await loadCart();
    } catch (e: any) {
      alert(`❌ No se pudo actualizar (${e?.response?.status ?? "error"})`);
    }
  }

  async function removeItem(productId: number) {
    try {
      await api.delete(`/cart/${productId}`);
      await loadCart();
    } catch (e: any) {
      alert(`❌ No se pudo borrar (${e?.response?.status ?? "error"})`);
    }
  }

  async function clearCart() {
    if (!confirm("¿Vaciar el carrito?")) return;
    try {
      await api.delete("/cart");
      await loadCart();
    } catch (e: any) {
      alert(`❌ No se pudo vaciar (${e?.response?.status ?? "error"})`);
    }
  }

  async function checkoutLocalPay() {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const orderRes = await api.post("/orders");
      const orderId = orderRes.data?.id;
      if (!orderId) return alert("❌ No llegó el id de la orden");

      await api.post("/payments/local-pay", { orderId });
      setItems([]);
      navigate(`/orders/${orderId}`);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? "Error al procesar el pago";
      alert(`❌ ${msg}`);
    } finally {
      setCheckingOut(false);
    }
  }

  async function checkoutAndPay() {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const orderRes = await api.post("/orders");
      const orderId = orderRes.data?.id;
      if (!orderId) return alert("❌ No llegó el id de la orden");

      const payRes = await api.post("/payments/mercadopago/checkout", { orderId });
      const url = payRes.data?.init_point || payRes.data?.sandbox_init_point;
      if (!url) {
        alert("❌ No llegó init_point de MercadoPago");
        navigate(`/orders/${orderId}`);
        return;
      }
      setItems([]);
      navigate(`/orders/${orderId}`);
      const win = window.open(url, "_blank");
      if (!win) window.location.href = url;
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? "No se pudo iniciar el pago";
      alert(`❌ ${msg}`);
    } finally {
      setCheckingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <p>Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="row-between" style={{ marginBottom: 40 }}>
        <div className="stack">
          <span className="title-eyebrow">Tu pedido</span>
          <h1 className="h1">Carrito</h1>
        </div>
        {items.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clearCart}>
            Vaciar carrito
          </button>
        )}
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {items.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🛒</div>
          <p style={{ marginBottom: 16 }}>Tu carrito está vacío</p>
          <Link to="/products" className="btn btn-primary">
            Ver productos
          </Link>
        </div>
      ) : (
        <div className="grid-summary">
          {/* ITEMS */}
          <div className="stack-lg">
            {items.map((it) => {
              const productId = toNumber(it.productId ?? it.product?.id);
              const name = it.product?.name ?? it.name ?? `Producto ${productId}`;
              const image = it.product?.imageUrl ?? it.imageUrl;
              const category = it.product?.category?.name;
              const price = toNumber(it.product?.price ?? it.price);
              const stock = toNumber(it.product?.stock ?? it.stock);
              const qty = toNumber(it.quantity);
              const subtotal = price * qty;

              return (
                <div
                  key={productId}
                  className="card"
                  style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 16, alignItems: "center" }}
                >
                  {/* IMG */}
                  <div
                    style={{
                      width: 100,
                      height: 100,
                      background: "var(--surface-2)",
                      borderRadius: "var(--r-md)",
                      overflow: "hidden",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {image ? (
                      <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }} />
                    ) : (
                      <span style={{ fontSize: 28, opacity: 0.4 }}>📦</span>
                    )}
                  </div>

                  {/* INFO */}
                  <div className="stack" style={{ gap: 6 }}>
                    {category && (
                      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", fontWeight: 500 }}>
                        {category}
                      </span>
                    )}
                    <Link to={`/products/${productId}`} style={{ color: "var(--text)", fontWeight: 500, fontSize: 15 }}>
                      {name}
                    </Link>
                    <div className="muted" style={{ fontSize: 13 }}>
                      ${price.toLocaleString("es-AR")} c/u
                    </div>

                    <div className="row" style={{ gap: 8, marginTop: 6 }}>
                      <div className="row" style={{ gap: 0, border: "1px solid var(--border)", borderRadius: "var(--r-md)", overflow: "hidden" }}>
                        <button
                          onClick={() => setQuantity(productId, Math.max(1, qty - 1))}
                          disabled={qty <= 1}
                          className="btn-ghost"
                          style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: qty <= 1 ? "not-allowed" : "pointer", opacity: qty <= 1 ? 0.4 : 1 }}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 32, textAlign: "center", fontWeight: 500, fontSize: 14 }}>{qty}</span>
                        <button
                          onClick={() => setQuantity(productId, qty + 1)}
                          disabled={stock > 0 ? qty >= stock : false}
                          className="btn-ghost"
                          style={{ width: 32, height: 32, border: "none", background: "transparent", cursor: stock > 0 && qty >= stock ? "not-allowed" : "pointer", opacity: stock > 0 && qty >= stock ? 0.4 : 1 }}
                        >
                          +
                        </button>
                      </div>
                      <button onClick={() => removeItem(productId)} className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }}>
                        Quitar
                      </button>
                    </div>
                  </div>

                  {/* SUBTOTAL */}
                  <div style={{ fontWeight: 700, fontSize: 18, color: "var(--text)" }}>
                    ${subtotal.toLocaleString("es-AR")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY */}
          <aside>
            <div className="card stack-lg" style={{ position: "sticky", top: 80 }}>
              <h3 className="h3">Resumen</h3>

              <div className="row-between">
                <span className="muted">Subtotal</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>
              <div className="row-between">
                <span className="muted">Envío</span>
                <span className="muted">A coordinar</span>
              </div>
              <div className="divider" />
              <div className="row-between" style={{ fontSize: 18, fontWeight: 700 }}>
                <span>Total</span>
                <span>${total.toLocaleString("es-AR")}</span>
              </div>

              <div className="stack" style={{ gap: 10 }}>
                <button
                  onClick={checkoutLocalPay}
                  disabled={checkingOut}
                  className="btn btn-primary btn-block btn-lg"
                >
                  {checkingOut ? "Procesando..." : "Pagar (local)"}
                </button>
                <button
                  onClick={checkoutAndPay}
                  disabled={checkingOut}
                  className="btn btn-secondary btn-block"
                >
                  {checkingOut ? "Creando orden..." : "Pagar con MercadoPago"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
