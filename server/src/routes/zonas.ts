import { Router } from "express";
import { prisma } from "../prisma";

export const zonasRouter = Router();

zonasRouter.get("/", async (_req, res) => {
  const zonas = await prisma.zone.findMany({ where: { activo: true }, orderBy: { codigo: "asc" } });
  res.json({ zonas });
});
