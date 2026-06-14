import { BrowserRouter, Routes, Route, Link, NavLink } from "react-router-dom";
import Login from "./pages/Login";
import Me from "./pages/Me";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import AdminRoute from "./routes/AdminRoute";
import AdminProducts from "./pages/AdminProducts";
import AdminProductEdit from "./pages/AdminProductEdit";
import Register from "./pages/Register";
import ProductDetail from "./pages/ProductDetail";

function Nav() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/products" className="nav-brand">
          Ecommerce<span className="nav-brand-dot">.</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/products" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
            Productos
          </NavLink>
          {user && (
            <>
              <NavLink to="/cart" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                Carrito
              </NavLink>
              <NavLink to="/orders" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                Órdenes
              </NavLink>
              <NavLink to="/me" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
                Mi cuenta
              </NavLink>
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin/products" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
              Admin
            </NavLink>
          )}
        </nav>

        <div className="nav-user">
          {user ? (
            <>
              <span>{user.email}</span>
              <button className="btn btn-secondary btn-sm" onClick={logout}>
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link to="/" className="nav-link">Iniciar sesión</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Crear cuenta</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />

          <Route path="/me" element={<ProtectedRoute><Me /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
          <Route path="/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />

          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/products/:id" element={<AdminRoute><AdminProductEdit /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
