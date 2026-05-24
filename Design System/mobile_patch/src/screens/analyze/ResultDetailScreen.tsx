import React, { useCallback, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import type { AnalysisResponse } from '../../services/api';
import { getSession, deletePhotoFromSession } from '../../services/historyStorage';
import { getVehicle } from '../../services/vehicleStorage';
import { confirmAction } from '../../components/confirmAction';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import SectionHeader from '../../components/SectionHeader';
import EstimateLineItem from '../../components/EstimateLineItem';
import DangerButton from '../../components/DangerButton';
import { scoreColor, severityLabel } from '../../components/severity';

type ResultDetailRoute = RouteProp<
  { ResultDetail: { sessionId: string; photoIndex: number } },
  'ResultDetail'
>;

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
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
  const { tokens: t } = useTheme();
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
      return () => { active = false; };
    }, [sessionId]),
  );

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color={t.primary} /></View>;
  }
  if (!session) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><Text style={{ color: t.fg5 }}>Session not found.</Text></View>;
  }
  const photo = session.photos[photoIndex];
  if (!photo) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><Text style={{ color: t.fg5 }}>Photo not found.</Text></View>;
  }

  const handleDeletePhoto = () => {
    const lastPhoto = session.photos.length === 1;
    confirmAction(
      'Delete photo?',
      lastPhoto
        ? 'This is the only photo in the session, so the whole session will be deleted.'
        : 'This photo will be removed from the session.',
      async () => {
        await deletePhotoFromSession(sessionId, photoIndex);
        navigation.goBack();
      },
    );
  };

  const { result, localUri } = photo;
  const scorePct = Math.round(result.damage_score * 100);
  const zones = result.damage_zones ?? [];
  const parts = result.affected_parts ?? [];
  const total = typeof result.total_estimated_cost === 'number' ? result.total_estimated_cost : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 28 }}>
      {/* Photo heading + analyzed date */}
      <View style={{ marginTop: 4, marginBottom: 14 }}>
        <Text style={{ fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.h1, color: t.fg1, letterSpacing: -0.3 }}>
          Photo {photoIndex + 1}
        </Text>
        <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5, marginTop: 4 }}>
          Analyzed {formatDate(session.createdAt)}
        </Text>
      </View>

      {/* Hero image with overlay severity */}
      <View style={{
        borderRadius: t.rLg, overflow: 'hidden',
        borderWidth: 1, borderColor: t.hairline,
        shadowColor: t.shadowColor, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
        elevation: 4,
      }}>
        <Image source={{ uri: localUri }} style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: t.surface3 }} resizeMode="cover" />
        {/* Severity chip */}
        <View style={{
          position: 'absolute', top: 12, left: 12,
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: t.rPill,
          backgroundColor: 'rgba(0,0,0,0.55)',
          flexDirection: 'row', alignItems: 'center',
        }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor(result.damage_score, t), marginRight: 6 }} />
          <Text style={{ color: '#fff', fontFamily: t.font, fontSize: t.fs.caption, fontWeight: t.fw.semibold }}>{severityLabel(result.damage_score)}</Text>
        </View>
        {/* Score chip */}
        <View style={{
          position: 'absolute', top: 12, right: 12,
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: t.rPill,
          backgroundColor: 'rgba(0,0,0,0.55)',
        }}>
          <Text style={{ color: '#fff', fontFamily: t.font, fontSize: t.fs.meta, fontWeight: t.fw.bold, fontVariant: ['tabular-nums'] }}>{scorePct}%</Text>
        </View>
      </View>

      {/* Detected damage */}
      <SectionHeader title="Detected damage" hint={damageBreakdown(result)} />
      <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 }}>
        {zones.length === 0 ? (
          <Text style={{ paddingVertical: 14, color: t.fg5, fontStyle: 'italic', fontFamily: t.font }}>No zones detected.</Text>
        ) : zones.map((z, i) => (
          <View key={`${z.label}-${i}`} style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: i === zones.length - 1 ? 0 : 1,
            borderBottomColor: t.hairline,
          }}>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.body, color: t.fg1 }}>{z.label}</Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.body, color: t.fg3, fontWeight: t.fw.semibold, fontVariant: ['tabular-nums'] }}>{Math.round(z.confidence * 100)}%</Text>
          </View>
        ))}
      </Card>

      {/* Affected parts */}
      <SectionHeader title="Affected parts" />
      <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 }}>
        {parts.length === 0 ? (
          <Text style={{ paddingVertical: 14, color: t.fg5, fontStyle: 'italic', fontFamily: t.font }}>—</Text>
        ) : parts.map((p, i) => (
          <EstimateLineItem key={`${p.name}-${i}`} label={p.name} value={typeof p.estimated_cost === 'number' ? `€${p.estimated_cost.toFixed(0)}` : '—'} />
        ))}
        {total !== null ? <EstimateLineItem total label="Total (this photo)" value={`€${total.toFixed(0)}`} /> : null}
      </Card>

      {/* Recommendation */}
      <SectionHeader title="Recommendation" />
      <Card padding={16} style={{ backgroundColor: t.primarySubtle, borderColor: t.primary + '33' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10, backgroundColor: t.primary,
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons name="sparkles" size={18} color="#fff" />
          </View>
          <Text style={{ flex: 1, fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg1, lineHeight: 22 }}>
            {result.repair_recommendation ?? '—'}
          </Text>
        </View>
      </Card>

      {/* Delete photo */}
      <View style={{ marginTop: 24 }}>
        <DangerButton leftIcon="trash-outline" onPress={handleDeletePhoto}>Delete photo</DangerButton>
      </View>
    </ScrollView>
  );
}
