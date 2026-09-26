import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  listWorkoutsWithWeekdays,
  setWorkoutWeekdays,
} from '@/src/services/workout-plan';
import { weekdayName } from '@/src/utils/weekday';

type WorkoutRow = {
  workoutId: number;
  title: string;
  weekdays: { weekday: number; time: string | null }[];
  checked: boolean;
  time: string;
};

type Section = { key: string; label: string; emBreve: boolean };

const SECTIONS: Section[] = [
  { key: 'treino', label: 'Treino', emBreve: false },
  { key: 'alimentacao', label: 'Alimentação', emBreve: true },
  { key: 'cozinha', label: 'Cozinha', emBreve: true },
  { key: 'compras', label: 'Compras', emBreve: true },
];

export default function PlanWeekdayScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekday: weekdayParam } = useLocalSearchParams<{ weekday: string }>();
  const weekday = Number(weekdayParam);
  const [rows, setRows] = useState<WorkoutRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const load = useCallback(async () => {
    try {
      if (!user) return;
      const items = await listWorkoutsWithWeekdays(user.id);
      setRows(
        items.map(({ workout, weekdays }) => {
          const day = weekdays.find((entry) => entry.weekday === weekday);
          return {
            workoutId: workout.id,
            title: workout.title,
            weekdays,
            checked: day !== undefined,
            time: day?.time ?? '',
          };
        }),
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

  const setTime = (workoutId: number, time: string) => {
    setRows((current) =>
      (current ?? []).map((row) =>
        row.workoutId === workoutId ? { ...row, time } : row,
      ),
    );
  };

  const handleSave = async () => {
    if (!rows || !user) return;
    setSaving(true);
    setError(null);
    try {
      for (const row of rows) {
        const hasOtherDays = row.weekdays.some((day) => day.weekday !== weekday);
        const others = row.weekdays.filter((day) => day.weekday !== weekday);

        let weekdays;
        if (!row.checked) {
          weekdays = others;
        } else {
          const time = row.time.trim() || null;
          weekdays = hasOtherDays ? [...others, { weekday, time }] : [{ weekday, time }];
        }
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
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="p-4"
      contentContainerStyle={{ paddingBottom: keyboardHeight + 12 }}
      keyboardShouldPersistTaps="handled">
      <Text className="mb-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {weekdayName(weekday)}
      </Text>

      {SECTIONS.map((section) => (
        <View
          key={section.key}
          className="mb-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <Text className="mb-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {section.label}
          </Text>

          {section.emBreve ? (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Em breve
            </Text>
          ) : rows.length === 0 ? (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Você ainda não tem treinos. Crie um treino primeiro.
            </Text>
          ) : (
            rows.map((row) => (
              <View
                key={row.workoutId}
                className="mb-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-900">
                <Pressable
                  onPress={() => toggle(row.workoutId)}
                  className="flex-row items-center justify-between">
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
                {row.checked ? (
                  <TextField
                    value={row.time}
                    onChangeText={(text) => setTime(row.workoutId, text)}
                    placeholder="Horário (ex: 18:00)"
                    keyboardType="numbers-and-punctuation"
                    className="mt-3"
                  />
                ) : null}
              </View>
            ))
          )}
        </View>
      ))}

      {error ? <Text className="mb-4 text-center text-sm text-red-500">{error}</Text> : null}

      <Button label="Salvar planejamento" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}