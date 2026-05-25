import React from 'react';
import { View, Text, Image, ScrollView, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AnalysisSession, RepairRecord, Vehicle } from '../types/analysis';
import { vehicleDisplayName } from '../services/vehicleStorage';
import { deleteRepair } from '../services/historyStorage';
import { useTheme } from '../theme';
import Card from './Card';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import EstimateLineItem from './EstimateLineItem';
import SectionHeader from './SectionHeader';
import LinkButton from './LinkButton';
import DangerButton from './DangerButton';
import { getDetections, detectionCount, prettifyLabel, requiresReview } from './detections';

type Props = {
  session: AnalysisSession;
  vehicle: Vehicle | null;
  title: string;
  subtitle?: string;
  onPhotoPress: (index: number) => void;
  onAddPhotos: () => void;
  onAddRepair: () => void;
  onEditRepair: (repairId: string) => void;
  onChanged: () => void;
  onDeleteSession?: () => void;
};

function totalDamages(session: AnalysisSession): number {
  return session.photos.reduce((sum, p) => sum + detectionCount(p.result), 0);
}

/** Highest-confidence damage type across all photos in the session. */
function sessionPrimaryDamage(session: AnalysisSession): string | null {
  let topLabel: string | null = null;
  let topConf = -1;
  for (const p of session.photos) {
    for (const d of getDetections(p.result)) {
      if (d.confidence > topConf) { topConf = d.confidence; topLabel = d.label; }
    }
  }
  return topLabel ? prettifyLabel(topLabel) : null;
}

function sessionNeedsReview(session: AnalysisSession): boolean {
  return session.photos.some((p) => requiresReview(p.result));
}

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
  let total = 0; let any = false;
  for (const r of repairs) if (typeof r.actualCost === 'number') { total += r.actualCost; any = true; }
  return any ? total : null;
}

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return iso; }
}

