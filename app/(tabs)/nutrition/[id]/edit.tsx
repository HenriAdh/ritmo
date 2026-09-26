import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { MealForm } from '@/src/components/nutrition/MealForm';
import { useMeal } from '@/src/hooks/useMeal';

export default function EditMealScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mealId = Number(id);
  const { detail } = useMeal(mealId);

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <MealForm
      initial={detail}
      screenTitle="Editar refeição"
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
