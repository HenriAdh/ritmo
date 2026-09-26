import { Pressable, Text, View } from 'react-native';

import { AGENDA_KIND_LABELS } from '@/src/utils/day-agenda';
import {
  DAY_STATUS_LABELS,
  type DayItemStatus,
  type DaySummaryItem,
} from '@/src/utils/day-summary';

const BADGE_CLASS: Record<DaySummaryItem['kind'], string> = {
  workout: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  meal: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
};

type StatusBadge = { glyph: string; root: string };

// Glifos de texto em vez de fonte de ícones: mesmo padrão do checkbox de
// /plan/[weekday] e sem depender do carregamento da MaterialIcons.
const STATUS_BADGE: Record<DayItemStatus, StatusBadge> = {
  pending: { glyph: '', root: 'border-neutral-300 dark:border-neutral-700' },
  done: { glyph: '✓', root: 'border-transparent bg-neutral-900 dark:bg-neutral-100' },
  partial: { glyph: '–', root: 'border-transparent bg-amber-500' },
  skipped: { glyph: '✕', root: 'border-neutral-300 dark:border-neutral-700' },
};

const GLYPH_CLASS: Record<DayItemStatus, string> = {
  pending: '',
  done: 'text-white dark:text-black',
  partial: 'text-white',
  skipped: 'text-neutral-400 dark:text-neutral-600',
};

const TITLE_CLASS: Record<DayItemStatus, string> = {
  pending: 'text-neutral-900 dark:text-neutral-100',
  done: 'text-neutral-400 line-through dark:text-neutral-500',
  partial: 'text-neutral-700 dark:text-neutral-300',
  skipped: 'text-neutral-400 dark:text-neutral-500',
};

type DaySummaryRowProps = {
  item: DaySummaryItem;
  onPress: (item: DaySummaryItem) => void;
};

export function DaySummaryRow({ item, onPress }: DaySummaryRowProps) {
  const badge = STATUS_BADGE[item.status];

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${DAY_STATUS_LABELS[item.status]}`}
      className="mb-1 flex-row items-center rounded-lg bg-neutral-100 px-3 py-2 active:bg-neutral-200 dark:bg-neutral-900 dark:active:bg-neutral-800">
      <View
        className={`mr-2 h-5 w-5 items-center justify-center rounded-full border ${badge.root}`}>
        {badge.glyph ? (
          <Text className={`text-xs font-bold ${GLYPH_CLASS[item.status]}`}>{badge.glyph}</Text>
        ) : null}
      </View>
      <View className={`mr-2 rounded px-1.5 py-0.5 ${BADGE_CLASS[item.kind]}`}>
        <Text className="text-[10px] font-semibold uppercase">
          {AGENDA_KIND_LABELS[item.kind]}
        </Text>
      </View>
      <Text className={`flex-1 text-sm ${TITLE_CLASS[item.status]}`}>{item.title}</Text>
      <Text className="ml-2 text-sm text-neutral-500 dark:text-neutral-400">
        {item.time ?? '--:--'}
      </Text>
    </Pressable>
  );
}
