import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { DayAgendaRow } from '@/src/components/plan/DayAgendaRow';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useAuthStore } from '@/src/stores/auth-store';
import { useMealPlan } from '@/src/hooks/useMealPlan';
import { useWorkoutPlan } from '@/src/hooks/useWorkoutPlan';
import { buildDayAgenda } from '@/src/utils/day-agenda';
import { WEEKDAY_NAMES } from '@/src/utils/weekday';

function itemLabel(count: number): string {
  if (count === 0) {
    return 'Sem plano';
  }
  return count === 1 ? '1 item' : `${count} itens`;
}

export default function PlanScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { weekdays: workoutWeekdays, error: workoutError } = useWorkoutPlan(user?.id ?? -1);
  const { weekdays: mealWeekdays, error: mealError } = useMealPlan(user?.id ?? -1);

  const error = workoutError ?? mealError;

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-center text-sm text-danger-500">{error}</Text>
      </View>
    );
  }

  if (workoutWeekdays === null || mealWeekdays === null) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title="Planejar"
        subtitle="Organize seu dia por treino, alimentação, cozinha e compras."
      />

      <ScrollView className="flex-1" contentContainerClassName="p-4">
        {WEEKDAY_NAMES.map((dayName, index) => {
          const weekday = index;
          const workoutEntries = workoutWeekdays[weekday] ?? [];
          const mealEntries = mealWeekdays[weekday] ?? [];
          const total = workoutEntries.length + mealEntries.length;
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
                <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                  {itemLabel(total)}
                </Text>
              </View>
              {total > 0 ? (
                <View className="mt-2">
                  {buildDayAgenda(workoutEntries, mealEntries).map((item) => (
                    <DayAgendaRow key={item.key} item={item} />
                  ))}
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
