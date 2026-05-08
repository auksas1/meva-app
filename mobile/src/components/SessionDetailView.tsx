import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AnalysisSession, RepairRecord, Vehicle } from '../types/analysis';
import { vehicleDisplayName } from '../services/vehicleStorage';
import { deleteRepair } from '../services/historyStorage';

type Props = {
  session: AnalysisSession;
  vehicle: Vehicle | null;
  title: string;
  subtitle?: string;
  onPhotoPress: (index: number) => void;
  onEditVehicle: () => void;
  onAddPhotos: () => void;
  onAddRepair: () => void;
  onEditRepair: (repairId: string) => void;
  onChanged: () => void;
};

function scoreColor(score: number): string {
  if (score >= 0.66) return '#d12f2f';
  if (score >= 0.33) return '#d18b2f';
  return '#1f8a3e';
}

function totalDamages(session: AnalysisSession): number {
  return session.photos.reduce((sum, p) => sum + (p.result.damage_zones?.length ?? 0), 0);
}

/**
 * Sums affected_parts costs across all photos in the session, deduplicating by
 * part name. If the same part shows up in two photos (e.g., front and side
 * shots of the same bumper), it counts once at the highest reported cost.
 */
export function dedupedPartCosts(session: AnalysisSession): Map<string, number> {
  const seen = new Map<string, number>();
  for (const p of session.photos) {
    for (const part of p.result.affected_parts ?? []) {
      if (typeof part.estimated_cost !== 'number') continue;
      const prev = seen.get(part.name) ?? 0;
      if (part.estimated_cost > prev) seen.set(part.name, part.estimated_cost);
    }
  }
  return seen;
}

function totalEstimate(session: AnalysisSession): number | null {
  const parts = dedupedPartCosts(session);
  if (parts.size === 0) return null;
  return Array.from(parts.values()).reduce((a, b) => a + b, 0);
}

function totalActualSpent(session: AnalysisSession): number | null {
  const repairs = session.repairs ?? [];
  let total = 0;
  let any = false;
  for (const r of repairs) {
    if (typeof r.actualCost === 'number') {
      total += r.actualCost;
      any = true;
    }
  }
  return any ? total : null;
}

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

