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

  useEffect(() => {
    async function load() {
      setError(null);
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        setProduct(res.data);
      } catch (e: any) {
        console.log("LOAD PRODUCT DETAIL ERROR:", e?.response?.status, e?.response?.data, e?.message);
        setError("No pude cargar el producto");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function addToCart() {
    if (!product) return;
    try {
      await api.post("/cart", { productId: product.id, quantity: qty });
      alert("✅ Agregado al carrito");
    } catch (e: any) {
      console.log("ADD TO CART ERROR:", e?.response?.status, e?.response?.data, e?.message);
      alert(`❌ No se pudo agregar (${e?.response?.status ?? "NETWORK"})`);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h2>Producto</h2>
        <p>Cargando...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ padding: 20, fontFamily: "sans-serif" }}>
        <h2>Producto</h2>
        <p>❌ {error ?? "No encontrado"}</p>
        <Link to="/products">← Volver a productos</Link>
      </div>
    );
  }

  const maxQty = product.stock > 0 ? product.stock : 1;

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 1000, margin: "0 auto" }}>
      <Link to="/products" style={{ color: "inherit" }}>
        ← Volver a productos
      </Link>

      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 16, marginTop: 12 }}>
        {/* Imagen */}
        <div
          style={{
            border: "1px solid #444",
            borderRadius: 14,
            overflow: "hidden",
            background: "#0f0f0f",
            minHeight: 380,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ opacity: 0.7 }}>📷 Sin foto</div>
          )}
        </div>

        {/* Info */}
        <div style={{ border: "1px solid #444", borderRadius: 14, padding: 16, background: "#0f0f0f" }}>
          <h2 style={{ marginTop: 0 }}>{product.name}</h2>

          {product.category?.name && (
            <div style={{ opacity: 0.75, marginBottom: 10 }}>Categoría: {product.category.name}</div>
          )}

          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>${money(product.price)}</div>

          {isAdmin && (
            <div style={{ opacity: 0.85, marginBottom: 12 }}>
              Stock: <b>{product.stock}</b>
            </div>
          )}

          <div style={{ opacity: 0.9, marginBottom: 16 }}>
            {product.description ?? "Sin descripción"}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ opacity: 0.8 }}>Cantidad</span>
            <input
              type="number"
              min={1}
              max={maxQty}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
              style={{ width: 90, padding: 8, borderRadius: 10, border: "1px solid #444" }}
              disabled={product.stock <= 0}
            />
          </div>

          <button
            onClick={addToCart}
            disabled={product.stock <= 0}
            style={{
              marginTop: 14,
              padding: 12,
              width: "100%",
              borderRadius: 12,
              opacity: product.stock <= 0 ? 0.5 : 1,
              cursor: product.stock <= 0 ? "not-allowed" : "pointer",
            }}
          >
            {product.stock <= 0 ? "Sin stock" : "Agregar al carrito"}
          </button>
        </div>
      </div>
    </div>
  );
}
