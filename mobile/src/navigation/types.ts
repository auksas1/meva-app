import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AnalyzedPhoto } from '../types/analysis';

export type AnalyzeStackParamList = {
  AnalyzeHome: undefined;
  Camera: undefined;
  PickVehicle: { photos: AnalyzedPhoto[] };
  AddPhotos: { sessionId: string };
  ResultsSummary: { sessionId: string };
  ResultDetail: { sessionId: string; photoIndex: number };
  EditVehicle: { vehicleId: string };
  EditRepair: { sessionId: string; repairId?: string };
};

export type HistoryStackParamList = {
  VehicleList: undefined;
  VehicleDetail: { vehicleId: string };
  HistorySession: { sessionId: string };
  AddPhotos: { sessionId: string };
  ResultDetail: { sessionId: string; photoIndex: number };
  EditVehicle: { vehicleId: string };
  EditRepair: { sessionId: string; repairId?: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
};

export type MainTabParamList = {
  Analyze: NavigatorScreenParams<AnalyzeStackParamList>;
  History: NavigatorScreenParams<HistoryStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
