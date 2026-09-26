import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useAuthStore } from '@/src/stores/auth-store';
import {
  listMealsWithWeekdays,
  setMealWeekdays,
  type ScheduledDay,
} from '@/src/services/meal-plan';
import {
  listWorkoutsWithWeekdays,
  setWorkoutWeekdays,
} from '@/src/services/workout-plan';
import { weekdayName } from '@/src/utils/weekday';

type PlanKind = 'workout' | 'meal';

type PlanRow = {
  kind: PlanKind;
  id: number;
  title: string;
  weekdays: ScheduledDay[];
  checked: boolean;
  time: string;
};

type Section =
  | { key: PlanKind; label: string; emBreve: false }
  | { key: 'cozinha' | 'compras'; label: string; emBreve: true };

const SECTIONS: Section[] = [
  { key: 'workout', label: 'Treino', emBreve: false },
  { key: 'meal', label: 'Alimentação', emBreve: false },
  { key: 'cozinha', label: 'Cozinha', emBreve: true },
  { key: 'compras', label: 'Compras', emBreve: true },
];

const EMPTY_MESSAGE: Record<PlanKind, string> = {
  workout: 'Você ainda não tem treinos. Crie um treino primeiro.',
  meal: 'Você ainda não tem refeições. Crie uma refeição primeiro.',
};

export default function PlanWeekdayScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekday: weekdayParam } = useLocalSearchParams<{ weekday: string }>();
  const weekday = Number(weekdayParam);
  const [rows, setRows] = useState<PlanRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const load = useCallback(async () => {
    try {
      if (!user) return;
      const [workoutItems, mealItems] = await Promise.all([
        listWorkoutsWithWeekdays(user.id),
        listMealsWithWeekdays(user.id),
      ]);

      const workoutRows: PlanRow[] = workoutItems.map(({ workout, weekdays }) => {
        const day = weekdays.find((entry) => entry.weekday === weekday);
        return {
          kind: 'workout',
          id: workout.id,
          title: workout.title,
          weekdays,
          checked: day !== undefined,
          time: day?.time ?? '',
        };
      });

      const mealRows: PlanRow[] = mealItems.map(({ meal, weekdays }) => {
        const day = weekdays.find((entry) => entry.weekday === weekday);
        return {
          kind: 'meal',
          id: meal.id,
          title: meal.name,
          weekdays,
          checked: day !== undefined,
          time: day?.time ?? '',
        };
      });

      setRows([...workoutRows, ...mealRows]);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o plano do dia');
    }
  }, [user, weekday]);

  useEffect(() => {
    load();
  }, [load]);

  const toggle = (kind: PlanKind, id: number) => {
    setRows((current) =>
      (current ?? []).map((row) =>
        row.kind === kind && row.id === id ? { ...row, checked: !row.checked } : row,
      ),
    );
  };

  const setTime = (kind: PlanKind, id: number, time: string) => {
    setRows((current) =>
      (current ?? []).map((row) => (row.kind === kind && row.id === id ? { ...row, time } : row)),
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

        let weekdays: ScheduledDay[];
        if (!row.checked) {
          weekdays = others;
        } else {
          const time = row.time.trim() || null;
          weekdays = hasOtherDays ? [...others, { weekday, time }] : [{ weekday, time }];
        }

        if (row.kind === 'workout') {
          await setWorkoutWeekdays(row.id, weekdays);
        } else {
          await setMealWeekdays(row.id, weekdays);
        }
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

      {SECTIONS.map((section) => {
        const sectionRows =
          section.key === 'workout' || section.key === 'meal'
            ? rows.filter((row) => row.kind === section.key)
            : [];

        return (
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
            ) : sectionRows.length === 0 ? (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                {EMPTY_MESSAGE[section.key]}
              </Text>
            ) : (
              sectionRows.map((row) => (
                <View
                  key={`${row.kind}-${row.id}`}
                  className="mb-3 rounded-lg border border-neutral-100 p-3 dark:border-neutral-900">
                  <Pressable
                    onPress={() => toggle(row.kind, row.id)}
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
                      onChangeText={(text) => setTime(row.kind, row.id, text)}
                      placeholder="Horário (ex: 18:00)"
                      keyboardType="numbers-and-punctuation"
                      className="mt-3"
                    />
                  ) : null}
                </View>
              ))
            )}
          </View>
        );
      })}

      {error ? <Text className="mb-4 text-center text-sm text-red-500">{error}</Text> : null}

      <Button label="Salvar planejamento" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}
