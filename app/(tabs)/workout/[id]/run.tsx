import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { ExerciseLogRow } from '@/src/components/workout/ExerciseLogRow';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useWorkout } from '@/src/hooks/useWorkout';
import { useWorkoutExecution } from '@/src/hooks/useWorkoutExecution';
import {
  upsertExerciseLog,
  type ExerciseLogInput,
  type ExecutionItem,
} from '@/src/services/workout-execution';
import { todayISO } from '@/src/utils/date';

type LogDraft = {
  done: boolean;
  weightUsed: string;
  actualReps: string;
  notes: string;
  name?: string;
};

const EMPTY_DRAFT: LogDraft = { done: false, weightUsed: '', actualReps: '', notes: '' };

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
  const [drafts, setDrafts] = useState<Record<string, LogDraft>>({});
  const [extraKeys, setExtraKeys] = useState<string[]>([]);

  const nextExtraKey = useCallback(() => {
    const base = `x-new-${Date.now()}`;
    let key = base;
    let i = 2;
    while (key in drafts || extraKeys.includes(key)) {
      key = `${base}-${i}`;
      i += 1;
    }
    return key;
  }, [drafts, extraKeys]);

  useEffect(() => {
    if (!items) return;
    setDrafts(
      Object.fromEntries(
        items.map((item) => [
          item.key,
          {
            done: item.log?.done ?? false,
            weightUsed: item.log?.weight_used != null ? String(item.log.weight_used) : '',
            actualReps: item.log?.actual_reps ?? '',
            notes: item.log?.notes ?? '',
            ...(item.isExtra && { name: item.log?.exercise_name ?? '' }),
          },
        ]),
      ),
    );
  }, [items]);

  const patchDraft = useCallback((key: string, patch: Partial<LogDraft>) => {
    setDrafts((current) => ({
      ...current,
      [key]: { ...(current[key] ?? EMPTY_DRAFT), ...patch },
    }));
  }, []);

  const addExtra = () => {
    const key = nextExtraKey();
    setExtraKeys((current) => [...current, key]);
  };

  const removeExtra = (key: string) => {
    setExtraKeys((current) => current.filter((extraKey) => extraKey !== key));
    setDrafts((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const inputs: ExerciseLogInput[] = [];

      for (const item of items ?? []) {
        const draft = drafts[item.key] ?? EMPTY_DRAFT;
        const hasData =
          draft.done || draft.weightUsed || draft.actualReps || draft.notes || draft.name;

        if (!hasData) {
          if (item.exerciseId != null) {
            inputs.push({ exerciseId: item.exerciseId, date, done: false });
          }
          continue;
        }

        const base = {
          date,
          done: draft.done,
          weightUsed: draft.weightUsed ? Number(draft.weightUsed) : undefined,
          actualReps: draft.actualReps || undefined,
          notes: draft.notes || undefined,
        };

        if (item.isExtra) {
          const name = draft.name?.trim();
          if (!name) continue;
          inputs.push({ workoutId, exerciseName: name, ...base });
        } else {
          inputs.push({ exerciseId: item.exerciseId!, ...base });
        }
      }

      for (const key of extraKeys) {
        const draft = drafts[key] ?? EMPTY_DRAFT;
        const name = draft.name?.trim();
        if (!name) continue;
        const hasData = draft.done || draft.weightUsed || draft.actualReps || draft.notes;
        if (!hasData) continue;
        inputs.push({
          workoutId,
          exerciseName: name,
          date,
          done: draft.done,
          weightUsed: draft.weightUsed ? Number(draft.weightUsed) : undefined,
          actualReps: draft.actualReps || undefined,
          notes: draft.notes || undefined,
        });
      }

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
        <Text className="text-center text-sm text-danger-500">{error}</Text>
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

  const renderItem = (item: ExecutionItem) => {
    const draft = drafts[item.key] ?? EMPTY_DRAFT;
    return (
      <ExerciseLogRow
        key={item.key}
        name={item.name}
        editedName={draft.name ?? ''}
        isExtra={item.isExtra}
        plannedSets={item.plannedSets}
        plannedReps={item.plannedReps}
        done={draft.done}
        weightUsed={draft.weightUsed}
        actualReps={draft.actualReps}
        notes={draft.notes}
        onChange={(patch) => patchDraft(item.key, patch)}
        onToggleDone={() => patchDraft(item.key, { done: !draft.done })}
        onRemove={item.isExtra ? () => removeExtra(item.key) : undefined}
      />
    );
  };

  const doneCount = [...(items ?? []), ...extraKeys].filter(
    (item) => drafts[typeof item === 'string' ? item : item.key]?.done || false,
  ).length;

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title={detail.workout.title}
        subtitle={date}
        onBack={() => router.back()}
        actions={[{ label: 'Salvar', onPress: handleSave, loading: saving }]}
        right={
          <Text className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
            {doneCount}/{items.length + extraKeys.length}
          </Text>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        contentContainerStyle={{ paddingBottom: keyboardHeight + 12 }}
        keyboardShouldPersistTaps="handled">
        {items.map(renderItem)}
        {extraKeys.map((key) => {
          const draft = drafts[key] ?? EMPTY_DRAFT;
          return (
            <ExerciseLogRow
              key={key}
              name=""
              editedName={draft.name ?? ''}
              isExtra
              plannedSets={null}
              plannedReps={null}
              done={draft.done}
              weightUsed={draft.weightUsed}
              actualReps={draft.actualReps}
              notes={draft.notes}
              onChange={(patch) => patchDraft(key, patch)}
              onToggleDone={() => patchDraft(key, { done: !draft.done })}
              onRemove={() => removeExtra(key)}
            />
          );
        })}

        <Pressable onPress={addExtra} className="mt-1 self-start py-2">
          <Text className="text-sm font-semibold text-primary-600 dark:text-primary-400">
            + Adicionar exercício extra
          </Text>
        </Pressable>

        {saveError ? <Text className="text-center text-sm text-danger-500">{saveError}</Text> : null}
      </ScrollView>
    </View>
  );
}