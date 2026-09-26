import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getMealDetail, type MealDetail } from '@/src/services/meals';

export function useMeal(mealId: number) {
  const [detail, setDetail] = useState<MealDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDetail(await getMealDetail(mealId));
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

  return { detail, error, refresh };
}
