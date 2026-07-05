"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const env_1 = require("../env");
const auth_1 = require("../middleware/auth");
exports.authRouter = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    nombre: zod_1.z.string().min(2),
    telefono: zod_1.z.string().min(6),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
    password: zod_1.z.string().min(6),
    patente: zod_1.z.string().min(5).max(10),
});
exports.authRouter.post("/registro", async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Datos invalidos", detalle: parsed.error.flatten() });
    }
    const { nombre, telefono, email, password, patente } = parsed.data;
    const existente = await prisma_1.prisma.user.findUnique({ where: { telefono } });
    if (existente) {
        return res.status(409).json({ error: "Ya existe una cuenta con ese telefono" });
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            nombre,
            telefono,
            email: email || undefined,
            passwordHash,
            vehiculos: {
                create: [{ patente: patente.toUpperCase().replace(/\s/g, "") }],
            },
        },
        include: { vehiculos: true },
    });
    const token = signToken(user.id, user.esInspector);
    res.status(201).json({ token, user: publicUser(user) });
});
const loginSchema = zod_1.z.object({
    telefono: zod_1.z.string().min(6),
    password: zod_1.z.string().min(1),
});
exports.authRouter.post("/login", async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({ error: "Datos invalidos" });
    }
    const { telefono, password } = parsed.data;
    const user = await prisma_1.prisma.user.findUnique({ where: { telefono }, include: { vehiculos: true } });
    if (!user) {
        return res.status(401).json({ error: "Telefono o contraseña incorrectos" });
    }
    const ok = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!ok) {
        return res.status(401).json({ error: "Telefono o contraseña incorrectos" });
    }
    const token = signToken(user.id, user.esInspector);
    res.json({ token, user: publicUser(user) });
});
exports.authRouter.get("/me", auth_1.requireAuth, async (req, res) => {
    const user = await prisma_1.prisma.user.findUnique({
        where: { id: req.auth.userId },
        include: { vehiculos: true },
    });
    if (!user)
        return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ user: publicUser(user) });
});
function signToken(userId, esInspector) {
    return jsonwebtoken_1.default.sign({ userId, esInspector }, env_1.env.jwtSecret, { expiresIn: "30d" });
}
function publicUser(user) {
    return {
        id: user.id,
        nombre: user.nombre,
        telefono: user.telefono,
        email: user.email,
        esInspector: user.esInspector,
        vehiculos: user.vehiculos,
    };
}
//# sourceMappingURL=auth.js.map