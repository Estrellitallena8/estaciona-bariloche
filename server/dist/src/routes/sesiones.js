"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sesionesRouter = void 0;
exports.activarSesion = activarSesion;
const express_1 = require("express");
const zod_1 = require("zod");
const nanoid_1 = require("nanoid");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const tarifa_1 = require("../utils/tarifa");
const env_1 = require("../env");
const mercadopago_1 = require("../services/mercadopago");
exports.sesionesRouter = (0, express_1.Router)();
exports.sesionesRouter.use(auth_1.requireAuth);
const crearSchema = zod_1.z.object({
    spotId: zod_1.z.string(),
    vehicleId: zod_1.z.string(),
    duracionMinutos: zod_1.z.number().int().min(15).max(600),
    origen: zod_1.z.enum(["QR", "NFC"]).default("QR"),
});
exports.sesionesRouter.post("/", async (req, res) => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Datos invalidos", detalle: parsed.error.flatten() });
    const { spotId, vehicleId, duracionMinutos, origen } = parsed.data;
    const [spot, vehicle] = await Promise.all([
        prisma_1.prisma.parkingSpot.findUnique({ where: { id: spotId }, include: { zone: true } }),
        prisma_1.prisma.vehicle.findUnique({ where: { id: vehicleId } }),
    ]);
    if (!spot || !spot.activo)
        return res.status(404).json({ error: "Parquimetro no encontrado" });
    if (!vehicle || vehicle.userId !== req.auth.userId)
        return res.status(404).json({ error: "Vehiculo no encontrado" });
    const maxMinutos = spot.zone.maxHorasContinuas * 60;
    if (duracionMinutos > maxMinutos) {
        return res.status(422).json({ error: `Esta zona permite un maximo de ${spot.zone.maxHorasContinuas} horas continuas` });
    }
    const yaActiva = await prisma_1.prisma.parkingSession.findFirst({
        where: { vehicleId, estado: "ACTIVA", fin: { gt: new Date() } },
    });
    if (yaActiva) {
        return res.status(409).json({ error: "Ese vehiculo ya tiene un estacionamiento activo" });
    }
    const costo = (0, tarifa_1.calcularCosto)(spot.zone.tarifaPorHora, duracionMinutos);
    const session = await prisma_1.prisma.parkingSession.create({
        data: {
            userId: req.auth.userId,
            vehicleId,
            zoneId: spot.zoneId,
            spotId,
            duracionMinutos,
            costo,
            origen,
            ticketToken: (0, nanoid_1.nanoid)(12),
            pago: { create: { monto: costo, estado: "PENDIENTE", metodo: env_1.env.modoDemoPagos ? "demo" : "mercadopago" } },
        },
        include: { pago: true, zone: true, spot: true, vehicle: true },
    });
    if (env_1.env.modoDemoPagos) {
        const activada = await activarSesion(session.id);
        return res.status(201).json({ session: activada, modoDemo: true });
    }
    const preferencia = await (0, mercadopago_1.crearPreferencia)({
        sessionId: session.id,
        titulo: `Estacionamiento ${spot.zone.nombre} - ${duracionMinutos} min`,
        monto: costo,
    });
    await prisma_1.prisma.payment.update({
        where: { sessionId: session.id },
        data: { mpPreferenceId: preferencia.id },
    });
    res.status(201).json({
        session,
        modoDemo: false,
        checkoutUrl: preferencia.init_point,
    });
});
async function activarSesion(sessionId) {
    const inicio = new Date();
    const session = await prisma_1.prisma.parkingSession.findUniqueOrThrow({ where: { id: sessionId } });
    const fin = new Date(inicio.getTime() + session.duracionMinutos * 60000);
    await prisma_1.prisma.payment.update({ where: { sessionId }, data: { estado: "APROBADO" } });
    return prisma_1.prisma.parkingSession.update({
        where: { id: sessionId },
        data: { estado: "ACTIVA", inicio, fin },
        include: { pago: true, zone: true, spot: true, vehicle: true },
    });
}
exports.sesionesRouter.get("/activas", async (req, res) => {
    const sesiones = await prisma_1.prisma.parkingSession.findMany({
        where: { userId: req.auth.userId, estado: "ACTIVA", fin: { gt: new Date() } },
        include: { zone: true, spot: true, vehicle: true, pago: true },
        orderBy: { fin: "asc" },
    });
    res.json({ sesiones });
});
exports.sesionesRouter.get("/historial", async (req, res) => {
    const sesiones = await prisma_1.prisma.parkingSession.findMany({
        where: { userId: req.auth.userId },
        include: { zone: true, spot: true, vehicle: true, pago: true },
        orderBy: { createdAt: "desc" },
        take: 50,
    });
    res.json({ sesiones });
});
const extenderSchema = zod_1.z.object({ minutosAdicionales: zod_1.z.number().int().min(15).max(300) });
exports.sesionesRouter.post("/:id/extender", async (req, res) => {
    const parsed = extenderSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Datos invalidos" });
    const session = await prisma_1.prisma.parkingSession.findUnique({ where: { id: req.params.id }, include: { zone: true } });
    if (!session || session.userId !== req.auth.userId)
        return res.status(404).json({ error: "Sesion no encontrada" });
    if (session.estado !== "ACTIVA" || !session.fin || session.fin < new Date()) {
        return res.status(409).json({ error: "La sesion no esta activa" });
    }
    const nuevaDuracion = session.duracionMinutos + parsed.data.minutosAdicionales;
    const maxMinutos = session.zone.maxHorasContinuas * 60;
    if (nuevaDuracion > maxMinutos) {
        return res.status(422).json({ error: `Esta zona permite un maximo de ${session.zone.maxHorasContinuas} horas continuas` });
    }
    const costoAdicional = (0, tarifa_1.calcularCosto)(session.zone.tarifaPorHora, parsed.data.minutosAdicionales);
    // En modo demo se aprueba al instante; con MercadoPago real se deberia generar un cobro adicional.
    const nuevoFin = new Date(session.fin.getTime() + parsed.data.minutosAdicionales * 60000);
    const actualizada = await prisma_1.prisma.parkingSession.update({
        where: { id: session.id },
        data: {
            fin: nuevoFin,
            duracionMinutos: nuevaDuracion,
            costo: session.costo + costoAdicional,
        },
        include: { pago: true, zone: true, spot: true, vehicle: true },
    });
    res.json({ session: actualizada, costoAdicional });
});
exports.sesionesRouter.post("/:id/cancelar", async (req, res) => {
    const session = await prisma_1.prisma.parkingSession.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.auth.userId)
        return res.status(404).json({ error: "Sesion no encontrada" });
    if (session.estado !== "PENDIENTE_PAGO") {
        return res.status(409).json({ error: "Solo se puede cancelar antes de confirmar el pago" });
    }
    const actualizada = await prisma_1.prisma.parkingSession.update({
        where: { id: session.id },
        data: { estado: "CANCELADA" },
    });
    res.json({ session: actualizada });
});
exports.sesionesRouter.get("/:id", async (req, res) => {
    const session = await prisma_1.prisma.parkingSession.findUnique({
        where: { id: req.params.id },
        include: { zone: true, spot: true, vehicle: true, pago: true },
    });
    if (!session || session.userId !== req.auth.userId)
        return res.status(404).json({ error: "Sesion no encontrada" });
    res.json({ session });
});
//# sourceMappingURL=sesiones.js.map