export default function SessionDetailView({
  session,
  vehicle,
  title,
  subtitle,
  onPhotoPress,
  onEditVehicle,
  onAddPhotos,
  onAddRepair,
  onEditRepair,
  onChanged,
}: Props) {
  const damages = totalDamages(session);
  const estimate = totalEstimate(session);
  const spent = totalActualSpent(session);
  const repairs = session.repairs ?? [];
  const dedupedParts = dedupedPartCosts(session);

  const handleDeleteRepair = (repair: RepairRecord) => {
    Alert.alert('Delete repair?', 'This record will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteRepair(session.id, repair.id);
          onChanged();
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <Text style={styles.metaLine}>
        {session.photos.length} {session.photos.length === 1 ? 'photo' : 'photos'} · {damages}{' '}
        {damages === 1 ? 'damage' : 'damages'}
        {estimate !== null ? `  ·  ~€${estimate.toFixed(0)} estimate` : ''}
      </Text>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionLabel}>Vehicle</Text>
        <TouchableOpacity onPress={onEditVehicle} style={styles.linkButton}>
          <Ionicons name="create-outline" size={16} color="#1f6feb" />
          <Text style={styles.linkButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>Vehicle</Text>
          <Text style={styles.infoValue}>{vehicleDisplayName(vehicle)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoKey}>License plate</Text>
          <Text style={styles.infoValue}>{vehicle?.licensePlate ?? '—'}</Text>
        </View>
      </View>

      <View style={[styles.sectionHeaderRow, styles.sectionSpacing]}>
        <Text style={styles.sectionLabel}>Photos</Text>
        <TouchableOpacity onPress={onAddPhotos} style={styles.linkButton}>
          <Ionicons name="add" size={18} color="#1f6feb" />
          <Text style={styles.linkButtonText}>Add photos</Text>
        </TouchableOpacity>
      </View>
      {session.photos.map((p, idx) => {
        const zones = p.result.damage_zones?.length ?? 0;
        const scorePct = Math.round(p.result.damage_score * 100);
        return (
          <TouchableOpacity
            key={`${p.result.id}-${idx}`}
            style={styles.card}
            onPress={() => onPhotoPress(idx)}
          >
            <Image source={{ uri: p.localUri }} style={styles.thumb} />
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>Photo {idx + 1}</Text>
              <Text style={styles.cardLine}>
                {zones} {zones === 1 ? 'damage' : 'damages'}
              </Text>
              <Text style={[styles.cardScore, { color: scoreColor(p.result.damage_score) }]}>
                {scorePct}%
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {dedupedParts.size > 0 ? (
        <>
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Affected parts</Text>
          <View style={styles.infoBox}>
            {Array.from(dedupedParts.entries()).map(([name, cost]) => (
              <View key={name} style={styles.infoRow}>
                <Text style={styles.infoKey}>{name}</Text>
                <Text style={styles.infoValue}>€{cost.toFixed(0)}</Text>
              </View>
            ))}
            <View style={[styles.infoRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total estimate</Text>
              <Text style={styles.totalValue}>
                €{(estimate ?? 0).toFixed(0)}
              </Text>
            </View>
          </View>
        </>
      ) : null}

      <View style={[styles.sectionHeaderRow, styles.sectionSpacing]}>
        <Text style={styles.sectionLabel}>Repair log</Text>
        <TouchableOpacity onPress={onAddRepair} style={styles.linkButton}>
          <Ionicons name="add" size={18} color="#1f6feb" />
          <Text style={styles.linkButtonText}>Add repair</Text>
        </TouchableOpacity>
      </View>

      {repairs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No repairs logged yet.</Text>
        </View>
      ) : (
        repairs.map((r) => (
          <View key={r.id} style={styles.repairCard}>
            <View style={styles.repairHeader}>
              <Text style={styles.repairTitle}>
                {formatDate(r.performedAt)}
                {r.performedBy ? ` · ${r.performedBy}` : ''}
              </Text>
              {typeof r.actualCost === 'number' ? (
                <Text style={styles.repairCost}>€{r.actualCost.toFixed(0)}</Text>
              ) : null}
            </View>
            {r.workDescription ? (
              <Text style={styles.repairDesc}>{r.workDescription}</Text>
            ) : null}
            {r.notes ? <Text style={styles.repairNotes}>{r.notes}</Text> : null}
            <View style={styles.repairActions}>
              <TouchableOpacity onPress={() => onEditRepair(r.id)} style={styles.smallButton}>
                <Text style={styles.smallButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDeleteRepair(r)}
                style={[styles.smallButton, styles.smallButtonDanger]}
              >
                <Text style={[styles.smallButtonText, styles.smallButtonTextDanger]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      {spent !== null ? (
        <Text style={styles.totalSpent}>Total spent on repairs: €{spent.toFixed(0)}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 4 },
  metaLine: { fontSize: 13, color: '#666', marginBottom: 18 },

  sectionLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  sectionSpacing: { marginTop: 24 },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  linkButtonText: { color: '#1f6feb', fontSize: 14, fontWeight: '600' },

  infoBox: { backgroundColor: '#f7f7f7', borderRadius: 8, padding: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  infoKey: { fontSize: 13, color: '#666' },
  infoValue: { fontSize: 14, color: '#222', fontWeight: '500' },

  totalRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ccc',
    paddingTop: 8,
    marginTop: 4,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#333' },
  totalValue: { fontSize: 16, fontWeight: '700', color: '#1f6feb' },

  card: {
    flexDirection: 'row',
    backgroundColor: '#f7f7f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: 6, backgroundColor: '#eee', marginRight: 12 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  cardLine: { fontSize: 13, color: '#555', marginBottom: 2 },
  cardScore: { fontSize: 14, fontWeight: '600' },

  emptyBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: { color: '#888', fontSize: 13 },

  repairCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  repairHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  repairTitle: { fontSize: 14, fontWeight: '600', color: '#222', flex: 1, marginRight: 8 },
  repairCost: { fontSize: 14, fontWeight: '700', color: '#1f8a3e' },
  repairDesc: { fontSize: 13, color: '#444', marginTop: 4 },
  repairNotes: { fontSize: 12, color: '#777', fontStyle: 'italic', marginTop: 4 },
  repairActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eef3ff',
  },
  smallButtonDanger: { backgroundColor: '#fde9e9' },
  smallButtonText: { color: '#1f6feb', fontSize: 13, fontWeight: '600' },
  smallButtonTextDanger: { color: '#d12f2f' },

  totalSpent: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: '600',
    color: '#222',
    textAlign: 'right',
  },
});
