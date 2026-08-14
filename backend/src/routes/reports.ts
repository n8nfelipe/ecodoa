import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const reportSchema = z.object({
  listingId: z.string().uuid("Anúncio inválido."),
  reason: z.string().min(5, "Informe um motivo com pelo menos 5 caracteres."),
});

// POST /api/reports
router.post("/", authenticate, async (req, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { listingId, reason } = parsed.data;

  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    res.status(404).json({ error: "Anúncio não encontrado." });
    return;
  }

  const report = await prisma.report.create({
    data: {
      reporterId: req.user!.id,
      listingId,
      reason,
    },
  });

  res.status(201).json(report);
});

export default router;