import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

import authRoutes from "./routes/auth";
import listingRoutes from "./routes/listings";
import reviewRoutes from "./routes/reviews";
import reportRoutes from "./routes/reports";
import adminRoutes from "./routes/admin";
import uploadRoutes from "./routes/upload";

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || "3333", 10);

app.use(cors());
app.use(express.json());

const uploadDir = process.env.UPLOAD_DIR || "uploads";
fs.mkdirSync(uploadDir, { recursive: true });
app.use("/uploads", express.static(path.resolve(uploadDir)));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "ecodoa-backend" });
});

app.use("/api/auth", authRoutes);
app.use("/api/listings", listingRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);

app.use(
  (
    err: Error & { status?: number },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || "Erro interno." });
  }
);

app.listen(PORT, () => {
  console.log(`🚀 EcoDoa backend rodando em http://localhost:${PORT}`);
});