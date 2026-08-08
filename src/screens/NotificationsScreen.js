import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';

// Dummy data just for testing the UI — swap this out once you're
// pulling real notification history from the backend.
const DUMMY_NOTIFICATIONS = [
  {
    id: '1',
    title: 'Test Notification',
    body: 'This notification is being sent every minute.',
    type: 'System',
    time: '2m ago',
    read: false,
  },
  {
    id: '2',
    title: 'New Message',
    body: 'You have a new message from the team chat.',
    type: 'Chat',
    time: '15m ago',
    read: false,
  },
  {
    id: '3',
    title: 'Task Assigned',
    body: 'A new task "Fix login bug" was assigned to you.',
    type: 'Task',
    time: '1h ago',
    read: true,
  },
  {
    id: '4',
    title: 'Login Alert',
    body: 'Your account was logged in from a new device.',
    type: 'Security',
    time: '3h ago',
    read: true,
  },
  {
    id: '5',
    title: 'Reminder',
    body: 'Daily attendance check-in closes in 30 minutes.',
    type: 'Reminder',
    time: 'Yesterday',
    read: true,
  },
];

const TYPE_COLORS = {
  System: '#2563eb',
  Chat: '#16a34a',
  Task: '#f59e0b',
  Security: '#dc2626',
  Reminder: '#7c3aed',
};

const NotificationCard = ({item}) => {
  const accentColor = TYPE_COLORS[item.type] || '#2563eb';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View
        style={[
          styles.accentBar,
          {backgroundColor: accentColor},
        ]}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>

          {!item.read && <View style={styles.unreadDot} />}
        </View>

        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body}
        </Text>

        <View style={styles.cardFooterRow}>
          <View
            style={[
              styles.typeBadge,
              {backgroundColor: `${accentColor}1A`},
            ]}>
            <Text style={[styles.typeBadgeText, {color: accentColor}]}>
              {item.type}
            </Text>
          </View>

          <Text style={styles.cardTime}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const NotificationsScreen = ({navigation}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Notifications</Text>

        <View style={styles.backButton} />
      </View>

      <FlatList
        data={DUMMY_NOTIFICATIONS}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => <NotificationCard item={item} />}
        ItemSeparatorComponent={() => <View style={{height: 12}} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
  },

  backButton: {
    width: 60,
  },

  backButtonText: {
    color: '#2563eb',
    fontSize: 15,
    fontWeight: '600',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
  },

  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },

  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },

  accentBar: {
    width: 5,
  },

  cardContent: {
    flex: 1,
    padding: 16,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    flexShrink: 1,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginLeft: 8,
  },

  cardBody: {
    fontSize: 13.5,
    color: '#666',
    marginTop: 6,
    lineHeight: 19,
  },

  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },

  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  cardTime: {
    fontSize: 12,
    color: '#999',
  },
});

export default NotificationsScreen;