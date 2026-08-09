import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  listWeekdayWorkouts,
  type WeekdayWorkouts,
} from '@/src/services/workout-plan';

export function useWorkoutPlan(userId: number) {
  const [weekdays, setWeekdays] = useState<WeekdayWorkouts | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setWeekdays(await listWeekdayWorkouts(userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar planejamento');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { weekdays, error, refresh };
}