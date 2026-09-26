import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { getDaySummary, type DaySummary } from '@/src/services/day-summary';
import { todayISO } from '@/src/utils/date';
import { todayWeekday } from '@/src/utils/weekday';

export function useDaySummary(userId: number) {
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Data e dia da semana são lidos a cada refresh para virar o dia certinho
  // caso o app fique aberto atravessando a meia-noite.
  const refresh = useCallback(async () => {
    try {
      setSummary(await getDaySummary(userId, todayISO(), todayWeekday()));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o resumo do dia');
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { summary, error, refresh };
}
