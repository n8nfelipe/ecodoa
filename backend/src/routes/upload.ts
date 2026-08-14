import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";
import { authenticate } from "../middleware/auth";

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || "uploads";

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${randomUUID()}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Formato de imagem não permitido."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB || "5", 10) || 5) * 1024 * 1024,
  },
});

// POST /api/upload
router.post("/", authenticate, upload.array("images", 6), (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    res.status(400).json({ error: "Nenhum arquivo enviado." });
    return;
  }

  const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3333}`;
  const urls = files.map((f) => `${baseUrl}/uploads/${f.filename}`);

  res.status(201).json({ urls });
});

export default router;