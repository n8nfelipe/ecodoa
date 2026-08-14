import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, phone || undefined);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha no cadastro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="mb-6 text-center text-2xl font-bold tracking-tight text-gray-900">
        Criar conta
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Nome
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field w-full"
            minLength={2}
            required
          />
        </div>
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
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            WhatsApp (opcional, usado para contato)
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="11999999999"
            className="field w-full"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Senha
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field w-full"
            minLength={6}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-600">
        Já tem conta?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 underline underline-offset-2 transition hover:text-brand-700"
        >
          Entrar
        </Link>
      </p>
    </div>
  );
}