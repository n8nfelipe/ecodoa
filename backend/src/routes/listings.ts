import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate } from "../middleware/auth";
import { haversineDistance, buildWhatsAppUrl } from "../utils/geo";

const router = Router();

const listingSchema = z.object({
  title: z.string().min(3, "Título muito curto.").max(120),
  description: z.string().min(10, "Descrição muito curta."),
  type: z.enum(["DONATION", "ECOPOINT"]).default("DONATION"),
  categoryId: z.string().uuid("Categoria inválida."),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(3, "Endereço muito curto."),
  city: z.string().min(2, "Cidade inválida."),
  state: z.string().length(2, "UF deve ter 2 letras."),
  images: z.array(z.string().url()).default([]),
});

const querySchema = z.object({
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  radiusKm: z.coerce.number().positive().max(500).default(20),
  type: z.enum(["DONATION", "ECOPOINT"]).optional(),
  categoryId: z.string().uuid().optional(),
  status: z
    .enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"])
    .optional(),
  userId: z.string().uuid().optional(),
});

// GET /api/listings
router.get("/", async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { lat, lng, radiusKm, type, categoryId, status, userId } =
    parsed.data;

  const where: Record<string, unknown> = {};

  if (type) where.type = type;
  if (categoryId) where.categoryId = categoryId;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (!status) where.status = "APPROVED";

  let listings = await prisma.listing.findMany({
    where,
    include: {
      images: true,
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (lat !== undefined && lng !== undefined) {
    listings = listings.filter((l) => {
      const distance = haversineDistance(lat, lng, l.latitude, l.longitude);
      return distance <= radiusKm;
    });
  }

  res.json(listings);
});

// POST /api/listings
router.post("/", authenticate, async (req, res) => {
  const parsed = listingSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const data = parsed.data;
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    res.status(400).json({ error: "Categoria inválida." });
    return;
  }

  const listing = await prisma.listing.create({
    data: {
      title: data.title,
      description: data.description,
      type: category.type,
      categoryId: data.categoryId,
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      city: data.city,
      state: data.state,
      userId: req.user!.id,
      images: {
        create: data.images.map((url) => ({ url })),
      },
    },
    include: { images: true, category: true },
  });

  res.status(201).json(listing);
});

// GET /api/listings/categories
router.get("/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  res.json(categories);
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  const listing = await prisma.listing.findUnique({
    where: { id: String(req.params.id) },
    include: {
      images: true,
      category: true,
      user: {
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          phone: true,
        },
      },
    },
  });

  if (!listing) {
    res.status(404).json({ error: "Anúncio não encontrado." });
    return;
  }

  const waLink =
    listing.user.phone &&
    buildWhatsAppUrl(
      listing.user.phone,
      `Olá! Vi seu anúncio "${listing.title}" na plataforma EcoDoa e gostaria de combinar a retirada.`
    );

  res.json({ ...listing, waLink });
});

// PATCH /api/listings/:id/status
router.patch("/:id/status", authenticate, async (req, res) => {
  const parsed = z
    .enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED"])
    .safeParse(req.body.status);

  if (!parsed.success) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  const listing = await prisma.listing.findUnique({
    where: { id: String(req.params.id) },
  });

  if (!listing) {
    res.status(404).json({ error: "Anúncio não encontrado." });
    return;
  }

  const isOwner = listing.userId === req.user!.id;
  const isStaff = req.user!.role === "MODERATOR" || req.user!.role === "ADMIN";

  if (!isOwner && !isStaff) {
    res.status(403).json({ error: "Sem permissão para alterar este anúncio." });
    return;
  }

  const updated = await prisma.listing.update({
    where: { id: listing.id },
    data: { status: parsed.data },
    include: { images: true, category: true },
  });

  res.json(updated);
});

export default router;