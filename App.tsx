import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import DatabaseProvider from '@nozbe/watermelondb/react/DatabaseProvider';
import { database } from './src/database';

export default function App() {
  return (
    <DatabaseProvider database={database}>
      <SafeAreaProvider>
        <NavigationContainer>
          <AppNavigator />
          <StatusBar style="auto" />
        </NavigationContainer>
      </SafeAreaProvider>
    </DatabaseProvider>
  );
}
