import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router-dom";
import type { Listing } from "../types";

const iconDonation = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const iconEcopoint = L.divIcon({
  className: "ecopoint-icon",
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#10b981;border:3px solid #065f46;font-size:12px;display:flex;align-items:center;justify-content:center;">♻️</div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

interface MapViewProps {
  listings: Listing[];
  center?: [number, number];
  zoom?: number;
  onPickLocation?: (lat: number, lng: number) => void;
  className?: string;
}

function ViewSync({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

export default function MapView({
  listings,
  center = [-23.5505, -46.6333],
  zoom = 12,
  onPickLocation,
  className = "h-[420px] w-full rounded-xl border border-gray-200",
}: MapViewProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className={className}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ViewSync center={center} />
      {listings.map((listing) => (
        <Marker
          key={listing.id}
          position={[listing.latitude, listing.longitude]}
          icon={listing.type === "ECOPOINT" ? iconEcopoint : iconDonation}
        >
          <Popup>
            <div className="w-48">
              {listing.images[0] && (
                <img
                  src={listing.images[0].url}
                  alt={listing.title}
                  className="mb-2 h-24 w-full rounded object-cover"
                />
              )}
              <strong>{listing.title}</strong>
              <p className="text-xs text-gray-600">
                {listing.category.icon} {listing.category.name}
              </p>
              <Link
                to={`/listing/${listing.id}`}
                className="mt-1 block text-xs font-semibold text-brand-600 underline"
              >
                Ver detalhes →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
      {onPickLocation && (
        <Marker position={center} icon={iconDonation} />
      )}
    </MapContainer>
  );
}