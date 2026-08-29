import {Platform, PermissionsAndroid} from 'react-native';

import {
  getMessaging,
  getToken,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';

import api from './api';

// Android 13 (API 33)+ requires this runtime permission separately.
// Firebase's requestPermission() above only drives the iOS prompt — on
// Android it resolves AUTHORIZED even if POST_NOTIFICATIONS was never
// granted, which is why notifications can silently fail to show in the
// tray on newer emulator images.
const requestAndroidPostNotificationsPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) {
    return true;
  }

  const alreadyGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  if (alreadyGranted) {
    return true;
  }

  const result = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );

  console.log('POST_NOTIFICATIONS result:', result);

  return result === PermissionsAndroid.RESULTS.GRANTED;
};

export const requestNotificationPermission =
  async () => {
    try {
      const androidGranted =
        await requestAndroidPostNotificationsPermission();

      if (!androidGranted) {
        console.log(
          'Android POST_NOTIFICATIONS permission denied',
        );

        return false;
      }

      const messagingInstance =
        getMessaging();

      const authStatus =
        await requestPermission(
          messagingInstance,
        );

      const enabled =
        authStatus ===
          AuthorizationStatus.AUTHORIZED ||
        authStatus ===
          AuthorizationStatus.PROVISIONAL;

      console.log(
        'Notification permission:',
        authStatus,
      );

      return enabled;
    } catch (error) {
      console.error(
        'Permission error:',
        error,
      );

      return false;
    }
  };

export const getFcmToken = async () => {
  try {
    const messagingInstance =
      getMessaging();

    const token =
      await getToken(messagingInstance);

    console.log(
      'FCM TOKEN:',
      token,
    );

    return token;
  } catch (error) {
    console.error(
      'FCM token error:',
      error,
    );

    return null;
  }
};

export const registerFcmToken = async (
  userId,
  token,
) => {
  try {
    console.log(
      'Registering FCM token...',
    );

    const response = await api.post(
      '/notifications/register-token',
      {
        userId,
        token,
        deviceType: Platform.OS,
      },
    );

    console.log(
      'FCM registration response:',
      response.data,
    );

    return response.data;
  } catch (error) {
    console.error(
      'FCM registration error:',
      error?.response?.data ||
        error.message,
    );

    throw error;
  }
};
