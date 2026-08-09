import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { registerUser } from '@/src/services/auth';
import { useAuthStore } from '@/src/stores/auth-store';

export default function RegisterScreen() {
  const signIn = useAuthStore((state) => state.signIn);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = async () => {
    setError(null);
    if (password !== confirmPassword) {
      setError('As senhas não conferem');
      return;
    }
    setSubmitting(true);
    try {
      const user = await registerUser({ name, password });
      signIn(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white px-6 dark:bg-black">
      <Text className="mb-8 text-center text-3xl font-bold text-neutral-900 dark:text-neutral-100">
        Ritmo
      </Text>

      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Nome"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        placeholderTextColor="#9ca3af"
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        className="mb-3 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        placeholderTextColor="#9ca3af"
      />
      <TextInput
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirmar senha"
        secureTextEntry
        className="mb-4 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        placeholderTextColor="#9ca3af"
      />

      {error ? <Text className="mb-3 text-center text-sm text-red-500">{error}</Text> : null}

      <Pressable
        onPress={handleRegister}
        disabled={submitting}
        className="items-center rounded-xl bg-neutral-900 py-3 dark:bg-neutral-100">
        {submitting ? (
          <ActivityIndicator color="#fafafa" />
        ) : (
          <Text className="text-base font-semibold text-white dark:text-black">Criar conta</Text>
        )}
      </Pressable>

      <Link href="/login" className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Já tenho conta
      </Link>
    </View>
  );
}
