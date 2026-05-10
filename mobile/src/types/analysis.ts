import type { AnalysisResponse } from '../services/api';

export type AnalyzedPhoto = {
  localUri: string;
  result: AnalysisResponse;
};

export type Vehicle = {
  id: string;
  brand?: string;
  model?: string;
  year?: number;
  licensePlate?: string;
  notes?: string;
  createdAt: string;
};

export type RepairRecord = {
  id: string;
  performedAt: string;
  performedBy?: string;
  workDescription?: string;
  actualCost?: number;
  notes?: string;
};

export type AnalysisSession = {
  id: string;
  vehicleId: string;
  createdAt: string;
  photos: AnalyzedPhoto[];
  repairs?: RepairRecord[];
};
