import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { WorkoutForm } from '@/src/components/workout/WorkoutForm';
import { useWorkout } from '@/src/hooks/useWorkout';

export default function EditWorkoutScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const { detail } = useWorkout(workoutId);

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return <WorkoutForm initial={detail} onSaved={() => router.back()} />;
}