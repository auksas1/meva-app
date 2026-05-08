import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import type { AnalysisResponse } from '../../services/api';
import { getSession } from '../../services/historyStorage';
import { getVehicle, vehicleDisplayName } from '../../services/vehicleStorage';

type ResultDetailRoute = RouteProp<
  { ResultDetail: { sessionId: string; photoIndex: number } },
  'ResultDetail'
>;

function scoreColor(score: number): string {
  if (score >= 0.66) return '#d12f2f';
  if (score >= 0.33) return '#d18b2f';
  return '#1f8a3e';
}

function severityLabel(score: number): string {
  if (score >= 0.66) return 'Significant';
  if (score >= 0.33) return 'Moderate';
  if (score > 0) return 'Minor';
  return 'None';
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function damageBreakdown(result: AnalysisResponse): string {
  const zones = result.damage_zones ?? [];
  if (zones.length === 0) return '—';
  const counts = new Map<string, number>();
  for (const z of zones) counts.set(z.label, (counts.get(z.label) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, n]) => `${n} ${label.toLowerCase()}${n > 1 ? 's' : ''}`)
    .join(' · ');
}

export default function ResultDetailScreen() {
  const route = useRoute<ResultDetailRoute>();
  const navigation = useNavigation();
  const { sessionId, photoIndex } = route.params;

  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const s = await getSession(sessionId);
        if (!active) return;
        setSession(s);
        if (s) {
          const v = await getVehicle(s.vehicleId);
          if (active) setVehicle(v);
        }
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [sessionId]),
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missing}>Session not found.</Text>
      </View>
    );
  }

  const photo = session.photos[photoIndex];
  if (!photo) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missing}>Photo not found.</Text>
      </View>
    );
  }

  const { result, localUri } = photo;
  const scorePct = Math.round(result.damage_score * 100);
  const zones = result.damage_zones ?? [];
  const parts = result.affected_parts ?? [];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: localUri }} style={styles.image} resizeMode="contain" />

      <Text style={styles.sectionLabel}>Vehicle</Text>
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Vehicle</Text>
          <Text style={styles.infoValue}>{vehicleDisplayName(vehicle)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>License plate</Text>
          <Text style={styles.infoValue}>{vehicle?.licensePlate ?? '—'}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Analyzed</Text>
          <Text style={styles.infoValue}>{formatDate(session.createdAt)}</Text>
        </View>
      </View>

      <View style={styles.scoreRow}>
        <View>
          <Text style={styles.scoreLabel}>Damage score</Text>
          <Text style={[styles.severityLabel, { color: scoreColor(result.damage_score) }]}>
            {severityLabel(result.damage_score)}
          </Text>
        </View>
        <Text style={[styles.scoreValue, { color: scoreColor(result.damage_score) }]}>
          {scorePct}%
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Text style={styles.infoKey}>Damage breakdown</Text>
        <Text style={styles.infoValue}>{damageBreakdown(result)}</Text>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Detected damage</Text>
      {zones.length === 0 ? (
        <Text style={styles.empty}>No damage zones detected.</Text>
      ) : (
        zones.map((z, i) => (
          <View key={`${z.label}-${i}`} style={styles.zoneRow}>
            <Text style={styles.zoneLabel}>{z.label}</Text>
            <Text style={styles.zoneConfidence}>{Math.round(z.confidence * 100)}%</Text>
          </View>
        ))
      )}

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Affected parts</Text>
      {parts.length === 0 ? (
        <Text style={styles.empty}>—</Text>
      ) : (
        parts.map((p, i) => (
          <View key={`${p.name}-${i}`} style={styles.zoneRow}>
            <Text style={styles.zoneLabel}>{p.name}</Text>
            <Text style={styles.zoneConfidence}>
              {typeof p.estimated_cost === 'number' ? `€${p.estimated_cost.toFixed(0)}` : '—'}
            </Text>
          </View>
        ))
      )}

      <View style={[styles.totalRow, styles.sectionSpacing]}>
        <Text style={styles.totalLabel}>Total estimated repair (this photo)</Text>
        <Text style={styles.totalValue}>
          {typeof result.total_estimated_cost === 'number'
            ? `€${result.total_estimated_cost.toFixed(0)}`
            : '—'}
        </Text>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Recommendation</Text>
      <Text style={styles.recommendation}>{result.repair_recommendation ?? '—'}</Text>

      <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
        <Text style={styles.doneButtonText}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missing: { color: '#666' },
  container: { padding: 20, paddingBottom: 40 },
  image: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginBottom: 16,
  },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 8 },
  sectionSpacing: { marginTop: 22 },

  infoBox: { backgroundColor: '#f7f7f7', borderRadius: 8, padding: 12, marginBottom: 18 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoKey: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 14, color: '#222', fontWeight: '500', flexShrink: 1, textAlign: 'right' },

  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  scoreLabel: { fontSize: 14, color: '#444', fontWeight: '500' },
  severityLabel: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  scoreValue: { fontSize: 32, fontWeight: '700' },

  empty: { color: '#888', fontStyle: 'italic' },

  zoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ddd',
  },
  zoneLabel: { fontSize: 15, color: '#222' },
  zoneConfidence: { fontSize: 15, color: '#555', fontWeight: '600' },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#eef3ff',
    borderRadius: 8,
  },
  totalLabel: { fontSize: 14, fontWeight: '600', color: '#333', flex: 1, marginRight: 8 },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#1f6feb' },

  recommendation: { fontSize: 14, color: '#333', lineHeight: 20 },

  doneButton: {
    marginTop: 28,
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
