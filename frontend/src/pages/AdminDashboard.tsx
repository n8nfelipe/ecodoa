import { useEffect, useState } from "react";
import api from "../services/api";
import type { Listing } from "../types";
import { STATUS_STYLES, STATUS_LABELS } from "../lib/status";

interface Report {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  reporter: { id: string; name: string };
  listing: Listing;
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<Listing[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [p, r] = await Promise.all([
        api.get("/admin/listings/pending"),
        api.get("/admin/reports"),
      ]);
      setPending(p.data);
      setReports(r.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha ao carregar o painel.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const moderate = async (id: string, status: "APPROVED" | "REJECTED") => {
    await api.patch(`/admin/listings/${id}/moderate`, { status });
    await load();
  };

  const resolveReport = async (id: string) => {
    await api.patch(`/admin/reports/${id}/resolve`);
    await load();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">
        Painel de Moderação
      </h1>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Anúncios pendentes ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum anúncio aguardando revisão.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((listing) => (
              <div key={listing.id} className="card p-4">
                <div className="flex gap-4">
                  {listing.images[0] ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="h-20 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-gray-100 text-2xl text-gray-400">
                      ♻️
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">
                      {listing.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {listing.category.icon} {listing.category.name} ·{" "}
                      {listing.user.name}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                      {listing.description}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => moderate(listing.id, "APPROVED")}
                    className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-1"
                  >
                    ✓ Aprovar
                  </button>
                  <button
                    onClick={() => moderate(listing.id, "REJECTED")}
                    className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-1"
                  >
                    ✕ Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Denúncias abertas ({reports.length})
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma denúncia em aberto.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-gray-900">
                    <strong>{report.reporter.name}</strong> denunciou{" "}
                    <strong>{report.listing.title}</strong>
                  </p>
                  <span
                    className={`pill ${STATUS_STYLES[report.listing.status]}`}
                  >
                    {STATUS_LABELS[report.listing.status]}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{report.reason}</p>
                <button
                  onClick={() => resolveReport(report.id)}
                  className="mt-3 rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
                >
                  Marcar como resolvida
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
