import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate, authorize("MODERATOR", "ADMIN"));

// GET /api/admin/listings/pending
router.get("/listings/pending", async (_req, res) => {
  const listings = await prisma.listing.findMany({
    where: { status: "PENDING" },
    include: {
      images: true,
      category: true,
      user: { select: { id: true, name: true, email: true } },
      reports: { include: { reporter: { select: { id: true, name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  res.json(listings);
});

// PATCH /api/admin/listings/:id/moderate
router.patch("/listings/:id/moderate", async (req, res) => {
  const parsed = z
    .object({
      status: z.enum(["APPROVED", "REJECTED"]),
    })
    .safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({ error: "Status inválido." });
    return;
  }

  const existing = await prisma.listing.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!existing) {
    res.status(404).json({ error: "Anúncio não encontrado." });
    return;
  }

  const updated = await prisma.listing.update({
    where: { id: String(req.params.id) },
    data: { status: parsed.data.status },
    include: { images: true, category: true },
  });

  res.json(updated);
});

// GET /api/admin/reports
router.get("/reports", async (_req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    include: {
      listing: {
        include: { images: true, category: true },
      },
      reporter: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(reports);
});

// PATCH /api/admin/reports/:id/resolve
router.patch("/reports/:id/resolve", async (req, res) => {
  const existing = await prisma.report.findUnique({
    where: { id: String(req.params.id) },
  });
  if (!existing) {
    res.status(404).json({ error: "Denúncia não encontrada." });
    return;
  }

  const updated = await prisma.report.update({
    where: { id: String(req.params.id) },
    data: { status: "RESOLVED" },
  });

  res.json(updated);
});

export default router;