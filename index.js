import {AppRegistry} from 'react-native';

// Must be registered here, outside the React tree, so the background
// handler is attached even when the app is killed (not just backgrounded).
// Importing it only inside a screen/component (e.g. HomeScreen) is too late
// for killed-state delivery.
import './src/services/backgroundNotification';

import App from './src/App';
import {name as appName} from './app.json';
AppRegistry.registerComponent(appName, () => App);