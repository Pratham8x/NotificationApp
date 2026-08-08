const cron = require('node-cron');

const User = require('../models/User');

const {
  sendNotification,
} = require('./notificationService');

const startNotificationScheduler = () => {
  console.log(
    'Notification scheduler started',
  );

  cron.schedule('* * * * *', async () => {
    try {
      console.log(
        'Sending scheduled test notifications...',
      );

      const users = await User.find({
        'fcmTokens.0': {
          $exists: true,
        },
      });

      for (const user of users) {
        for (const device of user.fcmTokens) {
          try {
            await sendNotification({
              token: device.token,

              title: 'Test Notification 🔔',

              body:
                'This notification is being sent every minute.',

              data: {
                type: 'scheduled_test',
                screen: 'Home',
              },
            });

            console.log(
              `Notification sent to ${user.email}`,
            );
          } catch (error) {
            console.log(
              'Notification failed:',
              error.message,
            );
          }
        }
      }
    } catch (error) {
      console.error(
        'Scheduler error:',
        error,
      );
    }
  });
};

module.exports = {
  startNotificationScheduler,
};