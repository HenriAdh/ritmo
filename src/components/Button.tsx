import { useColorScheme } from 'nativewind';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonProps = {
  label: string;
  loading?: boolean;
  className?: string;
} & Omit<PressableProps, 'children'>;

export function Button({ label, loading = false, className = '', disabled, ...props }: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      {...props}
      disabled={disabled ?? loading}
      className={`items-center rounded-xl bg-neutral-900 py-3 active:bg-neutral-800 disabled:opacity-60 dark:bg-neutral-100 dark:active:bg-neutral-200 ${className}`}>
      {loading ? (
        <ActivityIndicator color={isDark ? '#171717' : '#fafafa'} />
      ) : (
        <Text className="text-base font-semibold text-white dark:text-black">{label}</Text>
      )}
    </Pressable>
  );
}