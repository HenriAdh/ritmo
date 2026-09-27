import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useMeals } from '@/src/hooks/useMeals';
import { useAuthStore } from '@/src/stores/auth-store';

export default function MealListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { meals, error } = useMeals(user?.id ?? 0);

  if (!user) {
    return null;
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title="Refeições"
        actions={[{ label: 'Nova', onPress: () => router.push('/nutrition/new') }]}
      />

      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-danger-500">{error}</Text>
        </View>
      ) : meals === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <FlatList
          data={meals}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="p-4"
          ListEmptyComponent={
            <View className="items-center justify-center py-16">
              <Text className="text-center text-neutral-500 dark:text-neutral-400">
                Nenhuma refeição cadastrada ainda.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Link href={{ pathname: '/nutrition/[id]', params: { id: String(item.id) } }} asChild>
              <Pressable className="mb-3 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
                <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.name}
                </Text>
                <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  {item.ingredientCount} ingrediente{item.ingredientCount === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </Link>
          )}
        />
      )}
    </View>
  );
}
