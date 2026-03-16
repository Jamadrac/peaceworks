import express from "express";
import multer from "multer";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { StatusCodes } from "http-status-codes";

const uploadRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const accountId =  "859b914602758e51e4e66a197332af8e";
const bucket = "pieceworkszambia";
const endpoint =  `https://${accountId}.r2.cloudflarestorage.com`;
const publicBaseUrl = `https://${accountId}.r2.cloudflarestorage.com/${bucket}`;

const hasR2Config =
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!accountId &&
  !!bucket;

const s3 = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const sanitizeFileName = (name: string) =>
  name
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();

const toObjectKey = (urlOrKey: string) => {
  const value = String(urlOrKey || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    try {
      const parsed = new URL(value);
      const keyFromQuery = parsed.searchParams.get("key");
      if (keyFromQuery) return keyFromQuery.replace(/^\/+/, "");

      const path = parsed.pathname.replace(/^\/+/, "");
      if (path) {
        if (path.startsWith(`${bucket}/`)) return path.slice(`${bucket}/`.length);
        return path;
      }
    } catch {
      const base = publicBaseUrl.replace(/\/+$/, "");
      if (value.startsWith(base + "/")) {
        return value.slice((base + "/").length);
      }
    }
  }
  return value.replace(/^\/+/, "");
};

uploadRouter.get("/file", async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "R2 upload is not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env",
      });
    }

    const key = toObjectKey(String(req.query?.key || req.query?.url || ""));
    if (!key) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "File key or url is required" });
    }

    const result = await s3.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    if (result.ContentType) res.setHeader("Content-Type", result.ContentType);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const body = result.Body as any;
    if (body?.pipe) {
      body.pipe(res);
      return;
    }

    return res.status(StatusCodes.NOT_FOUND).json({ message: "File not found" });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to load file",
      error: error?.message || error,
    });
  }
});

uploadRouter.post("/file", upload.single("file"), async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "R2 upload is not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "No file provided" });
    }

    const folder = String(req.body?.folder || "uploads").trim().replace(/^\/+|\/+$/g, "") || "uploads";
    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    const safeName = sanitizeFileName(file.originalname.replace(`.${ext}`, ""));
    const key = `${folder}/${Date.now()}-${safeName}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const fileUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

    return res.status(StatusCodes.OK).json({
      message: "File uploaded successfully",
      key,
      fileUrl,
      mimeType: file.mimetype,
      fileName: file.originalname,
      size: file.size,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to upload file",
      error: error?.message || error,
    });
  }
});

uploadRouter.post("/project-image", upload.single("image"), async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "R2 upload is not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env",
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "No image file provided" });
    }

    const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
    const safeName = sanitizeFileName(file.originalname.replace(`.${ext}`, ""));
    const key = `project-images/${Date.now()}-${safeName}.${ext}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const imageUrl = `${publicBaseUrl.replace(/\/+$/, "")}/${key}`;

    return res.status(StatusCodes.OK).json({
      message: "Image uploaded successfully",
      key,
      imageUrl,
    });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to upload image",
      error: error?.message || error,
    });
  }
});

uploadRouter.delete("/file", async (req, res) => {
  try {
    if (!hasR2Config) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "R2 upload is not configured. Set R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in backend/.env",
      });
    }

    const key = toObjectKey(req.body?.key || req.body?.url || "");
    if (!key) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "File key or url is required" });
    }

    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );

    return res.status(StatusCodes.OK).json({ message: "File deleted", key });
  } catch (error: any) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete file",
      error: error?.message || error,
    });
  }
});

export default uploadRouter;
