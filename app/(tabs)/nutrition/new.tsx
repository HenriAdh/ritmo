import { useRouter } from 'expo-router';

import { MealForm } from '@/src/components/nutrition/MealForm';

export default function NewMealScreen() {
  const router = useRouter();

  return <MealForm onSaved={() => router.back()} />;
}
