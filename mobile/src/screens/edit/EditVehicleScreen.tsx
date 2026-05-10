import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { getVehicle, updateVehicle } from '../../services/vehicleStorage';

type EditVehicleRoute = RouteProp<{ EditVehicle: { vehicleId: string } }, 'EditVehicle'>;

export default function EditVehicleScreen() {
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
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.helper}>
        Edit vehicle details. Updates apply to all sessions for this vehicle.
      </Text>

      <Text style={styles.label}>Brand</Text>
      <TextInput
        value={brand}
        onChangeText={setBrand}
        placeholder="e.g. Toyota"
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Model</Text>
      <TextInput
        value={model}
        onChangeText={setModel}
        placeholder="e.g. Corolla"
        style={styles.input}
        autoCapitalize="words"
      />

      <Text style={styles.label}>Year</Text>
      <TextInput
        value={year}
        onChangeText={setYear}
        placeholder="e.g. 2018"
        keyboardType="number-pad"
        maxLength={4}
        style={styles.input}
      />

      <Text style={styles.label}>License plate</Text>
      <TextInput
        value={licensePlate}
        onChangeText={setLicensePlate}
        placeholder="e.g. ABC123"
        autoCapitalize="characters"
        style={styles.input}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="e.g. Bought used in 2022"
        multiline
        style={[styles.input, styles.inputMulti]}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.buttonCancel]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  helper: { fontSize: 13, color: '#666', marginBottom: 16, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '600', color: '#333', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  inputMulti: { minHeight: 70, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginTop: 24 },
  button: {
    flex: 1,
    backgroundColor: '#1f6feb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonCancel: { backgroundColor: '#888' },
  buttonDisabled: { backgroundColor: '#bbb' },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
