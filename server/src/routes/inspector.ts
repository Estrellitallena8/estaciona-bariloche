import { Router } from "express";
import { prisma } from "../prisma";
import { requireAuth, requireInspector } from "../middleware/auth";

export const inspectorRouter = Router();
inspectorRouter.use(requireAuth, requireInspector);

inspectorRouter.get("/verificar", async (req, res) => {
  const { patente, ticket } = req.query as { patente?: string; ticket?: string };
  if (!patente && !ticket) return res.status(400).json({ error: "Falta patente o ticket" });

  const session = await prisma.parkingSession.findFirst({
    where: ticket
      ? { ticketToken: ticket }
      : { vehicle: { patente: patente!.toUpperCase().replace(/\s/g, "") }, estado: "ACTIVA" },
    orderBy: { createdAt: "desc" },
    include: { zone: true, spot: true, vehicle: true },
  });

  if (!session) {
    return res.json({ valido: false, mensaje: "No se encontro un estacionamiento activo para esa busqueda" });
  }

  const ahora = new Date();
  const vigente = session.estado === "ACTIVA" && !!session.fin && session.fin > ahora;

  res.json({
    valido: vigente,
    mensaje: vigente ? "Estacionamiento vigente" : "El estacionamiento esta vencido o no esta activo",
    session: {
      patente: session.vehicle.patente,
      zona: session.zone.nombre,
      calle: session.spot.calle,
      inicio: session.inicio,
      fin: session.fin,
      estado: session.estado,
    },
  });
});
