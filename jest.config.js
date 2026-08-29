module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['./jest.setup.js'],
  transform: {'^.+\\.[jt]sx?$': 'babel-jest'},
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|react-redux|@reduxjs|redux|immer|reselect)/)',
  ],
};
