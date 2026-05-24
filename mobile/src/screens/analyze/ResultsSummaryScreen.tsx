import React, { useCallback, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnalyzeStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import { getSession } from '../../services/historyStorage';
import { getVehicle } from '../../services/vehicleStorage';
import SessionDetailView from '../../components/SessionDetailView';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'ResultsSummary'>;

export default function ResultsSummaryScreen({ navigation, route }: Props) {
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
      title="Analysis complete"
      onPhotoPress={(idx) =>
        navigation.navigate('ResultDetail', { sessionId, photoIndex: idx })
      }
      onAddPhotos={() => navigation.navigate('AddPhotos', { sessionId })}
      onAddRepair={() => navigation.navigate('EditRepair', { sessionId })}
      onEditRepair={(repairId) => navigation.navigate('EditRepair', { sessionId, repairId })}
      onChanged={reload}
    />
  );
}
