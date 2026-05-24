import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnalyzeStackParamList } from '../../navigation/types';
import type { AnalysisSession } from '../../types/analysis';
import { getSessionsForVehicle, saveSession, appendPhotosToSession } from '../../services/historyStorage';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import SectionHeader from '../../components/SectionHeader';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'PickSession'>;

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

export default function PickSessionScreen({ navigation, route }: Props) {
  const { tokens: t } = useTheme();
  const { vehicleId, photos } = route.params;
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const s = await getSessionsForVehicle(vehicleId);
    setSessions(s);
    setLoading(false);
  }, [vehicleId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleNewSession = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const session = await saveSession(vehicleId, photos);
      navigation.replace('ResultsSummary', { sessionId: session.id });
    } catch {
      Alert.alert('Error', 'Could not save session.');
      setSaving(false);
    }
  };

  const handleAppend = async (session: AnalysisSession) => {
    if (saving) return;
    setSaving(true);
    try {
      await appendPhotosToSession(session.id, photos);
      navigation.replace('ResultsSummary', { sessionId: session.id });
    } catch {
      Alert.alert('Error', 'Could not add photos to that session.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 40 }}>
      <Text style={{ fontFamily: t.font, fontSize: t.fs.h1, fontWeight: t.fw.bold, color: t.fg1, letterSpacing: -0.4, marginTop: 4, marginBottom: 6 }}>
        New session or add to existing?
      </Text>
      <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginBottom: 20, lineHeight: 20 }}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} analyzed. Save them as a new session, or add them to one of this vehicle&apos;s sessions.
      </Text>

      <PrimaryButton leftIcon="add-circle-outline" onPress={handleNewSession} loading={saving}>
        Save as new session
      </PrimaryButton>

      {sessions.length > 0 ? (
        <>
          <SectionHeader title="Or add to an existing session" />
          <View style={{ gap: 10 }}>
            {sessions.map((s) => {
              const firstUri = s.photos[0]?.localUri;
              return (
                <Card key={s.id} onPress={() => handleAppend(s)} padding={12} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {firstUri ? (
                    <Image source={{ uri: firstUri }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: t.surface3 }} />
                  ) : (
                    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: t.surface3 }} />
                  )}
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.body, fontWeight: t.fw.semibold, color: t.fg1 }}>{formatDate(s.createdAt)}</Text>
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>
                      {s.photos.length} {s.photos.length === 1 ? 'photo' : 'photos'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={t.fg5} />
                </Card>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}
