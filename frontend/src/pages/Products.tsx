import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null; // ✅ NUEVO
  category?: { id: number; name: string } | null;
  categoryId?: number | null;
};

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/products");
        setProducts(res.data);
      } catch (e) {
        console.log("LOAD PRODUCTS ERROR:", e);
        setError("No pude cargar productos");
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h2>Productos</h2>
      {error && <p>❌ {error}</p>}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 12,
        }}
      >
        {products.map((p) => (
          <Link to={`/products/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
          {

          <div
            key={p.id}
            style={{
              border: "1px solid #444",
              borderRadius: 12,
              padding: 12,
              background: "#0f0f0f",
            }}
          >
            {/* FOTO */}
            <div
              style={{
                height: 150,
                borderRadius: 10,
                overflow: "hidden",
                border: "1px solid #333",
                marginBottom: 10,
                background: "#111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  loading="lazy"
                />
              ) : (
                <div style={{ opacity: 0.7, fontSize: 14 }}>📷 Sin foto</div>
              )}
            </div>

            <h3 style={{ margin: "0 0 6px 0" }}>{p.name}</h3>

            {p.category?.name && (
              <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                Categoría: {p.category.name}
              </div>
            )}

            <p style={{ margin: "0 0 10px 0", opacity: 0.85 }}>
              {p.description ?? "Sin descripción"}
            </p>

            <p style={{ margin: 0 }}>
              <b>${Number(p.price)}</b>
              {/* ✅ Stock solo para admin */}
              {isAdmin && <> — stock: {p.stock}</>}
            </p>
            
          </div>}
          </Link>
          
        ))}
      </div>
    </div>
  );
}
