const moneyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number): string {
  return moneyFormatter.format(value);
}

export function createId(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
