import { Router, Request, Response } from "express";
import { prisma } from "../../config/db";
import { StatusCodes } from "http-status-codes";
import acceptRouter from "./acceptRoute";

const taskRouter = Router();

const accountId = process.env.R2_ACCOUNT_ID || "";
const bucket = process.env.R2_BUCKET || "";
const publicBase =
  (process.env.R2_PUBLIC_BASE_URL ||
    (accountId && bucket ? `https://pub-${accountId}.r2.dev/${bucket}` : "")).replace(/\/+$/, "");
const altPublicBase =
  (process.env.R2_ALT_PUBLIC_BASE_URL ||
    "https://pub-515711e07e0b4b9fad3ce8d5ada6bfa5.r2.dev").replace(/\/+$/, "");

const generatePublicId = () => {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const time = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `PW-${date}${time}-${rand}`;
};

const isR2PublicUrl = (url?: string | null) => {
  if (!url) return false;
  return (
    /https?:\/\/pub-[^.]+\.r2\.dev\/.+/i.test(url) ||
    /https?:\/\/[^.]+\.r2\.cloudflarestorage\.com\/.+/i.test(url)
  );
};

const toPublicUrl = (url?: string | null) => {
  if (!url) return url;
  try {
    // Already public
    if (url.includes(".r2.dev/")) return url;

    // Convert API endpoint to public host (generic)
    const apiPattern = /^https?:\/\/([^\.]+)\.r2\.cloudflarestorage\.com\/([^/]+)\/(.+)$/i;
    const match = url.match(apiPattern);
    if (match) {
      const [, acc, buck, key] = match;
      return `https://pub-${acc}.r2.dev/${buck}/${key}`;
    }

    // Legacy fix: if path contains piecework-images, prefer altPublicBase and strip known extra prefix
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/^\/+/, "");
    if (path.includes("piecework-images/")) {
      const cleanedPath = path.replace(/^(madac|pieceworkszambia)\//, "");
      return `${altPublicBase}/${cleanedPath}`;
    }

    // Allow building from bare key/path only (no external URLs)
    const looksLikeKey = !/^https?:\/\//i.test(url);
    if (looksLikeKey && publicBase) {
      const cleanedKey = url.replace(/^\/+/, "");
      return `${publicBase}/${cleanedKey}`;
    }
  } catch {
    /* ignore */
  }
  return url;
};

taskRouter.get("/", async (_req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const mapped = tasks.map((task) => ({
      ...task,
      imageUrl: toPublicUrl(task.imageUrl || (task as any).image),
    }));
    res.status(StatusCodes.OK).json(mapped);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to load tasks",
      error: error?.message || error,
    });
  }
});

taskRouter.post("/", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Coerce IDs to strings to satisfy schema
    const employerId = data.employerId != null ? String(data.employerId) : "";
    const employerUserId = data.employerUserId != null ? String(data.employerUserId) : employerId;
    const imageUrl =
      toPublicUrl(data.imageUrl) ||
      toPublicUrl(data.image) ||
      (typeof data.image === "string" ? toPublicUrl(data.image) : null);

    if (!imageUrl || !isR2PublicUrl(imageUrl)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "imageUrl must be an R2 public URL (pub-<account>.r2.dev/...)" });
    }

    // Ensure publicId uniqueness with a few retries to avoid 500s on collisions
    let payload = {
      ...data,
      publicId: data.publicId || generatePublicId(),
      employerId,
      employerUserId,
      imageUrl,
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const task = await prisma.task.create({ data: payload });
        return res.status(StatusCodes.CREATED).json(task);
      } catch (err: any) {
        const isUniquePublicId =
          err?.code === "P2002" &&
          Array.isArray(err?.meta?.target) &&
          err.meta.target.includes("publicId");
        if (isUniquePublicId) {
          payload = { ...payload, publicId: generatePublicId() };
          continue;
        }
        throw err;
      }
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create task after multiple attempts to generate a unique publicId",
    });
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to create task",
      error: error?.message || error,
    });
  }
});

taskRouter.use("/", acceptRouter);

taskRouter.patch("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};

    // Normalize any incoming image reference to the publicly resolvable R2 URL
    const imageUrl =
      toPublicUrl(body.imageUrl) ||
      toPublicUrl(body.image) ||
      (typeof body.image === "string" ? toPublicUrl(body.image) : null);

    if (body.imageUrl || body.image) {
      if (!imageUrl || !isR2PublicUrl(imageUrl)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "imageUrl must be an R2 public URL (pub-<account>.r2.dev/...)",
        });
      }
    }

    const payload = {
      ...body,
      ...(imageUrl ? { imageUrl } : {}),
    };

    const task = await prisma.task.update({
      where: { id },
      data: payload,
    });
    res.status(StatusCodes.OK).json(task);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to update task",
      error: error?.message || error,
    });
  }
});

taskRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await prisma.task.delete({ where: { id } });
    res.status(StatusCodes.NO_CONTENT).send();
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to delete task",
      error: error?.message || error,
    });
  }
});

taskRouter.patch("/:id/review", async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { rating, comment, reviewBy, reviewForId } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: "Rating must be between 1 and 5" });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Task not found" });
    }

    const acceptedAsNumber = Number(task.acceptedById);
    const reviewForIdNumber = Number(reviewForId);
    const finalReviewForId = Number.isFinite(reviewForIdNumber)
      ? reviewForIdNumber
      : Number.isFinite(acceptedAsNumber)
        ? acceptedAsNumber
        : null;

    const updated = await prisma.task.update({
      where: { id },
      data: {
        reviewRating: rating,
        reviewComment: comment,
        reviewBy,
        reviewForId: finalReviewForId,
        reviewGiven: true,
        reviewAt: new Date(),
      },
    });

    res.status(StatusCodes.OK).json(updated);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to submit review",
      error: error?.message || error,
    });
  }
});

export default taskRouter;
