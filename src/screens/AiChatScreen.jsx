import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import api from '../services/api';

const AiChatScreen = ({navigation}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const requestRef = useRef(null);
  useEffect(() => {
    const controller = new AbortController();
    api.get('/ai/messages', {signal: controller.signal, timeout: 15000})
      .then(({data}) => {
        if (!controller.signal.aborted) setMessages(data.messages.flatMap(item => [
          {id: `${item._id}-user`, role: 'user', text: item.text},
          ...(item.answer ? [{id: `${item._id}-ai`, role: 'model', text: item.answer}] : []),
        ]));
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Could not load conversation. Reopen this chat to try again.');
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => {
      controller.abort();
      requestRef.current?.abort();
    };
  }, []);

  const send = async () => {
    const message = text.trim();
    if (!message || loading || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setSending(true);
    setError('');
    setText('');
    const userMessage = {id: `${Date.now()}-user`, role: 'user', text: message};
    setMessages(previous => [...previous, userMessage]);
    try {
      const {data} = await api.post('/ai/chat', {message}, {timeout: 75000, signal: controller.signal});
      if (!data.success || typeof data.answer !== 'string' || !data.answer.trim()) throw new Error('Invalid AI response');
      if (!controller.signal.aborted) setMessages(previous => [...previous, {id: `${Date.now()}-ai`, role: 'model', text: data.answer}]);
    } catch (requestError) {
      if (!controller.signal.aborted) {
        if (!requestError.response?.data?.savedMessage) {
          setMessages(previous => previous.filter(item => item.id !== userMessage.id));
        }
        setText(message);
        setError(requestError.response?.data?.message || 'Could not reach AI. Please try again.');
      }
    } finally {
      if (!controller.signal.aborted) setSending(false);
      requestRef.current = null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.back} onPress={navigation.goBack} accessibilityLabel="Go back"><Ionicons name="arrow-back" size={25} color="#0F172A" /></TouchableOpacity>
        <View style={styles.avatar}><Ionicons name="sparkles" size={23} color="#2563EB" /></View>
        <View style={styles.headerText}><Text style={styles.phone}>Chirpy AI</Text><Text style={styles.presence}>{sending ? 'Thinking…' : 'Insurance assistant · Demo data'}</Text></View>
      </View>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList ref={listRef} data={messages} keyExtractor={item => item.id} contentContainerStyle={styles.messages}
          onContentSizeChange={() => listRef.current?.scrollToEnd({animated: true})}
          renderItem={({item}) => <View style={[styles.bubble, item.role === 'user' ? styles.mine : styles.theirs]}><Text selectable style={styles.messageText}>{item.text}</Text></View>}
          ListEmptyComponent={loading ? <ActivityIndicator color="#2563EB" /> : <Text style={styles.empty}>Hi! Ask about motor insurance, compare our fictional demo plans, or explore the sample claim process. Your conversation is saved to your account.</Text>}
          ListFooterComponent={sending ? <Text style={styles.presence}>Chirpy AI is typing…</Text> : null}
        />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        <View style={styles.composer}>
          <TextInput value={text} onChangeText={setText} editable={!sending && !loading} style={styles.input} placeholder="Ask about insurance" placeholderTextColor="#94A3B8" multiline maxLength={2000} accessibilityLabel="Message to Chirpy AI" />
          <TouchableOpacity style={[styles.send, (!text.trim() || sending || loading) && styles.sendDisabled]} onPress={send} disabled={!text.trim() || sending || loading} accessibilityRole="button" accessibilityLabel="Send message">
            {sending ? <ActivityIndicator color="#FFFFFF" /> : <Ionicons name="send" size={19} color="#FFFFFF" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  error: {padding: 12, color: '#B91C1C', backgroundColor: '#FEE2E2'},
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

export default AiChatScreen;
