import { formatLongDate, toISODate, todayISO } from '@/src/utils/date';

describe('date utils', () => {
  describe('toISODate', () => {
    it('formata com dois dígitos no mês e no dia', () => {
      expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    });

    it('formata o dia 26 de setembro', () => {
      expect(toISODate(new Date(2026, 8, 26))).toBe('2026-09-26');
    });
  });

  describe('formatLongDate', () => {
    it('escreve dia da semana, dia e mês por extenso', () => {
      expect(formatLongDate(new Date(2026, 8, 26))).toBe('sábado, 26 de setembro');
    });

    it('começa a semana no domingo, como getDay', () => {
      expect(formatLongDate(new Date(2026, 8, 20))).toBe('domingo, 20 de setembro');
      expect(formatLongDate(new Date(2026, 8, 21))).toBe('segunda-feira, 21 de setembro');
    });

    it('usa os nomes de todos os meses', () => {
      const expected = [
        'janeiro',
        'fevereiro',
        'março',
        'abril',
        'maio',
        'junho',
        'julho',
        'agosto',
        'setembro',
        'outubro',
        'novembro',
        'dezembro',
      ];

      expected.forEach((month, index) => {
        expect(formatLongDate(new Date(2026, index, 10))).toContain(month);
      });
    });

    it('formata dia 1 sem zero à esquerda', () => {
      expect(formatLongDate(new Date(2026, 0, 1))).toBe('quinta-feira, 1 de janeiro');
    });
  });

  describe('todayISO', () => {
    it('devolve o dia de hoje no formato ISO', () => {
      expect(todayISO()).toBe(toISODate(new Date()));
    });
  });
});
