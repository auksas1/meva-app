import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { HistoryStackParamList } from '../../navigation/types';
import type { AnalysisSession, Vehicle } from '../../types/analysis';
import { createVehicle, getVehicles, vehicleDisplayName } from '../../services/vehicleStorage';
import { getSessions } from '../../services/historyStorage';

import { useTheme } from '../../theme';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import SectionHeader from '../../components/SectionHeader';
import PrimaryButton from '../../components/PrimaryButton';
import { detectionCount } from '../../components/detections';

type Props = NativeStackScreenProps<HistoryStackParamList, 'VehicleList'>;

type VehicleSummary = {
  vehicle: Vehicle;
  sessionCount: number;
  repairCount: number;
  findings: number;
};

function summarize(vehicles: Vehicle[], sessions: AnalysisSession[]): VehicleSummary[] {
  return vehicles.map((v) => {
    const matching = sessions.filter((s) => s.vehicleId === v.id);
    const repairCount = matching.reduce((sum, s) => sum + (s.repairs?.length ?? 0), 0);
    let findings = 0;
    for (const s of matching) for (const p of s.photos) findings += detectionCount(p.result);
    return { vehicle: v, sessionCount: matching.length, repairCount, findings };
  });
}

export default function VehicleListScreen({ navigation }: Props) {
  const { tokens: t } = useTheme();
  const [data, setData] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [vehicles, sessions] = await Promise.all([getVehicles(), getSessions()]);
    setData(summarize(vehicles, sessions));
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  const handleAddVehicle = async () => {
    const v = await createVehicle({});
    navigation.navigate('EditVehicle', { vehicleId: v.id });
  };

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color={t.primary} /></View>;
  }

  if (data.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg, paddingHorizontal: 32 }}>
        <EmptyState
          icon="car-outline"
          title="No vehicles yet"
          body="Take a photo from Analyze to start, or add a vehicle manually."
          action={<PrimaryButton leftIcon="add" onPress={handleAddVehicle}>Add vehicle</PrimaryButton>}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={data}
        contentContainerStyle={{ padding: t.screenPad, paddingBottom: 100 }}
        keyExtractor={(item) => item.vehicle.id}
        ListHeaderComponent={
          <SectionHeader title={`${data.length} ${data.length === 1 ? 'vehicle' : 'vehicles'}`} />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('VehicleDetail', { vehicleId: item.vehicle.id })} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: t.primarySubtle, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="car-outline" size={22} color={t.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1 }}>
                  {vehicleDisplayName(item.vehicle)}
                </Text>
                {item.findings > 0 ? <StatusBadge color="neutral" label={`${item.findings} ${item.findings === 1 ? 'finding' : 'findings'}`} /> : null}
              </View>
              {item.vehicle.licensePlate ? (
                <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 4 }}>{item.vehicle.licensePlate}</Text>
              ) : null}
              <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg4, marginTop: 4 }}>
                {item.sessionCount} {item.sessionCount === 1 ? 'session' : 'sessions'}
                {item.repairCount > 0 ? ` · ${item.repairCount} repaired` : ''}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={t.fg5} />
          </Card>
        )}
      />
      {/* FAB */}
      <Pressable
        onPress={handleAddVehicle}
        style={({ pressed }) => ({
          position: 'absolute', right: 20, bottom: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: t.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: t.primary,
          shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 },
          elevation: 8,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}
