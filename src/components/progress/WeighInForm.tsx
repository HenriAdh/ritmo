import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
import type { WeighInInput } from '@/src/services/weigh-ins';
import type { WeighIn } from '@/src/types';
import { todayISO } from '@/src/utils/date';
import { formatWeight, parseWeight } from '@/src/utils/weight';

type WeighInFormProps = {
  today: WeighIn | null;
  saving: boolean;
  onSubmit: (input: WeighInInput) => Promise<void>;
};

export function WeighInForm({ today, saving, onSubmit }: WeighInFormProps) {
  const [weight, setWeight] = useState(today ? formatWeight(today.weight) : '');
  const [photoUri, setPhotoUri] = useState<string | null>(today?.photo_uri ?? null);
  const [error, setError] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const pickPhoto = async () => {
    setPicking(true);
    setError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!result.canceled) {
        setPhotoUri(result.assets[0]?.uri ?? null);
      }
    } catch {
      setError('Não foi possível abrir a galeria.');
    } finally {
      setPicking(false);
    }
  };

  const submit = async () => {
    const parsed = parseWeight(weight);
    if (parsed === null) {
      setError('Informe um peso válido, como 82,4.');
      return;
    }
    setError(null);
    // A data fica implícita: o formulário sempre edita o registro de hoje.
    await onSubmit({ date: today?.date ?? todayISO(), weight: parsed, photoUri });
  };

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Peso de hoje (kg)
        </Text>
        <TextField
          value={weight}
          onChangeText={setWeight}
          placeholder="82,4"
          keyboardType="decimal-pad"
          returnKeyType="done"
          onSubmitEditing={submit}
          accessibilityLabel="Peso de hoje em quilogramas"
        />
      </View>

      <Pressable
        onPress={pickPhoto}
        disabled={picking}
        accessibilityRole="button"
        accessibilityLabel="Escolher foto da galeria"
        className="flex-row items-center gap-3 rounded-xl border border-dashed border-neutral-300 p-3 active:bg-neutral-100 dark:border-neutral-700 dark:active:bg-neutral-800">
        {photoUri ? (
          <Image source={{ uri: photoUri }} className="h-12 w-12 rounded-lg" resizeMode="cover" />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-lg bg-neutral-200 dark:bg-neutral-800">
            <Text className="text-lg text-neutral-500 dark:text-neutral-400">+</Text>
          </View>
        )}
        <Text className="flex-1 text-sm text-neutral-600 dark:text-neutral-300">
          {picking ? 'Abrindo a galeria...' : photoUri ? 'Trocar a foto' : 'Adicionar foto (opcional)'}
        </Text>
      </Pressable>

      {error ? (
        <Text className="text-sm text-danger-600 dark:text-danger-500">{error}</Text>
      ) : null}

      <Button label={today ? 'Atualizar peso' : 'Salvar peso'} loading={saving} onPress={submit} />
    </View>
  );
}
