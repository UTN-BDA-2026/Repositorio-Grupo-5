import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

type Product = {
  id: number;
  name: string;
  price: number | string;
  imageUrl?: string | null;
  category?: { id: number; name: string } | null;
};

/**
 * Landing page (ruta `/`).
 * Siempre muestra el contenido marketing (hero + features + destacados).
 * El bloque de login se oculta si el usuario ya está logueado.
 */
export default function Landing() {
  return (
    <>
      <Hero />
      <Features />
      <Categories />
      <FeaturedProducts />
      <LoginSection />
      <Footer />
    </>
  );
}

/* ─────────────────── HERO ─────────────────── */
function Hero() {
  const { user } = useAuth();

  return (
    <section
      style={{
        position: "relative",
        background:
          "radial-gradient(1200px 600px at 0% 0%, oklch(58% 0.18 280 / 0.18), transparent 60%)," +
          "radial-gradient(1000px 700px at 100% 30%, oklch(60% 0.20 305 / 0.16), transparent 55%)," +
          "linear-gradient(180deg, oklch(98% 0.004 270) 0%, oklch(96% 0.012 270) 100%)",
        borderBottom: "1px solid var(--border)",
        overflow: "hidden",
      }}
    >
      <div className="container" style={{ padding: "96px 64px 112px" }}>
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            gap: 72,
            alignItems: "center",
          }}
        >
          {/* COPY */}
          <div className="stack-lg" style={{ gap: 28 }}>
            <span
              className="badge badge-primary anim-fade-up"
              style={{ alignSelf: "flex-start", padding: "6px 14px", fontSize: 13 }}
            >
              ✦ Tienda online · envíos a todo el país
            </span>

            <h1
              className="anim-fade-up-delay-1"
              style={{
                fontSize: 60,
                fontWeight: 700,
                letterSpacing: "-0.025em",
                lineHeight: 1.04,
                color: "var(--text)",
                margin: 0,
              }}
            >
              Tecnología y hogar,<br />
              <span style={{ color: "var(--primary)" }}>al precio justo.</span>
            </h1>

            <p
              className="anim-fade-up-delay-2"
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: "var(--text-muted)",
                maxWidth: 540,
                margin: 0,
              }}
            >
              Catálogo curado con miles de productos en electrónica, gaming, hogar y
              más. Compra rápida, pago seguro, y soporte real cuando lo necesitás.
            </p>

            <div className="row anim-fade-up-delay-3" style={{ gap: 12, marginTop: 8 }}>
              <Link to="/products" className="btn btn-primary btn-lg">
                Explorar catálogo
              </Link>
              {!user && (
                <Link to="/register" className="btn btn-secondary btn-lg">
                  Crear cuenta gratis
                </Link>
              )}
            </div>

            <div
              className="row anim-fade-up-delay-4"
              style={{ gap: 32, marginTop: 24, flexWrap: "wrap" }}
            >
              <Stat value="5.000+" label="Productos disponibles" />
              <Stat value="24h" label="Despacho promedio" />
              <Stat value="100%" label="Pago seguro" />
            </div>
          </div>

          {/* IMAGE COLLAGE */}
          <HeroCollage />
        </div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .hero-collage { display: none; }
        }
      `}</style>
    </section>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="stack" style={{ gap: 4 }}>
      <span style={{ fontSize: 26, fontWeight: 700, color: "var(--text)", letterSpacing: "-0.015em" }}>
        {value}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </span>
    </div>
  );
}

function HeroCollage() {
  // Imágenes de Unsplash (CDN público, no requieren API key).
  const img1 =
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"; // headphones
  const img2 =
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"; // sneakers
  const img3 =
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"; // watch
  const img4 =
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80"; // phone

  return (
    <div
      className="hero-collage"
      style={{
        position: "relative",
        aspectRatio: "1 / 1.05",
        maxWidth: 520,
        marginLeft: "auto",
        width: "100%",
      }}
    >
      {/* Halo background */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-6% -6% 0 -6%",
          borderRadius: 32,
          background:
            "linear-gradient(135deg, oklch(53% 0.21 280 / 0.85) 0%, oklch(48% 0.24 305 / 0.85) 100%)",
          transform: "rotate(-3deg)",
          boxShadow: "0 40px 100px oklch(50% 0.20 285 / 0.30)",
        }}
        className="anim-fade-up"
      />

      {/* Big image */}
      <div
        className="anim-fade-up-delay-1 anim-float"
        style={{
          position: "absolute",
          top: "8%",
          left: "8%",
          width: "62%",
          aspectRatio: "1 / 1",
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 25px 60px oklch(20% 0.025 270 / 0.25)",
          background: "var(--surface)",
        }}
      >
        <img
          src={img1}
          alt="Auriculares premium"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Top-right small image */}
      <div
        className="anim-fade-up-delay-2 anim-float-slower"
        style={{
          position: "absolute",
          top: "0%",
          right: "0%",
          width: "40%",
          aspectRatio: "1 / 1",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 20px 50px oklch(20% 0.025 270 / 0.20)",
          background: "var(--surface)",
        }}
      >
        <img
          src={img3}
          alt="Reloj"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Bottom-right image */}
      <div
        className="anim-fade-up-delay-3 anim-float-alt"
        style={{
          position: "absolute",
          bottom: "4%",
          right: "4%",
          width: "44%",
          aspectRatio: "1 / 1",
          borderRadius: 18,
          overflow: "hidden",
          boxShadow: "0 22px 55px oklch(20% 0.025 270 / 0.22)",
          background: "var(--surface)",
        }}
      >
        <img
          src={img2}
          alt="Zapatillas"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Bottom-left phone */}
      <div
        className="anim-fade-up-delay-4 anim-float"
        style={{
          position: "absolute",
          bottom: "-2%",
          left: "0%",
          width: "32%",
          aspectRatio: "1 / 1",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 18px 45px oklch(20% 0.025 270 / 0.22)",
          background: "var(--surface)",
        }}
      >
        <img
          src={img4}
          alt="Smartphone"
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Floating price badge */}
      <div
        className="anim-fade-up-delay-4"
        style={{
          position: "absolute",
          top: "44%",
          right: "-4%",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "12px 16px",
          boxShadow: "var(--shadow-lg)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span
          className="anim-pulse-ring"
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: "var(--success)",
            display: "inline-block",
          }}
        />
        <div className="stack" style={{ gap: 0 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>En stock</span>
          <span style={{ fontWeight: 700, fontSize: 14 }}>+1.200 hoy</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── FEATURES ─────────────────── */
function Features() {
  const items = [
    {
      icon: "🚚",
      title: "Envío rápido",
      body: "Llegamos a todo el país en 24 a 72 horas. Despacho gratis desde $30.000.",
    },
    {
      icon: "🔒",
      title: "Pago protegido",
      body: "Procesamos con MercadoPago. Tus datos nunca pasan por nuestros servidores.",
    },
    {
      icon: "↩️",
      title: "Devoluciones simples",
      body: "Hasta 30 días para cambiar o devolver. Sin letra chica.",
    },
  ];

  return (
    <section style={{ padding: "96px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="container">
        <div className="stack" style={{ gap: 8, marginBottom: 48, maxWidth: 640 }}>
          <span className="title-eyebrow">Por qué Zentro</span>
          <h2 className="h1" style={{ fontSize: 38 }}>
            Una experiencia de compra<br />que no necesita explicaciones.
          </h2>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 24,
          }}
        >
          {items.map((it, i) => (
            <div
              key={it.title}
              className={`card card-roomy anim-fade-up-delay-${i + 1}`}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: "var(--primary-soft)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  marginBottom: 20,
                }}
              >
                {it.icon}
              </div>
              <h3 className="h3" style={{ marginBottom: 8 }}>{it.title}</h3>
              <p className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>
                {it.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── CATEGORIES VISUAL ─────────────────── */
function Categories() {
  const cats = [
    {
      name: "Electrónica",
      img: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=700&q=80",
    },
    {
      name: "Hogar",
      img: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=700&q=80",
    },
    {
      name: "Gaming",
      img: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=700&q=80",
    },
    {
      name: "Moda",
      img: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80",
    },
  ];

  return (
    <section style={{ padding: "96px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="container">
        <div className="row-between" style={{ marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div className="stack" style={{ gap: 8, maxWidth: 540 }}>
            <span className="title-eyebrow">Categorías</span>
            <h2 className="h1" style={{ fontSize: 38 }}>Explorá por rubro</h2>
          </div>
          <Link to="/products" className="btn btn-secondary">
            Ver catálogo completo
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {cats.map((c, i) => (
            <Link
              key={c.name}
              to="/products"
              className={`anim-fade-up-delay-${Math.min(i + 1, 4)}`}
              style={{
                position: "relative",
                borderRadius: 16,
                overflow: "hidden",
                aspectRatio: "4 / 5",
                color: "oklch(99% 0.005 270)",
                textDecoration: "none",
                display: "block",
                boxShadow: "var(--shadow-md)",
              }}
            >
              <img
                src={c.img}
                alt={c.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLImageElement).style.transform = "scale(1)";
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(180deg, transparent 40%, oklch(15% 0.025 270 / 0.85) 100%)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 20,
                  left: 20,
                  right: 20,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.015em" }}>
                  {c.name}
                </span>
                <span
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 999,
                    background: "oklch(99% 0.005 270 / 0.15)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                  }}
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── FEATURED PRODUCTS ─────────────────── */
function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.slice(0, 4));
      } catch {
        /* silent */
      }
    })();
  }, []);

  if (products.length === 0) return null;

  return (
    <section style={{ padding: "96px 0", borderBottom: "1px solid var(--border)" }}>
      <div className="container">
        <div className="row-between" style={{ marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div className="stack" style={{ gap: 8, maxWidth: 540 }}>
            <span className="title-eyebrow">Destacados</span>
            <h2 className="h1" style={{ fontSize: 38 }}>Lo que se está vendiendo ahora</h2>
          </div>
          <Link to="/products" className="btn btn-secondary">
            Ver todos →
          </Link>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 24,
          }}
        >
          {products.map((p, i) => (
            <Link
              key={p.id}
              to={`/products/${p.id}`}
              className={`card-flush card-hover anim-fade-up-delay-${Math.min(i + 1, 4)}`}
              style={{ display: "flex", flexDirection: "column", color: "inherit" }}
            >
              <div
                style={{
                  background: "var(--surface-2)",
                  aspectRatio: "1 / 1",
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
                    style={{ width: "100%", height: "100%", objectFit: "contain", padding: 16 }}
                  />
                ) : (
                  <span style={{ fontSize: 36, opacity: 0.35 }}>📦</span>
                )}
              </div>
              <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                {p.category?.name && (
                  <span style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 500 }}>
                    {p.category.name}
                  </span>
                )}
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 40 }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 18, fontWeight: 700, marginTop: "auto", paddingTop: 4 }}>
                  ${Number(p.price).toLocaleString("es-AR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── LOGIN SECTION ─────────────────── */
function LoginSection() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user) {
    // Si ya está logueado, mostramos un CTA simple en vez del form.
    return (
      <section
        style={{
          padding: "96px 0",
          background: "var(--surface-2)",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div className="container" style={{ textAlign: "center" }}>
          <span className="title-eyebrow">Cuenta activa</span>
          <h2 className="h1" style={{ fontSize: 38, marginTop: 8 }}>
            Hola, <span style={{ color: "var(--primary)" }}>{user.email}</span>
          </h2>
          <p className="muted" style={{ fontSize: 16, marginTop: 12, maxWidth: 540, marginLeft: "auto", marginRight: "auto" }}>
            Seguí navegando el catálogo o revisá tus compras en curso.
          </p>
          <div className="row" style={{ justifyContent: "center", gap: 12, marginTop: 32 }}>
            <button className="btn btn-primary btn-lg" onClick={() => navigate("/products")}>
              Ver catálogo
            </button>
            <button className="btn btn-secondary btn-lg" onClick={() => navigate("/orders")}>
              Mis órdenes
            </button>
          </div>
        </div>
      </section>
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/products");
    } catch {
      setError("Email o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      id="login"
      style={{
        padding: "112px 0",
        background: "var(--surface-2)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="container">
        <div
          className="login-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 440px)",
            gap: 80,
            alignItems: "center",
          }}
        >
          <div className="stack" style={{ gap: 16, maxWidth: 480 }}>
            <span className="title-eyebrow">Ya tenés cuenta</span>
            <h2 className="h1" style={{ fontSize: 38 }}>
              Iniciá sesión y seguí donde dejaste.
            </h2>
            <p className="muted" style={{ fontSize: 16, lineHeight: 1.6 }}>
              Acceso a tu carrito, historial de órdenes, dirección de envío y
              ofertas personalizadas.
            </p>
            <p className="muted" style={{ fontSize: 14, marginTop: 8 }}>
              ¿Sos nuevo? <Link to="/register">Crear cuenta gratis</Link>
            </p>
          </div>

          <div className="card card-roomy stack-lg">
            <form onSubmit={handleLogin} className="stack-lg">
              <div className="field">
                <label className="label" htmlFor="login-email">Email</label>
                <input
                  id="login-email"
                  type="email"
                  className="input"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="login-password">Contraseña</label>
                <input
                  id="login-password"
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && <div className="alert alert-error">{error}</div>}

              <button
                type="submit"
                className="btn btn-primary btn-block btn-lg"
                disabled={loading}
              >
                {loading ? "Ingresando..." : "Iniciar sesión"}
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 920px) {
          .login-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
        }
      `}</style>
    </section>
  );
}

/* ─────────────────── FOOTER ─────────────────── */
function Footer() {
  return (
    <footer
      style={{
        padding: "48px 0",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="container">
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div className="row" style={{ gap: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 17 }}>
              Zentro Digital<span style={{ color: "var(--primary)" }}>.</span>
            </span>
            <span className="muted" style={{ fontSize: 13 }}>
              © {new Date().getFullYear()} · Todos los derechos reservados
            </span>
          </div>
          <div className="row" style={{ gap: 20, fontSize: 13 }}>
            <Link to="/products" className="muted">Catálogo</Link>
            <Link to="/register" className="muted">Crear cuenta</Link>
            <a href="#login" className="muted">Iniciar sesión</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
