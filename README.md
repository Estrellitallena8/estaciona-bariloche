# Estaciona Bariloche

App de estacionamiento medido con pago por **QR** y **NFC** para San Carlos de Bariloche.
El conductor identifica el lugar donde estacionó escaneando el cartel (QR) o acercando el
celular a un tag NFC, elige la duración, paga y queda un ticket digital validable por los
inspectores de tránsito.

## Arquitectura

```
estaciona-bariloche/
├── server/     API REST (Node + Express + TypeScript + Prisma/SQLite)
└── web/        App web PWA (React + Vite + TypeScript)
```

- **Sin instalación nativa**: es una PWA mobile-first, instalable desde el navegador.
  El escaneo QR usa la cámara (`html5-qrcode`); el NFC usa la **Web NFC API**
  (`NDEFReader`), disponible hoy en Chrome para Android sobre HTTPS o `localhost`.
- **Pago**: integración con **MercadoPago Checkout Pro** (el método más usado en
  Argentina). Si no configurás credenciales, el sistema opera en **modo demo**:
  aprueba los pagos automáticamente para poder probar todo el flujo sin cobrar de verdad.
- **Base de datos**: SQLite vía Prisma, cero configuración para levantar el proyecto.
  Migrar a Postgres para producción es un cambio de una línea en `schema.prisma`.

## Modelo del dominio

- **Zonas**: áreas tarifadas de Bariloche (Centro Cívico, Zona Comercial, Costanera,
  Av. Bustillo) con tarifa por hora, horario de servicio y máximo de horas continuas.
- **Parquímetros virtuales (`ParkingSpot`)**: el "cartel" físico en la vía pública,
  identificado por un `qrToken` (URL del QR) y un `nfcTagId` (tag NFC).
- **Sesión de estacionamiento**: se crea al pagar, con inicio/fin, tarifa y estado
  (`PENDIENTE_PAGO`, `ACTIVA`, `EXPIRADA`, `CANCELADA`).
- **Inspector**: rol especial que puede verificar si una patente tiene un
  estacionamiento vigente, buscando por patente o escaneando el QR del ticket.

## Cómo correrlo

### 1. Backend

```bash
cd server
npm install
npx prisma migrate dev --name init   # crea prisma/dev.db
npm run seed                          # carga zonas, parquímetros y usuario inspector
npm run dev                           # http://localhost:4000
```

Variables de entorno (`server/.env`):

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="cambiar-en-produccion"
PORT=4000
MP_ACCESS_TOKEN=        # vacío = modo demo (pagos auto-aprobados)
CLIENT_URL="http://localhost:5173"
```

Para cobrar de verdad, generá un **Access Token** en
https://www.mercadopago.com.ar/developers y pegalo en `MP_ACCESS_TOKEN`. También
configurá el webhook de notificaciones apuntando a `POST /api/pagos/webhook`.

### 2. Frontend

```bash
cd web
npm install
npm run dev   # http://localhost:5173
```

### 3. Generar los QR de prueba

```bash
cd server
npm run qrcodes
```

Genera PNGs en `server/qr-output/`, uno por parquímetro, listos para imprimir y pegar
en un cartel de prueba, o para abrir directamente desde el celular sin escanear nada
(cada QR es en realidad un link `http://localhost:5173/escanear?qr=<token>`).

### Usuarios de prueba

- **Conductor**: te registrás vos mismo desde la app con tu teléfono y patente.
- **Inspector de demo**: teléfono `0000000000`, contraseña `inspector123`.

## Flujo de uso

1. El conductor estaciona y escanea el QR del cartel (o acerca el celular al tag NFC).
2. La app identifica la zona y tarifa, y le muestra el costo según la duración elegida.
3. Paga con MercadoPago (o al instante en modo demo) y el estacionamiento queda **ACTIVA**.
4. Ve la cuenta regresiva, puede extender el tiempo, y muestra el QR de su ticket.
5. Un inspector de tránsito busca la patente o escanea ese QR desde su panel y ve
   al instante si el estacionamiento está vigente.

## Decisiones de diseño

- **QR como URL, no como código propietario**: cualquier cámara del celular (no hace
  falta tener la app abierta) puede abrir el link del cartel y entrar directo al flujo
  de pago. Esto reduce fricción para quien nunca usó la app.
- **NFC como alternativa "tap"**: para quienes ya tienen la app instalada, es más rápido
  que apuntar la cámara. Como Web NFC solo funciona en Chrome/Android, el QR es siempre
  el método universal de respaldo.
- **Modo demo de pagos**: permite desplegar y probar todo el circuito (incluida la
  verificación de inspectores) sin depender de credenciales reales de MercadoPago.
- **Tarifas de ejemplo**: los valores de `prisma/seed.ts` son ilustrativos; hay que
  actualizarlos con los montos oficiales vigentes del municipio de Bariloche.

## Próximos pasos sugeridos para producción

- Migrar SQLite → PostgreSQL y desplegar server + web (Railway/Render/Fly.io + Vercel).
- Emitir credenciales reales de MercadoPago y validar la firma del webhook.
- App nativa opcional (o Capacitor) si se necesita escritura de tags NFC desde el celular
  del municipio para programar los carteles.
- Notificaciones push cuando el estacionamiento está por vencer.
