import { parseQuantity } from '@/src/utils/quantity';

describe('parseQuantity', () => {
  it('converte número válido', () => {
    expect(parseQuantity('100')).toBe(100);
    expect(parseQuantity(' 12.5 ')).toBe(12.5);
    expect(parseQuantity('0')).toBe(0);
  });

  it('devolve null para campo vazio', () => {
    expect(parseQuantity('')).toBeNull();
    expect(parseQuantity('   ')).toBeNull();
  });

  it('devolve null para valor inválido ou negativo', () => {
    expect(parseQuantity('abc')).toBeNull();
    expect(parseQuantity('-5')).toBeNull();
    expect(parseQuantity('10g')).toBeNull();
  });
});
