-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "esInspector" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patente" TEXT NOT NULL,
    "alias" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Vehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Zone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tarifaPorHora" REAL NOT NULL,
    "toleranciaMin" INTEGER NOT NULL DEFAULT 10,
    "maxHorasContinuas" INTEGER NOT NULL DEFAULT 4,
    "colorHex" TEXT NOT NULL DEFAULT '#2563eb',
    "horarioDesde" TEXT NOT NULL DEFAULT '09:00',
    "horarioHasta" TEXT NOT NULL DEFAULT '21:00',
    "diasServicio" TEXT NOT NULL DEFAULT 'Lun a Sáb',
    "activo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "ParkingSpot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigo" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "altura" TEXT,
    "lat" REAL NOT NULL,
    "lng" REAL NOT NULL,
    "qrToken" TEXT NOT NULL,
    "nfcTagId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ParkingSpot_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ParkingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "zoneId" TEXT NOT NULL,
    "spotId" TEXT NOT NULL,
    "inicio" DATETIME,
    "fin" DATETIME,
    "duracionMinutos" INTEGER NOT NULL,
    "costo" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE_PAGO',
    "origen" TEXT NOT NULL DEFAULT 'QR',
    "ticketToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ParkingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ParkingSession_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ParkingSession_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "Zone" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ParkingSession_spotId_fkey" FOREIGN KEY ("spotId") REFERENCES "ParkingSpot" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'mercadopago',
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "mpPreferenceId" TEXT,
    "mpPaymentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ParkingSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telefono_key" ON "User"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_userId_patente_key" ON "Vehicle"("userId", "patente");

-- CreateIndex
CREATE UNIQUE INDEX "Zone_codigo_key" ON "Zone"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_codigo_key" ON "ParkingSpot"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_qrToken_key" ON "ParkingSpot"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSpot_nfcTagId_key" ON "ParkingSpot"("nfcTagId");

-- CreateIndex
CREATE UNIQUE INDEX "ParkingSession_ticketToken_key" ON "ParkingSession"("ticketToken");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_sessionId_key" ON "Payment"("sessionId");
