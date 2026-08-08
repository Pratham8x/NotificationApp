import React, {useEffect, useState} from 'react';

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';

import {
  requestNotificationPermission,
  getFcmToken,
  registerFcmToken,
} from '../services/notificationService';

import {
  registerForegroundNotificationListener,
} from '../services/notificationListeners';

const HomeScreen = ({
  navigation,
  route,
}) => {
  const user = route?.params?.user;

  const [notificationSetup, setNotificationSetup] =
    useState(false);

  const [fcmToken, setFcmToken] =
    useState('');

  useEffect(() => {
    setupNotifications();

    const unsubscribe =
      registerForegroundNotificationListener();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const setupNotifications = async () => {
    try {
      console.log(
        '========== HOME NOTIFICATION SETUP =========='
      );

      if (!user?._id) {
        console.log(
          'User ID not found',
        );

        return;
      }

      // 1. Ask notification permission
      const permissionGranted =
        await requestNotificationPermission();

      console.log(
        'Permission granted:',
        permissionGranted,
      );

      if (!permissionGranted) {
        console.log(
          'Notification permission denied',
        );

        return;
      }

      // 2. Get FCM token
      const token =
        await getFcmToken();

      if (!token) {
        console.log(
          'FCM token not available',
        );

        return;
      }

      setFcmToken(token);

      console.log(
        'FCM token:',
        token,
      );

      // 3. Register token with backend
      await registerFcmToken(
        user._id,
        token,
      );

      setNotificationSetup(true);

      console.log(
        'FCM TOKEN REGISTERED SUCCESSFULLY',
      );

      console.log(
        '============================================'
      );

    } catch (error) {
      console.error(
        'Notification setup error:',
        error,
      );
    }
  };

  const handleLogout = () => {
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>

      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>
            Welcome 👋
          </Text>

          <Text style={styles.name}>
            {user?.name || 'User'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.notificationsButton}
            onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.notificationsText}>
              Notifications
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}>
            <Text style={styles.logoutText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>

        <Text style={styles.cardTitle}>
          Notification Status
        </Text>

        {notificationSetup ? (
          <>
            <Text style={styles.success}>
              ✓ FCM Connected
            </Text>

            <Text
              style={styles.token}
              numberOfLines={2}>
              {fcmToken}
            </Text>
          </>
        ) : (
          <View style={styles.loadingRow}>
            <ActivityIndicator />

            <Text style={styles.loadingText}>
              Setting up notifications...
            </Text>
          </View>
        )}

      </View>

      <View style={styles.statsContainer}>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            12
          </Text>

          <Text style={styles.statLabel}>
            Notifications
          </Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            5
          </Text>

          <Text style={styles.statLabel}>
            Messages
          </Text>
        </View>

      </View>

      <View style={styles.testCard}>

        <Text style={styles.testTitle}>
          FCM Testing
        </Text>

        <Text style={styles.testText}>
          Your device is registered for
          push notifications.
        </Text>

        <Text style={styles.testText}>
          Send a notification from Postman
          to test FCM.
        </Text>

      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f6fa',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 25,
  },

  welcome: {
    fontSize: 16,
    color: '#777',
  },

  name: {
    fontSize: 27,
    fontWeight: '700',
    color: '#222',
    marginTop: 3,
  },

  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  notificationsButton: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
  },

  notificationsText: {
    color: '#2563eb',
    fontWeight: '600',
  },

  logoutButton: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 15,
    paddingVertical: 9,
    borderRadius: 8,
  },

  logoutText: {
    color: '#dc2626',
    fontWeight: '600',
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    elevation: 3,
    marginBottom: 20,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 15,
  },

  success: {
    color: '#16a34a',
    fontSize: 16,
    fontWeight: '600',
  },

  token: {
    marginTop: 10,
    fontSize: 11,
    color: '#777',
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  loadingText: {
    marginLeft: 10,
    color: '#777',
  },

  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },

  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    elevation: 2,
  },

  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2563eb',
  },

  statLabel: {
    color: '#777',
    marginTop: 5,
  },

  testCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    elevation: 2,
  },

  testTitle: {
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 10,
  },

  testText: {
    color: '#666',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 5,
  },
});

export default HomeScreen;