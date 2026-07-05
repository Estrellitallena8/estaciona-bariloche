"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const client_1 = require("@prisma/client");
const env_1 = require("../src/env");
const prisma = new client_1.PrismaClient();
async function main() {
    const outDir = path_1.default.join(__dirname, "..", "qr-output");
    fs_1.default.mkdirSync(outDir, { recursive: true });
    const spots = await prisma.parkingSpot.findMany({ include: { zone: true } });
    if (spots.length === 0) {
        console.log('No hay parquimetros cargados. Corre primero "npm run seed".');
        return;
    }
    for (const spot of spots) {
        const url = `${env_1.env.clientUrl}/escanear?qr=${spot.qrToken}`;
        const filePath = path_1.default.join(outDir, `${spot.codigo}.png`);
        await qrcode_1.default.toFile(filePath, url, { width: 400, margin: 2 });
        console.log(`Generado ${filePath}  ->  ${url}`);
    }
    console.log(`\n${spots.length} códigos QR generados en ${outDir}`);
    console.log("Imprimi estos PNG para simular los carteles de la via publica, o abri la URL directamente en el celular para probar sin escanear.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=generate-qr-codes.js.map