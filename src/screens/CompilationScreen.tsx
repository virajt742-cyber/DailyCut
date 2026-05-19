import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { compilationEngine, ReelData } from '../utils/compilationEngine';
import { AppFileSystem } from '../utils/fileSystem';
import Clip from '../database/models/Clip';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode, AVPlaybackStatus, Audio } from 'expo-av';
import { format } from 'date-fns';
import { Play, Pause, Music, Download, Check } from 'lucide-react-native';

type Props = NativeStackScreenProps<RootStackParamList, 'Compilation'>;

interface Track {
  id: string;
  name: string;
  url: string;
}

const TRACKS: Track[] = [
  { id: 'none', name: 'No Music (Original Audio)', url: '' },
  { id: 'lofi', name: '🎧 Lofi Dreamscape', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'acoustic', name: '🎸 Acoustic Sunset', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'upbeat', name: '🎵 Upbeat Memory Lane', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: 'chill', name: '🌊 Chill Waves', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'piano', name: '🎹 Soft Piano', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'ambient', name: '✨ Ambient Glow', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
];

export default function CompilationScreen({ navigation }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reelData, setReelData] = useState<ReelData | null>(null);
  
  // Sequential playback state
  const [currentClipIndex, setCurrentClipIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);

  // Refs to avoid stale closures in callbacks
  const clipIndexRef = useRef(0);
  const soundRef = useRef<Audio.Sound | null>(null);
  const videoRef = useRef<Video>(null);
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();

  const currentClip = reelData?.clips[currentClipIndex] ?? null;
  const totalClips = reelData?.clips.length ?? 0;

  // Keep ref in sync with state
  useEffect(() => {
    clipIndexRef.current = currentClipIndex;
  }, [currentClipIndex]);

  // Load clips
  useEffect(() => {
    let active = true;
    
    async function init() {
      try {
        const data = await compilationEngine.loadReelData();
        if (active) {
          setReelData(data);
          setIsLoading(false);
          if (data.missingCount > 0) {
            Alert.alert(
              "Some clips missing",
              `${data.missingCount} clip(s) could not be found on disk and were skipped.`
            );
          }
        }
      } catch (err: any) {
        if (active) {
          Alert.alert("No memories yet", err.message || "Record some 1-second clips first before compiling!", [
            { text: "Go Back", onPress: () => navigation.goBack() }
          ]);
        }
      }
    }

    init();
    return () => { active = false; };
  }, []);

  // Cleanup sound on unmount only
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Handle sequential playback — uses ref to always read latest index
  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    if (status.didJustFinish) {
      setReelData((currentData) => {
        if (!currentData) return currentData;
        
        const nextIndex = clipIndexRef.current + 1;
        if (nextIndex < currentData.clips.length) {
          clipIndexRef.current = nextIndex;
          setCurrentClipIndex(nextIndex);
        } else {
          // Reel finished — loop back to start
          clipIndexRef.current = 0;
          setCurrentClipIndex(0);
          setIsPlaying(false);
          if (soundRef.current) {
            soundRef.current.stopAsync().catch(() => {});
          }
        }
        return currentData; // Don't mutate, just read
      });
    }
  }, []);

  const handleTrackChange = async (track: Track) => {
    setSelectedTrack(track);

    // Stop and unload existing sound via ref
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }

    if (track.id === 'none') return;

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: isPlaying, isLooping: true, volume: 0.6 }
      );
      soundRef.current = newSound;
    } catch (error) {
      console.warn("Failed to load soundtrack:", error);
    }
  };

  const togglePlayback = async () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      await videoRef.current.pauseAsync();
      if (soundRef.current) await soundRef.current.pauseAsync().catch(() => {});
      setIsPlaying(false);
    } else {
      await videoRef.current.playAsync();
      if (soundRef.current) await soundRef.current.playAsync().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleExport = async () => {
    if (!reelData || reelData.videoPaths.length === 0) return;

    if (permissionResponse?.status !== 'granted') {
      const resp = await requestPermission();
      if (resp.status !== 'granted') {
        Alert.alert("Permission needed", "We need access to save videos to your camera roll.");
        return;
      }
    }

    setIsSaving(true);
    try {
      // Pause playback during export
      if (isPlaying) await togglePlayback();

      const outputUri = AppFileSystem.getTempUri(`Export_${Date.now()}.mp4`);
      
      // Attempt hardware merge
      const { FFmpegEngine } = await import('../utils/ffmpegEngine');
      const success = await FFmpegEngine.exportReel(
        reelData.videoPaths,
        outputUri
      );

      if (success) {
        await MediaLibrary.createAssetAsync(outputUri);
        Alert.alert(
          "Reel Exported! 🎉", 
          "Your continuous 1-second reel has been merged and saved to your camera roll.",
          [{ text: "Awesome", onPress: () => navigation.navigate('Dashboard') }]
        );
      } else {
        console.warn("Hardware merge failed. Falling back to individual clip saves.");
        // Fallback: Save each clip individually to camera roll if merge fails
        let savedCount = 0;
        for (const path of reelData.videoPaths) {
          try {
            await MediaLibrary.createAssetAsync(path);
            savedCount++;
          } catch (e) {
            console.warn("Failed to save clip:", path, e);
          }
        }
        
        if (savedCount > 0) {
          Alert.alert(
            "Merge Unavailable on This Device", 
            `Your device's video encoder couldn't create a single merged file. We saved all ${savedCount} clips individually to your gallery instead. You can merge them using a free app like InShot or CapCut.`,
            [{ text: "OK", onPress: () => navigation.navigate('Dashboard') }]
          );
        } else {
          Alert.alert("Export failed", "Could not merge or save the videos.");
        }
      }
    } catch (e: any) {
      Alert.alert("Export failed", e.message || "Could not save videos.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading your memories...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Memory Reel</Text>
      <Text style={styles.subtitle}>
        {totalClips} clip{totalClips !== 1 ? 's' : ''} • Playing sequentially
      </Text>

      {/* Sequential Video Player */}
      <View style={styles.videoCard}>
        {currentClip && (
          <View style={styles.playerWrapper}>
            <Video
              ref={videoRef}
              source={{ uri: currentClip.videoPath }}
              rate={1.0}
              volume={selectedTrack.id !== 'none' ? 0.3 : 1.0}
              isMuted={false}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay={isPlaying}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              style={styles.player}
            />
            {/* Live date overlay */}
            <View style={styles.playerDateOverlay}>
              <Text style={styles.playerDateText}>
                {format(new Date(currentClip.date), 'MMMM d, yyyy').toUpperCase()}
              </Text>
            </View>
            {/* Clip counter */}
            <View style={styles.clipCounter}>
              <Text style={styles.clipCounterText}>
                {currentClipIndex + 1} / {totalClips}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            {isPlaying ? (
              <Pause color="#fff" size={24} fill="#fff" />
            ) : (
              <Play color="#fff" size={24} fill="#fff" />
            )}
          </TouchableOpacity>
          <Text style={styles.playText}>
            {isPlaying ? "Playing Reel" : "Paused"}
          </Text>
        </View>
      </View>

      {/* Music Selection Section */}
      <View style={styles.sectionHeader}>
        <Music size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Soundtrack</Text>
      </View>
      <Text style={styles.musicNote}>
        🎵 Music plays during preview only. Exported video uses original audio.
      </Text>

      <View style={styles.trackList}>
        {TRACKS.map((track) => (
          <TouchableOpacity
            key={track.id}
            style={[
              styles.trackItem,
              selectedTrack.id === track.id && styles.selectedTrackItem
            ]}
            onPress={() => handleTrackChange(track)}
          >
            <Text
              style={[
                styles.trackName,
                selectedTrack.id === track.id && styles.selectedTrackName
              ]}
            >
              {track.name}
            </Text>
            {selectedTrack.id === track.id && (
              <Check color="#007AFF" size={18} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Export Button */}
      <TouchableOpacity
        style={[styles.exportButton, isSaving && styles.exportButtonDisabled]}
        onPress={handleExport}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.exportButtonText}>Merging clips...</Text>
          </>
        ) : (
          <>
            <Download color="#fff" size={20} />
            <Text style={styles.exportButtonText}>Export to Camera Roll</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#f2f2f6', alignItems: 'center' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f2f2f6' },
  loadingText: { marginTop: 20, fontSize: 16, color: '#666', fontWeight: '500' },
  title: { fontSize: 26, fontWeight: 'bold', color: '#1c1c1e', marginBottom: 6 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#666', marginBottom: 24, paddingHorizontal: 10 },
  videoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 24,
  },
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    position: 'relative',
  },
  player: {
    width: '100%',
    height: '100%',
  },
  playerDateOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  playerDateText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  clipCounter: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  clipCounterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  playButton: {
    backgroundColor: '#007AFF',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1c1c1e',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 4,
    paddingLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1c1c1e',
    marginLeft: 8,
  },
  musicNote: {
    fontSize: 12,
    color: '#999',
    width: '100%',
    paddingLeft: 4,
    marginBottom: 12,
  },
  trackList: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  trackItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e5ea',
  },
  selectedTrackItem: {
    backgroundColor: '#f2f2f7',
  },
  trackName: {
    fontSize: 15,
    color: '#3a3a3c',
  },
  selectedTrackName: {
    color: '#007AFF',
    fontWeight: '600',
  },
  exportButton: {
    backgroundColor: '#34c759',
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#34c759',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 30,
  },
  exportButtonDisabled: {
    backgroundColor: '#999',
    shadowColor: '#999',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});
