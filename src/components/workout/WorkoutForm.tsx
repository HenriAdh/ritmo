import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import {
  createWorkout,
  updateWorkout,
  type ExerciseInput,
  type WorkoutDetail,
} from '@/src/services/workouts';
import { useAuthStore } from '@/src/stores/auth-store';

type ExerciseRow = {
  name: string;
  plannedSets: string;
  plannedReps: string;
};

type WorkoutFormProps = {
  initial?: WorkoutDetail;
  onSaved: () => void;
};

const EMPTY_EXERCISE: ExerciseRow = { name: '', plannedSets: '', plannedReps: '' };

export function WorkoutForm({ initial, onSaved }: WorkoutFormProps) {
  const user = useAuthStore((state) => state.user);
  const [title, setTitle] = useState(initial?.workout.title ?? '');
  const [rows, setRows] = useState<ExerciseRow[]>(
    initial
      ? initial.exercises.map((exercise) => ({
          name: exercise.name,
          plannedSets: String(exercise.planned_sets),
          plannedReps: String(exercise.planned_reps),
        }))
      : [EMPTY_EXERCISE],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const addExercise = () => setRows((current) => [...current, EMPTY_EXERCISE]);

  const removeExercise = (index: number) =>
    setRows((current) => current.filter((_, i) => i !== index));

  const updateRow = (index: number, patch: Partial<ExerciseRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (!user) {
      return;
    }
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Informe o nome do treino');
      return;
    }

    const exercises: ExerciseInput[] = [];
    for (const row of rows) {
      const name = row.name.trim();
      if (!name) {
        continue;
      }
      const plannedSets = Number(row.plannedSets);
      const plannedReps = Number(row.plannedReps);
      if (!Number.isInteger(plannedSets) || plannedSets < 1 || !Number.isInteger(plannedReps) || plannedReps < 1) {
        setError('Séries e repetições precisam ser números maiores que zero');
        return;
      }
      exercises.push({ name, plannedSets, plannedReps });
    }

    setSaving(true);
    try {
      if (initial) {
        await updateWorkout({ id: initial.workout.id, title: trimmedTitle, exercises });
      } else {
        await createWorkout({ userId: user.id, title: trimmedTitle, exercises });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar treino');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-12"
        keyboardShouldPersistTaps="handled">
        <Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Título
      </Text>
      <TextField
        value={title}
        onChangeText={setTitle}
        placeholder="Ex.: Treino A - Peito e tríceps"
        className="mb-6"
      />

      <Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        Exercícios
      </Text>
      {rows.map((row, index) => (
        <View key={index} className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
          <TextField
            value={row.name}
            onChangeText={(text) => updateRow(index, { name: text })}
            placeholder="Nome do exercício"
            className="mb-3"
          />
          <View className="flex-row gap-3">
            <TextField
              value={row.plannedSets}
              onChangeText={(text) => updateRow(index, { plannedSets: text })}
              placeholder="Séries"
              keyboardType="number-pad"
              className="flex-1"
            />
            <TextField
              value={row.plannedReps}
              onChangeText={(text) => updateRow(index, { plannedReps: text })}
              placeholder="Repetições"
              keyboardType="number-pad"
              className="flex-1"
            />
          </View>
          {rows.length > 1 ? (
            <Pressable onPress={() => removeExercise(index)} className="mt-2 self-start">
              <Text className="text-sm text-red-500">Remover</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      <Pressable onPress={addExercise} className="mb-6 rounded-xl border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
        <Text className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
          + Adicionar exercício
        </Text>
      </Pressable>

      {error ? <Text className="mb-4 text-center text-sm text-red-500">{error}</Text> : null}

      <Button label="Salvar" onPress={handleSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}