import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { useAuthStore } from '@/src/stores/auth-store';
import { useWorkoutPlan } from '@/src/hooks/useWorkoutPlan';
import { WEEKDAY_NAMES } from '@/src/services/workout-plan';

export default function HomeScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekdays, error } = useWorkoutPlan(user?.id ?? -1);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-center text-sm text-red-500">{error}</Text>
      </View>
    );
  }

  if (weekdays === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="p-4">
      <View className="mb-4">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Planejamento da semana
        </Text>
        <Text className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Organize seus treinos por dia.
        </Text>
      </View>

      {WEEKDAY_NAMES.map((dayName, index) => {
        const weekday = index;
        const workouts = weekdays[weekday] ?? [];
        return (
          <Pressable
            key={weekday}
            onPress={() =>
              router.push({ pathname: '/plan/[weekday]', params: { weekday: String(weekday) } })
            }
            className="mb-3 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {dayName}
              </Text>
              <Text className="text-sm text-indigo-600 dark:text-indigo-400">
                {workouts.length > 0
                  ? workouts.length === 1
                    ? '1 treino'
                    : `${workouts.length} treinos`
                  : 'Nenhum treino'}
              </Text>
            </View>
            {workouts.length > 0 ? (
              <View className="mt-2">
                {workouts.map((workout) => (
                  <View
                    key={workout.id}
                    className="mb-1 rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-900">
                    <Text className="text-sm text-neutral-700 dark:text-neutral-300">
                      {workout.title}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}