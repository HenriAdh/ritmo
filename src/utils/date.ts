export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

// Montado à mão em vez de usar toLocaleDateString: o Hermes vem com ICU
// reduzido no Android e cairia para o inglês sem a lib de internationalização.
const LONG_WEEKDAY_NAMES = [
  'domingo',
  'segunda-feira',
  'terça-feira',
  'quarta-feira',
  'quinta-feira',
  'sexta-feira',
  'sábado',
];

const MONTH_NAMES = [
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

export function formatLongDate(date: Date): string {
  const weekday = LONG_WEEKDAY_NAMES[date.getDay()] ?? '';
  const month = MONTH_NAMES[date.getMonth()] ?? '';
  return `${weekday}, ${date.getDate()} de ${month}`;
}

const MONTH_SHORT_NAMES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

// Aceita o formato YYYY-MM-DD que o app grava no banco.
export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) {
    return isoDate;
  }
  const monthName = MONTH_SHORT_NAMES[Number(month) - 1];
  if (!monthName) {
    return isoDate;
  }
  return `${Number(day)} ${monthName}`;
}