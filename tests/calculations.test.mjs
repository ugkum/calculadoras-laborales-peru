import test from "node:test";
import assert from "node:assert/strict";
import { CONFIG } from "../assets/js/config.js";
import { calculateCts, calculateGratification, calculateVacation, getPeriodRange, getRmv } from "../assets/js/calculations.js";

test("CTS de seis meses incluye un sexto de la gratificación anterior", () => {
  const result = calculateCts({
    salary: 3000,
    lastGratification: 3000,
    hireDate: "2026-05-01",
    periodStart: "2026-05-01",
    periodEnd: "2026-10-31"
  }, CONFIG);

  assert.equal(result.months, 6);
  assert.equal(result.days, 0);
  assert.equal(result.computableRemuneration, 3500);
  assert.equal(result.amount, 1750);
});

test("CTS cuenta meses y días con el mes laboral de 30 días", () => {
  const result = calculateCts({
    salary: 3000,
    hireDate: "2026-08-17",
    periodStart: "2026-05-01",
    periodEnd: "2026-10-31"
  }, CONFIG);

  assert.equal(result.months, 2);
  assert.equal(result.days, 14);
  assert.equal(result.amount, 3000 * 74 / 360);
});

test("CTS usa la RMV vigente al cierre del periodo para asignación familiar", () => {
  const result = calculateCts({
    salary: 1500,
    familyAllowance: true,
    hireDate: "2026-05-01",
    periodStart: "2026-05-01",
    periodEnd: "2026-10-31"
  }, CONFIG);

  assert.equal(result.rmv, 1230);
  assert.equal(result.familyAllowance, 123);
});

test("gratificación completa de julio agrega 9 por ciento de EsSalud", () => {
  const result = calculateGratification({
    salary: 3000,
    hireDate: "2026-01-01",
    year: 2026,
    cycle: "julio",
    healthPlan: "essalud"
  }, CONFIG);

  assert.equal(result.months, 6);
  assert.equal(result.amount, 3000);
  assert.equal(result.extraordinaryBonus, 270);
  assert.equal(result.total, 3270);
});

test("gratificación de julio solo cuenta meses calendario completos", () => {
  const result = calculateGratification({
    salary: 3000,
    hireDate: "2026-02-15",
    year: 2026,
    cycle: "julio",
    healthPlan: "eps"
  }, CONFIG);

  assert.equal(result.months, 4);
  assert.equal(result.amount, 2000);
  assert.equal(result.extraordinaryBonus, 135);
  assert.equal(result.total, 2135);
});

test("periodos semestrales y valores oficiales efectivos", () => {
  assert.deepEqual(getPeriodRange("cts", 2026, "mayo"), { start: "2025-11-01", end: "2026-04-30" });
  assert.deepEqual(getPeriodRange("cts", 2026, "noviembre"), { start: "2026-05-01", end: "2026-10-31" });
  assert.equal(getRmv("2026-09-30", CONFIG).amount, 1130);
  assert.equal(getRmv("2026-10-01", CONFIG).amount, 1230);
  assert.equal(CONFIG.values.uitByYear[2026].amount, 5500);
});

test("vacaciones gozadas estima el pago proporcional a los días de descanso", () => {
  const result = calculateVacation({
    mode: "gozadas",
    salary: 3000,
    familyAllowance: true,
    vacationDays: 15,
    vacationStartDate: "2026-10-01"
  }, CONFIG);

  assert.equal(result.computableRemuneration, 3123);
  assert.equal(result.vacationPay, 1561.5);
  assert.equal(result.amount, 1561.5);
});

test("vacaciones sin asignación familiar no dependen de una RMV histórica", () => {
  const result = calculateVacation({
    mode: "gozadas",
    salary: 3000,
    vacationDays: 30,
    vacationStartDate: "2024-10-01"
  }, CONFIG);

  assert.equal(result.familyAllowance, 0);
  assert.equal(result.amount, 3000);
});

test("vacaciones truncas reconocen seis meses desde el último aniversario", () => {
  const result = calculateVacation({
    mode: "truncas",
    salary: 3000,
    hireDate: "2025-01-01",
    cessationDate: "2026-06-30"
  }, CONFIG);

  assert.equal(result.months, 6);
  assert.equal(result.days, 0);
  assert.equal(result.amount, 1500);
});

test("vacaciones truncas prorratean los días posteriores a meses completos", () => {
  const result = calculateVacation({
    mode: "truncas",
    salary: 3000,
    hireDate: "2026-05-17",
    cessationDate: "2026-10-31"
  }, CONFIG);

  assert.equal(result.months, 5);
  assert.equal(result.days, 14);
  assert.equal(result.amount, 3000 * (5 / 12 + 14 / 360));
});

test("vacaciones truncas no paga periodos menores de un mes", () => {
  const result = calculateVacation({
    mode: "truncas",
    salary: 3000,
    hireDate: "2026-05-01",
    cessationDate: "2026-05-20"
  }, CONFIG);

  assert.equal(result.months, 0);
  assert.equal(result.amount, 0);
});

test("vacación vencida separa remuneración pendiente e indemnización", () => {
  const result = calculateVacation({
    mode: "no-gozadas",
    salary: 3000,
    entitlementDate: "2025-01-01",
    asOfDate: "2026-01-02",
    vacationPayPending: true
  }, CONFIG);

  assert.equal(result.vacationPay, 3000);
  assert.equal(result.indemnity, 3000);
  assert.equal(result.amount, 6000);
  assert.equal(result.deadline, "2026-01-01");
});

test("vacación no vencida no genera indemnización vacacional", () => {
  const result = calculateVacation({
    mode: "no-gozadas",
    salary: 3000,
    entitlementDate: "2025-01-01",
    asOfDate: "2025-12-31",
    vacationPayPending: false
  }, CONFIG);

  assert.equal(result.vacationPay, 0);
  assert.equal(result.indemnity, 0);
  assert.equal(result.amount, 0);
});

test("vacación vencida pagada no vuelve a sumar la remuneración vacacional", () => {
  const result = calculateVacation({
    mode: "no-gozadas",
    salary: 3000,
    entitlementDate: "2025-01-01",
    asOfDate: "2026-01-02",
    vacationPayPending: false
  }, CONFIG);

  assert.equal(result.vacationPay, 0);
  assert.equal(result.indemnity, 3000);
  assert.equal(result.amount, 3000);
});