import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login";
import Me from "./pages/Me";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";

function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <Link to="/">Login</Link>
      <Link to="/me">Me</Link>
      <div style={{ marginLeft: "auto" }}>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>{user.email}</span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <span>No logueado</span>
        )}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/me"
            element={
              <ProtectedRoute>
                <Me />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
