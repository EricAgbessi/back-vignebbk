import { Hono } from "hono";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { adminMiddleware } from "../middleware/auth";
import { env } from "../config/env";

const uploadRoutes = new Hono();

const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// (mime -> extension)
// SVG is intentionally excluded: it can embed <script> and, served from the API
// origin, would be a stored-XSS vector.
const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/heic": ".heic",
  "image/heif": ".heif",
};

function safeMimeExtension(mime: string, originalName: string): string | null {
  const allowed = ALLOWED_MIME[mime];
  if (!allowed) return null;

  const ext = path.extname(originalName).toLowerCase();
  // Accept either the canonical extension or a known synonym (.jpeg)
  if (ext === allowed) return allowed;
  if (allowed === ".jpg" && ext === ".jpeg") return ".jpg";
  return allowed; // fall back to the mime-derived extension
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".heic": "image/heic",
    ".heif": "image/heif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Public: serve uploaded files (read-only)
uploadRoutes.get("/files/:filename", async (c) => {
  const filename = c.req.param("filename");

  // Hard-block any traversal attempt
  if (filename.includes("/") || filename.includes("\\") || filename.includes("..")) {
    return c.json({ error: "Invalid filename" }, 400);
  }

  const filepath = path.join(UPLOAD_DIR, filename);
  // Ensure the resolved path stays under UPLOAD_DIR
  if (!path.resolve(filepath).startsWith(path.resolve(UPLOAD_DIR))) {
    return c.json({ error: "Invalid path" }, 400);
  }

  if (!fs.existsSync(filepath)) {
    return c.notFound();
  }

  const fileContent = fs.readFileSync(filepath);
  c.header("Content-Type", getMimeType(filename));
  // Prevent MIME sniffing from turning a served file into an executable type.
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Cache-Control", "public, max-age=31536000, immutable");
  return c.body(fileContent);
});

// Admin-only: upload
uploadRoutes.post("/", adminMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!file || !(file instanceof File)) {
    return c.json({ error: "Aucun fichier reçu" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)` }, 413);
  }

  const extension = safeMimeExtension(file.type, file.name);
  if (!extension) {
    return c.json({ error: `Type de fichier non supporté: ${file.type}` }, 415);
  }

  const filename = `${uuidv4()}${extension}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const buffer = await file.arrayBuffer();
  fs.writeFileSync(filepath, Buffer.from(buffer));

  // Prefer the configured public origin; fall back to request headers only when
  // it is not set (the Host header is client-controllable).
  const base =
    env.PUBLIC_BASE_URL ??
    `${c.req.header("x-forwarded-proto") || "http"}://${c.req.header("host")}`;
  const url = `${base.replace(/\/$/, "")}/api/upload/files/${filename}`;

  return c.json({
    success: true,
    url,
    filename,
  });
});

export default uploadRoutes;
