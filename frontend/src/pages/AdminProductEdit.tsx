import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client";

type Product = {
  id: number;
  name: string;
  description?: string | null;
  price: string | number;
  stock: number;
  imageUrl?: string | null;
  categoryId?: number | null;
  category?: { id: number; name: string } | null;
};

function isValidUrl(s: string) {
  try { new URL(s); return true; } catch { return false; }
}

export default function AdminProductEdit() {
  const { id } = useParams();
  const isNew = id === "new";
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [categoryId, setCategoryId] = useState<string>("");
  const [imageUrl, setImageUrl] = useState("");

  const previewOk = useMemo(
    () => imageUrl.trim() !== "" && isValidUrl(imageUrl.trim()),
    [imageUrl]
  );

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setError(null);
      setLoading(true);
      try {
        const res = await api.get(`/products/${id}`);
        const p: Product = res.data;
        setName(p.name ?? "");
        setDescription(p.description ?? "");
        setPrice(String(p.price ?? "0"));
        setStock(String(p.stock ?? 0));
        setCategoryId(p.categoryId == null ? "" : String(p.categoryId));
        setImageUrl(p.imageUrl ?? "");
      } catch {
        setError("No pude cargar el producto");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isNew]);

  async function save() {
    setError(null);
    setSuccess(null);

    const payload: any = {
      name: name.trim(),
      description: description.trim() === "" ? null : description.trim(),
      price,
      stock: Number(stock),
      categoryId: categoryId.trim() === "" ? null : Number(categoryId),
      imageUrl: imageUrl.trim() === "" ? null : imageUrl.trim(),
    };

    if (!payload.name) return setError("El nombre es requerido");
    if (!Number.isFinite(Number(payload.price))) return setError("Precio inválido");
    if (!Number.isFinite(payload.stock) || payload.stock < 0) return setError("Stock inválido (≥ 0)");
    if (payload.categoryId !== null && !Number.isFinite(payload.categoryId)) return setError("categoryId inválido");

    setSaving(true);
    try {
      if (isNew) {
        const res = await api.post("/products", payload);
        navigate(`/admin/products/${res.data.id}`);
      } else {
        await api.patch(`/products/${id}`, payload);
        setSuccess("Cambios guardados");
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? "No se pudo guardar";
      setError(msg);
    } finally {
      setSaving(false);
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

  return (
    <div className="container page">
      <Link to="/admin/products" className="muted" style={{ display: "inline-block", marginBottom: 16, fontSize: 14 }}>
        ← Volver al panel
      </Link>

      <div className="row-between" style={{ marginBottom: 24 }}>
        <div className="stack">
          <span className="title-eyebrow">Admin</span>
          <h1 className="h1">{isNew ? "Nuevo producto" : `Editar producto #${id}`}</h1>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 32 }}>
        {/* FORM */}
        <div className="card stack-lg">
          <div className="field">
            <label className="label">Nombre</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <label className="label">Descripción</label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="field">
              <label className="label">Precio</label>
              <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Stock</label>
              <input className="input" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="label">Category ID (opcional)</label>
            <input
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              placeholder="ej: 1"
            />
            <span className="muted" style={{ fontSize: 12 }}>
              Dejalo vacío para "sin categoría"
            </span>
          </div>

          <div className="field">
            <label className="label">URL de imagen</label>
            <input
              className="input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://.../imagen.jpg"
            />
            <span className="muted" style={{ fontSize: 12 }}>
              Link directo a un archivo .jpg/.png
            </span>
          </div>

          <div className="row" style={{ gap: 12 }}>
            <button onClick={save} disabled={saving} className="btn btn-primary btn-lg">
              {saving ? "Guardando..." : isNew ? "Crear producto" : "Guardar cambios"}
            </button>
            <Link to="/admin/products" className="btn btn-ghost">Cancelar</Link>
          </div>
        </div>

        {/* PREVIEW */}
        <aside>
          <div className="card stack" style={{ position: "sticky", top: 80 }}>
            <h3 className="h3">Vista previa</h3>
            <div
              style={{
                aspectRatio: "1 / 1",
                background: "var(--surface-2)",
                borderRadius: "var(--r-md)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              {previewOk ? (
                <img
                  src={imageUrl.trim()}
                  alt="preview"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16 }}
                />
              ) : (
                <div className="muted" style={{ fontSize: 13, textAlign: "center" }}>
                  {imageUrl.trim() === "" ? "Sin imagen" : "URL inválida"}
                </div>
              )}
            </div>
            <div className="stack" style={{ gap: 4 }}>
              <span style={{ fontWeight: 500, fontSize: 15 }}>{name || "Nombre del producto"}</span>
              <span style={{ fontSize: 20, fontWeight: 700 }}>
                ${(Number.isFinite(Number(price)) ? Number(price) : 0).toLocaleString("es-AR")}
              </span>
              <span className="muted" style={{ fontSize: 12 }}>
                Stock: {Number.isFinite(Number(stock)) ? Number(stock) : 0}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
