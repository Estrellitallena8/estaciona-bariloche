"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calcularCosto = calcularCosto;
function calcularCosto(tarifaPorHora, duracionMinutos) {
    const horas = duracionMinutos / 60;
    const costoCrudo = tarifaPorHora * horas;
    // redondeo a multiplos de 50 ARS para simplificar el cobro
    return Math.ceil(costoCrudo / 50) * 50;
}
//# sourceMappingURL=tarifa.js.map