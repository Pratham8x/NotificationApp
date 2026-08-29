import React from 'react';
import {Platform, StyleSheet, View} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {Ionicons} from '@react-native-vector-icons/ionicons';
import HomeScreen from '../screens/HomeScreen';

const Tab = createBottomTabNavigator();
const icons = {Home: 'chatbubbles', Status: 'aperture', Calls: 'call'};
const tabOptions = ({route}) => ({
  headerShown: false,
  tabBarShowLabel: false,
  tabBarActiveTintColor: '#2563EB',
  tabBarInactiveTintColor: '#94A3B8',
  tabBarStyle: styles.tabBar,
  tabBarIcon: ({color, focused}) => <View style={[styles.iconWrap, focused && styles.iconWrapActive]}><Ionicons name={focused ? icons[route.name] : `${icons[route.name]}-outline`} size={23} color={color} /></View>,
});
const MainTabs = () => (
  <Tab.Navigator screenOptions={tabOptions}>
    <Tab.Screen name="Home" component={HomeScreen} initialParams={{section: 'Chats'}} />
    <Tab.Screen name="Status" component={HomeScreen} initialParams={{section: 'Status'}} />
    <Tab.Screen name="Calls" component={HomeScreen} initialParams={{section: 'Calls'}} />
  </Tab.Navigator>
);
const styles = StyleSheet.create({
  tabBar: {height: Platform.OS === 'ios' ? 82 : 66, paddingTop: 7, paddingBottom: Platform.OS === 'ios' ? 19 : 7, backgroundColor: '#FFFFFF', borderTopColor: '#E7EEF8', elevation: 10},
  iconWrap: {width: 48, height: 38, borderRadius: 15, alignItems: 'center', justifyContent: 'center'}, iconWrapActive: {backgroundColor: '#EAF2FF'},
});
export default MainTabs;
