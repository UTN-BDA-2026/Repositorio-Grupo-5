import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  category?: { id: number; name: string } | null;
};

const money = (v: any) => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [product, setProduct] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch {
        setError("No pude cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  async function addToCart() {
    if (!product) return;
    setFeedback(null);
    try {
      await api.post("/cart", { productId: product.id, quantity: qty });
      setFeedback("✅ Agregado al carrito");
    } catch (e: any) {
      setFeedback(`❌ No se pudo agregar (${e?.response?.status ?? "error"})`);
    }
  }

  if (loading) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <p>Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container page">
        <div className="empty">
          <div className="empty-icon">❌</div>
          <p>{error ?? "Producto no encontrado"}</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>
            Volver a productos
          </Link>
        </div>
      </div>
    );
  }

  const maxQty = product.stock > 0 ? product.stock : 1;
  const outOfStock = product.stock <= 0;

  return (
    <div className="container page">
      <Link to="/products" className="muted" style={{ display: "inline-block", marginBottom: 24, fontSize: 14 }}>
        ← Volver al catálogo
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
        {/* IMAGE */}
        <div
          className="card-flush"
          style={{
            background: "var(--surface-2)",
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 32 }}
            />
          ) : (
            <span style={{ fontSize: 64, opacity: 0.35 }}>📦</span>
          )}
          {outOfStock && (
            <span className="badge badge-danger" style={{ position: "absolute", top: 16, left: 16 }}>
              Sin stock
            </span>
          )}
        </div>

        {/* INFO */}
        <div className="stack-lg">
          {product.category?.name && (
            <span className="title-eyebrow">{product.category.name}</span>
          )}

          <h1 className="h1">{product.name}</h1>

          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            ${money(product.price).toLocaleString("es-AR")}
          </div>

          {isAdmin && (
            <div className="badge badge-primary" style={{ alignSelf: "flex-start" }}>
              Stock disponible: {product.stock}
            </div>
          )}

          <div className="divider" />

          <div className="stack">
            <h3 className="h3">Descripción</h3>
            <p className="muted">{product.description ?? "Sin descripción disponible."}</p>
          </div>

          <div className="divider" />

          <div className="row" style={{ gap: 16 }}>
            <div className="field" style={{ width: 110 }}>
              <label className="label">Cantidad</label>
              <input
                type="number"
                min={1}
                max={maxQty}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
                className="input"
                disabled={outOfStock}
              />
            </div>
            <button
              onClick={addToCart}
              disabled={outOfStock}
              className="btn btn-primary btn-lg"
              style={{ flex: 1, marginTop: 20 }}
            >
              {outOfStock ? "Sin stock" : "Agregar al carrito"}
            </button>
          </div>

          {feedback && (
            <div className={feedback.startsWith("✅") ? "alert alert-success" : "alert alert-error"}>
              {feedback}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
