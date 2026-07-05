"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireInspector = requireInspector;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../env");
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No autenticado" });
    }
    const token = header.slice("Bearer ".length);
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
        req.auth = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: "Token invalido o expirado" });
    }
}
function requireInspector(req, res, next) {
    if (!req.auth?.esInspector) {
        return res.status(403).json({ error: "Requiere permisos de inspector" });
    }
    next();
}
//# sourceMappingURL=auth.js.map