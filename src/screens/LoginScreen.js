import React, {useState} from 'react';

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';

import api from '../services/api';

const LoginScreen = ({navigation}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(
        'Validation',
        'Please enter email and password',
      );

      return;
    }

    try {
      setLoading(true);

      console.log('========== LOGIN ==========');

      const response = await api.post(
        '/users/login',
        {
          email,
          password,
        },
      );

      console.log('Login response:', response.data);

      if (response.data?.success) {
        const user = response.data.user;

        console.log('Logged in user:', user);

        navigation.replace('Home', {
          user,
        });
      } else {
        Alert.alert(
          'Login Failed',
          response.data?.message ||
            'Invalid credentials',
        );
      }
    } catch (error) {
      console.log(
        'Login error:',
        error?.response?.data || error.message,
      );

      Alert.alert(
        'Login Error',
        error?.response?.data?.message ||
          'Unable to login',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Welcome Back
      </Text>

      <Text style={styles.subtitle}>
        Login to continue
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.loginButton}
        onPress={handleLogin}
        disabled={loading}>

        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.loginText}>
            Login
          </Text>
        )}

      </TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 25,
    backgroundColor: '#f5f6fa',
  },

  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 35,
  },

  input: {
    height: 55,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    marginBottom: 15,
    color: '#222',
  },

  loginButton: {
    height: 55,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default LoginScreen;