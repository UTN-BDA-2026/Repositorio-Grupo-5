import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) return setError("Completá email y contraseña");
    if (password.length < 6) return setError("La contraseña debe tener mínimo 6 caracteres");
    if (password !== password2) return setError("Las contraseñas no coinciden");

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email: email.trim(),
        password,
      });

      const token = res.data?.token;
      if (!token) {
        setError("No llegó token del servidor");
        return;
      }
      localStorage.setItem("token", token);
      window.location.href = "/products";
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="card stack-lg">
          <div className="stack">
            <span className="title-eyebrow">Nuevo usuario</span>
            <h1 className="h2">Crear cuenta</h1>
            <p className="muted">Empezá a comprar en segundos</p>
          </div>

          <form onSubmit={submit} className="stack-lg">
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Contraseña</label>
              <input
                id="password"
                type="password"
                className="input"
                placeholder="mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password2">Repetir contraseña</label>
              <input
                id="password2"
                type="password"
                className="input"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? "Creando..." : "Crear cuenta"}
            </button>
          </form>

          <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>
            ¿Ya tenés cuenta? <Link to="/">Iniciá sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
