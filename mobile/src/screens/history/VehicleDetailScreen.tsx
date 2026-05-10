import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import { getVehicle, deleteVehicle, vehicleDisplayName } from '../../services/vehicleStorage';
import { getSessionsForVehicle } from '../../services/historyStorage';

type Props = NativeStackScreenProps<HistoryStackParamList, 'VehicleDetail'>;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function totalDamages(s: AnalysisSession): number {
  return s.photos.reduce((sum, p) => sum + (p.result.damage_zones?.length ?? 0), 0);
}

function totalEstimate(s: AnalysisSession): number | null {
  const seen = new Map<string, number>();
  for (const p of s.photos) {
    for (const part of p.result.affected_parts ?? []) {
      if (typeof part.estimated_cost === 'number' && !seen.has(part.name)) {
        seen.set(part.name, part.estimated_cost);
      }
    }
  }
  return seen.size > 0 ? Array.from(seen.values()).reduce((a, b) => a + b, 0) : null;
}

export default function VehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [v, s] = await Promise.all([getVehicle(vehicleId), getSessionsForVehicle(vehicleId)]);
    setVehicle(v);
    setSessions(s);
    setLoading(false);
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleDelete = () => {
    if (sessions.length > 0) {
      Alert.alert(
        'Cannot delete',
        `This vehicle has ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}. Delete the sessions first.`,
      );
      return;
    }
    Alert.alert('Delete vehicle?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteVehicle(vehicleId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missing}>Vehicle not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="car" size={28} color="#1f6feb" />
        <Text style={styles.title}>{vehicleDisplayName(vehicle)}</Text>
      </View>

      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Brand</Text>
          <Text style={styles.infoValue}>{vehicle.brand ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Model</Text>
          <Text style={styles.infoValue}>{vehicle.model ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Year</Text>
          <Text style={styles.infoValue}>{vehicle.year ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>License plate</Text>
          <Text style={styles.infoValue}>{vehicle.licensePlate ?? '—'}</Text>
        </View>
        {vehicle.notes ? (
          <View style={[styles.infoRow, styles.notesRow]}>
            <Text style={styles.infoKey}>Notes</Text>
            <Text style={styles.notesValue}>{vehicle.notes}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('EditVehicle', { vehicleId })}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Edit vehicle</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={handleDelete}
        >
          <Ionicons name="trash-outline" size={16} color="#fff" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Sessions</Text>
      {sessions.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>
            No analyses yet for this vehicle. Take photos in the Analyze tab.
          </Text>
        </View>
      ) : (
        sessions.map((s) => {
          const damages = totalDamages(s);
          const estimate = totalEstimate(s);
          const repaired = (s.repairs?.length ?? 0) > 0;
          const firstUri = s.photos[0]?.localUri;
          return (
            <TouchableOpacity
              key={s.id}
              style={styles.card}
              onPress={() => navigation.navigate('HistorySession', { sessionId: s.id })}
            >
              {firstUri ? (
                <Image source={{ uri: firstUri }} style={styles.thumb} />
              ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]} />
              )}
              <View style={styles.cardBody}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardDate}>{formatDate(s.createdAt)}</Text>
                  {repaired ? <Text style={styles.repairedBadge}>✓ Repaired</Text> : null}
                </View>
                <Text style={styles.cardLine}>
                  {s.photos.length} {s.photos.length === 1 ? 'photo' : 'photos'} · {damages}{' '}
                  {damages === 1 ? 'damage' : 'damages'}
                  {estimate !== null ? `  ·  ~€${estimate.toFixed(0)}` : ''}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: '#666' },
  container: { padding: 20, paddingBottom: 40 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },

  infoBox: { backgroundColor: '#f7f7f7', borderRadius: 8, padding: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  notesRow: { flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  infoKey: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 14, color: '#222', fontWeight: '500' },
  notesValue: { fontSize: 13, color: '#333' },

  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonDanger: { backgroundColor: '#d12f2f' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  sectionSpacing: { marginTop: 24 },

  emptyBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  emptyText: { color: '#888', fontSize: 13, textAlign: 'center' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#eee', marginRight: 12 },
  thumbPlaceholder: { backgroundColor: '#ddd' },
  cardBody: { flex: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardDate: { fontSize: 14, fontWeight: '600' },
  cardLine: { fontSize: 13, color: '#555', marginTop: 2 },
  repairedBadge: {
    fontSize: 11,
    color: '#1f8a3e',
    fontWeight: '700',
    backgroundColor: '#e3f4ea',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
