const AGE_FACTORS = Object.freeze({
  "Menos de 1 año": 1,
  "1 a 2 años": 1.1,
  "Más de 2 años": 1.25,
});

export const currencyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export function getAgeFactor(age) {
  const factor = AGE_FACTORS[age];
  if (factor === undefined) {
    throw new Error(`No se encontró un factor para la antigüedad "${age}".`);
  }
  return factor;
}

export function calcularCuota(valor, tasaAnual, factorAntiguedad) {
  if (
    !Number.isFinite(valor) ||
    !Number.isFinite(tasaAnual) ||
    !Number.isFinite(factorAntiguedad)
  ) {
    throw new TypeError("El valor, la tasa anual y el factor deben ser números finitos.");
  }
  return Math.round((valor * tasaAnual) / 12 * factorAntiguedad);
}

export function calculatePlanQuote(value, plan, age) {
  return calcularCuota(value, plan.annualRate, getAgeFactor(age));
}

export function findPlan(plans, planId) {
  const plan = plans.find(({ id }) => id === planId);
  if (!plan) {
    throw new Error(`No se encontró el plan "${planId}" en data/planes.json.`);
  }
  return plan;
}
