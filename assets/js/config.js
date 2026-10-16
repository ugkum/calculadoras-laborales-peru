export const CONFIG = {
  siteName: "Laboral Claro Perú",
  siteUrl: "https://calculadoras-laborales-peru.pages.dev",
  updatedAt: "2026-10-16",
  brand: "Ugkum Innova",
  whatsappNumber: "",
  contactEmail: "",
  values: {
    familyAllowanceRate: 0.10,
    ctsGratificationFraction: 1 / 6,
    ctsDaysPerMonth: 30,
    ctsMonthsPerYear: 12,
    gratificationMonthsPerSemester: 6,
    gratificationRates: {
      essalud: 0.09,
      eps: 0.0675
    },
    vacationDaysPerYear: 30,
    vacationMonthsPerYear: 12,
    vacationMinimumServiceMonths: 1,
    vacationGraceYears: 1,
    rmvByDate: [
      { effective: "2025-01-01", amount: 1130, source: "D.S. 006-2024-TR" },
      { effective: "2026-10-01", amount: 1230, source: "D.S. 015-2026-TR" }
    ],
    uitByYear: {
      2026: { amount: 5500, source: "D.S. 301-2025-EF" },
      2025: { amount: 5350, source: "D.S. 260-2024-EF" }
    }
  },
  sources: {
    mtpeBenefits: "https://www.gob.pe/72288-calcular-la-liquidacion-de-beneficios-sociales-para-trabajadores-del-sector-privado",
    ctsLaw: "https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00650.pdf",
    gratificationLaw: "https://www.leyes.congreso.gob.pe/Documentos/Leyes/27735.pdf",
    gratificationBonusLaw: "https://www.leyes.congreso.gob.pe/Documentos/Leyes/30334.pdf",
    vacationLaw: "https://www.leyes.congreso.gob.pe/Documentos/DecretosLegislativos/00713.pdf",
    rmvCurrent: "https://busquedas.elperuano.pe/dispositivo/EX/2559163-1",
    rmvPrevious: "https://www.gob.pe/institucion/mtpe/normas-legales",
    uit: "https://www.sunat.gob.pe/indicestasas/uit.html"
  }
};