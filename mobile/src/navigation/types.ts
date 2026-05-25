import type { NavigatorScreenParams } from '@react-navigation/native';
import type { AnalyzedPhoto } from '../types/analysis';

// AddPhotos works in two modes:
// - { sessionId } → analyze photos and append them to that existing session
// - { vehicleId } → analyze photos and save them as a NEW session for that vehicle
export type AddPhotosParams = { sessionId: string } | { vehicleId: string };

export type AnalyzeStackParamList = {
  AnalyzeHome: undefined;
  Camera: undefined;
  PickVehicle: { photos: AnalyzedPhoto[] };
  PickSession: { vehicleId: string; photos: AnalyzedPhoto[] };
  AddPhotos: AddPhotosParams;
  ResultsSummary: { sessionId: string };
  ResultDetail: { sessionId: string; photoIndex: number };
  EditVehicle: { vehicleId: string };
  EditRepair: { sessionId: string; repairId?: string };
};

export type HistoryStackParamList = {
  VehicleList: undefined;
  VehicleDetail: { vehicleId: string };
  HistorySession: { sessionId: string };
  Camera: undefined;
  AddPhotos: AddPhotosParams;
  ResultDetail: { sessionId: string; photoIndex: number };
  EditVehicle: { vehicleId: string };
  EditRepair: { sessionId: string; repairId?: string };
};

export type SettingsStackParamList = {
  SettingsHome: undefined;
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Analyze: NavigatorScreenParams<AnalyzeStackParamList>;
  History: NavigatorScreenParams<HistoryStackParamList>;
  Settings: NavigatorScreenParams<SettingsStackParamList>;
};
