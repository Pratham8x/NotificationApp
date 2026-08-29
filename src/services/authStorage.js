import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@chirpy/session';
export const saveSession = session => AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
export const getSession = async () => {
  const value = await AsyncStorage.getItem(SESSION_KEY);
  return value ? JSON.parse(value) : null;
};
export const clearSession = () => AsyncStorage.removeItem(SESSION_KEY);
