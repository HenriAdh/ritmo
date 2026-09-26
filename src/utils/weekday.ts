export const WEEKDAY_NAMES = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];

export function weekdayName(weekday: number): string {
  return WEEKDAY_NAMES[weekday] ?? String(weekday);
}

export function todayWeekday(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}
