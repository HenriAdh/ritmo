import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  listExercisesWithLogs,
  type ExerciseWithLog,
} from '@/src/services/workout-execution';

export function useWorkoutExecution(workoutId: number, date: string) {
  const [items, setItems] = useState<ExerciseWithLog[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setItems(await listExercisesWithLogs(workoutId, date));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exercícios');
    }
  }, [workoutId, date]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { items, error, refresh };
}