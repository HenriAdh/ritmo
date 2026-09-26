import {
  MAX_WEIGHT,
  MIN_WEIGHT,
  formatWeight,
  formatWeightDelta,
  parseWeight,
  weightTrend,
} from '@/src/utils/weight';

describe('parseWeight', () => {
  it('aceita vírgula e ponto decimais', () => {
    expect(parseWeight('82,4')).toBe(82.4);
    expect(parseWeight('82.4')).toBe(82.4);
  });

  it('ignora espaços nas pontas', () => {
    expect(parseWeight('  80 ')).toBe(80);
  });

  it('aceita inteiro sem parte decimal', () => {
    expect(parseWeight('82')).toBe(82);
  });

  it('recusa entrada vazia ou não numérica', () => {
    expect(parseWeight('')).toBeNull();
    expect(parseWeight('   ')).toBeNull();
    expect(parseWeight('abc')).toBeNull();
    expect(parseWeight('8a,2')).toBeNull();
  });

  it('recusa mais de duas casas decimais', () => {
    expect(parseWeight('82,456')).toBeNull();
  });

  it('recusa mais de três dígitos inteiros', () => {
    expect(parseWeight('1234')).toBeNull();
  });

  it('recusa valores fora da faixa plausível', () => {
    expect(parseWeight(String(MIN_WEIGHT - 1))).toBeNull();
    expect(parseWeight(String(MAX_WEIGHT + 1))).toBeNull();
  });

  it('aceita os extremos da faixa', () => {
    expect(parseWeight(String(MIN_WEIGHT))).toBe(MIN_WEIGHT);
    expect(parseWeight(String(MAX_WEIGHT))).toBe(MAX_WEIGHT);
  });
});

describe('formatWeight', () => {
  it('usa vírgula decimal', () => {
    expect(formatWeight(82.4)).toBe('82,4');
  });

  it('esconde o zero decimal', () => {
    expect(formatWeight(82)).toBe('82');
  });

  it('arredonda para uma casa', () => {
    expect(formatWeight(82.46)).toBe('82,5');
  });
});

describe('formatWeightDelta', () => {
  it('sinaliza perda com o sinal de menos typográfico', () => {
    expect(formatWeightDelta(-1.6)).toBe('−1,6 kg');
  });

  it('sinaliza ganho com o sinal de mais', () => {
    expect(formatWeightDelta(2)).toBe('+2 kg');
  });

  it('trata variação nula como estável, sem sinal', () => {
    expect(formatWeightDelta(0)).toBe('0 kg');
  });

  it('ignora ruído de ponto flutuante', () => {
    expect(formatWeightDelta(0.04)).toBe('0 kg');
  });
});

describe('weightTrend', () => {
  it('devolve null sem medições', () => {
    expect(weightTrend([])).toBeNull();
  });

  it('compara o primeiro com o último valor', () => {
    expect(weightTrend([80, 79, 78.4])).toEqual({
      first: 80,
      last: 78.4,
      delta: -1.6,
      direction: 'down',
    });
  });

  it('marca estável quando o peso não mudou', () => {
    expect(weightTrend([80, 80])).toEqual({
      first: 80,
      last: 80,
      delta: 0,
      direction: 'stable',
    });
  });

  it('marca subida quando o peso aumentou', () => {
    expect(weightTrend([78, 80])?.direction).toBe('up');
  });

  it('usa o próprio valor como primeiro e último em medição única', () => {
    expect(weightTrend([80])).toEqual({ first: 80, last: 80, delta: 0, direction: 'stable' });
  });
});
