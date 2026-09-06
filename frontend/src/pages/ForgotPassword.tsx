import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResetUrl("");
    try {
      const response = await api.post("/auth/forgot-password", { email });
      setMessage(response.data.message);
      setResetUrl(response.data.resetUrl || "");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao solicitar recuperação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto max-w-md p-8">
      <h1 className="text-center text-2xl font-bold tracking-tight text-gray-900">
        Recuperar senha
      </h1>
      <p className="mt-2 text-center text-sm text-gray-600">
        Informe seu e-mail para receber um link de redefinição.
      </p>

      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-lg bg-green-50 p-3 text-sm text-green-700">{message}</p>}
      {resetUrl && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          Ambiente local: <a href={resetUrl} className="font-semibold underline">abrir link de recuperação</a>.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field w-full" autoComplete="email" required />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>
      </form>

      <p className="mt-5 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand-600 underline underline-offset-2">Voltar para o login</Link>
      </p>
    </div>
  );
}
