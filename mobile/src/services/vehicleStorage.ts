import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Vehicle } from '../types/analysis';

const KEY = 'meva.vehicles';

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function writeAll(vehicles: Vehicle[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(vehicles));
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Vehicle[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  const all = await getVehicles();
  return all.find((v) => v.id === id) ?? null;
}

export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'createdAt'>,
): Promise<Vehicle> {
  const vehicle: Vehicle = {
    ...data,
    id: makeId(),
    createdAt: new Date().toISOString(),
  };
  const all = await getVehicles();
  await writeAll([vehicle, ...all]);
  return vehicle;
}

export async function updateVehicle(
  id: string,
  patch: Partial<Omit<Vehicle, 'id' | 'createdAt'>>,
): Promise<Vehicle | null> {
  const all = await getVehicles();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...patch };
  all[idx] = updated;
  await writeAll(all);
  return updated;
}

export async function deleteVehicle(id: string): Promise<void> {
  const all = await getVehicles();
  await writeAll(all.filter((v) => v.id !== id));
}

export async function clearVehicles(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}

export function vehicleDisplayName(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Unknown vehicle';
  const parts = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (vehicle.licensePlate) return vehicle.licensePlate;
  return 'Unnamed vehicle';
}
