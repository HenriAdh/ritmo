import { useColorScheme } from 'nativewind';
import { Pressable, Text, TextInput, View } from 'react-native';

import { TextField } from '@/src/components/TextField';
import { ink } from '@/src/theme/colors';

type DraftPatch = {
  name?: string;
  weightUsed?: string;
  actualReps?: string;
  notes?: string;
};

type ExerciseLogRowProps = {
  name: string;
  editedName?: string;
  isExtra: boolean;
  plannedSets: number | null;
  plannedReps: number | null;
  done: boolean;
  weightUsed: string;
  actualReps: string;
  notes: string;
  onChange: (patch: DraftPatch) => void;
  onToggleDone: () => void;
  onRemove?: () => void;
};

export function ExerciseLogRow({
  name,
  editedName,
  isExtra,
  plannedSets,
  plannedReps,
  done,
  weightUsed,
  actualReps,
  notes,
  onChange,
  onToggleDone,
  onRemove,
}: ExerciseLogRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const planned = plannedSets != null && plannedReps != null ? `${plannedSets} x ${plannedReps}` : null;

  return (
    <View className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-1 pr-2">
          {isExtra ? (
            <TextInput
              value={editedName}
              onChangeText={(text) => onChange({ name: text })}
              placeholder="Nome do exercício extra"
              placeholderTextColor={ink('muted', isDark)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
            />
          ) : (
            <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
              {name}
            </Text>
          )}
          {isExtra ? (
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Extra do dia</Text>
          ) : (
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              Planejado: {planned ?? '-'}
            </Text>
          )}
        </View>
        <Pressable
          onPress={onToggleDone}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700">
          <Text
            className={`text-sm font-medium ${done ? 'text-success-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
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
        <View className="flex-[2]">
          <TextField
            value={actualReps}
            onChangeText={(text) => onChange({ actualReps: text })}
            placeholder="Reps por série (ex: 12, 10, 8)"
            keyboardType="numbers-and-punctuation"
          />
        </View>
      </View>

      <TextField
        value={notes}
        onChangeText={(text) => onChange({ notes: text })}
        placeholder="Observações (opcional)"
      />

      {isExtra && onRemove ? (
        <Pressable onPress={onRemove} className="mt-3 self-start">
          <Text className="text-sm font-medium text-danger-500">Remover</Text>
        </Pressable>
      ) : null}
    </View>
  );
}