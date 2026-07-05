import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";
import { env } from "../env";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  nombre: z.string().min(2),
  telefono: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6),
  patente: z.string().min(5).max(10),
});

authRouter.post("/registro", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos", detalle: parsed.error.flatten() });
  }
  const { nombre, telefono, email, password, patente } = parsed.data;

  const existente = await prisma.user.findUnique({ where: { telefono } });
  if (existente) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese telefono" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
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

const loginSchema = z.object({
  telefono: z.string().min(6),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Datos invalidos" });
  }
  const { telefono, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { telefono }, include: { vehiculos: true } });
  if (!user) {
    return res.status(401).json({ error: "Telefono o contraseña incorrectos" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "Telefono o contraseña incorrectos" });
  }
  const token = signToken(user.id, user.esInspector);
  res.json({ token, user: publicUser(user) });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.auth!.userId },
    include: { vehiculos: true },
  });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ user: publicUser(user) });
});

function signToken(userId: string, esInspector: boolean) {
  return jwt.sign({ userId, esInspector }, env.jwtSecret, { expiresIn: "30d" });
}

function publicUser(user: { id: string; nombre: string; telefono: string; email: string | null; esInspector: boolean; vehiculos: unknown[] }) {
  return {
    id: user.id,
    nombre: user.nombre,
    telefono: user.telefono,
    email: user.email,
    esInspector: user.esInspector,
    vehiculos: user.vehiculos,
  };
}
