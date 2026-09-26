import { Text, View } from 'react-native';
import type { ReactNode } from 'react';

type ModulePlaceholderProps = {
  description: string;
  /** O header entra acima do texto, que segue centralizado no espaço que sobra. */
  header?: ReactNode;
};

export function ModulePlaceholder({ description, header }: ModulePlaceholderProps) {
  return (
    <View className="flex-1 bg-white dark:bg-black">
      {header}
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </Text>
      </View>
    </View>
  );
}
