import { useRouter } from 'expo-router';

import { WorkoutForm } from '@/src/components/workout/WorkoutForm';

export default function NewWorkoutScreen() {
  const router = useRouter();

  return <WorkoutForm onSaved={() => router.back()} />;
}