import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listMealsByWeekday, type WeekdayMeals } from '@/src/services/meals';

export function useMeals(userId: number) {
  const [weekdays, setWeekdays] = useState<WeekdayMeals | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setWeekdays(await listMealsByWeekday(userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar refeições');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { weekdays, error, refresh };
}
