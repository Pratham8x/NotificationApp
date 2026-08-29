import React, {useCallback, useState} from 'react';
import {ActivityIndicator, Alert, FlatList, Platform, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useDispatch} from 'react-redux';
import api from '../services/api';
import {clearSession} from '../services/authStorage';
import {disconnectSocket} from '../services/socket';
import {logout} from '../store/authSlice';

const UserRow = ({user, onPress}) => (
  <TouchableOpacity style={styles.userRow} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.userAvatar}><Text style={styles.avatarText}>{user.mobileNumber.slice(-2)}</Text></View>
    <View style={styles.userDetails}><Text style={styles.phone}>+91 {user.mobileNumber}</Text><Text style={styles.userHint}>Tap to start chatting</Text></View>
    <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
  </TouchableOpacity>
);

const HomeScreen = ({navigation, route}) => {
  const dispatch = useDispatch();
  const section = route?.params?.section || 'Chats';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(section === 'Chats');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = useCallback(async (refresh = false) => {
    if (section !== 'Chats') return;
    refresh ? setRefreshing(true) : setLoading(true);
    try {
      const {data} = await api.get('/users');
      setUsers(data.users || []);
      setError('');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Could not load users. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [section]);

  useFocusEffect(useCallback(() => { loadUsers(); }, [loadUsers]));

  const confirmLogout = () => {
    Alert.alert('Log out?', 'You will need to verify your mobile number to sign in again.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          disconnectSocket();
          await clearSession();
          dispatch(logout());
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>chirpy</Text><Text style={styles.title}>{section}</Text></View>
        <TouchableOpacity style={styles.headerAvatar} onPress={confirmLogout} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Log out">
          <Ionicons name="log-out-outline" size={22} color="#2563EB" />
        </TouchableOpacity>
      </View>
      {section !== 'Chats' ? <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="chatbubble-ellipses-outline" size={34} color="#2563EB" /></View><Text style={styles.emptyTitle}>{section} are coming next</Text></View> : loading ? <View style={styles.center}><ActivityIndicator color="#2563EB" /></View> : (
        <FlatList
          data={users} keyExtractor={item => item._id}
          renderItem={({item}) => <UserRow user={item} onPress={() => navigation.navigate('Chat', {user: item})} />}
          contentContainerStyle={users.length ? styles.list : styles.emptyList}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadUsers(true)} tintColor="#2563EB" colors={['#2563EB']} />}
          ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
          ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyTitle}>No other users yet</Text><Text style={styles.emptyText}>Registered mobile numbers will appear here.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7FAFF'}, header: {height: Platform.OS === 'ios' ? 82 : 76, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E7EEF8'},
  eyebrow: {fontSize: 12, fontWeight: '700', color: '#3B82F6', letterSpacing: 1.2}, title: {fontSize: 27, fontWeight: '800', color: '#0F172A'}, headerAvatar: {width: 42, height: 42, borderRadius: 16, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center'},
  list: {paddingVertical: 8}, emptyList: {flexGrow: 1}, center: {flex: 1, alignItems: 'center', justifyContent: 'center'}, userRow: {minHeight: 76, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE6F3'},
  userAvatar: {width: 50, height: 50, borderRadius: 25, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center'}, avatarText: {fontSize: 16, fontWeight: '800', color: '#2563EB'}, userDetails: {flex: 1, marginLeft: 14}, phone: {fontSize: 16, fontWeight: '700', color: '#0F172A'}, userHint: {fontSize: 13, color: '#64748B', marginTop: 4},
  empty: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 45, paddingBottom: 70}, emptyIcon: {width: 78, height: 78, borderRadius: 28, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center'}, emptyTitle: {fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 18}, emptyText: {fontSize: 14, lineHeight: 21, color: '#64748B', textAlign: 'center', marginTop: 7},
  error: {margin: 12, padding: 12, borderRadius: 10, color: '#B91C1C', backgroundColor: '#FEE2E2', textAlign: 'center'},
});
export default HomeScreen;
