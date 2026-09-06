import { Router } from "express";
import { z } from "zod";

const router = Router();

const querySchema = z.object({
  q: z.string().trim().min(3, "Informe um endereço válido.").max(250),
});

const resultSchema = z.array(
  z.object({
    lat: z.string(),
    lon: z.string(),
    display_name: z.string(),
  })
);

const cache = new Map<
  string,
  { latitude: number; longitude: number; displayName: string }
>();
let requestQueue = Promise.resolve();
let lastRequestStartedAt = 0;

function fetchFromGeocoder(url: URL) {
  const request = requestQueue.then(async () => {
    const waitMs = Math.max(0, lastRequestStartedAt + 1_000 - Date.now());
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    lastRequestStartedAt = Date.now();

    return fetch(url, {
      headers: {
        "Accept-Language": "pt-BR,pt;q=0.9",
        Referer: process.env.BASE_URL || "http://localhost:5174",
        "User-Agent": `EcoDoa/1.0 (${process.env.BASE_URL || "http://localhost:5174"})`,
      },
      signal: AbortSignal.timeout(8_000),
    });
  });

  requestQueue = request.then(
    () => undefined,
    () => undefined
  );
  return request;
}

// GET /api/geocoding/search?q=...
router.get("/search", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const query = parsed.data.q;
  const cacheKey = query.toLocaleLowerCase("pt-BR");
  const cached = cache.get(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  const baseUrl =
    process.env.GEOCODING_BASE_URL || "https://nominatim.openstreetmap.org";
  const url = new URL("/search", baseUrl);
  url.searchParams.set("q", query);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");

  try {
    const response = await fetchFromGeocoder(url);

    if (!response.ok) {
      throw new Error(`Geocodificador respondeu com status ${response.status}.`);
    }

    const results = resultSchema.parse(await response.json());
    const first = results[0];
    if (!first) {
      res.status(404).json({
        error: "Endereço não encontrado. Confira rua, cidade e UF.",
      });
      return;
    }

    const location = {
      latitude: Number(first.lat),
      longitude: Number(first.lon),
      displayName: first.display_name,
    };

    if (!Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      throw new Error("O geocodificador retornou coordenadas inválidas.");
    }

    cache.set(cacheKey, location);
    res.json(location);
  } catch (error) {
    console.error("Falha ao geocodificar endereço:", error);
    res.status(502).json({
      error: "Não foi possível localizar o endereço agora. Tente novamente.",
    });
  }
});

export default router;
