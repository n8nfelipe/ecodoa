import { useEffect, useState, useCallback } from "react";
import api from "../services/api";
import type { Listing, Category } from "../types";
import MapView from "../components/MapView";
import { geocodeAddress } from "../services/geocoding";

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <a
      href={`/listing/${listing.id}`}
      className="group flex gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
        {listing.images[0] ? (
          <img
            src={listing.images[0].url}
            alt={listing.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xl text-gray-400">
            ♻️
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-gray-900 group-hover:text-brand-700">
          {listing.title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-gray-500">
          {listing.category.icon} {listing.category.name}
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          {listing.city}/{listing.state}
        </p>
      </div>
    </a>
  );
}

export default function Home() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"" | "DONATION" | "ECOPOINT">("");
  const [radiusKm, setRadiusKm] = useState(20);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [loading, setLoading] = useState(true);
  const [geoError, setGeoError] = useState("");
  const [addressQuery, setAddressQuery] = useState("");
  const [searchingAddress, setSearchingAddress] = useState(false);

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { radiusKm };
      if (categoryId) params.categoryId = categoryId;
      if (type) params.type = type;
      params.lat = center[0];
      params.lng = center[1];
      const res = await api.get("/listings", { params });
      setListings(res.data);
    } catch {
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [categoryId, type, radiusKm, center]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  useEffect(() => {
    api.get("/listings/categories").then((res) => setCategories(res.data));
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Seu navegador não suporta geolocalização.");
      return;
    }
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter([pos.coords.latitude, pos.coords.longitude]),
      () =>
        setGeoError(
          "Não foi possível obter sua localização. Verifique as permissões do navegador."
        )
    );
  };

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!addressQuery.trim()) return;

    setSearchingAddress(true);
    setGeoError("");
    try {
      const location = await geocodeAddress(addressQuery.trim());
      setCenter([location.latitude, location.longitude]);
    } catch (err: any) {
      setGeoError(
        err.response?.data?.error || "Não foi possível localizar o endereço."
      );
    } finally {
      setSearchingAddress(false);
    }
  };

  const clearFilters = () => {
    setType("");
    setCategoryId("");
    setRadiusKm(20);
    setAddressQuery("");
    setCenter(DEFAULT_CENTER);
    setGeoError("");
  };

  const count = listings.length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold tracking-tight text-brand-700 sm:text-2xl">
          Encontre doações e ecopontos
        </h1>
        <p className="mt-1 max-w-xl text-sm text-gray-600">
          Veja o que está disponível perto de você ou publique o que tem para
          doar.
        </p>
      </header>

      <div className="sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2 shadow-sm">
        <form
          onSubmit={searchAddress}
          className="flex min-w-full gap-2 sm:min-w-72 sm:flex-1"
        >
          <input
            type="search"
            value={addressQuery}
            onChange={(event) => setAddressQuery(event.target.value)}
            className="field min-w-0 flex-1"
            placeholder="Digite rua, bairro ou cidade"
            aria-label="Endereço para buscar"
          />
          <button
            type="submit"
            disabled={searchingAddress || !addressQuery.trim()}
            className="btn-primary"
          >
            {searchingAddress ? "Buscando..." : "Buscar"}
          </button>
        </form>

        <select
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="field flex-1 sm:flex-none"
          aria-label="Tipo"
        >
          <option value="">Todos os tipos</option>
          <option value="DONATION">Doações</option>
          <option value="ECOPOINT">Ecopontos</option>
        </select>

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="field flex-1 sm:flex-none"
          aria-label="Categoria"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          Raio
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="field"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={20}>20 km</option>
            <option value={50}>50 km</option>
          </select>
        </label>

        <button onClick={locateMe} className="btn-primary">
          <span aria-hidden>📍</span> Minha localização
        </button>

      </div>

      {geoError && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {geoError}
        </p>
      )}

      <MapView
        listings={listings}
        center={center}
        className="h-64 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm sm:h-72 lg:h-80"
      />

      <section aria-label="Resultados" className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-gray-900">
            Publicações encontradas
          </h2>
          <span className="text-sm font-medium text-gray-500">
            {count} {count === 1 ? "anúncio" : "anúncios"}
          </span>
        </div>
        {loading ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <li
                key={i}
                className="flex animate-pulse gap-3 rounded-xl border border-gray-200 bg-white p-3"
              >
                <div className="h-20 w-20 shrink-0 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-2/3 rounded bg-gray-200" />
                  <div className="h-3 w-1/3 rounded bg-gray-200" />
                </div>
              </li>
            ))}
          </ul>
        ) : count === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-2xl">
              🗺️
            </div>
            <h3 className="font-semibold text-gray-900">
              Nenhum anúncio por aqui
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Tente ampliar o raio de busca ou mudar os filtros.
            </p>
            <button onClick={clearFilters} className="btn-primary mt-4">
              Limpar filtros
            </button>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingRow listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
