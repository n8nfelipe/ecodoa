import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import ListingDetails from "./pages/ListingDetails";
import CreateListing from "./pages/CreateListing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";

function Loading() {
  return (
    <div className="flex justify-center py-16" role="status">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || (user.role !== "MODERATOR" && user.role !== "ADMIN"))
    return <Navigate to="/" replace />;
  return children;
}

function RequireAdministrator({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || user.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id" element={<ListingDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/create"
            element={
              <RequireAuth>
                <CreateListing />
              </RequireAuth>
            }
          />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminDashboard />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RequireAdministrator>
                <UserManagement />
              </RequireAdministrator>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
