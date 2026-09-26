/* global jest */

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({})),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-crypto', () => ({
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  getRandomBytes: (size) => new Uint8Array(size).map((_, i) => (i + 1) % 256),
  digestStringAsync: async (_algorithm, data = '') => `digest-${data}`,
}));

// useSafeAreaInsets() lança fora de um SafeAreaProvider, e o ScreenHeader usa
// em toda tela. Insets zeradas resolvem no teste sem provider real.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
}));