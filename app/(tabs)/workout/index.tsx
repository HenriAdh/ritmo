import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useAuthStore } from '@/src/stores/auth-store';
import { useWorkouts } from '@/src/hooks/useWorkouts';

export default function WorkoutListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { workouts, error } = useWorkouts(user?.id ?? 0);

  if (!user) {
    return null;
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title="Treinos"
        actions={[{ label: 'Novo', onPress: () => router.push('/workout/new') }]}
      />

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : workouts === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-4"
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-center text-neutral-500 dark:text-neutral-400">
                Nenhum treino cadastrado ainda.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/workout/[id]', params: { id: String(item.id) } }} asChild>
              <Pressable className="mb-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </Text>
                <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {item.exerciseCount} exercício{item.exerciseCount === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}