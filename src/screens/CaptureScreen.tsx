import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAppPermissions } from '../utils/permissions';
import CameraRecorder from '../components/Capture/CameraRecorder';
import GalleryPicker from '../components/Capture/GalleryPicker';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

export default function CaptureScreen({ navigation, route }: Props) {
  const { allGranted, requestAll } = useAppPermissions();
  const { date } = route.params;

  useEffect(() => {
    if (allGranted === false) {
      requestAll();
    }
  }, [allGranted]);

  const handleVideoReady = (uri: string) => {
    navigation.navigate('Trim', { videoUri: uri, date });
  };

  if (allGranted === null || allGranted === false) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>We need camera and media permissions to record your memory.</Text>
        <Button title="Grant Permissions" onPress={requestAll} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraRecorder onVideoRecorded={handleVideoReady} />
      <View style={styles.galleryContainer}>
        <GalleryPicker onVideoSelected={handleVideoReady} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { textAlign: 'center', marginBottom: 20, fontSize: 16 },
  galleryContainer: {
    position: 'absolute',
    bottom: 40,
    right: 30,
  }
});
