import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { getVehicle, updateVehicle } from '../../services/vehicleStorage';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';

type EditVehicleRoute = RouteProp<{ EditVehicle: { vehicleId: string } }, 'EditVehicle'>;

export default function EditVehicleScreen() {
  const { tokens: t } = useTheme();
  const route = useRoute<EditVehicleRoute>();
  const navigation = useNavigation();
  const { vehicleId } = route.params;

  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const v = await getVehicle(vehicleId);
      if (v) {
        setBrand(v.brand ?? '');
        setModel(v.model ?? '');
        setYear(v.year !== undefined ? String(v.year) : '');
        setLicensePlate(v.licensePlate ?? '');
        setNotes(v.notes ?? '');
      }
      setLoading(false);
    })();
  }, [vehicleId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const yearNum = year.trim() === '' ? undefined : Number(year);
      if (yearNum !== undefined && (Number.isNaN(yearNum) || yearNum < 1900 || yearNum > 2100)) {
        Alert.alert('Invalid year', 'Year must be a valid number between 1900 and 2100.');
        setSaving(false);
        return;
      }
      await updateVehicle(vehicleId, {
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: yearNum,
        licensePlate: licensePlate.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save vehicle info.');
    } finally {
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
      <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginBottom: 16, lineHeight: 20 }}>
        Edit vehicle details. Updates apply to all sessions for this vehicle.
      </Text>

      <Card padding={16}>
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
        <Field label="Notes">
          <Input value={notes} onChangeText={setNotes} placeholder="e.g. Bought used in 2022" multiline style={{ minHeight: 70, textAlignVertical: 'top' }} />
        </Field>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 24 }}>
        <View style={{ flex: 1 }}>
          <SecondaryButton onPress={() => navigation.goBack()} disabled={saving}>Cancel</SecondaryButton>
        </View>
        <View style={{ flex: 1 }}>
          <PrimaryButton onPress={handleSave} loading={saving}>Save</PrimaryButton>
        </View>
      </View>
    </ScrollView>
  );
}
