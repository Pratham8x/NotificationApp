import React, {useState} from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import api from '../services/api';
import VerifyOtp from './VerifyOtp';

const LoginScreen = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const onChangeMobile = value => {
    setMobileNumber(value.replace(/\D/g, '').slice(0, 10));
    setError('');
  };

  const getOtp = async () => {
    if (!/^\d{10}$/.test(mobileNumber)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    try {
      setLoading(true);
      await api.post('/users/request-otp', {mobileNumber});
      setShowOtp(true);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <View style={styles.logoHalo}><Image source={require('../assets/logo.png')} style={styles.logo} /></View>
            <Text style={styles.brand}>chirpy<Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.tagline}>Small messages. Real connections.</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.heading}>Welcome to Chirpy</Text>
            <Text style={styles.description}>Enter your mobile number to continue</Text>
            <Text style={styles.label}>Mobile number</Text>
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <Text style={styles.countryCode}>+91</Text>
              <View style={styles.divider} />
              <TextInput
                style={styles.input}
                value={mobileNumber}
                onChangeText={onChangeMobile}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={getOtp}
              />
            </View>
            {!!error && <Text style={styles.error}>{error}</Text>}
            <TouchableOpacity
              style={[styles.button, mobileNumber.length !== 10 && styles.buttonDisabled]}
              onPress={getOtp}
              disabled={loading}
              activeOpacity={0.85}>
              {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Get OTP</Text>}
            </TouchableOpacity>
            <Text style={styles.terms}>By continuing, you agree to Chirpy's Terms & Privacy Policy.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
      <VerifyOtp visible={showOtp} mobileNumber={mobileNumber} onClose={() => setShowOtp(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#F7FAFF'},
  keyboardView: {flex: 1},
  content: {flex: 1, justifyContent: 'center', paddingHorizontal: Platform.select({ios: 26, android: 22}), paddingBottom: Platform.OS === 'ios' ? 24 : 12},
  brandBlock: {alignItems: 'center', marginBottom: 34},
  logoHalo: {width: 104, height: 104, borderRadius: 32, backgroundColor: '#EAF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  logo: {width: 82, height: 82, resizeMode: 'contain', borderRadius: 22},
  brand: {fontSize: 43, lineHeight: 49, fontWeight: Platform.OS === 'ios' ? '800' : '700', letterSpacing: -2, color: '#174EA6'},
  brandDot: {color: '#3B82F6'},
  tagline: {fontSize: 14, color: '#64748B', marginTop: 2},
  formCard: {backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, borderWidth: 1, borderColor: '#E5EEFB', ...Platform.select({ios: {shadowColor: '#174EA6', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.09, shadowRadius: 22}, android: {elevation: 4}})},
  heading: {fontSize: 23, fontWeight: '700', color: '#0F172A'},
  description: {fontSize: 14, color: '#64748B', marginTop: 6, marginBottom: 24},
  label: {fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8},
  inputRow: {height: Platform.OS === 'ios' ? 56 : 58, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1.5, borderColor: '#D8E3F2', backgroundColor: '#F8FBFF'},
  inputError: {borderColor: '#EF4444'},
  countryCode: {paddingLeft: 16, fontSize: 16, fontWeight: '700', color: '#174EA6'},
  divider: {width: 1, height: 24, backgroundColor: '#CBD5E1', marginHorizontal: 12},
  input: {flex: 1, height: '100%', paddingRight: 14, paddingVertical: 0, fontSize: 16, color: '#0F172A'},
  error: {fontSize: 12, color: '#DC2626', marginTop: 7},
  button: {height: 56, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', marginTop: 20, ...Platform.select({ios: {shadowColor: '#2563EB', shadowOffset: {width: 0, height: 7}, shadowOpacity: 0.24, shadowRadius: 10}, android: {elevation: 4}})},
  buttonDisabled: {backgroundColor: '#7AA7F7'},
  buttonText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  terms: {fontSize: 11, lineHeight: 16, textAlign: 'center', color: '#94A3B8', marginTop: 16},
});

export default LoginScreen;
