import { format, parseISO } from "date-fns";

export function formatCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "MMK",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatCompactCurrency(value: number | string) {
  const amount = typeof value === "string" ? Number(value) : value;
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  if (Math.abs(safeAmount) >= 100000) {
    const lakhValue = safeAmount / 100000;
    const formatted = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: lakhValue >= 10 ? 0 : 1,
      maximumFractionDigits: lakhValue >= 10 ? 1 : 2
    }).format(lakhValue);

    return `MMK ${formatted} lakh`;
  }

  return formatCurrency(safeAmount);
}

export function formatDateValue(value: string | Date, pattern = "MMM d, yyyy") {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern);
}

export function formatDateInput(value: string | Date) {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "yyyy-MM-dd");
}

export function toTitleCase(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
