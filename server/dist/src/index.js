"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./env");
const auth_1 = require("./routes/auth");
const vehiculos_1 = require("./routes/vehiculos");
const zonas_1 = require("./routes/zonas");
const spots_1 = require("./routes/spots");
const sesiones_1 = require("./routes/sesiones");
const pagos_1 = require("./routes/pagos");
const inspector_1 = require("./routes/inspector");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: env_1.env.clientUrl }));
app.use(express_1.default.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, modoDemoPagos: env_1.env.modoDemoPagos }));
app.use("/api/auth", auth_1.authRouter);
app.use("/api/vehiculos", vehiculos_1.vehiculosRouter);
app.use("/api/zonas", zonas_1.zonasRouter);
app.use("/api/spots", spots_1.spotsRouter);
app.use("/api/sesiones", sesiones_1.sesionesRouter);
app.use("/api/pagos", pagos_1.pagosRouter);
app.use("/api/inspector", inspector_1.inspectorRouter);
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
});
app.listen(env_1.env.port, () => {
    console.log(`API de Estaciona Bariloche escuchando en http://localhost:${env_1.env.port}`);
    console.log(`Modo demo de pagos: ${env_1.env.modoDemoPagos ? "ACTIVADO (sin MercadoPago real)" : "desactivado"}`);
});
//# sourceMappingURL=index.js.map