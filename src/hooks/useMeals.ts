import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listMeals, type MealListItem } from '@/src/services/meals';

export function useMeals(userId: number) {
  const [meals, setMeals] = useState<MealListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMeals(await listMeals(userId));
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

  return { meals, error, refresh };
}
