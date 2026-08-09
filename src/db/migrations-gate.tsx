import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { ActivityIndicator, Text, View } from 'react-native';

import { db } from './client';
import migrations from './migrations/migrations';

type MigrationGateProps = {
  children: React.ReactNode;
};

export function MigrationGate({ children }: MigrationGateProps) {
  const { success, error } = useMigrations(db, migrations);

  if (error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="text-center text-sm text-red-500">
          Erro ao aplicar migrações: {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return children;
}
