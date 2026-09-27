import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';

import { ink, shade } from '@/src/theme/colors';

type IconName = keyof typeof MaterialIcons.glyphMap;

function tabIcon(name: IconName) {
  return function TabBarIcon({ color, size }: { color: string; size: number }) {
    return <MaterialIcons name={name} size={size} color={color} />;
  };
}

export default function TabLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: shade('primary', isDark ? 400 : 600),
        tabBarInactiveTintColor: ink('subtle', isDark),
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="plan"
        options={{ title: 'Planejar', tabBarIcon: tabIcon('calendar-month') }}
      />
      <Tabs.Screen
        name="workout"
        options={{ title: 'Treino', tabBarIcon: tabIcon('fitness-center') }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{ title: 'Alimentação', tabBarIcon: tabIcon('restaurant') }}
      />
      <Tabs.Screen
        name="shopping"
        options={{ title: 'Compras', tabBarIcon: tabIcon('shopping-cart') }}
      />
      <Tabs.Screen
        name="cooking"
        options={{ title: 'Cozinha', tabBarIcon: tabIcon('kitchen') }}
      />
    </Tabs>
  );
}