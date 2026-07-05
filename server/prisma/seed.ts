import { PrismaClient } from "@prisma/client";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const zonasSeed = [
  {
    codigo: "Z1-CENTRO",
    nombre: "Centro Cívico",
    descripcion: "Alrededores del Centro Cívico y Av. Bartolomé Mitre",
    tarifaPorHora: 1200,
    maxHorasContinuas: 3,
    colorHex: "#dc2626",
  },
  {
    codigo: "Z2-COMERCIAL",
    nombre: "Zona Comercial",
    descripcion: "Moreno, Rolando, Elflein y Onelli",
    tarifaPorHora: 1000,
    maxHorasContinuas: 4,
    colorHex: "#ea580c",
  },
  {
    codigo: "Z3-COSTANERA",
    nombre: "Costanera",
    descripcion: "Av. San Martín y Costanera del Lago Nahuel Huapi",
    tarifaPorHora: 900,
    maxHorasContinuas: 4,
    colorHex: "#0891b2",
  },
  {
    codigo: "Z4-BUSTILLO",
    nombre: "Av. Bustillo (km 0 a 5)",
    descripcion: "Zona hotelera y gastronómica de Av. Exequiel Bustillo",
    tarifaPorHora: 800,
    maxHorasContinuas: 6,
    colorHex: "#16a34a",
  },
] as const;

const spotsSeed = [
  { zona: "Z1-CENTRO", codigo: "CEN-001", calle: "Mitre", altura: "100", lat: -41.1335, lng: -71.3103 },
  { zona: "Z1-CENTRO", codigo: "CEN-002", calle: "Mitre", altura: "250", lat: -41.1339, lng: -71.3092 },
  { zona: "Z1-CENTRO", codigo: "CEN-003", calle: "San Martín", altura: "50", lat: -41.1330, lng: -71.3110 },
  { zona: "Z2-COMERCIAL", codigo: "COM-001", calle: "Moreno", altura: "300", lat: -41.1347, lng: -71.3088 },
  { zona: "Z2-COMERCIAL", codigo: "COM-002", calle: "Elflein", altura: "20", lat: -41.1338, lng: -71.3075 },
  { zona: "Z2-COMERCIAL", codigo: "COM-003", calle: "Rolando", altura: "150", lat: -41.1343, lng: -71.3080 },
  { zona: "Z3-COSTANERA", codigo: "COS-001", calle: "Av. Costanera", altura: "10", lat: -41.1318, lng: -71.3120 },
  { zona: "Z3-COSTANERA", codigo: "COS-002", calle: "Av. San Martín", altura: "500", lat: -41.1312, lng: -71.3145 },
  { zona: "Z4-BUSTILLO", codigo: "BUS-001", calle: "Av. Bustillo", altura: "km 1.5", lat: -41.1280, lng: -71.3320 },
  { zona: "Z4-BUSTILLO", codigo: "BUS-002", calle: "Av. Bustillo", altura: "km 3", lat: -41.1230, lng: -71.3550 },
] as const;

async function main() {
  console.log("Sembrando zonas...");
  const zonaIdPorCodigo = new Map<string, string>();
  for (const z of zonasSeed) {
    const zona = await prisma.zone.upsert({
      where: { codigo: z.codigo },
      update: z,
      create: z,
    });
    zonaIdPorCodigo.set(z.codigo, zona.id);
  }

  console.log("Sembrando parquimetros virtuales (QR + NFC)...");
  for (const s of spotsSeed) {
    const zoneId = zonaIdPorCodigo.get(s.zona)!;
    await prisma.parkingSpot.upsert({
      where: { codigo: s.codigo },
      update: {},
      create: {
        codigo: s.codigo,
        zoneId,
        calle: s.calle,
        altura: s.altura,
        lat: s.lat,
        lng: s.lng,
        qrToken: nanoid(16),
        nfcTagId: `NFC-${s.codigo}-${nanoid(6)}`,
      },
    });
  }

  console.log("Creando usuario inspector de demo...");
  const passwordHash = await bcrypt.hash("inspector123", 10);
  await prisma.user.upsert({
    where: { telefono: "0000000000" },
    update: {},
    create: {
      nombre: "Inspector Demo",
      telefono: "0000000000",
      passwordHash,
      esInspector: true,
    },
  });

  console.log("Listo. Zonas y parquimetros creados/actualizados.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
