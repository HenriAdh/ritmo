import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { ExerciseLogRow } from '@/src/components/workout/ExerciseLogRow';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useWorkoutExecution } from '@/src/hooks/useWorkoutExecution';
import { upsertExerciseLog, type ExerciseLogInput } from '@/src/services/workout-execution';
import { useWorkout } from '@/src/hooks/useWorkout';
import { todayISO } from '@/src/utils/date';

type LogDraft = {
  done: boolean;
  weightUsed: string;
  actualSets: string;
  actualReps: string;
  notes: string;
};

const EMPTY_DRAFT: LogDraft = { done: false, weightUsed: '', actualSets: '', actualReps: '', notes: '' };

export default function WorkoutRunScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const date = todayISO();
  const { detail } = useWorkout(workoutId);
  const { items, error } = useWorkoutExecution(workoutId, date);
  const keyboardHeight = useKeyboardHeight();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, LogDraft>>({});

  useEffect(() => {
    if (!items) return;
    setDrafts(
      Object.fromEntries(
        items.map((item) => {
          const log = item.log;
          return [
            item.exercise.id,
            {
              done: log?.done ?? false,
              weightUsed: log?.weight_used != null ? String(log.weight_used) : '',
              actualSets: log?.actual_sets != null ? String(log.actual_sets) : '',
              actualReps: log?.actual_reps != null ? String(log.actual_reps) : '',
              notes: log?.notes ?? '',
            },
          ];
        }),
      ),
    );
  }, [items]);

  const patches = useCallback(
    (exerciseId: number) => ({
      draft: drafts[exerciseId] ?? EMPTY_DRAFT,
      patch: (update: Partial<LogDraft>) =>
        setDrafts((current) => ({
          ...current,
          [exerciseId]: { ...(current[exerciseId] ?? EMPTY_DRAFT), ...update },
        })),
    }),
    [drafts],
  );

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const inputs: ExerciseLogInput[] = detail.exercises.map((exercise) => {
        const draft = drafts[exercise.id] ?? EMPTY_DRAFT;
        const hasData =
          draft.done || draft.weightUsed || draft.actualSets || draft.actualReps || draft.notes;

        if (!hasData) {
          return { exerciseId: exercise.id, date, done: false };
        }

        return {
          exerciseId: exercise.id,
          date,
          done: draft.done,
          weightUsed: draft.weightUsed ? Number(draft.weightUsed) : undefined,
          actualSets: draft.actualSets ? Number(draft.actualSets) : undefined,
          actualReps: draft.actualReps ? Number(draft.actualReps) : undefined,
          notes: draft.notes || undefined,
        };
      });

      for (const input of inputs) {
        await upsertExerciseLog(input);
      }
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-center text-sm text-red-500">{error}</Text>
      </View>
    );
  }

  if (!detail || items === null) {
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
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {detail.workout.title}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{date}</Text>
        </View>
        <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
          {items.filter((item) => drafts[item.exercise.id]?.done ?? false).length}/{items.length}
        </Text>
      </View>

      {items.map((item) => {
        const { draft, patch } = patches(item.exercise.id);
        return (
          <ExerciseLogRow
            key={item.exercise.id}
            name={item.exercise.name}
            plannedSets={item.exercise.planned_sets}
            plannedReps={item.exercise.planned_reps}
            done={draft.done}
            weightUsed={draft.weightUsed}
            actualSets={draft.actualSets}
            actualReps={draft.actualReps}
            notes={draft.notes}
            onChange={patch}
            onToggleDone={() => patch({ done: !draft.done })}
          />
        );
      })}

      {saveError ? <Text className="mb-3 text-center text-sm text-red-500">{saveError}</Text> : null}

      <Button label="Salvar treino" onPress={handleSave} loading={saving} className="mt-2" />
    </ScrollView>
  );
}