import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';

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
        tabBarActiveTintColor: isDark ? '#fafafa' : '#171717',
        tabBarInactiveTintColor: isDark ? '#525252' : '#a3a3a3',
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home') }}
      />
      <Tabs.Screen
        name="plan/[weekday]"
        options={{ href: null, title: 'Planejar dia' }}
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