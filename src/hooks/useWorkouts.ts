import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { listWorkouts, type WorkoutListItem } from '@/src/services/workouts';

export function useWorkouts(userId: number) {
  const [workouts, setWorkouts] = useState<WorkoutListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setWorkouts(await listWorkouts(userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar treinos');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { workouts, error, refresh };
}