import { todayWeekday, weekdayName } from '@/src/utils/weekday';

describe('weekdayName', () => {
  it('retorna o nome do dia por índice', () => {
    expect(weekdayName(0)).toBe('Segunda');
    expect(weekdayName(6)).toBe('Domingo');
  });

  it('devolve o próprio número quando o índice não existe', () => {
    expect(weekdayName(9)).toBe('9');
  });
});

describe('todayWeekday', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mapeia segunda para 0', () => {
    jest.setSystemTime(new Date('2026-09-28T12:00:00'));
    expect(todayWeekday()).toBe(0);
  });

  it('mapeia domingo para 6', () => {
    jest.setSystemTime(new Date('2026-09-27T12:00:00'));
    expect(todayWeekday()).toBe(6);
  });
});
