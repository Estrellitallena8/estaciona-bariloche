"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehiculosRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
exports.vehiculosRouter = (0, express_1.Router)();
exports.vehiculosRouter.use(auth_1.requireAuth);
exports.vehiculosRouter.get("/", async (req, res) => {
    const vehiculos = await prisma_1.prisma.vehicle.findMany({
        where: { userId: req.auth.userId },
        orderBy: { createdAt: "asc" },
    });
    res.json({ vehiculos });
});
const crearSchema = zod_1.z.object({
    patente: zod_1.z.string().min(5).max(10),
    alias: zod_1.z.string().optional(),
});
exports.vehiculosRouter.post("/", async (req, res) => {
    const parsed = crearSchema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: "Datos invalidos" });
    const patente = parsed.data.patente.toUpperCase().replace(/\s/g, "");
    const existe = await prisma_1.prisma.vehicle.findFirst({ where: { userId: req.auth.userId, patente } });
    if (existe)
        return res.status(409).json({ error: "Ya tenes esa patente cargada" });
    const vehiculo = await prisma_1.prisma.vehicle.create({
        data: { patente, alias: parsed.data.alias, userId: req.auth.userId },
    });
    res.status(201).json({ vehiculo });
});
exports.vehiculosRouter.delete("/:id", async (req, res) => {
    const vehiculo = await prisma_1.prisma.vehicle.findUnique({ where: { id: req.params.id } });
    if (!vehiculo || vehiculo.userId !== req.auth.userId) {
        return res.status(404).json({ error: "Vehiculo no encontrado" });
    }
    await prisma_1.prisma.vehicle.delete({ where: { id: vehiculo.id } });
    res.status(204).send();
});
//# sourceMappingURL=vehiculos.js.map