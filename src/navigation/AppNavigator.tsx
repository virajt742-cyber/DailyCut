import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import DashboardScreen from '../screens/DashboardScreen';
import CaptureScreen from '../screens/CaptureScreen';
import TrimScreen from '../screens/TrimScreen';
import CompilationScreen from '../screens/CompilationScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Dashboard">
      <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: '1 Second Everyday' }} />
      <Stack.Screen name="Capture" component={CaptureScreen} options={{ title: 'Capture Clip' }} />
      <Stack.Screen name="Trim" component={TrimScreen} options={{ title: 'Trim Clip' }} />
      <Stack.Screen name="Compilation" component={CompilationScreen} options={{ title: 'My Reel' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Stack.Navigator>
  );
}
