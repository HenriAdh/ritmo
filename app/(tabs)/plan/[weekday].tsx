import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  listWorkoutsWithWeekdays,
  setWorkoutWeekdays,
  weekdayName,
} from '@/src/services/workout-plan';

type WorkoutRow = {
  workoutId: number;
  title: string;
  weekdays: number[];
  checked: boolean;
};

export default function PlanWeekdayScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekday: weekdayParam } = useLocalSearchParams<{ weekday: string }>();
  const weekday = Number(weekdayParam);
  const [rows, setRows] = useState<WorkoutRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      if (!user) return;
      const items = await listWorkoutsWithWeekdays(user.id);
      setRows(
        items.map(({ workout, weekdays }) => ({
          workoutId: workout.id,
          title: workout.title,
          weekdays,
          checked: weekdays.includes(weekday),
        })),
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar treinos');
    }
  }, [user, weekday]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (workoutId: number) => {
    setRows((current) =>
      (current ?? []).map((row) =>
        row.workoutId === workoutId ? { ...row, checked: !row.checked } : row,
      ),
    );
  };

  const handleSave = async () => {
    if (!rows || !user) return;
    setSaving(true);
    setError(null);
    try {
      for (const row of rows) {
        const weekdays = row.checked
          ? row.weekdays.includes(weekday)
            ? row.weekdays
            : [...row.weekdays, weekday]
          : row.weekdays.filter((day) => day !== weekday);
        await setWorkoutWeekdays(row.workoutId, weekdays);
      }
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar planejamento');
    } finally {
      setSaving(false);
    }
  };

  if (rows === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <View className="p-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {weekdayName(weekday)}
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Marque os treinos do dia.
        </Text>
      </View>

      <View className="px-4">
        {rows.length === 0 ? (
          <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
            Você ainda não tem treinos. Crie um treino primeiro.
          </Text>
        ) : (
          rows.map((row) => (
            <Pressable
              key={row.workoutId}
              onPress={() => toggle(row.workoutId)}
              className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <Text className="flex-1 text-base font-medium text-neutral-900 dark:text-neutral-100">
                {row.title}
              </Text>
              <View
                className={`h-6 w-6 items-center justify-center rounded-md border ${
                  row.checked
                    ? 'border-indigo-600 bg-indigo-600'
                    : 'border-neutral-300 dark:border-neutral-700'
                }`}>
                {row.checked ? <Text className="text-sm text-white">✓</Text> : null}
              </View>
            </Pressable>
          ))
        )}
      </View>

      {error ? <Text className="mb-4 px-4 text-center text-sm text-red-500">{error}</Text> : null}

      <View className="mt-auto p-4">
        <Button label="Salvar planejamento" onPress={handleSave} loading={saving} />
      </View>
    </View>
  );
}