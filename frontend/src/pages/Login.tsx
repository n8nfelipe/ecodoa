import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha no login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900">
        Entrar
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field w-full"
            required
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <label className="block text-sm font-medium text-gray-700">Senha</label>
            <Link to="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
              Esqueci minha senha
            </Link>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field w-full"
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Não tem conta?{" "}
        <Link
          to="/register"
          className="font-semibold text-brand-600 underline underline-offset-2 transition hover:text-brand-700"
        >
          Cadastre-se
        </Link>
      </p>
    </div>
  );
}
