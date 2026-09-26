// Teclado pt-BR entrega "82,4". O app precisa aceitar vírgula e ponto, e
// exibir sempre com vírgula, senão o peso salvo não bate com o que aparece.
const WEIGHT_PATTERN = /^\d{1,3}([.,]\d{1,2})?$/;

export const MIN_WEIGHT = 20;
export const MAX_WEIGHT = 400;

export function parseWeight(input: string): number | null {
  const trimmed = input.trim();
  if (!WEIGHT_PATTERN.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed.replace(',', '.'));
  if (!Number.isFinite(value) || value < MIN_WEIGHT || value > MAX_WEIGHT) {
    return null;
  }
  return value;
}

export function formatWeight(value: number): string {
  // toLocaleString cairia para o inglês no Hermes com ICU reduzido.
  return String(Number(value.toFixed(1))).replace('.', ',');
}

export function formatWeightDelta(value: number): string {
  const rounded = Number(value.toFixed(1));
  if (rounded === 0) {
    return '0 kg';
  }
  return `${rounded > 0 ? '+' : '−'}${formatWeight(Math.abs(rounded))} kg`;
}

export type WeightTrend = {
  first: number;
  last: number;
  delta: number;
  direction: 'up' | 'down' | 'stable';
};

export function weightTrend(weights: readonly number[]): WeightTrend | null {
  if (weights.length === 0) {
    return null;
  }
  const first = weights[0];
  const last = weights[weights.length - 1];
  const delta = Number((last - first).toFixed(1));
  const direction = delta > 0 ? 'up' : delta < 0 ? 'down' : 'stable';
  return { first, last, delta, direction };
}
