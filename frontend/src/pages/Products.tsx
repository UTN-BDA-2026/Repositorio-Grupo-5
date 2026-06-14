import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  imageUrl?: string | null;
  category?: { id: number; name: string } | null;
  categoryId?: number | null;
};

type Category = { id: number; name: string };

export default function Products() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          api.get("/products"),
          api.get("/categories").catch(() => ({ data: [] as Category[] })),
        ]);
        setProducts(prodRes.data);
        setCategories(catRes.data);
      } catch {
        setError("No pude cargar productos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCat =
        selectedCategory === null ||
        p.categoryId === selectedCategory ||
        p.category?.id === selectedCategory;
      const q = search.trim().toLowerCase();
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [products, selectedCategory, search]);

  const activeCategory = categories.find((c) => c.id === selectedCategory);

  return (
    <div className="container page">
      {/* HERO */}
      <section
        className="stack-lg"
        style={{
          background:
            "linear-gradient(135deg, oklch(53% 0.21 280) 0%, oklch(48% 0.24 305) 100%)",
          color: "oklch(99% 0.005 270)",
          borderRadius: 20,
          padding: "72px 64px",
          marginBottom: 64,
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            opacity: 0.85,
          }}
        >
          Catálogo
        </span>
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "-0.02em",
            maxWidth: 600,
          }}
        >
          {activeCategory ? activeCategory.name : "Explorá nuestros productos"}
        </h1>
        <p style={{ opacity: 0.85, fontSize: 15, maxWidth: 600 }}>
          {loading
            ? "Cargando catálogo..."
            : `${filtered.length} producto${filtered.length === 1 ? "" : "s"} disponibles`}
        </p>
      </section>

      <div className="grid-sidebar">
        {/* SIDEBAR */}
        <aside>
          <div className="card card-tight" style={{ position: "sticky", top: 88 }}>
            <h3 className="h3" style={{ marginBottom: 16 }}>Categorías</h3>
            <ul className="stack" style={{ gap: 2 }}>
              <CategoryItem
                label="Todas"
                count={products.length}
                active={selectedCategory === null}
                onClick={() => setSelectedCategory(null)}
              />
              {categories.map((c) => {
                const count = products.filter(
                  (p) => p.categoryId === c.id || p.category?.id === c.id
                ).length;
                return (
                  <CategoryItem
                    key={c.id}
                    label={c.name}
                    count={count}
                    active={selectedCategory === c.id}
                    onClick={() => setSelectedCategory(c.id)}
                  />
                );
              })}
            </ul>
          </div>
        </aside>

        {/* MAIN */}
        <main>
          {/* SEARCH */}
          <div className="row" style={{ marginBottom: 24 }}>
            <input
              type="text"
              className="input"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: 360 }}
            />
            {selectedCategory !== null && (
              <span className="badge badge-primary">
                {activeCategory?.name}
                <button
                  onClick={() => setSelectedCategory(null)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    marginLeft: 2,
                    fontSize: 14,
                  }}
                  aria-label="Quitar filtro"
                >
                  ×
                </button>
              </span>
            )}
          </div>

          {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}

          {loading ? (
            <div className="empty">
              <div className="empty-icon">⏳</div>
              <p>Cargando productos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">🔍</div>
              <p>No encontramos productos con esos filtros</p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                gap: 20,
              }}
            >
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} isAdmin={isAdmin} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* ─────────────── COMPONENTS ─────────────── */

function CategoryItem({
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
    <li>
      <button
        onClick={onClick}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          padding: "8px 10px",
          borderRadius: 8,
          fontSize: 14,
          background: active ? "var(--primary-soft)" : "transparent",
          color: active ? "var(--primary-hover)" : "var(--text)",
          fontWeight: active ? 600 : 400,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = "var(--surface-2)";
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = "transparent";
        }}
      >
        <span>{label}</span>
        <span
          style={{
            fontSize: 11,
            color: active ? "var(--primary-hover)" : "var(--text-faint)",
          }}
        >
          {count}
        </span>
      </button>
    </li>
  );
}

function ProductCard({ product, isAdmin }: { product: Product; isAdmin: boolean }) {
  const outOfStock = product.stock === 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="card-flush card-hover"
      style={{ display: "flex", flexDirection: "column", color: "inherit" }}
    >
      {/* IMG */}
      <div
        style={{
          position: "relative",
          background: "var(--surface-2)",
          aspectRatio: "1 / 1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              padding: 16,
            }}
          />
        ) : (
          <span style={{ fontSize: 36, opacity: 0.35 }}>📦</span>
        )}
        {outOfStock && (
          <span
            className="badge badge-danger"
            style={{ position: "absolute", top: 10, left: 10 }}
          >
            Sin stock
          </span>
        )}
      </div>

      {/* INFO */}
      <div
        style={{
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        {product.category?.name && (
          <span
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 500,
            }}
          >
            {product.category.name}
          </span>
        )}
        <h3
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--text)",
            margin: 0,
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 40,
          }}
        >
          {product.name}
        </h3>
        <div className="row-between" style={{ marginTop: "auto", paddingTop: 4 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "var(--text)",
              letterSpacing: "-0.01em",
            }}
          >
            ${Number(product.price).toLocaleString("es-AR")}
          </span>
          {isAdmin && (
            <span style={{ fontSize: 11, color: "var(--text-faint)" }}>
              stock: {product.stock}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
