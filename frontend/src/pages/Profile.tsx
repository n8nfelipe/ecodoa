import { useEffect, useState } from "react";
import api from "../services/api";
import type { Listing } from "../types";
import { STATUS_STYLES, STATUS_LABELS } from "../lib/status";

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    averageRating: number | null;
    reviewCount: number;
    listings: Listing[];
    reviews: {
      id: string;
      rating: number;
      comment: string | null;
      reviewer: { id: string; name: string };
    }[];
  };
}

export default function Profile() {
  const [data, setData] = useState<ProfileData | null>(null);

  useEffect(() => {
    api.get("/auth/me").then((res) => setData(res.data));
  }, []);

  if (!data) {
    return <p className="text-center text-gray-500">Carregando...</p>;
  }

  const { user } = data;

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              {user.name}
            </h1>
            <p className="mt-0.5 truncate text-sm text-gray-500">
              {user.email}
            </p>
            {user.phone && (
              <p className="mt-0.5 text-sm text-gray-500">📱 {user.phone}</p>
            )}
          </div>
          <div className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700">
            ⭐{" "}
            {user.averageRating
              ? `${user.averageRating.toFixed(1)} (${user.reviewCount} ${
                  user.reviewCount === 1 ? "avaliação" : "avaliações"
                })`
              : "Sem avaliações ainda"}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Meus anúncios ({user.listings.length})
        </h2>
        {user.listings.length === 0 ? (
          <p className="text-sm text-gray-500">
            Você ainda não publicou nenhum anúncio.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.listings.map((listing) => (
              <a
                key={listing.id}
                href={`/listing/${listing.id}`}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                {listing.images[0] ? (
                  <img
                    src={listing.images[0].url}
                    alt={listing.title}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="grid h-32 w-full place-items-center bg-gray-100 text-3xl text-gray-400">
                    ♻️
                  </div>
                )}
                <div className="p-4">
                  <h3 className="truncate font-semibold text-gray-900 group-hover:text-brand-700">
                    {listing.title}
                  </h3>
                  <span
                    className={`pill mt-2 ${STATUS_STYLES[listing.status]}`}
                  >
                    {STATUS_LABELS[listing.status]}
                  </span>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {user.reviews.length > 0 && (
        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            Avaliações recebidas
          </h2>
          <div className="space-y-3">
            {user.reviews.map((review) => (
              <div key={review.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">
                    {review.reviewer.name}
                  </p>
                  <span className="text-sm text-amber-500" aria-label={`${review.rating} de 5 estrelas`}>
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-1 text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}