export default function SessionDetailView({
  session, vehicle, title, subtitle,
  onPhotoPress, onAddPhotos, onAddRepair, onEditRepair, onChanged, onDeleteSession,
}: Props) {
  const { tokens: t } = useTheme();
  const damages = totalDamages(session);
  const estimate = totalEstimate(session);
  const primary = sessionPrimaryDamage(session);
  const needsReview = sessionNeedsReview(session);
  const spent = totalActualSpent(session);
  const repairs = session.repairs ?? [];
  const dedupedParts = dedupedPartCosts(session);

  const handleDeleteRepair = (repair: RepairRecord) => {
    Alert.alert('Delete repair?', 'This record will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteRepair(session.id, repair.id); onChanged(); } },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 28 }}>
      {/* Vehicle inline strip — replaces the standalone Vehicle card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 4 }}>
        <View style={{
          width: 28, height: 28, borderRadius: 8,
          backgroundColor: t.primarySubtle,
          alignItems: 'center', justifyContent: 'center', marginRight: 10,
        }}>
          <Ionicons name="car-outline" size={16} color={t.primary} />
        </View>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg2, fontWeight: t.fw.semibold }}>
          {vehicleDisplayName(vehicle)}
          {vehicle?.licensePlate ? (
            <Text style={{ color: t.fg5, fontWeight: t.fw.medium }}>{` · ${vehicle.licensePlate}`}</Text>
          ) : null}
        </Text>
      </View>

      {/* Hero summary card */}
      <Card padding={20} style={{ marginTop: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={{
            width: 24, height: 24, borderRadius: 12,
            backgroundColor: t.successSoft,
            alignItems: 'center', justifyContent: 'center', marginRight: 8,
          }}>
            <Ionicons name="checkmark" size={14} color={t.success} />
          </View>
          <Text style={{
            fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.overline,
            color: t.success, letterSpacing: 0.8, textTransform: 'uppercase',
          }}>{title}</Text>
        </View>
        {subtitle ? (
          <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5, marginBottom: 4 }}>{subtitle}</Text>
        ) : (
          <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, fontWeight: t.fw.medium, marginBottom: 4 }}>Estimated total</Text>
        )}
        <Text style={{
          fontFamily: t.font, fontWeight: t.fw.black, fontSize: 36, color: t.fg1,
          letterSpacing: -0.7, lineHeight: 38,
        }}>
          {estimate !== null ? `€${estimate.toFixed(0)}` : '—'}
        </Text>

        <View style={{
          flexDirection: 'row', marginTop: 16, paddingTop: 16,
          borderTopWidth: 1, borderTopColor: t.hairline,
        }}>
          <StatBlock label="Photos" value={String(session.photos.length)} />
          <StatBlock label="Detections" value={String(damages)} />
          <View style={{ flex: 1 }}>
            <Text style={overlineStyle(t)}>{needsReview ? 'Status' : 'Main damage'}</Text>
            <View style={{ marginTop: 6 }}>
              {needsReview ? (
                <StatusBadge color="warning" label="Review" />
              ) : primary ? (
                <StatusBadge color="neutral" label={primary} />
              ) : (
                <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg5 }}>—</Text>
              )}
            </View>
          </View>
        </View>
      </Card>

      {/* Photos */}
      <SectionHeader title="Photos" action={<LinkButton onPress={onAddPhotos} leftIcon="add">Add</LinkButton>} />
      <View style={{ gap: 10 }}>
        {session.photos.map((p, idx) => {
          const detCount = detectionCount(p.result);
          const parts = p.result.affected_parts?.length ?? 0;
          const photoPrimary = detCount > 0 ? prettifyLabel(getDetections(p.result)[0]?.label ?? '') : null;
          return (
            <Card key={`${p.result.id}-${idx}`} onPress={() => onPhotoPress(idx)} padding={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ position: 'relative' }}>
                <Image source={{ uri: p.localUri }} style={{ width: 76, height: 76, borderRadius: 12, backgroundColor: t.surface3 }} />
                <View style={{
                  position: 'absolute', bottom: 6, left: 6,
                  paddingHorizontal: 8, paddingVertical: 2, borderRadius: t.rPill,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <Ionicons name="scan-outline" size={11} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={{ color: '#fff', fontFamily: t.font, fontWeight: t.fw.bold, fontSize: 11 }}>
                    {detCount}
                  </Text>
                </View>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1, marginRight: 8 }}>Photo {idx + 1}</Text>
                  {detCount === 0 ? (
                    <StatusBadge color="success" label="No damage" />
                  ) : photoPrimary ? (
                    <StatusBadge color="neutral" label={photoPrimary} />
                  ) : null}
                </View>
                <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg4 }}>
                  {detCount} {detCount === 1 ? 'detection' : 'detections'} · {parts} {parts === 1 ? 'part' : 'parts'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={t.fg5} />
            </Card>
          );
        })}
      </View>

      {/* Affected parts */}
      {dedupedParts.size > 0 ? (
        <>
          <SectionHeader title="Affected parts" hint="Deduplicated across photos" />
          <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 }}>
            {Array.from(dedupedParts.entries()).map(([name, cost]) => (
              <EstimateLineItem key={name} label={name} value={`€${cost.toFixed(0)}`} />
            ))}
            <EstimateLineItem total label="Total estimate" value={`€${(estimate ?? 0).toFixed(0)}`} />
          </Card>
        </>
      ) : null}

      {/* Repair log */}
      <SectionHeader title="Repair log" action={<LinkButton onPress={onAddRepair} leftIcon="add">Add repair</LinkButton>} />
      {repairs.length === 0 ? (
        <EmptyState icon="construct-outline" title="No repairs logged" body="Track what has been fixed and how much it cost." />
      ) : (
        <View style={{ gap: 10 }}>
          {repairs.map(r => (
            <Card key={r.id} padding={14}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1 }}>{r.performedBy || 'Repair'}</Text>
                  <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{formatDate(r.performedAt)}</Text>
                  {r.workDescription ? <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg3, marginTop: 10, lineHeight: 20 }}>{r.workDescription}</Text> : null}
                  {r.notes ? <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 6, fontStyle: 'italic' }}>{r.notes}</Text> : null}
                </View>
                {typeof r.actualCost === 'number' ? (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={overlineStyle(t)}>Spent</Text>
                    <Text style={{ fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.h2, color: t.success, marginTop: 2 }}>€{r.actualCost.toFixed(0)}</Text>
                  </View>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: t.hairline }}>
                <LinkButton onPress={() => onEditRepair(r.id)}>Edit</LinkButton>
                <LinkButton color="severe" onPress={() => handleDeleteRepair(r)}>Delete</LinkButton>
              </View>
            </Card>
          ))}
        </View>
      )}

      {spent !== null ? (
        <Text style={{ marginTop: 16, fontFamily: t.font, fontSize: t.fs.bodySm, fontWeight: t.fw.semibold, color: t.fg1, textAlign: 'right' }}>
          Total spent on repairs: €{spent.toFixed(0)}
        </Text>
      ) : null}

      {onDeleteSession ? (
        <View style={{ marginTop: 28 }}>
          <DangerButton leftIcon="trash-outline" onPress={onDeleteSession}>Delete session</DangerButton>
        </View>
      ) : null}
    </ScrollView>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  const { tokens: t } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={overlineStyle(t)}>{label}</Text>
      <Text style={{
        fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.h3,
        color: t.fg1, marginTop: 6,
      }}>{value}</Text>
    </View>
  );
}

function overlineStyle(t: ReturnType<typeof useTheme>['tokens']) {
  return {
    fontFamily: t.font,
    fontSize: 10,
    fontWeight: t.fw.semibold,
    color: t.fg5,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
  };
}
