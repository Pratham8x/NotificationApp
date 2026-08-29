/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-vector-icons/ionicons', () => ({Ionicons: () => null}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn(),
  requestPermission: jest.fn(),
  AuthorizationStatus: {AUTHORIZED: 1, PROVISIONAL: 2},
}));
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
