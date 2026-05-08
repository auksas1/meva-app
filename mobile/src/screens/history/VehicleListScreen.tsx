import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import {
  createVehicle,
  getVehicles,
  vehicleDisplayName,
} from '../../services/vehicleStorage';
import { getSessions } from '../../services/historyStorage';

type Props = NativeStackScreenProps<HistoryStackParamList, 'VehicleList'>;

type VehicleSummary = {
  vehicle: Vehicle;
  sessionCount: number;
  repairCount: number;
};

function summarize(vehicles: Vehicle[], sessions: AnalysisSession[]): VehicleSummary[] {
  return vehicles.map((v) => {
    const matching = sessions.filter((s) => s.vehicleId === v.id);
    const repairCount = matching.reduce((sum, s) => sum + (s.repairs?.length ?? 0), 0);
    return { vehicle: v, sessionCount: matching.length, repairCount };
  });
}

export default function VehicleListScreen({ navigation }: Props) {
  const [data, setData] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [vehicles, sessions] = await Promise.all([getVehicles(), getSessions()]);
    setData(summarize(vehicles, sessions));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleAddVehicle = async () => {
    const v = await createVehicle({});
    navigation.navigate('EditVehicle', { vehicleId: v.id });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (data.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTitle}>No vehicles yet</Text>
        <Text style={styles.emptyText}>
          Take a photo from Analyze to start, or add a vehicle manually.
        </Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddVehicle}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Add vehicle</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <FlatList
        contentContainerStyle={styles.list}
        data={data}
        keyExtractor={(item) => item.vehicle.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() =>
              navigation.navigate('VehicleDetail', { vehicleId: item.vehicle.id })
            }
          >
            <Ionicons name="car" size={24} color="#1f6feb" />
            <View style={styles.cardBody}>
              <Text style={styles.cardName}>{vehicleDisplayName(item.vehicle)}</Text>
              <Text style={styles.cardLine}>
                {item.sessionCount} {item.sessionCount === 1 ? 'session' : 'sessions'}
                {item.repairCount > 0 ? ` · ✓ ${item.repairCount} repaired` : ''}
              </Text>
              {item.vehicle.licensePlate ? (
                <Text style={styles.cardPlate}>{item.vehicle.licensePlate}</Text>
              ) : null}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={handleAddVehicle}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyText: { color: '#666', textAlign: 'center', marginBottom: 16 },

  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardBody: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '600', color: '#222' },
  cardLine: { fontSize: 13, color: '#555', marginTop: 2 },
  cardPlate: { fontSize: 12, color: '#888', marginTop: 2 },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f6feb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1f6feb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
});
