export const isValidKkm = (value: number) => {
  return Number.isFinite(value) && value >= 0 && value <= 100
}

export const normalizeUnitLabel = (unit: string) => {
  if (unit === "global") return "Global"
  if (unit === "mts") return "MTs"
  if (unit === "sma") return "SMA"
  return unit
}
