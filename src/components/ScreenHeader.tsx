import { useColorScheme } from 'nativewind';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ink } from '@/src/theme/colors';

export type HeaderAction = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** `default` some; `positive` para marcar algo como feito; `danger` para remover. */
  tone?: 'default' | 'positive' | 'danger';
};

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Sem isso, nenhum botão de voltar é desenhado. */
  onBack?: () => void;
  /** Desenhadas da esquerda para a direita no slot direito. */
  actions?: HeaderAction[];
  /** Conteúdo solto no lugar das ações, para contadores como "2/5". */
  right?: ReactNode;
};

const TONE_CLASSES: Record<NonNullable<HeaderAction['tone']>, string> = {
  default: 'text-neutral-900 dark:text-neutral-100',
  positive: 'text-success-600 dark:text-success-500',
  danger: 'text-danger-600 dark:text-danger-500',
};

/** Respiro entre o topo da tela e o título, somado ao inset da safe area. */
const TOP_PADDING = 12;

// Canto de duas bordas girado 45 graus: um chevron que não depende de nenhuma
// fonte de ícone, que o projeto ainda não tem resolvida.
//
// A ponta do chevron é o vértice do canto, não a abertura. Aqui o vértice fica
// embaixo à esquerda e o giro de 45 graus abre os dois braços para a direita,
// então a ponta aponta para a esquerda, como manda a convenção de "voltar".
// Trocar `border-l` por `border-r` e `rotate-45` por `-rotate-45` é o espelho
// exato e aponta para a direita; trocar só o sinal do giro aponta para baixo.
function BackChevron() {
  return (
    <View
      testID="back-chevron"
      className="h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-neutral-900 dark:border-neutral-100"
    />
  );
}

function HeaderActionButton({ action }: { action: HeaderAction }) {
  const { colorScheme } = useColorScheme();
  const busy = action.loading ?? false;
  const disabled = (action.disabled ?? false) || busy;

  return (
    <Pressable
      onPress={action.onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={action.label}
      accessibilityState={{ disabled, busy }}
      hitSlop={8}
      className="ml-2 min-h-10 items-center justify-center rounded-full px-2 active:bg-neutral-100 disabled:opacity-50 dark:active:bg-neutral-800">
      {busy ? (
        <ActivityIndicator size="small" color={ink('strong', colorScheme === 'dark')} />
      ) : (
        <Text className={`text-base font-semibold ${TONE_CLASSES[action.tone ?? 'default']}`}>
          {action.label}
        </Text>
      )}
    </Pressable>
  );
}

export function ScreenHeader({ title, subtitle, onBack, actions, right }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      testID="screen-header"
      style={{ paddingTop: insets.top + TOP_PADDING }}
      className="bg-white px-4 pb-4 dark:bg-black">
      <View className="flex-row items-start">
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={8}
            className="-ml-2 mr-1 h-10 w-10 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800">
            <BackChevron />
          </Pressable>
        ) : null}

        <View className="flex-1">
          <Text
            className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
            numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              className="mt-0.5 text-sm capitalize text-neutral-500 dark:text-neutral-400"
              numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {right ? <View className="ml-2 min-h-10 items-center justify-center">{right}</View> : null}
        {actions?.map((action) => (
          <HeaderActionButton key={action.label} action={action} />
        ))}
      </View>
    </View>
  );
}
