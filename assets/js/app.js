import { CONFIG } from "./config.js";
import { calculateCts, calculateGratification, calculateVacation, getPeriodRange, getRmv } from "./calculations.js";

const money = (amount) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", minimumFractionDigits: 2 }).format(amount);
const percentage = (rate) => `${new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(rate * 100)}%`;
const dateLong = (isoDate) => new Intl.DateTimeFormat("es-PE", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`));
const dateShort = (isoDate) => new Intl.DateTimeFormat("es-PE", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${isoDate}T00:00:00Z`)).replace(" de ", " ");

function updateSharedContent() {
  document.querySelectorAll("[data-updated-at]").forEach((element) => {
    element.textContent = dateShort(CONFIG.updatedAt);
  });
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });
  const rmvHighlight = document.querySelector("#rmv-highlight");
  if (rmvHighlight) {
    const today = new Date().toISOString().slice(0, 10);
    rmvHighlight.textContent = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN", maximumFractionDigits: 0 }).format(getRmv(today, CONFIG).amount);
  }

  const familyRate = percentage(CONFIG.values.familyAllowanceRate);
  document.querySelectorAll("[data-family-rate]").forEach((element) => {
    element.textContent = familyRate;
  });
  document.querySelectorAll("[data-rmv-at]").forEach((element) => {
    element.textContent = money(getRmv(element.dataset.rmvAt, CONFIG).amount);
  });
  document.querySelectorAll("[data-gratification-rate]").forEach((element) => {
    element.textContent = percentage(CONFIG.values.gratificationRates[element.dataset.gratificationRate]);
  });
  document.querySelectorAll("[data-health-rate]").forEach((element) => {
    const plan = element.dataset.healthRate;
    const label = plan === "eps" ? "EPS" : "EsSalud";
    element.textContent = `${label} (${percentage(CONFIG.values.gratificationRates[plan])})`;
  });
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    script.textContent = script.textContent
      .replaceAll("9%", percentage(CONFIG.values.gratificationRates.essalud))
      .replaceAll("6.75%", percentage(CONFIG.values.gratificationRates.eps));
  });

  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    const message = link.dataset.whatsappMessage || decodeURIComponent(new URL(link.href).searchParams.get("text") || "Hola, quiero orientación laboral.");
    const number = CONFIG.whatsappNumber.replace(/\D/g, "");
    link.href = number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : `https://wa.me/?text=${encodeURIComponent(message)}`;
  });
}

function updatePeriodDisplay(form, kind) {
  const cycle = form.elements.cycle.value;
  const year = Number(form.elements.year.value);
  const range = getPeriodRange(kind, year, cycle);
  form.elements.periodStart.value = range.start;
  form.elements.periodEnd.value = range.end;
  const display = document.querySelector("#period-display");
  display.textContent = `${dateLong(range.start)} al ${dateLong(range.end)}`;
  if (kind === "gratification") display.textContent += ` · pago hasta el ${dateLong(range.due)}`;
}

function appendBreakdown(container, rows) {
  container.replaceChildren();
  rows.forEach(([label, value, final = false]) => {
    const row = document.createElement("div");
    row.className = `breakdown-row${final ? " breakdown-row-final" : ""}`;
    const title = document.createElement("span");
    title.textContent = label;
    const amount = document.createElement("strong");
    amount.textContent = value;
    row.append(title, amount);
    container.append(row);
  });
}

function showError(form, message) {
  const error = document.querySelector(`#${form.id.replace("-form", "-error")}`);
  error.textContent = message;
  error.hidden = false;
}

