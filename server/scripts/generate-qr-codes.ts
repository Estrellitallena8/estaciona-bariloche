import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/env";

const prisma = new PrismaClient();

async function main() {
  const outDir = path.join(__dirname, "..", "qr-output");
  fs.mkdirSync(outDir, { recursive: true });

  const spots = await prisma.parkingSpot.findMany({ include: { zone: true } });
  if (spots.length === 0) {
    console.log('No hay parquimetros cargados. Corre primero "npm run seed".');
    return;
  }

  for (const spot of spots) {
    const url = `${env.clientUrl}/escanear?qr=${spot.qrToken}`;
    const filePath = path.join(outDir, `${spot.codigo}.png`);
    await QRCode.toFile(filePath, url, { width: 400, margin: 2 });
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
