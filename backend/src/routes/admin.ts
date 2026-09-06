import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();
const roleSchema = z.object({
  role: z.enum(["USER", "MODERATOR", "ADMIN"]),
});

router.use(authenticate, authorize("MODERATOR", "ADMIN"));

// GET /api/admin/users
router.get("/users", authorize("ADMIN"), async (_req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  res.json(users);
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", authorize("ADMIN"), async (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Perfil inválido." });
    return;
  }

  const userId = String(req.params.id);
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  if (existing.id === req.user!.id && existing.role !== parsed.data.role) {
    res.status(400).json({
      error: "Você não pode alterar seu próprio perfil administrativo.",
    });
    return;
  }

  if (existing.role === "ADMIN" && parsed.data.role !== "ADMIN") {
    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      res.status(409).json({
        error: "Não é possível remover o perfil do último administrador.",
      });
      return;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { listings: true } },
    },
  });

  res.json(updated);
});

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
