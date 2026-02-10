import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (!email.trim() || !password) {
      setMsg("Completá email y contraseña");
      return;
    }
    if (password.length < 6) {
      setMsg("La contraseña debe tener mínimo 6 caracteres");
      return;
    }
    if (password !== password2) {
      setMsg("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/register", {
        email: email.trim(),
        password,
      });

      const token = res.data?.token;
      if (!token) {
        setMsg("No llegó token del servidor");
        return;
      }

      // mismo key que venís usando
      localStorage.setItem("token", token);

      // recarga para que AuthContext levante el token y haga /auth/me
      window.location.href = "/me";
    } catch (e: any) {
      console.log("REGISTER ERROR:", e?.response?.status, e?.response?.data, e?.message);
      setMsg(e?.response?.data?.error ?? "No se pudo registrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif", maxWidth: 520 }}>
      <h2>Crear cuenta</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email"
          style={{ padding: 10 }}
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          type="password"
          style={{ padding: 10 }}
        />
        <input
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          placeholder="repetir password"
          type="password"
          style={{ padding: 10 }}
        />

        <button disabled={loading} style={{ padding: 10 }}>
          {loading ? "Creando..." : "Registrarme"}
        </button>

        {msg && <div style={{ opacity: 0.9 }}>{msg}</div>}

        <div style={{ opacity: 0.8 }}>
          ¿Ya tenés cuenta? <Link to="/">Ir a Login</Link>
        </div>
      </form>
    </div>
  );
}
