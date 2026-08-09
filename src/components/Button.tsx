import { useColorScheme } from 'nativewind';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type ButtonVariant = 'primary' | 'danger';

type ButtonProps = {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
} & Omit<PressableProps, 'children'>;

const variantStyles: Record<ButtonVariant, { root: string; label: string; spinner: string }> = {
  primary: {
    root: 'bg-neutral-900 active:bg-neutral-800 dark:bg-neutral-100 dark:active:bg-neutral-200',
    label: 'text-white dark:text-black',
    spinner: '',
  },
  danger: {
    root: 'border border-red-300 active:bg-red-50 dark:border-red-900 dark:active:bg-red-950',
    label: 'text-red-600 dark:text-red-500',
    spinner: 'text-red-600 dark:text-red-500',
  },
};

export function Button({
  label,
  loading = false,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const style = variantStyles[variant];
  const spinnerColor =
    variant === 'danger' ? (isDark ? '#ef4444' : '#dc2626') : isDark ? '#171717' : '#fafafa';

  return (
    <Pressable
      {...props}
      disabled={disabled ?? loading}
      className={`items-center rounded-xl py-3 disabled:opacity-60 ${style.root} ${className}`}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} className={style.spinner} />
      ) : (
        <Text className={`text-base font-semibold ${style.label}`}>{label}</Text>
      )}
    </Pressable>
  );
}