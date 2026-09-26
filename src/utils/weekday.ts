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
