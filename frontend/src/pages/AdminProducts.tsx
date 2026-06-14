import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  stock: number;
  imageUrl?: string | null;
  category?: { id: number; name: string } | null;
};

function money(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setError(null);
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch {
      setError("No pude cargar productos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter((p) =>
      `${p.name} ${p.description ?? ""} ${p.category?.name ?? ""}`.toLowerCase().includes(term)
    );
  }, [products, q]);

  return (
    <div className="container page">
      <div className="row-between" style={{ marginBottom: 24 }}>
        <div className="stack">
          <span className="title-eyebrow">Panel</span>
          <h1 className="h1">Admin · Productos</h1>
        </div>
        <Link to="/admin/products/new" className="btn btn-primary">
          + Nuevo producto
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="row" style={{ gap: 12, marginBottom: 20 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, descripción o categoría..."
          className="input"
          style={{ flex: 1 }}
        />
        <button className="btn btn-secondary" onClick={load}>Recargar</button>
      </div>

      {loading ? (
        <div className="empty">
          <div className="empty-icon">⏳</div>
          <p>Cargando productos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">🔍</div>
          <p>No hay productos para ese filtro</p>
        </div>
      ) : (
        <div className="card-flush">
          <table className="table">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Categoría</th>
                <th style={{ textAlign: "right" }}>Precio</th>
                <th style={{ textAlign: "right" }}>Stock</th>
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ width: 72 }}>
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: "var(--r-md)",
                        background: "var(--surface-2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }}
                        />
                      ) : (
                        <span style={{ fontSize: 20, opacity: 0.4 }}>📦</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 2 }}>
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.description && (
                        <span className="muted" style={{ fontSize: 12, maxWidth: 360, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {p.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    {p.category?.name ? (
                      <span className="badge">{p.category.name}</span>
                    ) : (
                      <span className="faint">—</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600 }}>
                    ${money(p.price).toLocaleString("es-AR")}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    {p.stock === 0 ? (
                      <span className="badge badge-danger">0</span>
                    ) : p.stock < 5 ? (
                      <span className="badge badge-warning">{p.stock}</span>
                    ) : (
                      <span>{p.stock}</span>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <Link to={`/admin/products/${p.id}`} className="btn btn-secondary btn-sm">
                      Editar
                    </Link>
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
