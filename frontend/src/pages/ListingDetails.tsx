import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import type { Listing } from "../types";
import { useAuth } from "../context/AuthContext";
import { STATUS_STYLES, STATUS_LABELS } from "../lib/status";

export default function ListingDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    api
      .get(`/listings/${id}`)
      .then((res) => setListing(res.data))
      .catch(() => setNotFound(true));
  }, [id]);

  if (notFound) {
    return <p className="text-center text-gray-500">Anúncio não encontrado.</p>;
  }

  if (!listing) {
    return <p className="text-center text-gray-500">Carregando...</p>;
  }

  const isOwner = user?.id === listing.userId;

  const markCompleted = async () => {
    await api.patch(`/listings/${listing.id}/status`, {
      status: "COMPLETED",
    });
    setListing({ ...listing, status: "COMPLETED" });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div>
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          {listing.images[0] ? (
            <img
              src={listing.images[0].url}
              alt={listing.title}
              className="h-72 w-full object-cover sm:h-96"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-gray-100 text-4xl text-gray-400 sm:h-96">
              ♻️
            </div>
          )}
        </div>
        {listing.images.length > 1 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {listing.images.slice(1).map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={listing.title}
                className="h-16 w-full rounded-lg border border-gray-200 object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-5 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="pill bg-brand-100 text-brand-700">
            {listing.category.icon} {listing.category.name}
          </span>
          <span className="pill bg-gray-100 text-gray-700">
            {listing.type === "ECOPOINT" ? "Ecoponto" : "Doação"}
          </span>
          <span className={`pill ${STATUS_STYLES[listing.status]}`}>
            {STATUS_LABELS[listing.status]}
          </span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {listing.title}
          </h1>
          <p className="mt-2 leading-relaxed text-gray-700">
            {listing.description}
          </p>
        </div>

        <dl className="space-y-2 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-gray-700">📍</dt>
            <dd>
              {listing.address} — {listing.city}/{listing.state}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="shrink-0 font-medium text-gray-700">Doador</dt>
            <dd className="font-medium text-gray-900">{listing.user.name}</dd>
          </div>
        </dl>

        <div className="space-y-3">
          {listing.waLink && listing.status === "APPROVED" && (
            <a
              href={listing.waLink}
              target="_blank"
              rel="noreferrer"
              className="btn-primary w-full py-3"
            >
              💬 Entrar em contato no WhatsApp
            </a>
          )}

          {isOwner && (
            <button
              onClick={markCompleted}
              disabled={listing.status === "COMPLETED"}
              className="btn-ghost w-full"
            >
              {listing.status === "COMPLETED"
                ? "✓ Doação concluída"
                : "Marcar como concluída"}
            </button>
          )}

          <Link
            to="/"
            className="block text-center text-sm font-medium text-gray-500 underline underline-offset-2 transition hover:text-brand-600"
          >
            ← Voltar ao mapa
          </Link>
        </div>
      </div>
    </div>
  );
}