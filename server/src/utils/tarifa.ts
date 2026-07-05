export function calcularCosto(tarifaPorHora: number, duracionMinutos: number): number {
  const horas = duracionMinutos / 60;
  const costoCrudo = tarifaPorHora * horas;
  // redondeo a multiplos de 50 ARS para simplificar el cobro
  return Math.ceil(costoCrudo / 50) * 50;
}
