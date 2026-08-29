import {Platform} from 'react-native';

const host = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
export const SERVER_URL = `http://${host}:5000`;
export const API_URL = `${SERVER_URL}/api`;
