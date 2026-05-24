import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AnalyzeStackParamList } from '../../navigation/types';
import type { Vehicle } from '../../types/analysis';
import {
  createVehicle,
  getVehicles,
  vehicleDisplayName,
} from '../../services/vehicleStorage';
import { saveSession } from '../../services/historyStorage';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import Segmented from '../../components/Segmented';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'PickVehicle'>;

type Mode = 'pick' | 'create';

export default function PickVehicleScreen({ navigation, route }: Props) {
  const { tokens: t } = useTheme();
  const { photos } = route.params;

  const [mode, setMode] = useState<Mode>('create');
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');

  useEffect(() => {
    (async () => {
      const all = await getVehicles();
      setVehicles(all);
      // Pre-fill new-vehicle form from AI guess on first photo.
      const first = photos[0]?.result;
      if (first) {
        setBrand(first.vehicle_brand ?? '');
        setModel(first.vehicle_model ?? '');
        setYear(first.vehicle_year !== undefined ? String(first.vehicle_year) : '');
      }
      // If user already has vehicles, default to picking from them.
      setMode(all.length > 0 ? 'pick' : 'create');
      setLoading(false);
    })();
  }, [photos]);

  const handleSelectExisting = (vehicle: Vehicle) => {
    if (saving) return;
    // Existing vehicles may already have sessions — let the user choose a new
    // session or append to one of the vehicle's existing sessions.
    navigation.navigate('PickSession', { vehicleId: vehicle.id, photos });
  };

  const handleCreateAndSave = async () => {
    if (saving) return;
    const yearNum = year.trim() === '' ? undefined : Number(year);
    if (yearNum !== undefined && (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100)) {
      Alert.alert('Invalid year', 'Year must be a valid number between 1900 and 2100.');
      return;
    }
    setSaving(true);
    try {
      const vehicle = await createVehicle({
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: yearNum,
        licensePlate: licensePlate.trim() || undefined,
      });
      const session = await saveSession(vehicle.id, photos);
      navigation.replace('ResultsSummary', { sessionId: session.id });
    } catch {
      Alert.alert('Error', 'Could not create vehicle and save session.');
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
        Save to which vehicle?
      </Text>
      <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginBottom: 20, lineHeight: 20 }}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} analyzed. Choose where this session belongs.
      </Text>

      {vehicles.length > 0 ? (
        <View style={{ marginBottom: 18 }}>
          <Segmented<Mode>
            options={[{ value: 'pick', label: 'Existing' }, { value: 'create', label: '+ New vehicle' }]}
            value={mode}
            onChange={setMode}
          />
        </View>
      ) : null}

      {mode === 'pick' ? (
        vehicles.length === 0 ? (
          <Text style={{ color: t.fg5, fontStyle: 'italic', fontFamily: t.font }}>No vehicles yet. Create one below.</Text>
        ) : (
          <View style={{ gap: 10 }}>
            {vehicles.map((v) => (
              <Card key={v.id} onPress={() => handleSelectExisting(v)} padding={14} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 36, height: 36, borderRadius: 10, backgroundColor: t.primarySubtle,
                  alignItems: 'center', justifyContent: 'center', marginRight: 12,
                }}>
                  <Ionicons name="car" size={18} color={t.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: t.font, fontSize: t.fs.body, fontWeight: t.fw.semibold, color: t.fg1 }}>{vehicleDisplayName(v)}</Text>
                  {v.licensePlate ? (
                    <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{v.licensePlate}</Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={t.fg5} />
              </Card>
            ))}
          </View>
        )
      ) : (
        <Card padding={16}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginBottom: 14 }}>AI guess pre-filled — adjust if wrong.</Text>

          <Field label="Brand">
            <Input value={brand} onChangeText={setBrand} placeholder="e.g. Toyota" autoCapitalize="words" />
          </Field>
          <Field label="Model">
            <Input value={model} onChangeText={setModel} placeholder="e.g. Corolla" autoCapitalize="words" />
          </Field>
          <Field label="Year">
            <Input value={year} onChangeText={setYear} placeholder="e.g. 2018" keyboardType="number-pad" maxLength={4} />
          </Field>
          <Field label="License plate">
            <Input value={licensePlate} onChangeText={setLicensePlate} placeholder="e.g. ABC123" autoCapitalize="characters" />
          </Field>

          <View style={{ marginTop: 10 }}>
            <PrimaryButton onPress={handleCreateAndSave} loading={saving}>Create vehicle and save</PrimaryButton>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}
