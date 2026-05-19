import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';

interface CameraRecorderProps {
  onVideoRecorded: (uri: string) => void;
}

export default function CameraRecorder({ onVideoRecorded }: CameraRecorderProps) {
  
  const openSystemCamera = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        videoMaxDuration: 10,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        onVideoRecorded(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("System camera failed:", error);
      alert("Camera failed: " + error.message);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.recordButton} onPress={openSystemCamera}>
        <Camera color="white" size={40} />
        <Text style={styles.recordText}>Record Video</Text>
      </TouchableOpacity>
      <Text style={styles.subText}>(Uses highly stable system camera)</Text>
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
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#e5e5e5',
  },
  recordText: {
    color: 'white',
    marginTop: 10,
    fontWeight: 'bold',
  },
  subText: {
    color: '#888',
    marginTop: 20,
    fontSize: 12,
  }
});
