import type { Meal, Workout } from '@/src/types';

export type DayAgendaKind = 'workout' | 'meal';

export type DayAgendaItem = {
  key: string;
  kind: DayAgendaKind;
  id: number;
  title: string;
  time: string | null;
};

export const AGENDA_KIND_LABELS: Record<DayAgendaKind, string> = {
  workout: 'Treino',
  meal: 'Refeição',
};

const TIME_PATTERN = /^(\d{1,2}):(\d{2})$/;

export function timeToMinutes(time: string | null | undefined): number | null {
  const match = time ? TIME_PATTERN.exec(time.trim()) : null;
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function sortAgendaByTime<T extends { time: string | null }>(items: T[]): T[] {
  return items
    .map((item, index) => ({ item, index, minutes: timeToMinutes(item.time) }))
    .sort((a, b) => {
      if (a.minutes === null && b.minutes === null) {
        return a.index - b.index;
      }
      if (a.minutes === null) {
        return 1;
      }
      if (b.minutes === null) {
        return -1;
      }
      if (a.minutes === b.minutes) {
        return a.index - b.index;
      }
      return a.minutes - b.minutes;
    })
    .map((entry) => entry.item);
}

export function buildDayAgenda(
  workoutEntries: readonly { workout: Workout; time: string | null }[],
  mealEntries: readonly { meal: Meal; time: string | null }[],
): DayAgendaItem[] {
  const items: DayAgendaItem[] = [
    ...workoutEntries.map(({ workout, time }) => ({
      key: `workout-${workout.id}`,
      kind: 'workout' as const,
      id: workout.id,
      title: workout.title,
      time,
    })),
    ...mealEntries.map(({ meal, time }) => ({
      key: `meal-${meal.id}`,
      kind: 'meal' as const,
      id: meal.id,
      title: meal.name,
      time,
    })),
  ];

  return sortAgendaByTime(items);
}
