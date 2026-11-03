import { calculatePlanQuote, findPlan } from "./cotizador.js";
import { resetSolicitud, solicitud } from "./estado.js";
import { renderPage, renderState } from "./render.js";
import {
  fieldValidators,
  parseEquipmentValue,
  validateAge,
  validateEquipmentValue,
} from "./validaciones.js";
import {
  generatePolicyNumber,
  getCardLastFour,
  paymentMethods,
  simulatePayment,
} from "./pago.js";

const forms = [...document.querySelectorAll("[data-validation-step]")];
const formByStep = new Map(
  forms.map((form) => [Number(form.dataset.validationStep), form]),
);
let plans = [];
let plansReady = false;
let paymentProcessing = false;

function setValue(path, value) {
  const keys = path.split(".");
  const property = keys.pop();
  const target = keys.reduce((current, key) => current[key], solicitud);
  target[property] = value;
}

function getControlValue(field) {
  if (field.dataset.validationField === "age") {
    return field.querySelector('input[type="radio"]:checked')?.value ?? "";
  }
  const control = field.querySelector("input, select");
  return control?.type === "checkbox" ? control.checked : control?.value ?? "";
}

function controlsFor(field) {
  if (field.dataset.validationField === "age") {
    return [...field.querySelectorAll('input[type="radio"]')];
  }
  const control = field.querySelector("input, select");
  return control ? [control] : [];
}

function showFieldError(field, message) {
  const controls = controlsFor(field);
  const errorId = field.querySelector(".field-error")?.id;
  const errorElement = errorId ? document.getElementById(errorId) : null;

  for (const control of controls) {
    if (message) {
      control.setAttribute("aria-invalid", "true");
      if (errorId) {
        control.setAttribute("aria-describedby", errorId);
      }
    } else {
      control.removeAttribute("aria-invalid");
    }
  }

  if (errorElement) {
    errorElement.textContent = message ?? "";
    errorElement.hidden = !message;
  }
}

function validateField(field, revealError) {
  const validator = fieldValidators[field.dataset.validationField];
  if (!validator) {
    throw new Error(
      `No hay una regla de validación para "${field.dataset.validationField}".`,
    );
  }
  const message = validator(getControlValue(field));
  if (revealError) {
    showFieldError(field, message);
  }
  return message;
}

function formErrors(form, revealErrors = false) {
  const invalidFields = [];
  for (const field of form.querySelectorAll("[data-validation-field]")) {
    if (validateField(field, revealErrors)) {
      invalidFields.push(field);
    }
  }

  if (form.dataset.validationStep === "2") {
    const error = document.getElementById("error-plan");
    const selected = form.querySelector('input[name="plan"]:checked');
    const message = selected ? null : "Elegí un plan para continuar";
    if (error && revealErrors) {
      error.textContent = message ?? "";
      error.hidden = !message;
    }
    if (message) {
      invalidFields.push(error ?? form);
    }
  }

  return invalidFields;
}

function setFeedback(form, valid) {
  const feedback = form.querySelector("[data-step-feedback]");
  if (!feedback) {
    return;
  }
  feedback.textContent = valid
    ? "Todo listo para continuar."
    : "Completá los campos indicados para continuar.";
}

function updateAdvanceButtons() {
  for (const form of forms) {
    const step = Number(form.dataset.validationStep);
    const valid =
      (step !== 2 || plansReady) &&
      formErrors(form).length === 0;
    for (const button of document.querySelectorAll(
      `[data-advance][form="${form.id}"], #${form.id} [data-advance]`,
    )) {
      const paymentLocked =
        step === 4 &&
        (paymentProcessing || solicitud.payment.status === "approved");
      button.disabled = !valid || paymentLocked;
    }
    setFeedback(form, valid);
  }
}

function paymentButtons() {
  const form = formByStep.get(4);
  return [
    ...document.querySelectorAll(
      `[data-advance][form="${form.id}"], #${form.id} [data-advance]`,
    ),
  ];
}

function setPaymentProcessing(isProcessing) {
  paymentProcessing = isProcessing;
  const form = formByStep.get(4);
  const feedback = form.querySelector("[data-step-feedback]");

  for (const button of paymentButtons()) {
    button.textContent = isProcessing
      ? "Procesando…"
      : button.dataset.readyLabel;
    button.setAttribute("aria-busy", String(isProcessing));
    if (isProcessing) {
      button.disabled = true;
    }
  }

  if (isProcessing) {
    feedback.textContent = "Procesando…";
  } else {
    updateAdvanceButtons();
  }
}

function focusFirstInvalid(field) {
  if (field instanceof HTMLElement && field.matches("[data-validation-field]")) {
    controlsFor(field)[0]?.focus();
    return;
  }
  if (field instanceof HTMLElement && field.matches("input")) {
    field.focus();
  }
}

function sectionForStep(step) {
  return document.querySelector(`section[data-step="${step}"]`);
}

