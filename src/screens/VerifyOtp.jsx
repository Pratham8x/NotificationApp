import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import {useDispatch} from 'react-redux';
import api from '../services/api';
import {getFcmToken, registerFcmToken, requestNotificationPermission} from '../services/notificationService';
import {saveSession} from '../services/authStorage';
import {loginSucceeded} from '../store/authSlice';

const OTP_LENGTH = 6;
const VerifyOtp = ({visible, onClose, mobileNumber}) => {
  const dispatch = useDispatch();
  const refs = useRef([]);
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(30);

  useEffect(() => {
    if (visible) {
      setDigits(Array(OTP_LENGTH).fill(''));
      setSeconds(30);
      const focusTimer = setTimeout(() => refs.current[0]?.focus(), 350);
      return () => clearTimeout(focusTimer);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || seconds <= 0) return;
    const timer = setTimeout(() => setSeconds(value => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, visible]);

  const verify = async otp => {
    try {
      setLoading(true);
      const {data} = await api.post('/users/verify-otp', {mobileNumber, otp});
      let fcmToken = null;
      if (await requestNotificationPermission()) {
        fcmToken = await getFcmToken();
        if (fcmToken) await registerFcmToken(data.user._id, fcmToken);
      }
      const session = {token: data.token, fcmToken, user: data.user};
      await saveSession(session);
      dispatch(loginSucceeded(session));
    } catch (error) {
      Alert.alert('Verification failed', error?.response?.data?.message || error?.message || 'Please try again.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const changeDigit = (text, index) => {
    if (loading) return;
    const clean = text.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < OTP_LENGTH - 1) refs.current[index + 1]?.focus();
    if (next.every(Boolean)) verify(next.join(''));
  };

  const resend = async () => {
    try {
      setLoading(true);
      await api.post('/users/request-otp', {mobileNumber});
      setDigits(Array(OTP_LENGTH).fill(''));
      setSeconds(30);
      setTimeout(() => refs.current[0]?.focus(), 100);
    } catch (error) {
      Alert.alert('Could not resend OTP', error?.response?.data?.message || 'Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable style={styles.card} onPress={() => {}}>
            <TouchableOpacity style={styles.close} onPress={onClose} disabled={loading}><Ionicons name="close" size={22} color="#334155" /></TouchableOpacity>
            <View style={styles.icon}><Ionicons name="chatbubble-ellipses" size={25} color="#2563EB" /></View>
            <Text style={styles.title}>Verify your number</Text>
            <Text style={styles.subtitle}>Enter the 6-digit code sent to{`\n`}<Text style={styles.number}>+91 {mobileNumber}</Text></Text>
            <View style={styles.otpRow}>
              {digits.map((digit, index) => (
                <View key={index} style={[styles.otpBox, digit && styles.otpBoxActive]}>
                  <TextInput
                    ref={ref => { refs.current[index] = ref; }} value={digit}
                    onChangeText={value => changeDigit(value, index)}
                    onKeyPress={({nativeEvent}) => { if (nativeEvent.key === 'Backspace' && !digit && index > 0) refs.current[index - 1]?.focus(); }}
                    keyboardType="number-pad" maxLength={1} editable={!loading}
                    selectTextOnFocus style={styles.otpInput}
                  />
                </View>
              ))}
            </View>
            {loading && <View style={styles.loadingRow}><ActivityIndicator size="small" color="#2563EB" /><Text style={styles.loadingText}>Verifying...</Text></View>}
            <TouchableOpacity style={styles.resend} onPress={resend} disabled={seconds > 0 || loading}>
              <Text style={[styles.resendText, (seconds > 0 || loading) && styles.resendDisabled]}>{seconds > 0 ? `Resend code in ${seconds}s` : 'Resend OTP'}</Text>
            </TouchableOpacity>
            <Text style={styles.devHint}>Development OTP: 123456</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {flex: 1, justifyContent: 'center', paddingHorizontal: 22, backgroundColor: 'rgba(15, 23, 42, 0.48)'},
  card: {backgroundColor: '#FFFFFF', borderRadius: 26, paddingHorizontal: 20, paddingVertical: 25, alignItems: 'center', ...Platform.select({ios: {shadowColor: '#0F172A', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.18, shadowRadius: 24}, android: {elevation: 14}})},
  close: {position: 'absolute', right: 14, top: 14, width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', zIndex: 2},
  icon: {width: 52, height: 52, borderRadius: 18, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 13},
  title: {fontSize: 21, fontWeight: '700', color: '#0F172A'},
  subtitle: {fontSize: 13, lineHeight: 20, color: '#64748B', textAlign: 'center', marginTop: 7},
  number: {fontWeight: '700', color: '#174EA6'},
  otpRow: {width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginTop: 25},
  otpBox: {width: Platform.OS === 'ios' ? 43 : 42, height: 52, borderRadius: 13, borderWidth: 1.5, borderColor: '#D8E3F2', backgroundColor: '#F8FBFF'},
  otpBoxActive: {borderColor: '#2563EB', backgroundColor: '#EFF6FF'},
  otpInput: {width: '100%', height: '100%', padding: 0, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#0F172A'},
  loadingRow: {flexDirection: 'row', alignItems: 'center', marginTop: 16},
  loadingText: {fontSize: 12, color: '#2563EB', marginLeft: 8},
  resend: {padding: 12, marginTop: 9},
  resendText: {fontSize: 13, fontWeight: '700', color: '#2563EB'},
  resendDisabled: {color: '#94A3B8'},
  devHint: {fontSize: 11, color: '#94A3B8'},
});

export default VerifyOtp;
