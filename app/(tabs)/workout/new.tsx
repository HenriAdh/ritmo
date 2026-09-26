import { useRouter } from 'expo-router';

import { WorkoutForm } from '@/src/components/workout/WorkoutForm';

export default function NewWorkoutScreen() {
  const router = useRouter();

  return (
    <WorkoutForm
      screenTitle="Novo treino"
      onSaved={() => router.back()}
      onCancel={() => router.back()}
    />
  );
}
