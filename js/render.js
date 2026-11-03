import { calculatePlanQuote, currencyFormatter } from "./cotizador.js";
import {
  parseEquipmentValue,
  validateAge,
  validateEquipmentValue,
} from "./validaciones.js";

function getValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function renderPlanCard(plan, state) {
  const card = document.createElement("label");
  card.className = "card plan-card";

  const heading = document.createElement("span");
  heading.className = "plan-heading";
  const title = document.createElement("span");
  title.className = "plan-title";
  title.textContent = plan.name;
  heading.append(title);

  if (plan.recommended) {
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.dataset.variant = "secondary";
    badge.textContent = "Recomendado";
    heading.append(badge);
  }

  const radio = document.createElement("input");
  radio.className = "plan-radio";
  radio.type = "radio";
  radio.name = "plan";
  radio.value = plan.id;
  radio.checked = plan.id === state.plan.id;
  radio.setAttribute("aria-label", `Seleccionar plan ${plan.name}`);
  radio.dataset.planId = plan.id;

  const price = document.createElement("span");
  price.className = "plan-price";
  price.dataset.planPrice = plan.id;

  const period = document.createElement("small");
  period.textContent = "/mes";
  price.append(period);

  const coverages = document.createElement("ul");
  coverages.className = "coverage-list";
  for (const coverage of plan.coverages) {
    const item = document.createElement("li");
    item.textContent = coverage;
    coverages.append(item);
  }

  card.append(heading, radio, price, coverages);
  return card;
}

function updateBoundValues(state) {
  for (const element of document.querySelectorAll("[data-bind]")) {
    const value = getValue(state, element.dataset.bind);
    if (value === undefined) {
      continue;
    }

    if (element.dataset.format?.startsWith("ars")) {
      const formatted =
        typeof value === "number" && Number.isFinite(value)
          ? currencyFormatter.format(value)
          : "—";
      element.textContent =
        element.dataset.format === "ars-monthly" && formatted !== "—"
          ? `${formatted}/mes`
          : formatted;
    } else {
      element.textContent = value;
    }
  }
}

function updatePlanPrices(state, plans) {
  const canQuote =
    validateEquipmentValue(state.device.value) === null &&
    validateAge(state.device.age) === null;
  const equipmentValue = parseEquipmentValue(state.device.value);

  for (const plan of plans) {
    const amount = canQuote
      ? calculatePlanQuote(equipmentValue, plan, state.device.age)
      : null;
    const price = document.querySelector(`[data-plan-price="${plan.id}"]`);
    if (price) {
      const period = price.querySelector("small");
      price.textContent =
        amount === null ? "—" : currencyFormatter.format(amount);
      if (period) {
        price.append(period);
      } else {
        const suffix = document.createElement("small");
        suffix.textContent = "/mes";
        price.append(suffix);
      }
    }
    if (plan.id === state.plan.id) {
      state.plan.monthlyPrice = amount;
      state.plan.name = plan.name;
      state.plan.annualRate = plan.annualRate;
    }
  }
}

function updatePlanSelection(state) {
  for (const card of document.querySelectorAll(".plan-card")) {
    card.classList.toggle(
      "is-selected",
      card.querySelector(".plan-radio")?.checked === true,
    );
  }
}

export function renderPage(state, plans) {
  for (const input of document.querySelectorAll("[data-value]")) {
    const value = getValue(state, input.dataset.value);
    if (value === undefined) {
      continue;
    }
    if (input.type === "checkbox") {
      input.checked = value === true;
    } else {
      input.value = value;
    }
  }

  for (const group of document.querySelectorAll("[data-choice-group]")) {
    const value = getValue(state, group.dataset.choiceGroup);
    for (const input of group.querySelectorAll('input[type="radio"]')) {
      input.checked = input.value === value;
    }
  }

  for (const input of document.querySelectorAll('input[name="medio-pago"]')) {
    input.checked = input.value === state.payment.method;
  }

  for (const method of state.paymentMethods) {
    const label = document.querySelector(
      `[data-payment-label="${method.id}"]`,
    );
    if (label) {
      label.textContent = method.label;
    }
  }

  const planContainer = document.querySelector("#planes-container");
  planContainer.replaceChildren(
    ...plans.map((plan) => renderPlanCard(plan, state)),
  );
  updatePlanPrices(state, plans);
  updatePlanSelection(state);
  updateBoundValues(state);
}

export function renderState(state, plans) {
  updatePlanPrices(state, plans);
  updatePlanSelection(state);
  updateBoundValues(state);
}
