import { Link, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { useMeals } from '@/src/hooks/useMeals';
import { useAuthStore } from '@/src/stores/auth-store';
import { WEEKDAY_NAMES } from '@/src/utils/weekday';

export default function MealListScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekdays, error } = useMeals(user?.id ?? 0);

  if (!user) {
    return null;
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      {error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-sm text-red-500">{error}</Text>
        </View>
      ) : weekdays === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerClassName="p-4">
          {WEEKDAY_NAMES.map((dayName, index) => {
            const weekday = index;
            const entries = weekdays[weekday] ?? [];
            return (
              <View key={dayName} className="mb-5">
                <Text className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                  {dayName}
                </Text>
                {entries.length === 0 ? (
                  <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                    Sem refeições
                  </Text>
                ) : (
                  entries.map((meal) => (
                    <Link
                      key={meal.id}
                      href={{ pathname: '/nutrition/[id]', params: { id: String(meal.id) } }}
                      asChild>
                      <Pressable className="mb-2 flex-row items-center justify-between rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
                        <View className="flex-1 pr-3">
                          <Text className="text-base font-medium text-neutral-900 dark:text-neutral-100">
                            {meal.name}
                          </Text>
                          <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {meal.ingredientCount} ingrediente
                            {meal.ingredientCount === 1 ? '' : 's'}
                          </Text>
                        </View>
                        <Text className="text-sm text-indigo-600 dark:text-indigo-400">
                          {meal.time}
                        </Text>
                      </Pressable>
                    </Link>
                  ))
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
      <View className="border-t border-neutral-200 p-4 dark:border-neutral-800">
        <Button label="Nova refeição" onPress={() => router.push('/nutrition/new')} />
      </View>
    </View>
  );
}
