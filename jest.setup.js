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