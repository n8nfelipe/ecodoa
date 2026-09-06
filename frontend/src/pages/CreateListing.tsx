import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import type { Category } from "../types";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import type { Map } from "leaflet";
import { fetchUfs, fetchCities, type IbgeUf, type IbgeCity } from "../services/ibge";
import { geocodeAddress } from "../services/geocoding";

function LocationPicker({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function MapController({
  onReady,
}: {
  onReady: (map: Map) => void;
}) {
  const map = useMap();
  useEffect(() => {
    onReady(map);
  }, [map, onReady]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [-23.5505, -46.6333];

export default function CreateListing() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [lat, setLat] = useState<number>(DEFAULT_CENTER[0]);
  const [lng, setLng] = useState<number>(DEFAULT_CENTER[1]);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ufs, setUfs] = useState<IbgeUf[]>([]);
  const [cities, setCities] = useState<IbgeCity[]>([]);
  const [cityLoading, setCityLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [geoError, setGeoError] = useState("");
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [locatingAddress, setLocatingAddress] = useState(false);
  const [locationLabel, setLocationLabel] = useState("");

  useEffect(() => {
    api.get("/listings/categories").then((res) => setCategories(res.data));
    fetchUfs()
      .then(setUfs)
      .catch(() => setError("Falha ao carregar os estados do IBGE."));
  }, []);

  const handleUfChange = (sigla: string) => {
    setState(sigla);
    setCity("");
    setLocationConfirmed(false);
    setLocationLabel("");
    setCities([]);
    if (!sigla) return;
    setCityLoading(true);
    fetchCities(sigla)
      .then(setCities)
      .catch(() => setError("Falha ao carregar as cidades do IBGE."))
      .finally(() => setCityLoading(false));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("images", file));
    try {
      const res = await api.post("/upload", formData);
      setImages((prev) => [...prev, ...res.data.urls]);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.error || "Falha no upload.");
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setGeoError("Seu navegador não suporta geolocalização.");
      return;
    }
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        setLocationConfirmed(true);
        setLocationLabel("Localização atual selecionada");
        mapRef.current?.flyTo([latitude, longitude], 14);
      },
      () =>
        setGeoError(
          "Não foi possível obter sua localização. Verifique as permissões do navegador."
        )
    );
  };

  const locateAddress = async () => {
    if (!address.trim() || !city || !state) {
      setGeoError("Preencha endereço, cidade e UF para localizar no mapa.");
      return null;
    }

    setLocatingAddress(true);
    setGeoError("");
    try {
      // Complementos residenciais como "casa 25" frequentemente não existem na
      // base cartográfica. Preservamos rua/quadra e bairro para obter o ponto útil
      // mais próximo, que ainda pode ser refinado manualmente no mapa.
      const searchableAddress = address
        .replace(/\b(?:casa|apartamento|apto|ap\.?|bloco)\s*[\w-]+\b/gi, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      const location = await geocodeAddress(
        `${searchableAddress}, ${city}, ${state}, Brasil`
      );
      setLat(location.latitude);
      setLng(location.longitude);
      setLocationConfirmed(true);
      setLocationLabel(location.displayName);
      mapRef.current?.flyTo([location.latitude, location.longitude], 16);
      return location;
    } catch (err: any) {
      setLocationConfirmed(false);
      setLocationLabel("");
      setGeoError(
        err.response?.data?.error || "Não foi possível localizar o endereço."
      );
      return null;
    } finally {
      setLocatingAddress(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!categoryId) {
      setError("Selecione uma categoria.");
      return;
    }
    setSubmitting(true);
    try {
      let listingLatitude = lat;
      let listingLongitude = lng;
      if (!locationConfirmed) {
        const location = await locateAddress();
        if (!location) return;
        listingLatitude = location.latitude;
        listingLongitude = location.longitude;
      }

      await api.post("/listings", {
        title,
        description,
        categoryId,
        latitude: listingLatitude,
        longitude: listingLongitude,
        address,
        city,
        state,
        images,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Erro ao publicar anúncio.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-3xl">
          🎉
        </div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Anúncio enviado para moderação!
        </h1>
        <p className="mt-2 text-gray-600">
          Assim que for aprovado por um moderador, ele aparecerá no mapa.
        </p>
        <a href="/profile" className="btn-primary mt-6">
          Ver meus anúncios
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        Publicar Doação ou Ecoponto
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="card space-y-5 p-6 sm:p-8"
      >
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Categoria *
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="field w-full"
            required
          >
            <option value="">Selecione...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Título *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field w-full"
            minLength={3}
            required
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Descrição *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="field w-full"
            rows={4}
            minLength={10}
            required
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Endereço *
            </label>
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setLocationConfirmed(false);
                setLocationLabel("");
              }}
              className="field w-full"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              UF *
            </label>
            <select
              value={state}
              onChange={(e) => handleUfChange(e.target.value)}
              className="field w-full"
              required
            >
              <option value="">Selecione...</option>
              {ufs.map((uf) => (
                <option key={uf.id} value={uf.sigla}>
                  {uf.sigla} — {uf.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Cidade *
            </label>
            <select
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setLocationConfirmed(false);
                setLocationLabel("");
              }}
              className="field w-full"
              disabled={!state}
              required
            >
              <option value="">
                {cityLoading
                  ? "Carregando cidades..."
                  : state
                    ? "Selecione..."
                    : "Escolha a UF primeiro"}
              </option>
              {cities.map((c) => (
                <option key={c.id} value={c.nome}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-sm font-medium text-gray-700">
              Localização (clique no mapa) *
            </label>
            <button
              type="button"
              onClick={() => void locateAddress()}
              disabled={locatingAddress}
              className="text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              {locatingAddress ? "Localizando..." : "🔎 Localizar endereço"}
            </button>
          </div>
          <MapContainer
            center={DEFAULT_CENTER}
            zoom={12}
            className="h-64 w-full overflow-hidden rounded-xl border border-gray-200"
          >
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[lat, lng]} />
            <LocationPicker
              onPick={(latitude, longitude) => {
                setLat(latitude);
                setLng(longitude);
                setLocationConfirmed(true);
                setLocationLabel("Ponto ajustado manualmente no mapa");
                setGeoError("");
              }}
            />
            <MapController
              onReady={(map) => {
                mapRef.current = map;
              }}
            />
          </MapContainer>
          <p className="mt-1.5 text-xs text-gray-500">
            {locationConfirmed
              ? `Localização confirmada: ${locationLabel} (${lat.toFixed(5)}, ${lng.toFixed(5)})`
              : "O endereço será localizado automaticamente ao publicar. Você também pode ajustar o ponto clicando no mapa."}
          </p>
          <button
            type="button"
            onClick={locateMe}
            className="mt-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            📍 Usar minha localização atual
          </button>
          {geoError && (
            <p
              role="alert"
              className="mt-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {geoError}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Fotos
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
          />
          {images.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {images.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Prévia"
                  className="h-16 w-16 rounded-lg border border-gray-200 object-cover"
                />
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full py-3"
        >
          {submitting ? "Publicando..." : "Publicar anúncio"}
        </button>
      </form>
    </div>
  );
}
