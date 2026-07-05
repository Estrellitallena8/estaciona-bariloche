import { Router } from "express";
import { z } from "zod";
import { prisma } from "../prisma";
import { requireAuth } from "../middleware/auth";

export const vehiculosRouter = Router();
vehiculosRouter.use(requireAuth);

vehiculosRouter.get("/", async (req, res) => {
  const vehiculos = await prisma.vehicle.findMany({
    where: { userId: req.auth!.userId },
    orderBy: { createdAt: "asc" },
  });
  res.json({ vehiculos });
});

const crearSchema = z.object({
  patente: z.string().min(5).max(10),
  alias: z.string().optional(),
});

vehiculosRouter.post("/", async (req, res) => {
  const parsed = crearSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Datos invalidos" });
  const patente = parsed.data.patente.toUpperCase().replace(/\s/g, "");

  const existe = await prisma.vehicle.findFirst({ where: { userId: req.auth!.userId, patente } });
  if (existe) return res.status(409).json({ error: "Ya tenes esa patente cargada" });

  const vehiculo = await prisma.vehicle.create({
    data: { patente, alias: parsed.data.alias, userId: req.auth!.userId },
  });
  res.status(201).json({ vehiculo });
});

vehiculosRouter.delete("/:id", async (req, res) => {
  const vehiculo = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehiculo || vehiculo.userId !== req.auth!.userId) {
    return res.status(404).json({ error: "Vehiculo no encontrado" });
  }
  await prisma.vehicle.delete({ where: { id: vehiculo.id } });
  res.status(204).send();
});
