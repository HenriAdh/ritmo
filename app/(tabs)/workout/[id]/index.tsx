import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Alert, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useWorkout } from '@/src/hooks/useWorkout';
import { deleteWorkout } from '@/src/services/workouts';

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workoutId = Number(id);
  const { detail, error } = useWorkout(workoutId);

  const confirmDelete = () => {
    if (!detail) return;
    Alert.alert(
      'Excluir treino',
      `Tem certeza que quer excluir "${detail.workout.title}"? Essa ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await deleteWorkout(workoutId);
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
          <Text className="text-center text-sm text-danger-500">{error}</Text>
        </View>
      ) : !detail ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <View className="flex-1">
          <ScreenHeader
            title={detail.workout.title}
            subtitle={`${detail.exercises.length} exercício${detail.exercises.length === 1 ? '' : 's'}`}
            onBack={() => router.back()}
            actions={[
              {
                label: 'Editar',
                onPress: () => router.push({ pathname: '/workout/[id]/edit', params: { id } }),
              },
            ]}
          />
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
              className="mb-4"
            />
            <Button label="Excluir treino" variant="danger" onPress={confirmDelete} />
          </View>
        </View>
      )}
    </View>
  );
}