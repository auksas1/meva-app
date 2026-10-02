import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import { getVehicle, deleteVehicle, vehicleDisplayName } from '../../services/vehicleStorage';
import { getSessionsForVehicle, deleteSession } from '../../services/historyStorage';
import { confirmAction } from '../../components/confirmAction';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import SecondaryButton from '../../components/SecondaryButton';
import DangerButton from '../../components/DangerButton';
import SectionHeader from '../../components/SectionHeader';
import LinkButton from '../../components/LinkButton';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { detectionCount } from '../../components/detections';

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
  return s.photos.reduce((sum, p) => sum + detectionCount(p.result), 0);
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
  const { tokens: t } = useTheme();
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
    const message =
      sessions.length > 0
        ? `This vehicle has ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}. The vehicle and all its sessions will be deleted.`
        : 'This action cannot be undone.';
    confirmAction('Delete vehicle?', message, async () => {
      try {
        for (const s of sessions) {
          await deleteSession(s.id);
        }
        await deleteVehicle(vehicleId);
        navigation.goBack();
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        Alert.alert('Could not delete vehicle', msg);
      }
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  if (!vehicle) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text style={{ color: t.fg5 }}>Vehicle not found.</Text>
      </View>
    );
  }

  const infoRow = (key: string, value: string) => (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5 }}>{key}</Text>
      <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg1, fontWeight: t.fw.medium, flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
        <View style={{
          width: 40, height: 40, borderRadius: 12, backgroundColor: t.primarySubtle,
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Ionicons name="car" size={22} color={t.primary} />
        </View>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.h1, fontWeight: t.fw.bold, color: t.fg1, letterSpacing: -0.4, flex: 1 }}>
          {vehicleDisplayName(vehicle)}
        </Text>
      </View>

      <Card padding={{ paddingHorizontal: 16, paddingVertical: 6 }}>
        {infoRow('Brand', vehicle.brand ?? '—')}
        {infoRow('Model', vehicle.model ?? '—')}
        {infoRow('Year', vehicle.year !== undefined ? String(vehicle.year) : '—')}
        {infoRow('License plate', vehicle.licensePlate ?? '—')}
        {vehicle.notes ? (
          <View style={{ paddingVertical: 8 }}>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5, marginBottom: 4 }}>Notes</Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg2, lineHeight: 20 }}>{vehicle.notes}</Text>
          </View>
        ) : null}
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton leftIcon="create-outline" onPress={() => navigation.navigate('EditVehicle', { vehicleId })}>
            Edit vehicle
          </SecondaryButton>
        </View>
        <View style={{ flex: 1 }}>
          <DangerButton leftIcon="trash-outline" onPress={handleDelete}>Delete</DangerButton>
        </View>
      </View>

      <SectionHeader
        title="Sessions"
        action={<LinkButton leftIcon="add" onPress={() => navigation.navigate('AddPhotos', { vehicleId })}>New session</LinkButton>}
      />

      {sessions.length === 0 ? (
        <EmptyState icon="images-outline" title="No analyses yet" body="No analyses yet for this vehicle. Take photos in the Analyze tab." />
      ) : (
        <View style={{ gap: 10 }}>
          {sessions.map((s) => {
            const damages = totalDamages(s);
            const estimate = totalEstimate(s);
            const repaired = (s.repairs?.length ?? 0) > 0;
            const firstUri = s.photos[0]?.localUri;
            return (
              <Card key={s.id} onPress={() => navigation.navigate('HistorySession', { sessionId: s.id })} padding={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
                {firstUri ? (
                  <Image source={{ uri: firstUri }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: t.surface3 }} />
                ) : (
                  <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: t.surface3 }} />
                )}
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.body, fontWeight: t.fw.semibold, color: t.fg1 }}>{formatDate(s.createdAt)}</Text>
                    {repaired ? <StatusBadge color="success" label="Repaired" /> : null}
                  </View>
                  <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg4, marginTop: 4 }}>
                    {s.photos.length} {s.photos.length === 1 ? 'photo' : 'photos'} · {damages} {damages === 1 ? 'damage' : 'damages'}
                    {estimate !== null ? `  ·  €${estimate.toFixed(0)}` : ''}
                  </Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}
