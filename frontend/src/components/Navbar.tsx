import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-brand-700 bg-brand-600 text-white shadow-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            aria-hidden
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15 text-base"
          >
            ♻️
          </span>
          <span className="text-base font-bold tracking-tight sm:text-lg">
            EcoDoa
          </span>
        </Link>

        <div className="flex items-center gap-1.5 text-sm sm:gap-2">
          <Link to="/" className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10">
            Mapa
          </Link>
          {user && (
            <Link to="/create" className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10">
              Publicar Doação
            </Link>
          )}
          {(user?.role === "MODERATOR" || user?.role === "ADMIN") && (
            <Link to="/admin" className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10">
              Moderação
            </Link>
          )}
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="rounded-md px-2.5 py-1.5 transition hover:bg-white/10">
                Olá, {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-white/15 px-3 py-1.5 font-medium transition hover:bg-white/25"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-white px-3.5 py-1.5 font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}