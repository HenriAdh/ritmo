import { Stack } from 'expo-router';

export default function NutritionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Refeições' }} />
      <Stack.Screen name="new" options={{ title: 'Nova refeição' }} />
      <Stack.Screen name="[id]/index" options={{ title: 'Refeição' }} />
      <Stack.Screen name="[id]/run" options={{ title: 'Registrar refeição' }} />
      <Stack.Screen name="[id]/edit" options={{ title: 'Editar refeição' }} />
    </Stack>
  );
}
