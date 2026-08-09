export function parseRepSetValues(value: string): number[] {
  const matches = value.match(/\d+(\.\d+)?/g);
  return (matches ?? []).map(Number).filter((n) => n > 0);
}

export function formatRepSetValues(values: number[]): string {
  return values.join(', ');
}