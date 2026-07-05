"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spotsRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../prisma");
exports.spotsRouter = (0, express_1.Router)();
// Resuelve un parquimetro virtual a partir del token leido por camara (QR) o por Web NFC
exports.spotsRouter.get("/resolver", async (req, res) => {
    const { qr, nfc } = req.query;
    if (!qr && !nfc) {
        return res.status(400).json({ error: "Falta el parametro qr o nfc" });
    }
    const spot = await prisma_1.prisma.parkingSpot.findFirst({
        where: qr ? { qrToken: qr } : { nfcTagId: nfc },
        include: { zone: true },
    });
    if (!spot || !spot.activo) {
        return res.status(404).json({ error: "Ese cartel de estacionamiento no es valido o esta dado de baja" });
    }
    res.json({
        spot: {
            id: spot.id,
            codigo: spot.codigo,
            calle: spot.calle,
            altura: spot.altura,
            lat: spot.lat,
            lng: spot.lng,
        },
        zona: spot.zone,
        origen: qr ? "QR" : "NFC",
    });
});
//# sourceMappingURL=spots.js.map