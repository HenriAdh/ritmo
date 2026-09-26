import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import type { WeighIn } from '@/src/types';
import { formatShortDate } from '@/src/utils/date';
import { formatWeight } from '@/src/utils/weight';

type PhotoTimelineProps = {
  weighIns: readonly WeighIn[];
};

export function PhotoTimeline({ weighIns }: PhotoTimelineProps) {
  // Guardamos a URI como referência à galeria, então o arquivo pode sumir se a
  // pessoa apagar a foto lá. Quando o Image falha, mostramos o aviso no lugar.
  const [broken, setBroken] = useState<ReadonlySet<number>>(new Set());
  const withPhoto = [...weighIns].reverse().filter((entry) => entry.photo_uri);

  if (withPhoto.length === 0) {
    return null;
  }

  const markBroken = (id: number) => {
    setBroken((current) => new Set(current).add(id));
  };

  return (
    <View className="gap-3">
      {withPhoto.map((entry) => (
        <View
          key={entry.id}
          className="flex-row items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-xl bg-neutral-200 dark:bg-neutral-800">
            {broken.has(entry.id) || !entry.photo_uri ? (
              <Text className="px-1 text-center text-xs text-neutral-500 dark:text-neutral-400">
                Foto indisponível
              </Text>
            ) : (
              <Image
                source={{ uri: entry.photo_uri }}
                className="h-full w-full"
                resizeMode="cover"
                testID="photo-image"
                onError={() => markBroken(entry.id)}
              />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {formatWeight(entry.weight)} kg
            </Text>
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatShortDate(entry.date)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
