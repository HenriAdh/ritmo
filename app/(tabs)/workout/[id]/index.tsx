import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { useWorkout } from '@/src/hooks/useWorkout';
import { deleteWorkout } from '@/src/services/workouts';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const { detail, error } = useWorkout(workoutId);

  const handleDelete = async () => {
    await deleteWorkout(workoutId);
    router.back();
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
              {detail.workout.title}
            </Text>
            <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
              {detail.exercises.length} exercício
              {detail.exercises.length === 1 ? '' : 's'}
            </Text>
          </View>
          <View className="px-4">
            {detail.exercises.map((exercise) => (
              <View
                key={exercise.id}
                className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                  {exercise.name}
                </Text>
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {exercise.planned_sets} x {exercise.planned_reps}
                </Text>
              </View>
            ))}
          </View>
          <View className="mt-auto border-t border-neutral-200 p-4 dark:border-neutral-800">
            <Button
              label="Iniciar treino"
              onPress={() => router.push({ pathname: '/workout/[id]/run', params: { id } })}
              className="mb-3"
            />
            <Button
              label="Editar"
              onPress={() => router.push({ pathname: '/workout/[id]/edit', params: { id } })}
              className="mb-3"
            />
            <Button label="Excluir" onPress={handleDelete} />
          </View>
        </View>
      )}
    </View>
  );
}