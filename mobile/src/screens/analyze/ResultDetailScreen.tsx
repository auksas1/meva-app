import React, { useCallback, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
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
import BboxOverlay from '../../components/BboxOverlay';
import {
  getDetections,
  detectionCount,
  prettifyLabel,
  confidenceLabel,
  confidencePercent,
  confidenceColor,
  getRecommendation,
  getAnnotatedImage,
  analysisNotice,
  noticeColors,
} from '../../components/detections';

type ResultDetailRoute = RouteProp<
  { ResultDetail: { sessionId: string; photoIndex: number } },
  'ResultDetail'
>;

function formatDate(iso: string): string {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

function damageBreakdown(result: AnalysisResponse): string {
  const dets = getDetections(result);
  if (dets.length === 0) return 'No damage detected';
  const counts = new Map<string, number>();
  for (const d of dets) counts.set(d.label, (counts.get(d.label) ?? 0) + 1);
  return Array.from(counts.entries())
    .map(([label, n]) => `${n} ${prettifyLabel(label).toLowerCase()}${n > 1 ? 's' : ''}`)
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
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);

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
  // Prefer a backend-annotated (pre-framed) image; fall back to the local photo.
  const imageUri = getAnnotatedImage(result) ?? localUri;
  const detections = getDetections(result);
  const count = detectionCount(result);
  const parts = result.affected_parts ?? [];
  const total = typeof result.total_estimated_cost === 'number' ? result.total_estimated_cost : null;
  const recommendation = getRecommendation(result);
  const notice = analysisNotice(result);
  const confColorMap = { success: t.success, warning: t.warning, neutral: t.fg4 } as const;

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

      {/* Hero image with bounding boxes */}
      <View
        onLayout={(e: LayoutChangeEvent) => setImageLayout({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        style={{
          borderRadius: t.rLg, overflow: 'hidden',
          borderWidth: 1, borderColor: t.hairline,
          shadowColor: t.shadowColor, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: t.surface3 }}
          resizeMode="contain"
          onLoad={(e) =>
            setNaturalSize({ width: e.nativeEvent.source.width, height: e.nativeEvent.source.height })
          }
        />
        {detections.length > 0 && imageLayout && naturalSize && (
          <BboxOverlay
            detections={detections}
            containerWidth={imageLayout.width}
            containerHeight={imageLayout.height}
            imageNaturalWidth={naturalSize.width}
            imageNaturalHeight={naturalSize.height}
          />
        )}
        {/* Detections count chip */}
        <View style={{
          position: 'absolute', top: 12, right: 12,
          paddingHorizontal: 12, paddingVertical: 6,
          borderRadius: t.rPill,
          backgroundColor: 'rgba(0,0,0,0.55)',
          flexDirection: 'row', alignItems: 'center',
        }}>
          <Ionicons name="scan-outline" size={13} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontFamily: t.font, fontSize: t.fs.caption, fontWeight: t.fw.semibold }}>
            {count} {count === 1 ? 'detection' : 'detections'}
          </Text>
        </View>
      </View>

      {/* Analysis state notice (no damage / poor quality / needs review) */}
      {notice ? (
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          backgroundColor: noticeColors(notice.tone, t).bg,
          borderRadius: t.rMd, paddingHorizontal: 14, paddingVertical: 12, marginTop: 16,
        }}>
          <Ionicons
            name={notice.tone === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
            size={18}
            color={noticeColors(notice.tone, t).fg}
            style={{ marginRight: 10 }}
          />
          <Text style={{ flex: 1, fontFamily: t.font, fontSize: t.fs.bodySm, color: noticeColors(notice.tone, t).fg, fontWeight: t.fw.medium }}>
            {notice.text}
          </Text>
        </View>
      ) : null}

      {/* Detected damage */}
      {count > 0 ? (
        <>
          <SectionHeader title="Detected damage" hint={damageBreakdown(result)} />
          <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4 }}>
            {detections.map((d, i) => {
              const cColor = confColorMap[confidenceColor(d)];
              return (
                <View key={`${d.label}-${i}`} style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 12,
                  borderBottomWidth: i === detections.length - 1 ? 0 : 1,
                  borderBottomColor: t.hairline,
                }}>
                  <Text style={{ fontFamily: t.font, fontSize: t.fs.body, color: t.fg1, flex: 1, marginRight: 12 }}>
                    {prettifyLabel(d.label)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: cColor, fontWeight: t.fw.semibold }}>
                      {confidenceLabel(d)}
                    </Text>
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginLeft: 6 }}>
                      {confidencePercent(d)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {/* Affected parts */}
      {parts.length > 0 ? (
        <>
          <SectionHeader title="Affected parts" />
          <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 }}>
            {parts.map((p, i) => (
              <EstimateLineItem key={`${p.name}-${i}`} label={p.name} value={typeof p.estimated_cost === 'number' ? `€${p.estimated_cost.toFixed(0)}` : '—'} />
            ))}
            {total !== null ? <EstimateLineItem total label="Total (this photo)" value={`€${total.toFixed(0)}`} /> : null}
          </Card>
        </>
      ) : null}

      {/* Recommendation */}
      {recommendation ? (
        <>
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
                {recommendation}
              </Text>
            </View>
          </Card>
        </>
      ) : null}

      {/* Delete photo */}
      <View style={{ marginTop: 24 }}>
        <DangerButton leftIcon="trash-outline" onPress={handleDeletePhoto}>Delete photo</DangerButton>
      </View>
    </ScrollView>
  );
}
