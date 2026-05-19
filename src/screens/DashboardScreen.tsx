import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, TouchableWithoutFeedback, NativeModules } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import CalendarGrid from '../components/CalendarGrid/CalendarGrid';
import { database } from '../database';
import Clip from '../database/models/Clip';
import withObservables from '@nozbe/with-observables';
import { Settings as SettingsIcon } from 'lucide-react-native';
import { calculateStreak } from '../utils/streak';
import { isSameDay, format } from 'date-fns';
import { Video, ResizeMode } from 'expo-av';
import { Image } from 'expo-image';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'> & {
  clips: Clip[];
};

const isAvAvailable = !!NativeModules.ExponentAV;

function DashboardScreen({ navigation, clips }: Props) {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  const handleDayPress = (date: Date) => {
    const clipForDay = clips.find(c => isSameDay(new Date(c.date), date));
    if (clipForDay) {
      setSelectedClip(clipForDay);
    } else {
      navigation.navigate('Capture', { date: date.getTime() });
    }
  };

  const currentStreak = useMemo(() => {
    return calculateStreak(clips);
  }, [clips]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.streakText}>🔥 {currentStreak} Day Streak</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <SettingsIcon color="#333" size={24} />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <CalendarGrid clips={clips} onDayPress={handleDayPress} />
        <TouchableOpacity style={styles.reelButton} onPress={() => navigation.navigate('Compilation')}>
          <Text style={styles.reelButtonText}>Generate Reel</Text>
        </TouchableOpacity>
      </View>

      {/* Video Preview Modal */}
      <Modal
        visible={selectedClip !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedClip(null)}
      >
        <TouchableWithoutFeedback onPress={() => setSelectedClip(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                {selectedClip && (
                  <>
                    <View style={styles.videoContainer}>
                      {isAvAvailable ? (
                        <Video
                          source={{ uri: selectedClip.videoPath }}
                          rate={1.0}
                          volume={1.0}
                          isMuted={false}
                          resizeMode={ResizeMode.CONTAIN}
                          shouldPlay
                          isLooping
                          style={styles.videoPlayer}
                        />
                      ) : (
                        <View style={styles.fallbackContainer}>
                          <Image source={{ uri: selectedClip.thumbnailPath }} style={styles.fallbackThumbnail} contentFit="cover" />
                          <View style={styles.fallbackTextWrapper}>
                            <Text style={styles.fallbackTitle}>Preview Player Locked</Text>
                            <Text style={styles.fallbackSubtitle}>
                              Please run a new development build (e.g., using EAS Build) to link the new video player native modules.
                            </Text>
                          </View>
                        </View>
                      )}
                      {/* Premium Date Overlay */}
                      <View style={styles.dateOverlay}>
                        <Text style={styles.dateText}>
                          {format(new Date(selectedClip.date), 'MMMM d, yyyy').toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.rerecordButton]}
                        onPress={() => {
                          const clipDate = selectedClip.date;
                          setSelectedClip(null);
                          navigation.navigate('Capture', { date: clipDate });
                        }}
                      >
                        <Text style={styles.rerecordButtonText}>Re-record</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.closeButton]}
                        onPress={() => setSelectedClip(null)}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const enhance = withObservables([], () => ({
  clips: database.collections.get<Clip>('clips').query().observe(),
}));

export default enhance(DashboardScreen);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f2f2f6' },
  container: { flex: 1, paddingTop: 10 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  streakText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF9500',
  },
  reelButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  reelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dateText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  rerecordButton: {
    backgroundColor: '#3a3a3c',
  },
  rerecordButtonText: {
    color: '#ff453a',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    backgroundColor: '#0a84ff',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fallbackContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fallbackThumbnail: {
    width: '100%',
    height: '100%',
    opacity: 0.4,
  },
  fallbackTextWrapper: {
    position: 'absolute',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  fallbackTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    color: '#aaa',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});
