import { Router } from "express";
import { prisma } from "../../config/db";
import { StatusCodes } from "http-status-codes";

const acceptRouter = Router();

acceptRouter.post("/:id/accept", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { acceptedById, acceptedByName, acceptedByEmail, acceptedByPhone } = req.body;

    const task = await prisma.task.update({
      where: { id },
      data: {
        status: "Accepted",
        acceptedTimestamp: new Date().toISOString(),
        acceptedById,
        acceptedByName,
        acceptedByEmail,
        acceptedByPhone,
      },
    });

    res.status(StatusCodes.OK).json(task);
  } catch (error: any) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "Failed to accept task",
      error: error?.message || error,
    });
  }
});

export default acceptRouter;
