"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function required(name, fallback) {
    const value = process.env[name] ?? fallback;
    if (value === undefined) {
        throw new Error(`Falta la variable de entorno ${name}`);
    }
    return value;
}
exports.env = {
    port: Number(process.env.PORT ?? 4000),
    jwtSecret: required("JWT_SECRET"),
    clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
    mpAccessToken: process.env.MP_ACCESS_TOKEN ?? "",
    get modoDemoPagos() {
        return this.mpAccessToken.length === 0;
    },
};
//# sourceMappingURL=env.js.map