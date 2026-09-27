import { useColorScheme } from 'nativewind';
import { useMemo, useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { ink } from '@/src/theme/colors';
import type { WeighIn } from '@/src/types';
import { formatShortDate } from '@/src/utils/date';
import { formatWeight } from '@/src/utils/weight';
import { buildWeightChart } from '@/src/utils/weight-chart';

const CHART_HEIGHT = 180;

type WeightChartProps = {
  weighIns: readonly WeighIn[];
};

export function WeightChart({ weighIns }: WeightChartProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [width, setWidth] = useState(0);

  const chart = useMemo(
    () => buildWeightChart(weighIns, { width, height: CHART_HEIGHT }),
    [weighIns, width],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const next = Math.round(event.nativeEvent.layout.width);
    setWidth((current) => (current === next ? current : next));
  };

  if (weighIns.length === 0) {
    return (
      <View className="items-center justify-center rounded-2xl border border-dashed border-neutral-300 p-8 dark:border-neutral-700">
        <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          Registre o peso para ver a evolução.
        </Text>
      </View>
    );
  }

  // Props de svg nao aceitam className, entao as cores saem do token de ink.
  const stroke = ink('strong', isDark);
  const grid = ink('faint', isDark);
  const areaFrom = ink('muted', isDark);
  const areaTo = ink('inverse', isDark);

  return (
    <View onLayout={onLayout}>
      {chart ? (
        <>
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="weightArea" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={areaFrom} stopOpacity={0.35} />
                <Stop offset="1" stopColor={areaTo} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Path
              d={`M ${chart.innerLeft} ${chart.baselineY} L ${chart.innerRight} ${chart.baselineY}`}
              stroke={grid}
              strokeWidth={1}
            />

            {chart.area ? <Path d={chart.area} fill="url(#weightArea)" /> : null}
            <Path
              d={chart.line}
              stroke={stroke}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {chart.points.map((point) => (
              <Circle
                key={point.id}
                cx={point.x}
                cy={point.y}
                r={chart.points.length > 30 ? 2 : 3}
                fill={stroke}
              />
            ))}
          </Svg>

          <View className="mt-1 flex-row justify-between">
            <Text className="text-xs text-neutral-500 dark:text-neutral-400">
              {formatShortDate(chart.points[0].date)}
            </Text>
            {chart.points.length > 1 ? (
              <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                {formatShortDate(chart.points[chart.points.length - 1].date)}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}

      <Text className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
        {`de ${formatWeight(chart?.dataMin ?? 0)} a ${formatWeight(chart?.dataMax ?? 0)} kg`}
      </Text>
    </View>
  );
}
