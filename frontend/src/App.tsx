import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
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



function Nav() {
  const { user, logout } = useAuth();
  {user?.role === "ADMIN" && <Link to="/admin/products">Admin</Link>}

  return (
    <nav style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
      <Link to="/">Login</Link>
      <Link to="/me">Me</Link>
      <Link to="/products">Products</Link>
      <Link to="/cart">Cart</Link>
      <Link to="/orders">Orders</Link>

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

          {/* Productos puede ser público */}
          <Route path="/products" element={<Products />} />

          <Route path="/register" element={<Register />} />
          
          {/* Carrito y órdenes: protegido */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products/:id"
            element={
              <AdminRoute>
                <AdminProductEdit />
              </AdminRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
