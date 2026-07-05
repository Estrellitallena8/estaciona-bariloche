"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zonasRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.zonasRouter = (0, express_1.Router)();
exports.zonasRouter.get("/", async (_req, res) => {
    const zonas = await prisma_1.prisma.zone.findMany({ where: { activo: true }, orderBy: { codigo: "asc" } });
    res.json({ zonas });
});
//# sourceMappingURL=zonas.js.map