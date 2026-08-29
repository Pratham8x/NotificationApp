import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, AppState, FlatList, KeyboardAvoidingView, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useSelector} from 'react-redux';
import api from '../services/api';
import {getSocket} from '../services/socket';

const ChatScreen = ({navigation, route}) => {
  const otherUser = route.params.user;
  const {token, user: currentUser} = useSelector(state => state.auth);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const listRef = useRef(null);

  const addMessage = useCallback(message => {
    const sender = String(message.sender?._id || message.sender);
    const recipient = String(message.recipient?._id || message.recipient);
    if (![sender, recipient].includes(String(otherUser._id)) || ![sender, recipient].includes(String(currentUser._id))) return;
    setMessages(previous => previous.some(item => item._id === message._id) ? previous : [...previous, message]);
  }, [currentUser._id, otherUser._id]);

  useEffect(() => {
    let active = true;
    api.get(`/chats/${otherUser._id}/messages`)
      .then(({data}) => { if (active) setMessages(data.messages || []); })
      .finally(() => { if (active) setLoading(false); });
    const socket = getSocket(token);
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message:new', addMessage);
    socket.connect();
    setConnected(socket.connected);
    const appStateSubscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') socket.connect();
      else socket.disconnect();
    });
    return () => {
      active = false;
      appStateSubscription.remove();
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message:new', addMessage);
      socket.disconnect();
    };
  }, [addMessage, otherUser._id, token]);

  useEffect(() => {
    if (messages.length) requestAnimationFrame(() => listRef.current?.scrollToEnd({animated: true}));
  }, [messages.length]);

  const send = () => {
    const messageText = text.trim();
    if (!messageText || sending) return;
    setText('');
    setSending(true);
    const finish = response => {
      setSending(false);
      if (!response?.success) setText(messageText);
      else if (response.message) addMessage(response.message);
    };
    const socket = getSocket(token);
    if (socket.connected) {
      socket.timeout(8000).emit('message:send', {recipientId: otherUser._id, text: messageText}, (error, response) => finish(error ? null : response));
    } else {
      api.post(`/chats/${otherUser._id}/messages`, {text: messageText})
        .then(({data}) => finish({success: true, message: data.message}))
        .catch(() => finish(null));
    }
  };

  const renderMessage = ({item}) => {
    const mine = String(item.sender?._id || item.sender) === String(currentUser._id);
    return <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}><Text style={styles.messageText}>{item.text}</Text><Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</Text></View>;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={navigation.goBack} hitSlop={10}><Ionicons name="arrow-back" size={25} color="#0F172A" /></TouchableOpacity>
        <View style={styles.avatar}><Text style={styles.avatarText}>{otherUser.mobileNumber.slice(-2)}</Text></View>
        <View style={styles.headerText}><Text style={styles.phone}>+91 {otherUser.mobileNumber}</Text><Text style={styles.presence}>{connected ? 'online' : 'connecting…'}</Text></View>
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? <View style={styles.loading}><ActivityIndicator color="#2563EB" /></View> : <FlatList ref={listRef} data={messages} keyExtractor={item => item._id} renderItem={renderMessage} contentContainerStyle={styles.messages} onContentSizeChange={() => listRef.current?.scrollToEnd({animated: false})} keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={styles.empty}>Say hello to start the conversation.</Text>} />}
        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} style={styles.input} placeholder="Message" placeholderTextColor="#94A3B8" multiline maxLength={2000} />
          <TouchableOpacity style={[styles.send, !text.trim() && styles.sendDisabled]} onPress={send} disabled={!text.trim() || sending}>{sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={19} color="#FFFFFF" />}</TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#FFFFFF'}, keyboard: {flex: 1, backgroundColor: '#EDF4F7'},
  header: {height: 64, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#CBD5E1', backgroundColor: '#FFFFFF'},
  back: {width: 40, height: 44, alignItems: 'center', justifyContent: 'center'}, avatar: {width: 42, height: 42, borderRadius: 21, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontSize: 14, fontWeight: '800', color: '#2563EB'}, headerText: {marginLeft: 11}, phone: {fontSize: 16, fontWeight: '700', color: '#0F172A'}, presence: {fontSize: 12, color: '#64748B', marginTop: 2},
  loading: {flex: 1, alignItems: 'center', justifyContent: 'center'}, messages: {flexGrow: 1, paddingHorizontal: 12, paddingVertical: 14, justifyContent: 'flex-end'}, empty: {textAlign: 'center', color: '#64748B', marginBottom: 30},
  bubble: {maxWidth: '82%', borderRadius: 15, paddingHorizontal: 12, paddingTop: 9, paddingBottom: 6, marginVertical: 3}, mine: {alignSelf: 'flex-end', backgroundColor: '#D9FDD3', borderBottomRightRadius: 4}, theirs: {alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4},
  messageText: {fontSize: 15, lineHeight: 20, color: '#111827'}, time: {fontSize: 10, color: '#64748B', alignSelf: 'flex-end', marginTop: 3, marginLeft: 18},
  composer: {flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 8, paddingVertical: 7, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#CBD5E1', backgroundColor: '#F8FAFC'},
  input: {flex: 1, minHeight: 44, maxHeight: 110, borderRadius: 22, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 12 : 9, paddingBottom: Platform.OS === 'ios' ? 10 : 9, backgroundColor: '#FFFFFF', color: '#0F172A', fontSize: 15},
  send: {width: 44, height: 44, borderRadius: 22, marginLeft: 7, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center'}, sendDisabled: {backgroundColor: '#93B4ED'},
});
export default ChatScreen;
