import { Text, View } from 'react-native';

import { AGENDA_KIND_LABELS, type DayAgendaItem } from '@/src/utils/day-agenda';

const BADGE_CLASS: Record<DayAgendaItem['kind'], string> = {
  workout: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  meal: 'bg-warning-100 text-warning-800 dark:bg-warning-900 dark:text-warning-300',
};

type DayAgendaRowProps = {
  item: DayAgendaItem;
};

export function DayAgendaRow({ item }: DayAgendaRowProps) {
  return (
    <View className="mb-1 flex-row items-center rounded-lg bg-neutral-100 px-3 py-2 dark:bg-neutral-900">
      <View className={`mr-2 rounded px-1.5 py-0.5 ${BADGE_CLASS[item.kind]}`}>
        <Text className="text-[10px] font-semibold uppercase">
          {AGENDA_KIND_LABELS[item.kind]}
        </Text>
      </View>
      <Text className="flex-1 text-sm text-neutral-700 dark:text-neutral-300">
        {item.title}
      </Text>
      <Text className="ml-2 text-sm font-medium text-neutral-500 dark:text-neutral-400">
        {item.time ?? '--:--'}
      </Text>
    </View>
  );
}
