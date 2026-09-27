import { Link } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/src/components/Button';
import { TextField } from '@/src/components/TextField';
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

      <TextField
        value={name}
        onChangeText={setName}
        placeholder="Nome"
        autoCapitalize="none"
        autoCorrect={false}
        className="mb-3"
      />
      <TextField
        value={password}
        onChangeText={setPassword}
        placeholder="Senha"
        secureTextEntry
        className="mb-3"
      />
      <TextField
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirmar senha"
        secureTextEntry
        className="mb-4"
      />

      {error ? <Text className="mb-3 text-center text-sm text-danger-500">{error}</Text> : null}

      <Button label="Criar conta" onPress={handleRegister} loading={submitting} />

      <Link href="/login" className="mt-4 text-center text-sm text-neutral-600 dark:text-neutral-300">
        Já tenho conta
      </Link>
    </View>
  );
}