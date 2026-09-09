/* global jest */
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));
jest.mock('@react-native-vector-icons/ionicons', () => ({
  Ionicons: () => null,
}));
jest.mock('@react-native-firebase/messaging', () => ({
  getMessaging: jest.fn(),
  getToken: jest.fn(),
  requestPermission: jest.fn(),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
jest.mock('react-native-audio-api', () => ({
  AudioContext: jest.fn(() => ({
    currentTime: 0,
    destination: {},
    resume: jest.fn(() => Promise.resolve()),
    createBuffer: jest.fn(() => ({ getChannelData: () => new Float32Array() })),
    createBufferSource: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    })),
  })),
  AudioManager: {
    setAudioSessionOptions: jest.fn(),
    requestRecordingPermissions: jest.fn(() => Promise.resolve('Granted')),
    setAudioSessionActivity: jest.fn(() => Promise.resolve()),
  },
  AudioRecorder: jest.fn(() => ({
    onAudioReady: jest.fn(),
    clearOnAudioReady: jest.fn(),
    start: jest.fn(() => Promise.resolve({ status: 'success' })),
    stop: jest.fn(() => Promise.resolve()),
  })),
}));
