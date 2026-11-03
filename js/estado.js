function createInitialSolicitud() {
  return {
    step: 0,
    device: {
      brand: "Samsung",
      model: "Galaxy A55",
      value: "600000",
      age: "Menos de 1 año",
      get summary() {
        return `${this.brand} ${this.model}`;
      },
    },
    plan: {
      id: "plus",
      name: "Plus",
      monthlyPrice: 0,
      annualRate: 0,
    },
    customer: {
      firstName: "Juan",
      lastName: "Pérez",
      document: "30123456",
      birthDate: "1990-01-01",
      email: "juan.perez@email.com",
      phone: "11 5555-1234",
      get fullName() {
        return `${this.firstName} ${this.lastName}`;
      },
    },
    payment: {
      method: "credito",
      cardNumber: "4111 1111 1111 1111",
      expiration: "12/28",
      cvv: "123",
      cardholder: "Juan Pérez",
      lastFour: "",
      status: "idle",
    },
    termsAccepted: true,
    policy: {
      number: "",
      startDate: "",
    },
    copy: {
      homeTitle: "Protegé lo que más usás en menos de 3 minutos",
      homeDescription:
        "Elegí qué querés asegurar. Cotizá al instante y contratá 100% online.",
      successMessage: "Tu celular ya está protegido",
      errorTitle: "No pudimos procesar el pago",
      errorMessage:
        "El pago fue rechazado. Podés reintentar o cambiar el medio de pago.",
    },
  };
}

export const solicitud = createInitialSolicitud();

export function resetSolicitud() {
  Object.assign(solicitud, createInitialSolicitud());
  return solicitud;
}
