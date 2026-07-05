"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inspectorRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
exports.inspectorRouter = (0, express_1.Router)();
exports.inspectorRouter.use(auth_1.requireAuth, auth_1.requireInspector);
exports.inspectorRouter.get("/verificar", async (req, res) => {
    const { patente, ticket } = req.query;
    if (!patente && !ticket)
        return res.status(400).json({ error: "Falta patente o ticket" });
    const session = await prisma_1.prisma.parkingSession.findFirst({
        where: ticket
            ? { ticketToken: ticket }
            : { vehicle: { patente: patente.toUpperCase().replace(/\s/g, "") }, estado: "ACTIVA" },
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
//# sourceMappingURL=inspector.js.map