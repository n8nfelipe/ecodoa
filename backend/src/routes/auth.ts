import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "../config/prisma";
import { authenticate, signToken } from "../middleware/auth";
import { createHash, randomBytes } from "crypto";
import { sendPasswordResetEmail } from "../services/email";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32, "Token inválido."),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
});

const forgotPasswordAttempts = new Map<
  string,
  { count: number; resetsAt: number }
>();

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const { name, password, phone } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: "E-mail já cadastrado." });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, phone },
  });

  const token = signToken(user);
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const password = parsed.data.password;
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas." });
    return;
  }

  const token = signToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const attemptKey = `${req.ip}:${parsed.data.email.toLowerCase()}`;
  const now = Date.now();
  const attempt = forgotPasswordAttempts.get(attemptKey);
  if (attempt && attempt.resetsAt > now && attempt.count >= 5) {
    res.status(429).json({
      error: "Muitas solicitações. Tente novamente em alguns minutos.",
    });
    return;
  }
  forgotPasswordAttempts.set(attemptKey, {
    count: attempt && attempt.resetsAt > now ? attempt.count + 1 : 1,
    resetsAt: attempt && attempt.resetsAt > now ? attempt.resetsAt : now + 15 * 60_000,
  });

  const rawToken = randomBytes(32).toString("hex");
  const frontendUrl = process.env.BASE_URL || "http://localhost:5173";
  const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (user?.passwordHash) {
    const configuredMinutes = parseInt(
      process.env.PASSWORD_RESET_TOKEN_MINUTES || "30",
      10
    );
    const expirationMinutes =
      Number.isFinite(configuredMinutes) && configuredMinutes > 0
        ? configuredMinutes
        : 30;
    const expiresAt = new Date(now + expirationMinutes * 60_000);
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      prisma.passwordResetToken.create({
        data: { tokenHash: tokenHash(rawToken), expiresAt, userId: user.id },
      }),
    ]);

    try {
      const sent = await sendPasswordResetEmail(
        user.email,
        resetUrl,
        expirationMinutes
      );
      if (!sent && process.env.PASSWORD_RESET_EXPOSE_LINK !== "true") {
        console.warn("SMTP não configurado; link de recuperação não enviado.");
      }
    } catch (error) {
      console.error("Falha ao enviar recuperação de senha:", error);
    }
  }

  res.json({
    message:
      "Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.",
    ...(process.env.PASSWORD_RESET_EXPOSE_LINK === "true" ? { resetUrl } : {}),
  });
});

// POST /api/auth/reset-password
router.post("/reset-password", async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0].message });
    return;
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: tokenHash(parsed.data.token) },
  });
  if (!resetToken || resetToken.expiresAt <= new Date()) {
    res.status(400).json({ error: "Link inválido ou expirado." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const changed = await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.passwordResetToken.deleteMany({
      where: { id: resetToken.id, expiresAt: { gt: new Date() } },
    });
    if (claimed.count !== 1) return false;

    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await transaction.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId },
    });
    return true;
  });

  if (!changed) {
    res.status(400).json({ error: "Link inválido ou expirado." });
    return;
  }

  res.json({ message: "Senha redefinida com sucesso." });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: {
      listings: {
        include: { images: true, category: true },
        orderBy: { createdAt: "desc" },
      },
      reviewsRecv: {
        include: { reviewer: { select: { id: true, name: true } } },
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: "Usuário não encontrado." });
    return;
  }

  const avg = user.reviewsRecv.length
    ? user.reviewsRecv.reduce((sum, r) => sum + r.rating, 0) /
      user.reviewsRecv.length
    : null;

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      avatarUrl: user.avatarUrl,
      averageRating: avg,
      reviewCount: user.reviewsRecv.length,
      listings: user.listings,
      reviews: user.reviewsRecv,
    },
  });
});

export default router;
