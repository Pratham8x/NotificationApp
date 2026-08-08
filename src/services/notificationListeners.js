import {getMessaging, onMessage} from '@react-native-firebase/messaging';

export const registerForegroundNotificationListener = () => {
  const messagingInstance = getMessaging();

  const unsubscribe = onMessage(messagingInstance, async remoteMessage => {
    console.log('======================================');
    console.log('FOREGROUND NOTIFICATION RECEIVED');
    console.log('======================================');

    console.log('Notification:', remoteMessage.notification);
    console.log('Data:', remoteMessage.data);
    console.log('Full message:', remoteMessage);
  });

  return unsubscribe;
};