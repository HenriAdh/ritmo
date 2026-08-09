import { useCallback, useEffect, useState } from 'react';

import { getWorkoutDetail, type WorkoutDetail } from '@/src/services/workouts';

export function useWorkout(workoutId: number) {
  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setDetail(await getWorkoutDetail(workoutId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar treino');
    }
  }, [workoutId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { detail, error, refresh };
}