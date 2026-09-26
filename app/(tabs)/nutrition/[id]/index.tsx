import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { useMeal } from '@/src/hooks/useMeal';
import { deleteMeal } from '@/src/services/meals';
import { weekdayName } from '@/src/utils/weekday';

export default function MealDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mealId = Number(id);
  const { detail, weekdays, error } = useMeal(mealId);

  const confirmDelete = () => {
    if (!detail) return;
    Alert.alert(
      'Excluir refeição',
      `Tem certeza que quer excluir "${detail.meal.name}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteMeal(mealId);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="flex-1">
          <View className="p-4">
            <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
              {detail.meal.name}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {weekdays.length === 0
                ? 'Nenhum dia vinculado'
                : `Planejada em ${weekdays
                    .slice()
                    .sort((a, b) => a.weekday - b.weekday)
                    .map((day) => weekdayName(day.weekday))
                    .join(', ')}`}
            </Text>
          </View>

          <View className="px-4">
            <Text className="mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              Ingredientes
            </Text>
            {detail.ingredients.length === 0 ? (
              <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                Nenhum ingrediente cadastrado.
              </Text>
            ) : (
              detail.ingredients.map((ingredient) => (
                <View
                  key={ingredient.id}
                  className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                  <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                    {ingredient.name}
                  </Text>
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    {ingredient.quantity === null && !ingredient.unit
                      ? ''
                      : [ingredient.quantity, ingredient.unit].filter(Boolean).join(' ')}
                  </Text>
                </View>
              ))
            )}
          </View>

          <View className="mt-auto border-t border-neutral-200 p-4 dark:border-neutral-800">
            <Button
              label="Registrar refeição"
              onPress={() => router.push({ pathname: '/nutrition/[id]/run', params: { id } })}
              className="mb-3"
            />
            <Button
              label="Editar"
              onPress={() => router.push({ pathname: '/nutrition/[id]/edit', params: { id } })}
              className="mb-4"
            />
            <View className="border-t border-neutral-100 pt-4 dark:border-neutral-900">
              <Button label="Excluir refeição" variant="danger" onPress={confirmDelete} />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
