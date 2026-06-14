import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const { login, user, logout } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  if (user) {
    return (
      <div className="container page">
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <div className="card stack-lg">
            <div className="stack">
              <span className="title-eyebrow">Sesión activa</span>
              <h1 className="h2">Ya estás logueado</h1>
              <p className="muted">como <b>{user.email}</b></p>
            </div>
            <div className="row" style={{ gap: 10 }}>
              <button className="btn btn-primary" onClick={() => navigate("/me")}>
                Ir a mi cuenta
              </button>
              <button className="btn btn-secondary" onClick={logout}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <div className="card stack-lg">
          <div className="stack">
            <span className="title-eyebrow">Bienvenido</span>
            <h1 className="h2">Iniciar sesión</h1>
            <p className="muted">Ingresá con tu cuenta para seguir comprando</p>
          </div>

          <form onSubmit={handleLogin} className="stack-lg">
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
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? "Ingresando..." : "Entrar"}
            </button>
          </form>

          <p className="muted" style={{ textAlign: "center", fontSize: 14 }}>
            ¿No tenés cuenta? <Link to="/register">Registrate</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
