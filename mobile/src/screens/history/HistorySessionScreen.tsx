import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import { getSession, deleteSession } from '../../services/historyStorage';
import { getVehicle } from '../../services/vehicleStorage';
import SessionDetailView from '../../components/SessionDetailView';
import { confirmAction } from '../../components/confirmAction';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<HistoryStackParamList, 'HistorySession'>;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export default function HistorySessionScreen({ navigation, route }: Props) {
  const { tokens: t } = useTheme();
  const { sessionId } = route.params;
  const [session, setSession] = useState<AnalysisSession | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const s = await getSession(sessionId);
    setSession(s);
    if (s) {
      const v = await getVehicle(s.vehicleId);
      setVehicle(v);
    }
    setLoading(false);
  }, [sessionId]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const handleDeleteSession = () => {
    confirmAction(
      'Delete session?',
      'This session and all its photos will be removed.',
      async () => {
        await deleteSession(sessionId);
        navigation.goBack();
      },
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <ActivityIndicator color={t.primary} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
        <Text style={{ color: t.fg5 }}>Session not found.</Text>
      </View>
    );
  }

  return (
    <SessionDetailView
      session={session}
      vehicle={vehicle}
      title={`Analysis from ${formatDate(session.createdAt)}`}
      onPhotoPress={(idx) =>
        navigation.navigate('ResultDetail', { sessionId, photoIndex: idx })
      }
      onAddPhotos={() => navigation.navigate('AddPhotos', { sessionId })}
      onAddRepair={() => navigation.navigate('EditRepair', { sessionId })}
      onEditRepair={(repairId) => navigation.navigate('EditRepair', { sessionId, repairId })}
      onChanged={reload}
      onDeleteSession={handleDeleteSession}
    />
  );
}
