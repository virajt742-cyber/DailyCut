import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Image as ImageIcon } from 'lucide-react-native';

interface GalleryPickerProps {
  onVideoSelected: (uri: string) => void;
}

export default function GalleryPicker({ onVideoSelected }: GalleryPickerProps) {
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      if (asset.duration && asset.duration < 1000) {
        Alert.alert("Video too short", "Please select a video that is at least 1 second long.");
        return;
      }
      onVideoSelected(asset.uri);
    }
  };

  return (
    <TouchableOpacity style={styles.button} onPress={pickVideo}>
      <ImageIcon color="white" size={24} />
      <Text style={styles.text}>Gallery</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  text: {
    color: 'white',
    marginLeft: 8,
    fontWeight: 'bold',
  }
});
