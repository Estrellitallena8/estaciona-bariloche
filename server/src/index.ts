import express from "express";
import cors from "cors";
import { env } from "./env";
import { authRouter } from "./routes/auth";
import { vehiculosRouter } from "./routes/vehiculos";
import { zonasRouter } from "./routes/zonas";
import { spotsRouter } from "./routes/spots";
import { sesionesRouter } from "./routes/sesiones";
import { pagosRouter } from "./routes/pagos";
import { inspectorRouter } from "./routes/inspector";

const app = express();
app.use(cors({ origin: env.clientUrl }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true, modoDemoPagos: env.modoDemoPagos }));
app.use("/api/auth", authRouter);
app.use("/api/vehiculos", vehiculosRouter);
app.use("/api/zonas", zonasRouter);
app.use("/api/spots", spotsRouter);
app.use("/api/sesiones", sesionesRouter);
app.use("/api/pagos", pagosRouter);
app.use("/api/inspector", inspectorRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(env.port, () => {
  console.log(`API de Estaciona Bariloche escuchando en http://localhost:${env.port}`);
  console.log(`Modo demo de pagos: ${env.modoDemoPagos ? "ACTIVADO (sin MercadoPago real)" : "desactivado"}`);
});
