import { Request, Response, NextFunction } from "express";
import jwt, { SignOptions } from "jsonwebtoken";
import prisma from "../config/prisma";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "USER" | "MODERATOR" | "ADMIN";
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function signToken(user: {
  id: string;
  name: string;
  email: string;
  role: AuthUser["role"];
}): string {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: (process.env.JWT_EXPIRES_IN || "7d") as SignOptions["expiresIn"] }
  );
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Token não fornecido." });
      return;
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    ) as AuthUser;

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado." });
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

export function authorize(...roles: AuthUser["role"][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Acesso negado." });
      return;
    }
    next();
  };
}