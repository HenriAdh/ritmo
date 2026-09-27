import { useColorScheme } from 'nativewind';
import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

import { ink, shade } from '@/src/theme/colors';

type ButtonVariant = 'primary' | 'danger';

type ButtonProps = {
  label: string;
  loading?: boolean;
  variant?: ButtonVariant;
  className?: string;
} & Omit<PressableProps, 'children'>;

const variantStyles: Record<ButtonVariant, { root: string; label: string; spinner: string }> = {
  primary: {
    // Branco sobre primary-600 da 5.70:1 e sobre primary-700 da 7.10:1, ambos
    // acima de 4.5:1. No escuro o 600 se mantem porque primary-500 com texto
    // branco cai para 4.23:1 e reprova em texto normal.
    root: 'bg-primary-600 active:bg-primary-700 dark:bg-primary-600 dark:active:bg-primary-500',
    label: 'text-white',
    spinner: '',
  },
  danger: {
    root: 'border border-danger-300 active:bg-danger-50 dark:border-danger-900 dark:active:bg-danger-950',
    label: 'text-danger-600 dark:text-danger-500',
    spinner: 'text-danger-600 dark:text-danger-500',
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
    variant === 'danger' ? shade('danger', isDark ? 500 : 600) : ink('onAccent', isDark);

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