function currentStepFromHash() {
  if (!location.hash) {
    return 0;
  }
  const target = document.querySelector(location.hash);
  return target?.closest("section[data-step]")
    ? Number(target.closest("section[data-step]").dataset.step)
    : 0;
}

function updateStepState() {
  const requestedStep = currentStepFromHash();
  if (requestedStep === 5 || requestedStep === 6) {
    const resultAllowed =
      (requestedStep === 5 && solicitud.payment.status === "approved") ||
      (requestedStep === 6 && solicitud.payment.status === "rejected");
    if (!resultAllowed) {
      navigateToStep(Math.min(solicitud.step, 4));
      return;
    }
    solicitud.step = requestedStep;
    document.documentElement.dataset.currentStep = String(requestedStep);
    for (const section of document.querySelectorAll("main > .screen")) {
      section.classList.toggle(
        "is-active",
        Number(section.dataset.step) === requestedStep,
      );
    }
    return;
  }
  if (
    requestedStep > solicitud.step &&
    !validateStepsBefore(requestedStep)
  ) {
    return;
  }

  solicitud.step = requestedStep;
  document.documentElement.dataset.currentStep = String(requestedStep);
  for (const section of document.querySelectorAll("main > .screen")) {
    section.classList.toggle(
      "is-active",
      Number(section.dataset.step) === requestedStep,
    );
  }
}

function navigateToStep(step) {
  const section = sectionForStep(step);
  if (!section) {
    throw new Error(`No existe la pantalla del paso ${step}.`);
  }
  if (location.hash === `#${section.id}`) {
    section.scrollIntoView({ behavior: "smooth" });
  } else {
    location.hash = section.id;
  }
}

function validateStepsBefore(targetStep) {
  for (let step = 1; step < targetStep; step += 1) {
    const form = formByStep.get(step);
    if (!form) {
      continue;
    }
    const invalidFields = formErrors(form, true);
    if (invalidFields.length > 0) {
      setFeedback(form, false);
      navigateToStep(step);
      focusFirstInvalid(invalidFields[0]);
      return false;
    }
  }
  return true;
}

function handleFieldEdit(control) {
  const path = control.dataset.value;
  if (path) {
    const value = control.type === "checkbox" ? control.checked : control.value;
    setValue(path, value);
  }

  const field = control.closest("[data-validation-field]");
  if (field) {
    showFieldError(field, null);
  }

  const ageGroup = control.closest("[data-choice-group]");
  if (ageGroup) {
    setValue(ageGroup.dataset.choiceGroup, control.value);
  }

  const selectedPlan = control.matches('input[name="plan"]:checked');
  if (selectedPlan) {
    const plan = findPlan(plans, control.value);
    solicitud.plan.id = plan.id;
    solicitud.plan.name = plan.name;
    solicitud.plan.annualRate = plan.annualRate;
  }

  const paymentMethod = control.matches('input[name="medio-pago"]:checked');
  if (paymentMethod) {
    solicitud.payment.method = control.value;
  }

  if (
    control.closest("#pago-form") &&
    solicitud.payment.status === "rejected"
  ) {
    solicitud.payment.status = "idle";
    solicitud.payment.lastFour = "";
  }

  renderState(solicitud, plans);
  updateAdvanceButtons();
}

function updatePaymentResultDetails() {
  const plan = findPlan(plans, solicitud.plan.id);
  const method = paymentMethods.find(
    ({ id }) => id === solicitud.payment.method,
  );
  document.getElementById("policy-coverages").textContent =
    plan.coverages.join(" · ");
  document.getElementById("policy-payment-method").textContent = method.label;
  document.getElementById("rejected-payment-method").textContent = method.label;
}

function setPaymentFieldsDisabled(disabled) {
  formByStep
    .get(4)
    .querySelectorAll("input, select, textarea")
    .forEach((control) => {
      control.disabled = disabled;
    });
}

function resetApplication() {
  resetSolicitud();
  paymentProcessing = false;
  setPaymentFieldsDisabled(false);

  for (const field of document.querySelectorAll("[data-validation-field]")) {
    showFieldError(field, null);
  }
  const planError = document.getElementById("error-plan");
  planError.textContent = "";
  planError.hidden = true;

  renderPage({ ...solicitud, paymentMethods }, plans);
  if (plansReady) {
    updatePaymentResultDetails();
  }
  updateAdvanceButtons();
}

