import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listMealExecution, type MealExecution } from '@/src/services/meal-execution';

export function useMealExecution(mealId: number, date: string) {
  const [execution, setExecution] = useState<MealExecution | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setExecution(await listMealExecution(mealId, date));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a refeição do dia');
    }
  }, [mealId, date]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { execution, error, refresh };
}
