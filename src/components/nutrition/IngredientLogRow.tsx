import { useColorScheme } from 'nativewind';
import { Pressable, Text, TextInput, View } from 'react-native';

import { TextField } from '@/src/components/TextField';
import { ink } from '@/src/theme/colors';

type DraftPatch = {
  name?: string;
  quantity?: string;
};

type IngredientLogRowProps = {
  name: string;
  editedName?: string;
  isExtra?: boolean;
  unit: string | null;
  plannedQuantity: number | null;
  eatenQuantity: string;
  onChange: (patch: DraftPatch) => void;
  onRemove?: () => void;
};

export function IngredientLogRow({
  name,
  editedName,
  isExtra = false,
  unit,
  plannedQuantity,
  eatenQuantity,
  onChange,
  onRemove,
}: IngredientLogRowProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const plannedText =
    plannedQuantity === null && !unit
      ? 'Planejado: -'
      : `Planejado: ${[plannedQuantity, unit].filter(Boolean).join(' ')}`;
  const unitHint = unit ? ` (${unit})` : '';

  return (
    <View className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <View className="mb-3">
        {isExtra ? (
          <TextInput
            value={editedName}
            onChangeText={(text) => onChange({ name: text })}
            placeholder="Nome do ingrediente extra"
            placeholderTextColor={ink('muted', isDark)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
          />
        ) : (
          <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            {name}
          </Text>
        )}
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {isExtra ? 'Extra do dia' : plannedText}
        </Text>
      </View>

      <TextField
        value={eatenQuantity}
        onChangeText={(text) => onChange({ quantity: text })}
        placeholder={`Quanto comi${unitHint}`}
        keyboardType="decimal-pad"
      />

      {isExtra && onRemove ? (
        <Pressable onPress={onRemove} className="mt-3 self-start">
          <Text className="text-sm font-medium text-danger-500">Remover</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
