export const paymentMethods = [
  { id: "credito", label: "Tarjeta de crédito" },
  { id: "debito", label: "Tarjeta de débito" },
];

const REJECTED_CARD_NUMBER = "4000000000000002";
const PAYMENT_RESPONSE_DELAY = 1500;
let policyCounter = 0;

export function simulatePayment(cardNumber) {
  const normalizedNumber = cardNumber.replace(/\s/g, "");
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ approved: normalizedNumber !== REJECTED_CARD_NUMBER });
    }, PAYMENT_RESPONSE_DELAY);
  });
}

export function getCardLastFour(cardNumber) {
  return cardNumber.replace(/\s/g, "").slice(-4);
}

export function generatePolicyNumber(date = new Date()) {
  policyCounter += 1;
  return `POL-${date.getFullYear()}-${String(policyCounter).padStart(6, "0")}`;
}
