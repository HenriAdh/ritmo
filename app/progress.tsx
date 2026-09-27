import { useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/src/components/ScreenHeader';
import { PhotoTimeline } from '@/src/components/progress/PhotoTimeline';
import { WeighInForm } from '@/src/components/progress/WeighInForm';
import { WeightChart } from '@/src/components/progress/WeightChart';
import { useWeighIns } from '@/src/hooks/useWeighIns';
import { useAuthStore } from '@/src/stores/auth-store';
import { formatWeight, formatWeightDelta, weightTrend } from '@/src/utils/weight';

const trendColors = {
  up: 'text-danger-600 dark:text-danger-500',
  down: 'text-success-600 dark:text-success-500',
  stable: 'text-neutral-500 dark:text-neutral-400',
};

export default function ProgressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const { weighIns, today, error, saving, save } = useWeighIns(user?.id ?? -1);

  if (error && !weighIns) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
        <Text className="text-center text-sm text-danger-500">{error}</Text>
      </View>
    );
  }

  if (!weighIns) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator />
      </View>
    );
  }

  const trend = weightTrend(weighIns.map((entry) => entry.weight));
  const current = weighIns[weighIns.length - 1];

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <ScreenHeader
        title="Progresso"
        subtitle="Acompanhe o peso e as fotos ao longo do tempo."
        onBack={() => router.back()}
      />

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-6 p-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <WeighInForm today={today} saving={saving} onSubmit={save} />
        {error ? <Text className="mt-2 text-sm text-danger-600 dark:text-danger-500">{error}</Text> : null}
      </View>

      {current && trend ? (
        <View className="flex-row items-center justify-between rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <View>
            <Text className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Peso atual
            </Text>
            <Text className="mt-1 text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              {formatWeight(current.weight)} kg
            </Text>
          </View>
          <Text className={`text-sm font-semibold ${trendColors[trend.direction]}`}>
            {formatWeightDelta(trend.delta)}
          </Text>
        </View>
      ) : null}

      <View>
        <Text className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
          Evolução
        </Text>
        <WeightChart weighIns={weighIns} />
      </View>

      {weighIns.some((entry) => entry.photo_uri) ? (
        <View>
          <Text className="mb-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Fotos
          </Text>
          <PhotoTimeline weighIns={weighIns} />
        </View>
      ) : null}
      </ScrollView>
    </View>
  );
}
