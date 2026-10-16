const parseDate = (value) => {
  if (value instanceof Date) return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
};

const addDays = (date, amount) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() + amount));
const toISODate = (date) => date.toISOString().slice(0, 10);
const date360 = (date) => date.getUTCFullYear() * 360 + (date.getUTCMonth() + 1) * 30 + Math.min(date.getUTCDate(), 30);
const addYearsClamped = (date, years) => {
  const year = date.getUTCFullYear() + years;
  const month = date.getUTCMonth();
  const day = Math.min(date.getUTCDate(), new Date(Date.UTC(year, month + 1, 0)).getUTCDate());
  return new Date(Date.UTC(year, month, day));
};
const moneyInput = (value, field) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(`${field} debe ser un monto igual o mayor que cero.`);
  return parsed;
};

export function getPeriodRange(kind, depositYear, cycle) {
  const year = Number(depositYear);
  if (!Number.isInteger(year) || year < 1900 || year > 2200) throw new RangeError("El año elegido no es válido.");
  if (kind === "cts") {
    if (cycle === "mayo") return { start: `${year - 1}-11-01`, end: `${year}-04-30` };
    if (cycle === "noviembre") return { start: `${year}-05-01`, end: `${year}-10-31` };
  }
  if (kind === "gratification") {
    if (cycle === "julio") return { start: `${year}-01-01`, end: `${year}-06-30`, due: `${year}-07-15` };
    if (cycle === "diciembre") return { start: `${year}-07-01`, end: `${year}-12-31`, due: `${year}-12-15` };
  }
  throw new RangeError("El periodo elegido no es válido.");
}

export function getRmv(referenceDate, config) {
  const date = parseDate(referenceDate);
  if (!date) throw new RangeError("La fecha de referencia no es válida.");
  const eligible = config.values.rmvByDate
    .filter((item) => item.effective <= toISODate(date))
    .sort((left, right) => right.effective.localeCompare(left.effective));
  if (eligible.length === 0) throw new RangeError("No hay una RMV configurada para la fecha elegida.");
  return eligible[0];
}

export function calculateCts(input, config) {
  const salary = moneyInput(input.salary, "El sueldo");
  const otherMonthly = moneyInput(input.otherMonthly || 0, "Otros conceptos mensuales");
  const lastGratification = moneyInput(input.lastGratification || 0, "La última gratificación");
  const hireDate = parseDate(input.hireDate);
  const periodStart = parseDate(input.periodStart);
  const periodEnd = parseDate(input.periodEnd);
  if (!hireDate || !periodStart || !periodEnd || periodEnd < periodStart) throw new RangeError("Revisa las fechas ingresadas.");

  const rmv = getRmv(input.periodEnd, config);
  const familyAllowance = input.familyAllowance ? rmv.amount * config.values.familyAllowanceRate : 0;
  const gratificationSixth = lastGratification * config.values.ctsGratificationFraction;
  const computableRemuneration = salary + otherMonthly + familyAllowance + gratificationSixth;
  const serviceStart = hireDate > periodStart ? hireDate : periodStart;
  const serviceEndExclusive = addDays(periodEnd, 1);
  const serviceDays360 = serviceStart > periodEnd ? 0 : Math.max(0, date360(serviceEndExclusive) - date360(serviceStart));
  const months = Math.floor(serviceDays360 / config.values.ctsDaysPerMonth);
  const days = serviceDays360 % config.values.ctsDaysPerMonth;
  const eligible = input.eligible !== false;
  const amount = eligible && months >= 1
    ? computableRemuneration * (months / config.values.ctsMonthsPerYear + days / (config.values.ctsMonthsPerYear * config.values.ctsDaysPerMonth))
    : 0;

  return {
    amount,
    eligible,
    months,
    days,
    serviceDays360,
    salary,
    otherMonthly,
    familyAllowance,
    rmv: rmv.amount,
    rmvSource: rmv.source,
    gratificationSixth,
    computableRemuneration
  };
}

export function calculateGratification(input, config) {
  const salary = moneyInput(input.salary, "El sueldo");
  const otherMonthly = moneyInput(input.otherMonthly || 0, "Otros conceptos mensuales");
  const hireDate = parseDate(input.hireDate);
  if (!hireDate) throw new RangeError("La fecha de ingreso no es válida.");
  if (input.cycle !== "julio" && input.cycle !== "diciembre") throw new RangeError("El periodo elegido no es válido.");

  const year = Number(input.year);
  const period = getPeriodRange("gratification", year, input.cycle);
  const referenceDate = period.due;
  const rmv = getRmv(referenceDate, config);
  const familyAllowance = input.familyAllowance ? rmv.amount * config.values.familyAllowanceRate : 0;
  const computableRemuneration = salary + otherMonthly + familyAllowance;
  const startMonth = input.cycle === "julio" ? 0 : 6;
  const endMonth = startMonth + 6;
  let months = 0;
  const includedMonths = [];
  for (let month = startMonth; month < endMonth; month += 1) {
    const monthStart = new Date(Date.UTC(year, month, 1));
    if (hireDate <= monthStart) {
      months += 1;
      includedMonths.push(month + 1);
    }
  }
  const amount = computableRemuneration * months / config.values.gratificationMonthsPerSemester;
  const rate = config.values.gratificationRates[input.healthPlan];
  if (!Number.isFinite(rate)) throw new RangeError("Elige EsSalud o EPS.");
  const extraordinaryBonus = amount * rate;

  return {
    amount,
    extraordinaryBonus,
    total: amount + extraordinaryBonus,
    months,
    includedMonths,
    salary,
    otherMonthly,
    familyAllowance,
    rmv: rmv.amount,
    rmvSource: rmv.source,
    computableRemuneration,
    healthPlan: input.healthPlan,
    bonusRate: rate,
    period
  };
}

