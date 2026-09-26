export function parseQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const quantity = Number(trimmed);
  if (!Number.isFinite(quantity) || quantity < 0) {
    return null;
  }
  return quantity;
}
