import { Stack } from 'expo-router';

export default function WorkoutLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Treinos' }} />
      <Stack.Screen name="new" options={{ title: 'Novo treino' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Treino' }} />
      <Stack.Screen name="[id]/run" options={{ title: 'Executar treino' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Editar treino' }} />
    </Stack>
  );
}