import { Text, View } from 'react-native';

type ModulePlaceholderProps = {
  title: string;
  description: string;
};

export function ModulePlaceholder({ title, description }: ModulePlaceholderProps) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-black">
      <Text className="mb-2 text-2xl font-bold text-neutral-900 dark:text-neutral-100">
        {title}
      </Text>
      <Text className="text-center text-sm text-neutral-500 dark:text-neutral-400">
        {description}
      </Text>
    </View>
  );
}