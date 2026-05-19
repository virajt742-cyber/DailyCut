export type RootStackParamList = {
  Dashboard: undefined;
  Capture: { date: number }; // pass date timestamp
  Trim: { videoUri: string; date: number };
  Compilation: undefined;
  Settings: undefined;
};
