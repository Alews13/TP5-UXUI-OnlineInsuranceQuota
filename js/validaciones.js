function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

function lettersCount(value) {
  return [...text(value)].filter((character) => /\p{L}/u.test(character)).length;
}

function parseBirthDate(value) {
  const raw = text(value);
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  const localMatch = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : localMatch
      ? [Number(localMatch[3]), Number(localMatch[2]), Number(localMatch[1])]
      : null;

  if (!parts) {
    return null;
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
    ? date
    : null;
}

export function parseEquipmentValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : Number.NaN;
  }

  const raw = text(value).replace(/^\$\s*/, "");
  if (/^\d{1,3}(?:\.\d{3})+$/.test(raw)) {
    return Number(raw.replaceAll(".", ""));
  }
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }
  return Number.NaN;
}

export function validateBrand(value) {
  return text(value) ? null : "Elegí una marca";
}

export function validateModel(value) {
  const model = text(value);
  return model.length >= 2 && model.length <= 40
    ? null
    : "Ingresá el modelo del equipo";
}

export function validateEquipmentValue(value) {
  const amount = parseEquipmentValue(value);
  return amount >= 100_000 && amount <= 2_500_000
    ? null
    : "El valor debe estar entre $100.000 y $2.500.000";
}

export function validateAge(value) {
  return text(value) ? null : "Indicá la antigüedad";
}

export function validateFirstName(value) {
  return lettersCount(value) >= 2 ? null : "Ingresá tu nombre";
}

export function validateLastName(value) {
  return lettersCount(value) >= 2 ? null : "Ingresá tu apellido";
}

export function validateDocument(value) {
  return /^\d{7,8}$/.test(text(value))
    ? null
    : "El DNI debe tener 7 u 8 números";
}

export function validateBirthDate(value, today = new Date()) {
  const birthDate = parseBirthDate(value);
  if (!birthDate) {
    return "Tenés que ser mayor de edad";
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age >= 18 ? null : "Tenés que ser mayor de edad";
}

export function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value))
    ? null
    : "Ingresá un email válido";
}

export function validatePhone(value) {
  const phone =
    typeof value === "string" ? value.replace(/[\s-]/g, "") : "";
  return /^\d{10}$/.test(phone) && !phone.startsWith("0") && !phone.startsWith("15")
    ? null
    : "Ingresá un celular válido de 10 dígitos, sin 0 ni 15";
}

export function validateTerms(value) {
  return value === true ? null : "Tenés que aceptar los términos";
}

export function validateCardNumber(value) {
  const number = typeof value === "string" ? value.replace(/\s/g, "") : "";
  return /^\d{16}$/.test(number) ? null : "Número de tarjeta inválido";
}

export function validateExpiration(value, today = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(text(value));
  if (!match) {
    return "Vencimiento inválido";
  }

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  const isValidMonth = month >= 1 && month <= 12;
  const isFuture =
    year > today.getFullYear() ||
    (year === today.getFullYear() && month >= today.getMonth() + 1);
  return isValidMonth && isFuture ? null : "Vencimiento inválido";
}

export function validateCvv(value) {
  return /^\d{3}$/.test(text(value)) ? null : "CVV inválido";
}

export function validateCardholder(value) {
  return text(value) ? null : "Ingresá el nombre del titular";
}

export const fieldValidators = {
  brand: validateBrand,
  model: validateModel,
  value: validateEquipmentValue,
  age: validateAge,
  firstName: validateFirstName,
  lastName: validateLastName,
  document: validateDocument,
  birthDate: validateBirthDate,
  email: validateEmail,
  phone: validatePhone,
  termsAccepted: validateTerms,
  cardNumber: validateCardNumber,
  expiration: validateExpiration,
  cvv: validateCvv,
  cardholder: validateCardholder,
};

export function getFieldValue(form, name) {
  const field = form.elements.namedItem(name);
  if (!field) {
    throw new Error(`No se encontró el campo "${name}" en el formulario.`);
  }
  return field.value;
}
