import * as FileSystem from 'expo-file-system/legacy';

export const AppFileSystem = {
  getTempUri: (filename: string) => {
    return `${FileSystem.cacheDirectory}${filename}`;
  },
  
  getPermanentUri: (filename: string) => {
    return `${FileSystem.documentDirectory}${filename}`;
  },

  moveFileToPermanent: async (tempUri: string, filename: string): Promise<string> => {
    const permUri = AppFileSystem.getPermanentUri(filename);
    
    const fileInfo = await FileSystem.getInfoAsync(permUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(permUri);
    }
    
    await FileSystem.moveAsync({
      from: tempUri,
      to: permUri,
    });
    return permUri;
  },

  createConcatFile: async (videoUris: string[]): Promise<string> => {
    const concatText = videoUris.map(uri => `file '${uri}'`).join('\n');
    const txtPath = AppFileSystem.getTempUri('concat.txt');
    await FileSystem.writeAsStringAsync(txtPath, concatText);
    return txtPath;
  }
};
