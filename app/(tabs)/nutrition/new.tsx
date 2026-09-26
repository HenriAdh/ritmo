import { useRouter } from 'expo-router';

import { MealForm } from '@/src/components/nutrition/MealForm';

export default function NewMealScreen() {
  const router = useRouter();

  return (
    <MealForm
      screenTitle="Nova refeição"
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
