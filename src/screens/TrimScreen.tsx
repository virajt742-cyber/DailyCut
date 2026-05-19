import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, NativeEventEmitter, NativeModules } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { showEditor } from 'react-native-video-trim';
import { FFmpegEngine } from '../utils/ffmpegEngine';
import { AppFileSystem } from '../utils/fileSystem';
import { clipService } from '../database/clipService';
import { notificationService } from '../utils/notifications';

type Props = NativeStackScreenProps<RootStackParamList, 'Trim'>;

export default function TrimScreen({ navigation, route }: Props) {
  const { videoUri, date } = route.params;
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('Launching trimmer...');

  useEffect(() => {
    // Determine the right module name (often VideoTrim)
    const module = NativeModules.VideoTrim || NativeModules.NativeVideoTrim;
    if (!module) {
      console.error("react-native-video-trim native module not found");
      alert("Video trimmer native module not found. Please rebuild your development client.");
      navigation.goBack();
      return;
    }

    const eventEmitter = new NativeEventEmitter(module);

    const subscription = eventEmitter.addListener('VideoTrim', async (event: any) => {
      if (event.name === 'onFinishTrimming') {
        // User finished trimming natively!
        setIsProcessing(true);
        setStatusText('Saving your 1-second memory...');
        
        try {
          const trimmedUri = event.outputPath;
          if (!trimmedUri) {
            throw new Error(`Output path is missing in trim event.`);
          }

          // Standardize (copy to our controlled temp path)
          const tempStandardUri = AppFileSystem.getTempUri(`std_${Date.now()}.mp4`);
          const stdSuccess = await FFmpegEngine.standardizeAndOverlay(trimmedUri, tempStandardUri, new Date(date));
          if (!stdSuccess) {
            throw new Error('Could not process trimmed video file');
          }

          setStatusText('Generating thumbnail...');
          const tempThumbUri = AppFileSystem.getTempUri(`thumb_${Date.now()}.jpg`);
          const thumbSuccess = await FFmpegEngine.generateThumbnail(tempStandardUri, tempThumbUri);
          if (!thumbSuccess) {
            throw new Error('Could not generate thumbnail');
          }

          // Move to permanent storage
          setStatusText('Almost done...');
          const finalVideoUri = await AppFileSystem.moveFileToPermanent(tempStandardUri, `clip_${date}.mp4`);
          const finalThumbUri = await AppFileSystem.moveFileToPermanent(tempThumbUri, `thumb_${date}.jpg`);

          // Save to database
          await clipService.saveClip(date, finalVideoUri, finalThumbUri);

          // Update reminder notifications with new streak info
          try {
            await notificationService.scheduleDailyReminder(20, 0);
          } catch (err) {
            console.warn("Failed to update notification streak:", err);
          }

          // Done! Reset to dashboard
          navigation.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
        } catch (e: any) {
          console.error('[TrimScreen] Processing error:', e);
          alert(`Failed to process video: ${e.message || e}`);
          navigation.goBack();
        } finally {
          setIsProcessing(false);
        }
      } else if (event.name === 'onCancelTrimming' || event.name === 'onCancel') {
        // User cancelled the trimmer
        navigation.goBack();
      } else if (event.name === 'onError') {
        // Native trimmer error
        console.error('[TrimScreen] Native editor error:', event.message);
        alert('Trimmer Error: ' + (event.message || 'Unknown error'));
        navigation.goBack();
      }
    });

    // Launch the native trimmer UI!
    // maxDuration: 2 seconds gives a wider selection window.
    // enablePreciseTrimming: false uses -c copy (stream copy) which avoids
    // the h264_mediacodec hardware encoder crash on affected Android devices.
    // The slight keyframe-inaccuracy is acceptable for a daily memory app.
    setTimeout(() => {
      const safeVideoUri = videoUri.startsWith('file://') ? videoUri : `file://${videoUri}`;
      showEditor(safeVideoUri, {
        maxDuration: 2,
        saveToPhoto: false,
        enableCancelTrimming: true,
        cancelTrimmingButtonText: "Cancel",
        enablePreciseTrimming: false,
      });
    }, 500); // slight delay to allow screen transition to finish

    return () => {
      subscription.remove();
    };
  }, [videoUri]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.statusText}>{statusText}</Text>
      {isProcessing && (
        <Text style={styles.subText}>Please wait, do not close the app...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center'
  },
  statusText: { 
    color: 'white', 
    marginTop: 20,
    fontSize: 16,
    fontWeight: 'bold' 
  },
  subText: {
    color: '#888',
    marginTop: 10,
    fontSize: 13,
  }
});
