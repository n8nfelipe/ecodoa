import { FormEvent, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Senha redefinida</h1>
        <p className="mt-2 text-sm text-gray-600">Você já pode entrar usando sua nova senha.</p>
        <Link to="/login" className="btn-primary mt-6">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">Criar nova senha</h1>
      {!token && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">Link de recuperação inválido.</p>}
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Nova senha</label>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="field w-full" minLength={6} autoComplete="new-password" required />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Confirmar nova senha</label>
          <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="field w-full" minLength={6} autoComplete="new-password" required />
        </div>
        <button type="submit" disabled={loading || !token} className="btn-primary w-full py-3">
          {loading ? "Salvando..." : "Redefinir senha"}
        </button>
      </form>
    </div>
  );
}
