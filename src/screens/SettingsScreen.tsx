import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { notificationService } from '../utils/notifications';
import * as Notifications from 'expo-notifications';
import { Bell, BellOff, Info } from 'lucide-react-native';

export default function SettingsScreen() {
  const [remindersEnabled, setRemindersEnabled] = useState(false);

  // Fix #6: Check if notifications are already scheduled on mount
  // so the toggle reflects reality instead of always starting as OFF
  useEffect(() => {
    async function checkExistingNotifications() {
      try {
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();
        setRemindersEnabled(scheduled.length > 0);
      } catch (err) {
        console.warn("Could not check scheduled notifications:", err);
      }
    }
    checkExistingNotifications();
  }, []);

  const toggleReminders = async (value: boolean) => {
    if (value) {
      const granted = await notificationService.requestPermissions();
      if (granted) {
        await notificationService.scheduleDailyReminder(20, 0);
        setRemindersEnabled(true);
        Alert.alert("Reminders On 🔔", "You'll get a daily reminder at 8:00 PM to record your 1-second memory.");
      } else {
        Alert.alert("Permission Required", "Please enable notification permissions in your device settings.");
      }
    } else {
      // Actually cancel all scheduled notifications
      await Notifications.cancelAllScheduledNotificationsAsync();
      setRemindersEnabled(false);
      Alert.alert("Reminders Off", "Daily reminders have been disabled.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      
      {/* Daily Reminders */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            {remindersEnabled ? (
              <Bell color="#007AFF" size={20} />
            ) : (
              <BellOff color="#999" size={20} />
            )}
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Daily Reminders</Text>
              <Text style={styles.settingSubtext}>Notify at 8:00 PM</Text>
            </View>
          </View>
          <Switch
            value={remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ false: '#e0e0e0', true: '#81b0ff' }}
            thumbColor={remindersEnabled ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <Info color="#999" size={20} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Daily Cut</Text>
              <Text style={styles.settingSubtext}>Version 1.0.0</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f2f2f6' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1c1c1e' },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  settingLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  labelTextContainer: {
    marginLeft: 12,
  },
  settingText: { fontSize: 16, color: '#1c1c1e', fontWeight: '500' },
  settingSubtext: { fontSize: 12, color: '#999', marginTop: 2 },
});
