import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getMealWeekdays, type ScheduledDay } from '@/src/services/meal-plan';
import { getMealDetail, type MealDetail } from '@/src/services/meals';

export function useMeal(mealId: number) {
  const [detail, setDetail] = useState<MealDetail | null>(null);
  const [weekdays, setWeekdays] = useState<ScheduledDay[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const mealDetail = await getMealDetail(mealId);
      const mealWeekdays = await getMealWeekdays(mealId);
      setDetail(mealDetail);
      setWeekdays(mealWeekdays);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar refeição');
    }
  }, [mealId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { detail, weekdays, error, refresh };
}
