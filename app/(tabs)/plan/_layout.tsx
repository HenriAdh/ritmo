import { Stack } from 'expo-router';

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Planejar' }} />
      <Stack.Screen name="[weekday]" options={{ title: 'Planejar dia' }} />
    </Stack>
  );
}