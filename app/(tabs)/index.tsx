import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { DaySummaryRow } from '@/src/components/home/DaySummaryRow';
import { NextActivityCard } from '@/src/components/home/NextActivityCard';
import { useDaySummary } from '@/src/hooks/useDaySummary';
import { useAuthStore } from '@/src/stores/auth-store';
import { formatLongDate } from '@/src/utils/date';
import { activityRoute, type DaySummaryItem } from '@/src/utils/day-summary';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { summary, error } = useDaySummary(user?.id ?? -1);

  const open = (item: DaySummaryItem) => {
    router.push(activityRoute(item));
  };

  const goToPlan = () => {
    router.push('/plan');
  };

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-center text-sm text-red-500">{error}</Text>
      </View>
    );
  }

  if (!summary) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  const isEmpty = summary.items.length === 0;

  return (
    <ScrollView
      className="flex-1 bg-white dark:bg-black"
      contentContainerClassName="p-4"
      contentContainerStyle={{ paddingTop: insets.top + 16 }}>
      <View className="mb-6">
        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Hoje</Text>
        <Text className="mt-1 text-sm capitalize text-neutral-500 dark:text-neutral-400">
          {formatLongDate(new Date())}
        </Text>
      </View>

      {isEmpty ? (
        <>
          <Text className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Resumo do dia
          </Text>
          <View className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <Text className="mb-3 text-sm text-neutral-500 dark:text-neutral-400">
              Nada planejado para hoje. Escolha o que fazer no dia da semana.
            </Text>
            <Button label="Planejar o dia" onPress={goToPlan} />
          </View>
        </>
      ) : (
        <>
          <NextActivityCard
            next={summary.next}
            total={summary.total}
            completed={summary.completed}
            onOpen={open}
            onPlan={goToPlan}
          />

          <Text className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Resumo do dia
          </Text>

          {summary.items.map((item) => (
            <DaySummaryRow key={item.key} item={item} onPress={open} />
          ))}
        </>
      )}
    </ScrollView>
  );
}
