import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { TextField } from '@/src/components/TextField';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import {
  createMeal,
  updateMeal,
  type IngredientInput,
  type MealDetail,
} from '@/src/services/meals';
import { useAuthStore } from '@/src/stores/auth-store';

type IngredientRow = {
  name: string;
  quantity: string;
  unit: string;
};

type MealFormProps = {
  initial?: MealDetail;
  onSaved: () => void;
  onCancel: () => void;
  screenTitle: string;
};

const EMPTY_INGREDIENT: IngredientRow = { name: '', quantity: '', unit: '' };

export function MealForm({ initial, onSaved, onCancel, screenTitle }: MealFormProps) {
  const user = useAuthStore((state) => state.user);
  const [name, setName] = useState(initial?.meal.name ?? '');
  const [rows, setRows] = useState<IngredientRow[]>(
    initial
      ? initial.ingredients.map((ingredient) => ({
          name: ingredient.name,
          quantity: ingredient.quantity === null ? '' : String(ingredient.quantity),
          unit: ingredient.unit ?? '',
        }))
      : [EMPTY_INGREDIENT],
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardHeight = useKeyboardHeight();

  const addIngredient = () => setRows((current) => [...current, EMPTY_INGREDIENT]);

  const removeIngredient = (index: number) =>
    setRows((current) => current.filter((_, i) => i !== index));

  const updateRow = (index: number, patch: Partial<IngredientRow>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const handleSave = async () => {
    if (!user) {
      return;
    }
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Informe o nome da refeição');
      return;
    }

    const ingredients: IngredientInput[] = [];
    for (const row of rows) {
      const ingredientName = row.name.trim();
      if (!ingredientName) {
        continue;
      }

      const trimmedQuantity = row.quantity.trim();
      let quantity: number | undefined;
      if (trimmedQuantity.length > 0) {
        quantity = Number(trimmedQuantity);
        if (!Number.isFinite(quantity) || quantity < 0) {
          setError(`Quantidade inválida em "${ingredientName}"`);
          return;
        }
      }

      const unit = row.unit.trim();
      ingredients.push({
        name: ingredientName,
        ...(quantity !== undefined && { quantity }),
        ...(unit.length > 0 && { unit }),
      });
    }

    setSaving(true);
    try {
      if (initial) {
        await updateMeal({ id: initial.meal.id, name: trimmedName, ingredients });
      } else {
        await createMeal({ userId: user.id, name: trimmedName, ingredients });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar refeição');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title={screenTitle}
        onBack={onCancel}
        actions={[{ label: 'Salvar', onPress: handleSave, loading: saving }]}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        contentContainerStyle={{ paddingBottom: keyboardHeight + 12 }}
        keyboardShouldPersistTaps="handled">
        <Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Nome da refeição
        </Text>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Ex.: Arroz, feijão e frango"
          className="mb-2"
        />
        <Text className="mb-6 text-xs text-neutral-500 dark:text-neutral-400">
          O dia da semana e o horário você define depois, na aba Planejar.
        </Text>

        <Text className="mb-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
          Ingredientes
        </Text>
        {rows.map((row, index) => (
          <View
            key={index}
            className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <TextField
              value={row.name}
              onChangeText={(text) => updateRow(index, { name: text })}
              placeholder="Nome do ingrediente"
              className="mb-3"
            />
            <View className="flex-row gap-3">
              <TextField
                value={row.quantity}
                onChangeText={(text) => updateRow(index, { quantity: text })}
                placeholder="Quantidade"
                keyboardType="decimal-pad"
                className="flex-1"
              />
              <TextField
                value={row.unit}
                onChangeText={(text) => updateRow(index, { unit: text })}
                placeholder="Unidade"
                className="flex-1"
              />
            </View>
            {rows.length > 1 ? (
              <Pressable onPress={() => removeIngredient(index)} className="mt-2 self-start">
                <Text className="text-sm text-red-500">Remover</Text>
              </Pressable>
            ) : null}
          </View>
        ))}

        <Pressable
          onPress={addIngredient}
          className="mb-6 rounded-xl border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
          <Text className="text-center text-sm font-medium text-neutral-500 dark:text-neutral-400">
            + Adicionar ingrediente
          </Text>
        </Pressable>

        {error ? <Text className="mb-4 text-center text-sm text-red-500">{error}</Text> : null}
      </ScrollView>
    </View>
  );
}
