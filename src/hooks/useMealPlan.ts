import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listWeekdayMeals, type WeekdayMeals } from '@/src/services/meal-plan';

export function useMealPlan(userId: number) {
  const [weekdays, setWeekdays] = useState<WeekdayMeals | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setWeekdays(await listWeekdayMeals(userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar refeições do dia');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { weekdays, error, refresh };
}