async function submitPayment() {
  if (
    paymentProcessing ||
    solicitud.payment.status === "approved"
  ) {
    return;
  }

  solicitud.payment.status = "processing";
  setPaymentProcessing(true);

  try {
    const { approved } = await simulatePayment(solicitud.payment.cardNumber);
    solicitud.payment.lastFour = getCardLastFour(
      solicitud.payment.cardNumber,
    );

    if (approved) {
      const now = new Date();
      solicitud.payment.status = "approved";
      solicitud.policy.number = generatePolicyNumber(now);
      solicitud.policy.startDate = new Intl.DateTimeFormat("es-AR").format(
        now,
      );
      setPaymentFieldsDisabled(true);
      renderState(solicitud, plans);
      updatePaymentResultDetails();
      setPaymentProcessing(false);
      navigateToStep(5);
      return;
    }

    solicitud.payment.status = "rejected";
    renderState(solicitud, plans);
    updatePaymentResultDetails();
    setPaymentProcessing(false);
    navigateToStep(6);
  } catch (error) {
    solicitud.payment.status = "idle";
    solicitud.payment.lastFour = "";
    setPaymentProcessing(false);
    formByStep.get(4).querySelector("[data-step-feedback]").textContent =
      "No se pudo completar el pago. Intentá nuevamente.";
    console.error("No se pudo completar el pago simulado.", error);
  }
}

function showPlansLoadError(error) {
  const message = `No se pudieron cargar los planes: ${error.message}`;
  const alert = document.getElementById("planes-error");
  alert.textContent = message;
  alert.hidden = false;

  const planForm = formByStep.get(2);
  planForm.querySelectorAll("input, button").forEach((control) => {
    control.disabled = true;
  });
  updateAdvanceButtons();
}

function isPlanList(value) {
  return (
    Array.isArray(value) &&
    value.length === 3 &&
    value.every(
      (plan) =>
        typeof plan.id === "string" &&
        typeof plan.name === "string" &&
        Number.isFinite(plan.annualRate) &&
        plan.annualRate > 0 &&
        Array.isArray(plan.coverages) &&
        plan.coverages.every((coverage) => typeof coverage === "string"),
    ) &&
    new Set(value.map(({ id }) => id)).size === 3 &&
    ["basico", "plus", "premium"].every((id) =>
      value.some((plan) => plan.id === id),
    )
  );
}

async function loadPlans() {
  const response = await fetch(new URL("../data/planes.json", import.meta.url));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  if (!isPlanList(data)) {
    throw new Error("el archivo no contiene planes válidos.");
  }
  return data;
}

async function initialize() {
  try {
    plans = await loadPlans();
    plansReady = true;
  } catch (error) {
    showPlansLoadError(error);
  }

  if (plansReady) {
    const selectedPlan = findPlan(plans, solicitud.plan.id);
    solicitud.plan.name = selectedPlan.name;
    solicitud.plan.annualRate = selectedPlan.annualRate;
    solicitud.plan.monthlyPrice =
      validateEquipmentValue(solicitud.device.value) === null &&
      validateAge(solicitud.device.age) === null
        ? calculatePlanQuote(
            parseEquipmentValue(solicitud.device.value),
            selectedPlan,
            solicitud.device.age,
          )
        : null;

    renderPage({ ...solicitud, paymentMethods }, plans);
    updatePaymentResultDetails();
  }
  updateAdvanceButtons();

  document.addEventListener("input", (event) => {
    if (event.target instanceof HTMLInputElement) {
      handleFieldEdit(event.target);
    }
  });
  document.addEventListener("change", (event) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement
    ) {
      handleFieldEdit(event.target);
    }
  });
  document.addEventListener(
    "focusout",
    (event) => {
      const field = event.target.closest?.("[data-validation-field]");
      if (field) {
        validateField(field, true);
        updateAdvanceButtons();
      }
    },
    true,
  );

  for (const form of forms) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const step = Number(form.dataset.validationStep);
      if (
        step === 4 &&
        (paymentProcessing || solicitud.payment.status === "approved")
      ) {
        return;
      }

      const invalidFields = formErrors(form, true);
      updateAdvanceButtons();
      if (invalidFields.length > 0) {
        focusFirstInvalid(invalidFields[0]);
        return;
      }

      if (step < 4) {
        navigateToStep(step + 1);
      } else {
        void submitPayment();
      }
    });
  }

  document.addEventListener("click", (event) => {
    const anchor = event.target.closest?.('a[href^="#"]');
    if (!anchor) {
      return;
    }
    const target = document.querySelector(anchor.getAttribute("href"));
    const targetSection = target?.closest("section[data-step]");
    if (!targetSection) {
      return;
    }
    const targetStep = Number(targetSection.dataset.step);
    if (targetStep === 0) {
      event.preventDefault();
      resetApplication();
      navigateToStep(0);
      return;
    }
    if (targetStep === 5 || targetStep === 6) {
      const resultAllowed =
        (targetStep === 5 && solicitud.payment.status === "approved") ||
        (targetStep === 6 && solicitud.payment.status === "rejected");
      if (!resultAllowed) {
        event.preventDefault();
      }
      return;
    }
    if (
      targetStep > solicitud.step &&
      !validateStepsBefore(targetStep)
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("hashchange", updateStepState);
  updateStepState();
}

initialize();
