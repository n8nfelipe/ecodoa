import api from "./api";

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
}

export async function geocodeAddress(query: string): Promise<GeocodingResult> {
  const response = await api.get<GeocodingResult>("/geocoding/search", {
    params: { q: query },
  });
  return response.data;
}
