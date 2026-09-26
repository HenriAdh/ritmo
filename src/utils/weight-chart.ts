import type { WeighIn } from '@/src/types';

export const CHART_PADDING = { top: 16, right: 14, bottom: 22, left: 14 };

export type ChartPoint = {
  id: number;
  date: string;
  weight: number;
  x: number;
  y: number;
};

export type WeightChartData = {
  points: ChartPoint[];
  line: string;
  area: string;
  // Domínio com folga, usado só na geometria.
  min: number;
  max: number;
  // Valor real mais baixo e mais alto, para os rótulos.
  dataMin: number;
  dataMax: number;
  baselineY: number;
  innerLeft: number;
  innerRight: number;
};

export type ChartBox = {
  width: number;
  height: number;
};

type WeightEntry = Pick<WeighIn, 'id' | 'date' | 'weight'>;

function epoch(isoDate: string): number | null {
  const value = Date.parse(isoDate);
  return Number.isNaN(value) ? null : value;
}

// Sem folga no eixo, a linha encosta na borda em cima e embaixo. 15% do
// alcance, com um piso de 0,5 kg, evita isso sem achatar variações reais.
function buildDomain(weights: readonly number[]): { min: number; max: number } {
  const lowest = Math.min(...weights);
  const highest = Math.max(...weights);
  const range = highest - lowest;
  const padding = Math.max(range * 0.15, 0.5);
  return { min: lowest - padding, max: highest + padding };
}

// A posição horizontal usa a data, não o índice: um mês com duas pesagens e o
// seguinte com uma não podem ocupar o mesmo espaço. Se alguma data vier
// inválida, cai para o índice para o gráfico não quebrar.
function buildHorizontalPositions(
  entries: readonly WeightEntry[],
  innerLeft: number,
  innerWidth: number,
): number[] {
  const times = entries.map((entry) => epoch(entry.date));
  const usable = times.every((value) => value !== null);
  const lowest = usable ? Math.min(...(times as number[])) : 0;
  const highest = usable ? Math.max(...(times as number[])) : 0;
  const span = highest - lowest;
  const step = entries.length > 1 ? innerWidth / (entries.length - 1) : 0;

  return entries.map((entry, index) => {
    if (!usable) {
      return innerLeft + (entries.length > 1 ? index * step : innerWidth / 2);
    }
    if (span === 0) {
      return innerLeft + innerWidth / 2;
    }
    return innerLeft + ((times[index] as number - lowest) / span) * innerWidth;
  });
}

export function buildWeightChart(
  entries: readonly WeightEntry[],
  box: ChartBox,
): WeightChartData | null {
  if (entries.length === 0 || box.width <= 0 || box.height <= 0) {
    return null;
  }

  const innerLeft = CHART_PADDING.left;
  const innerTop = CHART_PADDING.top;
  const innerWidth = box.width - CHART_PADDING.left - CHART_PADDING.right;
  const innerHeight = box.height - CHART_PADDING.top - CHART_PADDING.bottom;
  if (innerWidth <= 0 || innerHeight <= 0) {
    return null;
  }

  const weights = entries.map((entry) => entry.weight);
  const { min, max } = buildDomain(weights);
  const span = max - min;
  const xs = buildHorizontalPositions(entries, innerLeft, innerWidth);

  const points: ChartPoint[] = entries.map((entry, index) => ({
    id: entry.id,
    date: entry.date,
    weight: entry.weight,
    x: round(xs[index]),
    // Peso maior fica mais perto do topo.
    y: round(innerTop + innerHeight * ((max - entry.weight) / span)),
  }));

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const baselineY = round(innerTop + innerHeight);
  const first = points[0];
  const last = points[points.length - 1];
  const area = points.length === 1
    ? ''
    : `M ${first.x} ${baselineY} L ${line.slice(1)} L ${last.x} ${baselineY} Z`;

  return {
    points,
    line,
    area,
    min,
    max,
    dataMin: Math.min(...weights),
    dataMax: Math.max(...weights),
    baselineY,
    innerLeft,
    innerRight: round(innerLeft + innerWidth),
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
