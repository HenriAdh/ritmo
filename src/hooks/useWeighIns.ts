import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  deleteWeighIn,
  listWeighIns,
  saveWeighIn,
  type WeighInInput,
} from '@/src/services/weigh-ins';
import type { WeighIn } from '@/src/types';
import { todayISO } from '@/src/utils/date';

export function useWeighIns(userId: number) {
  const [weighIns, setWeighIns] = useState<WeighIn[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // O registro de hoje é o que o formulário edita, e sai da mesma lista que o
  // gráfico e a timeline usam. Buscar de novo aqui só abriria uma segunda
  // consulta e o risco de os dois ficarem fora de sincronia.
  const today = weighIns?.find((entry) => entry.date === todayISO()) ?? null;

  const refresh = useCallback(async () => {
    try {
      setWeighIns(await listWeighIns(userId));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o histórico de peso');
    }
  }, [userId]);

  // Lança de propósito: a tela precisa saber que falhou para manter o
  // formulário aberto, em vez de fechar e fingir que salvou.
  const save = useCallback(
    async (input: WeighInInput) => {
      setSaving(true);
      try {
        await saveWeighIn(userId, input);
        setError(null);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar o peso');
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [userId, refresh],
  );

  const remove = useCallback(
    async (id: number) => {
      try {
        await deleteWeighIn(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover o registro');
      }
    },
    [refresh],
  );

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  return { weighIns, today, error, saving, save, remove, refresh };
}
