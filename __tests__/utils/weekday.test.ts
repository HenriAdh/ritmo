import { weekdayName } from '@/src/utils/weekday';

describe('weekdayName', () => {
  it('retorna o nome do dia por índice', () => {
    expect(weekdayName(0)).toBe('Segunda');
    expect(weekdayName(6)).toBe('Domingo');
  });

  it('devolve o próprio número quando o índice não existe', () => {
    expect(weekdayName(9)).toBe('9');
  });
});