export function calculateVacation(input, config) {
  const salary = moneyInput(input.salary, "El sueldo");
  const otherMonthly = moneyInput(input.otherMonthly || 0, "Otros conceptos mensuales");
  const mode = input.mode;
  let referenceDate;
  let months = 0;
  let days = 0;
  let serviceDays360 = 0;
  let vacationDays = 0;
  let entitlementDate = null;
  let deadline = null;
  let indemnityDue = false;
  let vacationPayPending = false;

  if (mode === "gozadas") {
    referenceDate = parseDate(input.vacationStartDate);
    vacationDays = Number(input.vacationDays);
    if (!referenceDate) throw new RangeError("La fecha de inicio del descanso no es válida.");
    if (!Number.isFinite(vacationDays) || vacationDays <= 0 || vacationDays > config.values.vacationDaysPerYear) {
      throw new RangeError(`Ingresa entre 1 y ${config.values.vacationDaysPerYear} días de descanso.`);
    }
  } else if (mode === "truncas") {
    const hireDate = parseDate(input.hireDate);
    const cessationDate = parseDate(input.cessationDate);
    if (!hireDate || !cessationDate || cessationDate < hireDate) throw new RangeError("Revisa las fechas de ingreso y cese.");
    referenceDate = cessationDate;
    let completedYears = cessationDate.getUTCFullYear() - hireDate.getUTCFullYear();
    if (addYearsClamped(hireDate, completedYears) > cessationDate) completedYears -= 1;
    const lastAnniversary = addYearsClamped(hireDate, completedYears);
    serviceDays360 = Math.max(0, date360(addDays(cessationDate, 1)) - date360(lastAnniversary));
    months = Math.floor(serviceDays360 / config.values.ctsDaysPerMonth);
    days = serviceDays360 % config.values.ctsDaysPerMonth;
  } else if (mode === "no-gozadas") {
    entitlementDate = parseDate(input.entitlementDate);
    referenceDate = parseDate(input.asOfDate);
    if (!entitlementDate || !referenceDate || referenceDate < entitlementDate) {
      throw new RangeError("La fecha de referencia debe ser igual o posterior al inicio del periodo vacacional.");
    }
    deadline = addYearsClamped(entitlementDate, config.values.vacationGraceYears);
    indemnityDue = referenceDate >= deadline;
    vacationPayPending = input.vacationPayPending !== false;
  } else {
    throw new RangeError("Elige una modalidad de vacaciones.");
  }

  const rmv = input.familyAllowance ? getRmv(referenceDate, config) : { amount: 0, source: null };
  const familyAllowance = input.familyAllowance ? rmv.amount * config.values.familyAllowanceRate : 0;
  const computableRemuneration = salary + otherMonthly + familyAllowance;
  let vacationPay = 0;
  let indemnity = 0;
  let amount = 0;

  if (mode === "gozadas") {
    vacationPay = computableRemuneration * vacationDays / config.values.vacationDaysPerYear;
    amount = vacationPay;
  } else if (mode === "truncas") {
    if (months >= config.values.vacationMinimumServiceMonths) {
      vacationPay = computableRemuneration * (
        months / config.values.vacationMonthsPerYear +
        days / (config.values.vacationMonthsPerYear * config.values.ctsDaysPerMonth)
      );
    }
    amount = vacationPay;
  } else {
    vacationPay = vacationPayPending ? computableRemuneration : 0;
    indemnity = indemnityDue ? computableRemuneration : 0;
    amount = vacationPay + indemnity;
  }

  return {
    amount,
    mode,
    salary,
    otherMonthly,
    familyAllowance,
    rmv: rmv.amount,
    rmvSource: rmv.source,
    computableRemuneration,
    vacationDays,
    months,
    days,
    serviceDays360,
    vacationPay,
    vacationPayPending,
    indemnity,
    indemnityDue,
    entitlementDate: entitlementDate ? toISODate(entitlementDate) : null,
    deadline: deadline ? toISODate(deadline) : null,
    referenceDate: toISODate(referenceDate)
  };
}