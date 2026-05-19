import { useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

export function useAppPermissions() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();

  const allGranted = cameraPermission?.granted && micPermission?.granted && mediaPermission?.granted;

  const requestAll = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();
    if (!mediaPermission?.granted) await requestMediaPermission();
  };

  return {
    allGranted,
    requestAll,
    cameraPermission,
    micPermission,
    mediaPermission
  };
}
