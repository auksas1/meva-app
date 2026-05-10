import type { Vehicle } from '../types/analysis';
import {
  listVehicles,
  getVehicleById,
  createVehicleApi,
  updateVehicleApi,
  deleteVehicleApi,
  type VehicleApiResponse,
} from './api';

function toVehicle(r: VehicleApiResponse): Vehicle {
  return {
    id: String(r.id),
    brand: r.brand ?? undefined,
    model: r.model ?? undefined,
    year: r.year ?? undefined,
    licensePlate: r.license_plate ?? undefined,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

export async function getVehicles(): Promise<Vehicle[]> {
  try {
    const items = await listVehicles();
    return items.map(toVehicle);
  } catch {
    return [];
  }
}

export async function getVehicle(id: string): Promise<Vehicle | null> {
  try {
    const r = await getVehicleById(Number(id));
    return toVehicle(r);
  } catch {
    return null;
  }
}

export async function createVehicle(
  data: Omit<Vehicle, 'id' | 'createdAt'>,
): Promise<Vehicle> {
  const r = await createVehicleApi({
    brand: data.brand,
    model: data.model,
    year: data.year,
    license_plate: data.licensePlate,
    notes: data.notes,
  });
  return toVehicle(r);
}

export async function updateVehicle(
  id: string,
  patch: Partial<Omit<Vehicle, 'id' | 'createdAt'>>,
): Promise<Vehicle | null> {
  try {
    const r = await updateVehicleApi(Number(id), {
      brand: patch.brand,
      model: patch.model,
      year: patch.year,
      license_plate: patch.licensePlate,
      notes: patch.notes,
    });
    return toVehicle(r);
  } catch {
    return null;
  }
}

export async function deleteVehicle(id: string): Promise<void> {
  await deleteVehicleApi(Number(id));
}

export async function clearVehicles(): Promise<void> {
  // vehicles are owned by the backend — no-op
}

export function vehicleDisplayName(vehicle: Vehicle | null | undefined): string {
  if (!vehicle) return 'Unknown vehicle';
  const parts = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean);
  if (parts.length > 0) return parts.join(' ');
  if (vehicle.licensePlate) return vehicle.licensePlate;
  return 'Unnamed vehicle';
}
