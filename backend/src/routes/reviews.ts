import { Router } from "express";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate } from "../middleware/auth";

const router = Router();

const reviewSchema = z.object({
  targetUserId: z.string().uuid("Usuário inválido."),
  rating: z.number().int().min(1).max(5, "Avaliação entre 1 e 5 estrelas."),
  comment: z.string().max(500).optional(),
});

// POST /api/reviews
router.post("/", authenticate, async (req, res) => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { targetUserId, rating, comment } = parsed.data;

  if (targetUserId === req.user!.id) {
    res.status(400).json({ error: "Você não pode se avaliar." });
    return;
  }

  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  const review = await prisma.review.create({
    data: {
      reviewerId: req.user!.id,
      targetUserId,
      rating,
      comment,
    },
  });

  res.status(201).json(review);
});

export default router;