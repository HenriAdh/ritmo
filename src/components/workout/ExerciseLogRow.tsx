import { Pressable, Text, View } from 'react-native';

import { TextField } from '@/src/components/TextField';

type ExerciseLogRowProps = {
  name: string;
  plannedSets: number;
  plannedReps: number;
  done: boolean;
  weightUsed: string;
  actualSets: string;
  actualReps: string;
  notes: string;
  onChange: (patch: Partial<{
    weightUsed: string;
    actualSets: string;
    actualReps: string;
    notes: string;
  }>) => void;
  onToggleDone: () => void;
};

export function ExerciseLogRow({
  name,
  plannedSets,
  plannedReps,
  done,
  weightUsed,
  actualSets,
  actualReps,
  notes,
  onChange,
  onToggleDone,
}: ExerciseLogRowProps) {
  return (
    <View className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {name}
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            Planejado: {plannedSets} x {plannedReps}
          </Text>
        </View>
        <Pressable
          onPress={onToggleDone}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700">
          <Text
            className={`text-sm font-medium ${done ? 'text-green-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {done ? 'Concluído' : 'Marcar como feito'}
          </Text>
        </Pressable>
      </View>

      <View className="mb-3 flex-row gap-3">
        <View className="flex-1">
          <TextField
            value={weightUsed}
            onChangeText={(text) => onChange({ weightUsed: text })}
            placeholder="Carga (kg)"
            keyboardType="decimal-pad"
          />
        </View>
        <View className="flex-1">
          <TextField
            value={actualSets}
            onChangeText={(text) => onChange({ actualSets: text })}
            placeholder="Séries"
            keyboardType="number-pad"
          />
        </View>
        <View className="flex-1">
          <TextField
            value={actualReps}
            onChangeText={(text) => onChange({ actualReps: text })}
            placeholder="Reps"
            keyboardType="number-pad"
          />
        </View>
      </View>

      <TextField
        value={notes}
        onChangeText={(text) => onChange({ notes: text })}
        placeholder="Observações (opcional)"
      />
    </View>
  );
}