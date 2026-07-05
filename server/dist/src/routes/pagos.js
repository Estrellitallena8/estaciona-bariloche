"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pagosRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const mercadopago_1 = require("../services/mercadopago");
exports.pagosRouter = (0, express_1.Router)();
// Webhook publico de MercadoPago (IPN / webhooks v2)
exports.pagosRouter.post("/webhook", async (req, res) => {
    try {
        const paymentId = req.body?.data?.id ?? req.query["data.id"];
        if (!paymentId)
            return res.sendStatus(200);
        const pago = await (0, mercadopago_1.consultarPago)(String(paymentId));
        const sessionId = pago.external_reference;
        if (!sessionId)
            return res.sendStatus(200);
        const session = await prisma_1.prisma.parkingSession.findUnique({ where: { id: sessionId } });
        if (!session || session.estado !== "PENDIENTE_PAGO")
            return res.sendStatus(200);
        if (pago.status === "approved") {
            const inicio = new Date();
            const fin = new Date(inicio.getTime() + session.duracionMinutos * 60000);
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.payment.update({
                    where: { sessionId },
                    data: { estado: "APROBADO", mpPaymentId: String(paymentId) },
                }),
                prisma_1.prisma.parkingSession.update({
                    where: { id: sessionId },
                    data: { estado: "ACTIVA", inicio, fin },
                }),
            ]);
        }
        else if (pago.status === "rejected") {
            await prisma_1.prisma.payment.update({ where: { sessionId }, data: { estado: "RECHAZADO", mpPaymentId: String(paymentId) } });
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error("Error procesando webhook de MercadoPago", err);
        res.sendStatus(200);
    }
});
//# sourceMappingURL=pagos.js.map