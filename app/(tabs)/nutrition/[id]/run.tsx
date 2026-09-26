import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import { IngredientLogRow } from '@/src/components/nutrition/IngredientLogRow';
import { useKeyboardHeight } from '@/src/hooks/useKeyboardHeight';
import { useMeal } from '@/src/hooks/useMeal';
import { useMealExecution } from '@/src/hooks/useMealExecution';
import {
  MEAL_STATUS_LABELS,
  resolveMealStatus,
  upsertMealLog,
  type MealExtraInput,
  type MealIngredientInput,
} from '@/src/services/meal-execution';
import { todayISO } from '@/src/utils/date';
import { parseQuantity } from '@/src/utils/quantity';

type ExtraDraft = {
  name: string;
  quantity: string;
};

type Draft = {
  done: boolean;
  quantities: Record<number, string>;
  extras: Record<string, ExtraDraft>;
  notes: string;
};

const EMPTY_EXTRA: ExtraDraft = { name: '', quantity: '' };

export default function MealRunScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mealId = Number(id);
  const date = todayISO();
  const { detail } = useMeal(mealId);
  const { execution, error } = useMealExecution(mealId, date);
  const keyboardHeight = useKeyboardHeight();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [extraKeys, setExtraKeys] = useState<string[]>([]);

  useEffect(() => {
    if (!execution) return;
    setDraft({
      done: execution.log?.status === 'eaten' || execution.log?.status === 'partial',
      quantities: Object.fromEntries(
        execution.items.map((item) => [
          item.ingredientId,
          item.eatenQuantity === null ? '' : String(item.eatenQuantity),
        ]),
      ),
      extras: Object.fromEntries(
        execution.extras.map((extra) => [
          extra.key,
          { name: extra.name, quantity: extra.quantity === null ? '' : String(extra.quantity) },
        ]),
      ),
      notes: execution.log?.notes ?? '',
    });
  }, [execution]);

  const nextExtraKey = useCallback(() => {
    if (!draft) {
      return 'x-new-1';
    }
    const base = `x-new-${Date.now()}`;
    let key = base;
    let i = 2;
    while (key in draft.extras || extraKeys.includes(key)) {
      key = `${base}-${i}`;
      i += 1;
    }
    return key;
  }, [draft, extraKeys]);

  const patchExtra = useCallback((key: string, patch: Partial<ExtraDraft>) => {
    setDraft((current) =>
      current
        ? {
            ...current,
            extras: { ...current.extras, [key]: { ...(current.extras[key] ?? EMPTY_EXTRA), ...patch } },
          }
        : current,
    );
  }, []);

  const setQuantity = useCallback((ingredientId: number, quantity: string) => {
    setDraft((current) =>
      current
        ? { ...current, quantities: { ...current.quantities, [ingredientId]: quantity } }
        : current,
    );
  }, []);

  const addExtra = () => {
    const key = nextExtraKey();
    setExtraKeys((current) => [...current, key]);
  };

  const removeExtra = (key: string) => {
    setExtraKeys((current) => current.filter((extraKey) => extraKey !== key));
    setDraft((current) => {
      if (!current) return current;
      const next = { ...current.extras };
      delete next[key];
      return { ...current, extras: next };
    });
  };

  const toggleDone = () => {
    setDraft((current) => (current ? { ...current, done: !current.done } : current));
  };

  const status = useMemo(() => {
    if (!draft) return null;
    return resolveMealStatus(
      draft.done,
      (execution?.items ?? []).map((item) => ({
        plannedQuantity: item.plannedQuantity,
        eatenQuantity: parseQuantity(draft.quantities[item.ingredientId] ?? ''),
      })),
    );
  }, [draft, execution]);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    setSaveError(null);
    try {
      const items: MealIngredientInput[] = (execution?.items ?? []).flatMap((item) => {
        const quantity = parseQuantity(draft.quantities[item.ingredientId] ?? '');
        return quantity === null ? [] : [{ ingredientId: item.ingredientId, quantity }];
      });

      const extras: MealExtraInput[] = [
        ...(execution?.extras ?? []).map((extra) => extra.key),
        ...extraKeys,
      ].flatMap((key) => {
        const name = (draft.extras[key]?.name ?? '').trim();
        if (!name) return [];
        return [{ name, quantity: parseQuantity(draft.extras[key]?.quantity ?? '') }];
      });

      await upsertMealLog({
        mealId,
        date,
        done: draft.done,
        notes: draft.notes.trim() || undefined,
        items,
        extras,
      });
      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erro ao salvar a refeição');
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

  if (!detail || !execution || !draft) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  const renderExtra = (key: string) => (
    <IngredientLogRow
      key={key}
      name=""
      isExtra
      unit={null}
      plannedQuantity={null}
      editedName={draft.extras[key]?.name ?? ''}
      eatenQuantity={draft.extras[key]?.quantity ?? ''}
      onChange={(patch) => patchExtra(key, patch)}
      onRemove={() => removeExtra(key)}
    />
  );

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="p-4"
      contentContainerStyle={{ paddingBottom: keyboardHeight + 12 }}
      keyboardShouldPersistTaps="handled">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {detail.meal.name}
          </Text>
          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{date}</Text>
        </View>
        <Pressable
          onPress={toggleDone}
          className="rounded-lg border border-neutral-300 px-3 py-2 dark:border-neutral-700">
          <Text
            className={`text-sm font-medium ${draft.done ? 'text-green-600' : 'text-neutral-500 dark:text-neutral-400'}`}>
            {draft.done ? 'Concluído' : 'Marcar como feito'}
          </Text>
        </Pressable>
      </View>

      <View className="mb-4 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          Registro: {status ? MEAL_STATUS_LABELS[status] : '-'}
        </Text>
      </View>

      {execution.items.length === 0 && execution.extras.length === 0 ? (
        <Text className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Essa refeição não tem ingrediente cadastrado.
        </Text>
      ) : (
        execution.items.map((item) => (
          <IngredientLogRow
            key={item.key}
            name={item.name}
            unit={item.unit}
            plannedQuantity={item.plannedQuantity}
            eatenQuantity={draft.quantities[item.ingredientId] ?? ''}
            onChange={(patch) =>
              patch.quantity !== undefined && setQuantity(item.ingredientId, patch.quantity)
            }
          />
        ))
      )}

      {execution.extras.map((extra) => renderExtra(extra.key))}
      {extraKeys.map((key) => renderExtra(key))}

      <Pressable onPress={addExtra} className="mb-4 mt-1 self-start py-2">
        <Text className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          + Adicionar ingrediente extra
        </Text>
      </Pressable>

      <TextField
        value={draft.notes}
        onChangeText={(text) =>
          setDraft((current) => (current ? { ...current, notes: text } : current))
        }
        placeholder="Observações (opcional)"
        className="mb-4"
      />

      {saveError ? <Text className="mb-3 text-center text-sm text-red-500">{saveError}</Text> : null}

      <Button label="Salvar refeição" onPress={handleSave} loading={saving} />
    </ScrollView>
  );
}