function showCtsResult(form) {
  const result = calculateCts({
    salary: form.elements.salary.value,
    otherMonthly: form.elements.otherMonthly.value,
    lastGratification: form.elements.lastGratification.value,
    familyAllowance: form.elements.familyAllowance.checked,
    eligible: form.elements.eligible.checked,
    hireDate: form.elements.hireDate.value,
    periodStart: form.elements.periodStart.value,
    periodEnd: form.elements.periodEnd.value
  }, CONFIG);
  const panel = document.querySelector("#cts-result");
  panel.querySelector("[data-result-total]").textContent = money(result.amount);
  panel.querySelector("[data-result-subtitle]").textContent = `${result.months} meses y ${result.days} días computables`;
  appendBreakdown(panel.querySelector("[data-result-breakdown]"), [
    ["Sueldo mensual", money(result.salary)],
    ["Asignación familiar", money(result.familyAllowance)],
    ["Otros conceptos mensuales", money(result.otherMonthly)],
    ["1/6 de la última gratificación", money(result.gratificationSixth)],
    ["Remuneración computable", money(result.computableRemuneration)],
    ["Tiempo computable", `${result.months} meses + ${result.days} días`],
    ["CTS estimada", money(result.amount), true]
  ]);
  const note = result.months < 1
    ? "El periodo ingresado no alcanza un mes computable para esta estimación. Confirma tu régimen y fechas con un especialista."
    : !result.eligible
      ? "Marcaste una jornada promedio menor de cuatro horas. La calculadora no ha estimado un depósito de CTS."
      : `La asignación familiar se calculó con una RMV de ${money(result.rmv)} al cierre del periodo (${result.rmvSource}). No se descuentan depósitos ya realizados.`;
  panel.querySelector("[data-result-note]").textContent = note;
  panel.hidden = false;
  panel.dataset.ready = "true";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showGratificationResult(form) {
  const result = calculateGratification({
    salary: form.elements.salary.value,
    otherMonthly: form.elements.otherMonthly.value,
    familyAllowance: form.elements.familyAllowance.checked,
    hireDate: form.elements.hireDate.value,
    year: form.elements.year.value,
    cycle: form.elements.cycle.value,
    healthPlan: form.elements.healthPlan.value
  }, CONFIG);
  const panel = document.querySelector("#gratification-result");
  const planName = result.healthPlan === "eps" ? "EPS" : "EsSalud";
  panel.querySelector("[data-result-total]").textContent = money(result.total);
  panel.querySelector("[data-result-subtitle]").textContent = `${result.months} meses completos · bonificación calculada para ${planName}`;
  appendBreakdown(panel.querySelector("[data-result-breakdown]"), [
    ["Sueldo mensual", money(result.salary)],
    ["Asignación familiar", money(result.familyAllowance)],
    ["Otros conceptos mensuales", money(result.otherMonthly)],
    ["Remuneración computable", money(result.computableRemuneration)],
    ["Meses calendario completos", `${result.months} de 6`],
    ["Gratificación estimada", money(result.amount)],
    [`Bonificación extraordinaria (${(result.bonusRate * 100).toFixed(2)}%)`, money(result.extraordinaryBonus)],
    ["Total estimado", money(result.total), true]
  ]);
  const note = result.months === 0
    ? "No se identificaron meses calendario completos en el semestre elegido. Revisa tu fecha de ingreso y consulta si hubo cese o suspensión."
    : `La bonificación extraordinaria se estimó al ${(result.bonusRate * 100).toFixed(2)}% sobre la gratificación. La RMV de referencia fue ${money(result.rmv)} (${result.rmvSource}). No se han aplicado descuentos ni pagos previos.`;
  panel.querySelector("[data-result-note]").textContent = note;
  panel.hidden = false;
  panel.dataset.ready = "true";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showVacationResult(form) {
  const mode = form.elements.mode.value;
  const result = calculateVacation({
    mode,
    salary: form.elements.salary.value,
    otherMonthly: form.elements.otherMonthly.value,
    familyAllowance: form.elements.familyAllowance.checked,
    vacationDays: form.elements.vacationDays.value,
    vacationStartDate: form.elements.vacationStartDate.value,
    hireDate: form.elements.hireDate.value,
    cessationDate: form.elements.cessationDate.value,
    entitlementDate: form.elements.entitlementDate.value,
    asOfDate: form.elements.asOfDate.value,
    vacationPayPending: form.elements.vacationPayPending.checked
  }, CONFIG);
  const panel = document.querySelector("#vacation-result");
  panel.querySelector("[data-result-total]").textContent = money(result.amount);

  let subtitle;
  let rows;
  let note;
  if (mode === "gozadas") {
    subtitle = `${result.vacationDays} días de descanso remunerado`;
    rows = [
      ["Sueldo mensual", money(result.salary)],
      ["Asignación familiar", money(result.familyAllowance)],
      ["Otros conceptos mensuales", money(result.otherMonthly)],
      ["Remuneración computable", money(result.computableRemuneration)],
      ["Remuneración por día", money(result.computableRemuneration / CONFIG.values.vacationDaysPerYear)],
      ["Días de descanso", `${result.vacationDays} días`],
      ["Remuneración vacacional", money(result.vacationPay), true]
    ];
    note = "Es una estimación bruta de la remuneración por el descanso. No es un bono adicional al sueldo anual.";
  } else if (mode === "truncas") {
    subtitle = `${result.months} meses y ${result.days} días desde el último aniversario`;
    rows = [
      ["Sueldo mensual", money(result.salary)],
      ["Asignación familiar", money(result.familyAllowance)],
      ["Otros conceptos mensuales", money(result.otherMonthly)],
      ["Remuneración computable", money(result.computableRemuneration)],
      ["Meses computables", `${result.months} meses`],
      ["Días computables", `${result.days} días`],
      ["Vacaciones truncas estimadas", money(result.vacationPay), true]
    ];
    note = result.months < CONFIG.values.vacationMinimumServiceMonths
      ? "Esta estimación requiere al menos un mes de servicios. Revisa tus fechas y el régimen aplicable."
      : "Se asume que los periodos completos anteriores ya fueron gozados o pagados. No incluye descuentos ni otros conceptos de liquidación.";
  } else {
    subtitle = result.indemnityDue ? "El plazo para disfrutar este periodo ya venció" : "El plazo para disfrutar este periodo aún no vence";
    rows = [
      ["Remuneración computable", money(result.computableRemuneration)],
      ["Fecha del derecho vacacional", dateLong(result.entitlementDate)],
      ["Fecha límite estimada de goce", dateLong(result.deadline)],
      ["Remuneración vacacional pendiente", money(result.vacationPay)],
      ["Indemnización vacacional", money(result.indemnity)],
      ["Total estimado", money(result.amount), true]
    ];
    note = "El sueldo ordinario por el trabajo realizado no se suma: normalmente ya fue pagado en planilla. Si hay varios periodos pendientes o pagos discutidos, revisa cada uno por separado.";
  }

  panel.querySelector("[data-result-subtitle]").textContent = subtitle;
  appendBreakdown(panel.querySelector("[data-result-breakdown]"), rows);
  panel.querySelector("[data-result-note]").textContent = note;
  panel.hidden = false;
  panel.dataset.ready = "true";
  panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function setupVacationCalculator(form) {
  const today = new Date().toISOString().slice(0, 10);
  form.elements.vacationStartDate.value = today;
  form.elements.asOfDate.value = today;
  const guidance = {
    gozadas: "Estimación bruta para los días de descanso indicados; no es un pago adicional al sueldo anual.",
    truncas: "Calcula desde el último aniversario hasta el cese; asume que los periodos completos anteriores ya fueron usados o pagados.",
    "no-gozadas": "Separa la remuneración vacacional pendiente de la indemnización que puede corresponder al vencer el plazo legal."
  };

  const updateMode = () => {
    const mode = form.elements.mode.value;
    form.querySelectorAll("[data-mode-fields]").forEach((fieldset) => {
      const active = fieldset.dataset.modeFields === mode;
      fieldset.hidden = !active;
      fieldset.disabled = !active;
    });
    document.querySelector("#vacation-guidance").textContent = guidance[mode];
  };
  form.querySelectorAll('input[name="mode"]').forEach((radio) => radio.addEventListener("change", updateMode));
  updateMode();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.querySelector("#vacation-error");
    error.hidden = true;
    if (!form.reportValidity()) return;
    try {
      showVacationResult(form);
    } catch (calculationError) {
      showError(form, calculationError.message);
    }
  });
}

function setupCalculator() {
  const calculator = document.body.dataset.calculator;
  if (calculator === "vacation") {
    const vacationForm = document.querySelector("#vacation-form");
    if (vacationForm) setupVacationCalculator(vacationForm);
    return;
  }
  const form = document.querySelector("#cts-form, #gratification-form");
  if (!form) return;
  const kind = calculator === "cts" ? "cts" : "gratification";
  const now = new Date();
  const currentMonth = now.getMonth();
  const yearInput = form.elements.year;
  yearInput.value = String(now.getFullYear());

  if (kind === "cts") {
    if (currentMonth >= 10) {
      form.elements.cycle.value = "mayo";
      yearInput.value = String(now.getFullYear() + 1);
    } else if (currentMonth < 4) {
      form.elements.cycle.value = "mayo";
    } else {
      form.elements.cycle.value = "noviembre";
    }
  } else {
    form.elements.cycle.value = currentMonth < 6 ? "julio" : "diciembre";
  }

  const refresh = () => {
    try {
      updatePeriodDisplay(form, kind);
      if (!form.elements.hireDate.value) form.elements.hireDate.value = form.elements.periodStart.value;
    } catch (error) {
      showError(form, error.message);
    }
  };
  form.elements.cycle.addEventListener("change", refresh);
  yearInput.addEventListener("change", refresh);
  refresh();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const error = document.querySelector(`#${form.id.replace("-form", "-error")}`);
    error.hidden = true;
    if (!form.reportValidity()) return;
    try {
      if (kind === "cts") showCtsResult(form);
      else showGratificationResult(form);
    } catch (calculationError) {
      showError(form, calculationError.message);
    }
  });
}

function setupSearch() {
  const search = document.querySelector("#calculator-search");
  if (!search) return;
  const cards = [...document.querySelectorAll("#calculator-list [data-search]")];
  const empty = document.querySelector("#search-empty");
  search.addEventListener("input", () => {
    const query = search.value.trim().toLocaleLowerCase("es-PE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let visible = 0;
    cards.forEach((card) => {
      const text = `${card.dataset.search} ${card.textContent}`.toLocaleLowerCase("es-PE").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      card.hidden = !text.includes(query);
      if (!card.hidden) visible += 1;
    });
    empty.hidden = visible > 0;
  });
}

function setupResultActions() {
  document.querySelectorAll("[data-print-result]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = button.closest(".result-panel");
      if (panel?.dataset.ready === "true") window.print();
    });
  });
}

updateSharedContent();
setupCalculator();
setupSearch();
setupResultActions();