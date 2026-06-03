import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";

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
  const [checkingOut, setCheckingOut] = useState(false);

  async function loadCart() {
    setError(null);
    try {
      const res = await api.get("/cart");
      setItems(normalizeItems(res.data));
    } catch (e: any) {
      console.log("LOAD CART ERROR:", e?.response?.status, e?.response?.data, e?.message);
      setError("No pude cargar el carrito");
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  const computedTotal = useMemo(() => {
    return items.reduce((acc, it) => {
      const qty = toNumber(it.quantity);
      const price = toNumber(it.product?.price ?? it.price);
      return acc + qty * price;
    }, 0);
  }, [items]);

  async function setQuantity(productId: number, quantity: number) {
    try {
      await api.patch(`/cart/${productId}`, { quantity });
      await loadCart();
    } catch (e: any) {
      console.log("SET QTY ERROR:", e?.response?.status, e?.response?.data, e?.message);
      alert(`❌ No se pudo actualizar (${e?.response?.status ?? "NETWORK"})`);
    }
  }

  async function removeItem(productId: number) {
    try {
      await api.delete(`/cart/${productId}`);
      await loadCart();
    } catch (e: any) {
      console.log("REMOVE ITEM ERROR:", e?.response?.status, e?.response?.data, e?.message);
      alert(`❌ No se pudo borrar (${e?.response?.status ?? "NETWORK"})`);
    }
  }

  async function clearCart() {
    try {
      await api.delete("/cart");
      await loadCart();
    } catch (e: any) {
      console.log("CLEAR CART ERROR:", e?.response?.status, e?.response?.data, e?.message);
      alert(`❌ No se pudo vaciar (${e?.response?.status ?? "NETWORK"})`);
    }
  }

  // Pago local sin MercadoPago (para desarrollo)
  async function checkoutLocalPay() {
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const orderRes = await api.post("/orders");
      const orderId = orderRes.data?.id;
      if (!orderId) { alert("❌ No llegó el id de la orden"); return; }

      await api.post("/payments/local-pay", { orderId });

      setItems([]);
      navigate(`/orders/${orderId}`);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? "Error al procesar el pago";
      alert(`❌ ${msg} (${e?.response?.status ?? "NETWORK"})`);
    } finally {
      setCheckingOut(false);
    }
  }

  // ✅ 1 click: crea orden y abre MercadoPago
  async function checkoutAndPay() {
    if (items.length === 0) return;

    setCheckingOut(true);
    try {
      // 1) crear orden desde el carrito
      const orderRes = await api.post("/orders");
      const orderId = orderRes.data?.id;

      if (!orderId) {
        alert("❌ No llegó el id de la orden");
        return;
      }

      // 2) pedir link de MercadoPago
      const payRes = await api.post("/payments/mercadopago/checkout", { orderId });

      const url = payRes.data?.init_point || payRes.data?.sandbox_init_point;
      if (!url) {
        alert("❌ No llegó init_point/sandbox_init_point de MercadoPago");
        // igual te mando al detalle, la orden quedó creada
        navigate(`/orders/${orderId}`);
        return;
      }

      // 3) UX: vaciar UI + ir al detalle de la orden
      setItems([]);
      navigate(`/orders/${orderId}`);

      // 4) abrir MP (si el popup se bloquea, cae en la misma pestaña)
      const win = window.open(url, "_blank");
      if (!win) window.location.href = url;
    } catch (e: any) {
      console.log("CHECKOUT+PAY ERROR:", e?.response?.status, e?.response?.data, e?.message);
      const msg = e?.response?.data?.error ?? "No se pudo crear la orden / iniciar pago";
      alert(`❌ ${msg} (${e?.response?.status ?? "NETWORK"})`);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Carrito</h2>
      {error && <p>❌ {error}</p>}

      {items.length === 0 ? (
        <p>Carrito vacío</p>
      ) : (
        <>
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((it) => {
              const productId = toNumber(it.productId ?? it.product?.id);
              const name = it.product?.name ?? it.name ?? `Producto ${productId}`;
              const price = toNumber(it.product?.price ?? it.price);
              const stock = toNumber(it.product?.stock ?? it.stock);
              const qty = toNumber(it.quantity);

              return (
                <div
                  key={`${productId}`}
                  style={{ border: "1px solid #444", borderRadius: 8, padding: 12 }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{name}</b>
                    <span>${price}</span>
                  </div>

                  <div style={{ marginTop: 6, opacity: 0.9 }}>
                    Cantidad: <b>{qty}</b> {stock ? `(stock: ${stock})` : ""}
                  </div>

                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button
                      onClick={() => setQuantity(productId, Math.max(1, qty - 1))}
                      disabled={qty <= 1}
                      style={{ padding: 8 }}
                    >
                      -
                    </button>

                    <button
                      onClick={() => setQuantity(productId, qty + 1)}
                      disabled={stock > 0 ? qty >= stock : false}
                      style={{ padding: 8 }}
                    >
                      +
                    </button>

                    <button
                      onClick={() => removeItem(productId)}
                      style={{ padding: 8, marginLeft: "auto" }}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <h3 style={{ marginTop: 16 }}>Total: ${computedTotal}</h3>

          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
            <button onClick={clearCart} style={{ padding: 10 }}>
              Vaciar carrito
            </button>

            <button
              onClick={checkoutLocalPay}
              disabled={checkingOut}
              style={{ padding: 10, marginLeft: "auto", background: "#2ecc71", color: "white", border: "none", borderRadius: 6, cursor: "pointer" }}
            >
              {checkingOut ? "Procesando..." : "✅ Pagar (local)"}
            </button>

            <button
              onClick={checkoutAndPay}
              disabled={checkingOut}
              style={{ padding: 10 }}
            >
              {checkingOut ? "Creando orden..." : "Pagar con MercadoPago"}
            </button>
          </div>
        </>
      )}

      <button onClick={loadCart} style={{ marginTop: 12, padding: 10 }}>
        Recargar carrito
      </button>
    </div>
  );
}
