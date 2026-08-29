import React, {useEffect, useState} from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useDispatch, useSelector} from 'react-redux';
import LoginScreen from '../screens/LoginScreen';
import MainTabs from './MainTabs';
import ChatScreen from '../screens/ChatScreen';
import {getSession} from '../services/authStorage';
import {restoreSession} from '../store/authSlice';

const Stack = createNativeStackNavigator();
const theme = {...DefaultTheme, colors: {...DefaultTheme.colors, background: '#F7FAFF', card: '#FFFFFF', primary: '#2563EB', text: '#0F172A', border: '#E7EEF8'}};

const AppNavigator = () => {
  const dispatch = useDispatch();
  const token = useSelector(state => state.auth.token);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    getSession().then(session => { if (session?.token) dispatch(restoreSession(session)); }).finally(() => setReady(true));
  }, [dispatch]);
  if (!ready) return <View style={styles.loading}><StatusBar barStyle="dark-content" backgroundColor="#F7FAFF" /><ActivityIndicator color="#2563EB" /></View>;
  return (
    <NavigationContainer theme={theme}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7FAFF" translucent={false} />
      <Stack.Navigator screenOptions={{headerShown: false, contentStyle: {backgroundColor: '#F7FAFF'}}}>
        {token ? <><Stack.Screen name="MainTabs" component={MainTabs} /><Stack.Screen name="Chat" component={ChatScreen} /></> : <Stack.Screen name="Login" component={LoginScreen} />}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
const styles = StyleSheet.create({loading: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFF'}});
export default AppNavigator;
