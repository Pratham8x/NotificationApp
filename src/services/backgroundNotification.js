import {
  getMessaging,
  setBackgroundMessageHandler,
} from '@react-native-firebase/messaging';

const messagingInstance = getMessaging();

setBackgroundMessageHandler(messagingInstance, async remoteMessage => {
  console.log('========== BACKGROUND MESSAGE ==========');

  console.log(
    'Title:',
    remoteMessage?.notification?.title,
  );

  console.log(
    'Body:',
    remoteMessage?.notification?.body,
  );

  console.log('Data:', remoteMessage?.data);

  console.log('========================================');
});