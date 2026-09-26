import {
  AGENDA_KIND_LABELS,
  buildDayAgenda,
  sortAgendaByTime,
  timeToMinutes,
} from '@/src/utils/day-agenda';

describe('day-agenda utils', () => {
  it('converte horários válidos para minutos', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('18:00')).toBe(1080);
    expect(timeToMinutes('9:30')).toBe(570);
  });

  it('retorna null para horários inválidos', () => {
    expect(timeToMinutes('24:00')).toBeNull();
    expect(timeToMinutes('18:60')).toBeNull();
    expect(timeToMinutes('abc')).toBeNull();
    expect(timeToMinutes(null)).toBeNull();
  });

  it('ordena itens por horário e mantém sem horário no final', () => {
    const result = sortAgendaByTime([
      { title: 'Sem horário', time: null },
      { title: 'Noite', time: '20:00' },
      { title: 'Manhã', time: '08:00' },
      { title: 'Meio-dia', time: '12:00' },
      { title: 'Outro sem horário', time: '' },
    ]);

    expect(result.map((item) => item.title)).toEqual([
      'Manhã',
      'Meio-dia',
      'Noite',
      'Sem horário',
      'Outro sem horário',
    ]);
  });

  it('mescla treino e refeição e os ordena', () => {
    const workoutEntries = [
      { workout: { id: 1, user_id: 1, title: 'Treino A', created_at: new Date() }, time: '19:00' },
      { workout: { id: 2, user_id: 1, title: 'Treino B', created_at: new Date() }, time: '07:00' },
    ];
    const mealEntries = [
      { meal: { id: 1, user_id: 1, name: 'Café' }, time: '07:15' },
      { meal: { id: 2, user_id: 1, name: 'Jantar', time: null as unknown as string | null }, time: null },
    ];

    const agenda = buildDayAgenda(workoutEntries, mealEntries);

    expect(agenda.map((item) => ({ kind: item.kind, title: item.title, time: item.time }))).toEqual([
      { kind: 'workout', title: 'Treino B', time: '07:00' },
      { kind: 'meal', title: 'Café', time: '07:15' },
      { kind: 'workout', title: 'Treino A', time: '19:00' },
      { kind: 'meal', title: 'Jantar', time: null },
    ]);
  });

  it('define labels corretos por tipo', () => {
    expect(AGENDA_KIND_LABELS.workout).toBe('Treino');
    expect(AGENDA_KIND_LABELS.meal).toBe('Refeição');
  });
});
