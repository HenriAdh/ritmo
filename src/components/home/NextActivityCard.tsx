import { Pressable, Text, View } from 'react-native';

import { AGENDA_KIND_LABELS } from '@/src/utils/day-agenda';
import {
  ACTIVITY_ACTION_LABELS,
  progressLabel,
  type DaySummaryItem,
} from '@/src/utils/day-summary';

const BADGE_CLASS: Record<DaySummaryItem['kind'], string> = {
  workout: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  meal: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

type NextActivityCardProps = {
  next: DaySummaryItem | null;
  total: number;
  completed: number;
  onOpen: (item: DaySummaryItem) => void;
  onPlan: () => void;
};

export function NextActivityCard({
  next,
  total,
  completed,
  onOpen,
  onPlan,
}: NextActivityCardProps) {
  const counter = progressLabel(total, completed);

  if (!next) {
    return (
      <View className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <View className="mb-1 flex-row items-center gap-2">
          <View className="h-5 w-5 items-center justify-center rounded-full bg-neutral-900 dark:bg-neutral-100">
            <Text className="text-xs font-bold text-white dark:text-black">✓</Text>
          </View>
          <Text className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Nada pendente
          </Text>
        </View>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">{counter} hoje.</Text>
        <Pressable onPress={onPlan} className="mt-3 flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-neutral-900 underline dark:text-neutral-100">
            Planejar o dia
          </Text>
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">›</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onOpen(next)}
      accessibilityRole="button"
      accessibilityLabel={`${ACTIVITY_ACTION_LABELS[next.kind]}: ${next.title}`}
      className="mb-6 rounded-xl border border-neutral-200 bg-neutral-100 p-4 active:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800">
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400">
          Próxima atividade
        </Text>
        <Text className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
          {counter}
        </Text>
      </View>

      <View className="mb-3 flex-row items-center">
        <View className={`mr-2 rounded px-1.5 py-0.5 ${BADGE_CLASS[next.kind]}`}>
          <Text className="text-[10px] font-semibold uppercase">
            {AGENDA_KIND_LABELS[next.kind]}
          </Text>
        </View>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
          {next.time ?? 'Sem horário'}
        </Text>
      </View>

      <Text className="mb-4 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {next.title}
      </Text>

      <View className="flex-row items-center gap-1">
        <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {ACTIVITY_ACTION_LABELS[next.kind]}
        </Text>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">→</Text>
      </View>
    </Pressable>
  );
}
