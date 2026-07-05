import { Router } from "express";
import { prisma } from "../prisma";
import { consultarPago } from "../services/mercadopago";

export const pagosRouter = Router();

// Webhook publico de MercadoPago (IPN / webhooks v2)
pagosRouter.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id ?? req.query["data.id"];
    if (!paymentId) return res.sendStatus(200);

    const pago = await consultarPago(String(paymentId));
    const sessionId = pago.external_reference;
    if (!sessionId) return res.sendStatus(200);

    const session = await prisma.parkingSession.findUnique({ where: { id: sessionId } });
    if (!session || session.estado !== "PENDIENTE_PAGO") return res.sendStatus(200);

    if (pago.status === "approved") {
      const inicio = new Date();
      const fin = new Date(inicio.getTime() + session.duracionMinutos * 60_000);
      await prisma.$transaction([
        prisma.payment.update({
          where: { sessionId },
          data: { estado: "APROBADO", mpPaymentId: String(paymentId) },
        }),
        prisma.parkingSession.update({
          where: { id: sessionId },
          data: { estado: "ACTIVA", inicio, fin },
        }),
      ]);
    } else if (pago.status === "rejected") {
      await prisma.payment.update({ where: { sessionId }, data: { estado: "RECHAZADO", mpPaymentId: String(paymentId) } });
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error procesando webhook de MercadoPago", err);
    res.sendStatus(200);
  }
});
