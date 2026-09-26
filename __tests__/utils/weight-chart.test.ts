import { CHART_PADDING, buildWeightChart } from '@/src/utils/weight-chart';

const BOX = { width: 320, height: 180 };

function entry(id: number, date: string, weight: number) {
  return { id, date, weight };
}

describe('buildWeightChart', () => {
  it('devolve null sem entradas', () => {
    expect(buildWeightChart([], BOX)).toBeNull();
  });

  it('devolve null quando a caixa não tem área', () => {
    expect(buildWeightChart([entry(1, '2026-01-05', 80)], { width: 0, height: 0 })).toBeNull();
  });

  it('devolve null quando o padding some com a caixa', () => {
    expect(
      buildWeightChart([entry(1, '2026-01-05', 80)], {
        width: CHART_PADDING.left + CHART_PADDING.right,
        height: CHART_PADDING.top + CHART_PADDING.bottom,
      }),
    ).toBeNull();
  });

  it('centraliza uma medição única no meio da linha', () => {
    const chart = buildWeightChart([entry(1, '2026-01-05', 80)], BOX);

    expect(chart?.points).toHaveLength(1);
    expect(chart?.points[0].x).toBe(BOX.width / 2);
    expect(chart?.area).toBe('');
  });

  it('ancora a primeira e a última medição nas bordas internas', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 79)],
      BOX,
    );

    expect(chart?.points[0].x).toBe(CHART_PADDING.left);
    expect(chart?.points[1].x).toBe(BOX.width - CHART_PADDING.right);
  });

  it('espaça pela data, não pelo índice', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-01', 80), entry(2, '2026-01-02', 80), entry(3, '2026-01-11', 80)],
      BOX,
    );

    const innerWidth = BOX.width - CHART_PADDING.left - CHART_PADDING.right;
    // Do dia 1 ao dia 11 são 10 dias: o dia 2 fica a 10% da largura, e não
    // no meio como sairia se o espaçamento fosse pelo índice.
    expect(chart?.points[0].x).toBe(CHART_PADDING.left);
    expect(chart?.points[1].x).toBeCloseTo(CHART_PADDING.left + innerWidth * 0.1, 1);
    expect(chart?.points[2].x).toBe(BOX.width - CHART_PADDING.right);
  });

  it('coloca peso maior mais perto do topo', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 79), entry(2, '2026-01-20', 82)],
      BOX,
    );

    const [low, high] = chart?.points ?? [];
    expect(high.y).toBeLessThan(low.y);
  });

  it('lança a linha com um M e um L por ponto', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 79), entry(3, '2026-01-25', 78)],
      BOX,
    );

    expect(chart?.line.match(/^M/g)).toHaveLength(1);
    expect(chart?.line.match(/L/g)).toHaveLength(2);
  });

  it('fecha a área na linha de base', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 79)],
      BOX,
    );

    expect(chart?.area.startsWith('M ')).toBe(true);
    expect(chart?.area.endsWith('Z')).toBe(true);
    expect(chart?.area).toContain(String(chart?.baselineY));
  });

  it('separa o maior e o menor peso real', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 81), entry(2, '2026-01-20', 79.5)],
      BOX,
    );

    expect(chart?.dataMin).toBe(79.5);
    expect(chart?.dataMax).toBe(81);
  });

  it('dá folga no eixo para o peso não encostar na borda', () => {
    const chart = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 80)],
      BOX,
    );

    // Peso constante: a folga é o piso de 0,5 kg de cada lado.
    expect(chart?.min).toBe(79.5);
    expect(chart?.max).toBe(80.5);
    expect(chart?.dataMin).toBe(80);
    expect(chart?.dataMax).toBe(80);
  });

  it('cai para o índice quando alguma data é inválida', () => {
    const chart = buildWeightChart(
      [entry(1, 'nao-e-data', 80), entry(2, '2026-01-20', 79)],
      BOX,
    );

    expect(chart?.points[0].x).toBe(CHART_PADDING.left);
    expect(chart?.points[1].x).toBe(BOX.width - CHART_PADDING.right);
  });

  it('mantém o mesmo eixo quando o peso não variou', () => {
    const flat = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 80)],
      BOX,
    );
    const last = buildWeightChart(
      [entry(1, '2026-01-05', 80), entry(2, '2026-01-20', 80)],
      BOX,
    );

    expect(last?.points[1].y).toBe(flat?.points[1].y);
  });
});
