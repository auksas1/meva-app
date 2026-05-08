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

type Props = NativeStackScreenProps<AnalyzeStackParamList, 'PickVehicle'>;

type Mode = 'pick' | 'create';

export default function PickVehicleScreen({ navigation, route }: Props) {
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

  const handleSelectExisting = async (vehicle: Vehicle) => {
    if (saving) return;
    setSaving(true);
    try {
      const session = await saveSession(vehicle.id, photos);
      navigation.replace('ResultsSummary', { sessionId: session.id });
    } catch {
      Alert.alert('Error', 'Could not save session.');
      setSaving(false);
    }
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
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Save to which vehicle?</Text>
      <Text style={styles.subtitle}>
        {photos.length} {photos.length === 1 ? 'photo' : 'photos'} analyzed. Choose where this
        session belongs.
      </Text>

      {vehicles.length > 0 ? (
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, mode === 'pick' && styles.tabActive]}
            onPress={() => setMode('pick')}
          >
            <Text style={[styles.tabText, mode === 'pick' && styles.tabTextActive]}>
              Existing
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'create' && styles.tabActive]}
            onPress={() => setMode('create')}
          >
            <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
              + New vehicle
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {mode === 'pick' ? (
        vehicles.length === 0 ? (
          <Text style={styles.empty}>No vehicles yet. Create one below.</Text>
        ) : (
          vehicles.map((v) => (
            <TouchableOpacity
              key={v.id}
              style={styles.vehicleCard}
              onPress={() => handleSelectExisting(v)}
              disabled={saving}
            >
              <Ionicons name="car" size={20} color="#1f6feb" />
              <View style={styles.vehicleBody}>
                <Text style={styles.vehicleName}>{vehicleDisplayName(v)}</Text>
                {v.licensePlate ? (
                  <Text style={styles.vehiclePlate}>{v.licensePlate}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))
        )
      ) : (
        <View>
          <Text style={styles.helper}>AI guess pre-filled — adjust if wrong.</Text>

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

          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            onPress={handleCreateAndSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Create vehicle and save</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#555', marginBottom: 20 },

  tabRow: { flexDirection: 'row', backgroundColor: '#eee', borderRadius: 8, marginBottom: 18 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#1f6feb' },
  tabText: { fontSize: 14, color: '#444', fontWeight: '500' },
  tabTextActive: { color: '#fff', fontWeight: '700' },

  empty: { color: '#888', fontStyle: 'italic', marginBottom: 16 },

  vehicleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    marginBottom: 8,
    gap: 10,
  },
  vehicleBody: { flex: 1 },
  vehicleName: { fontSize: 15, fontWeight: '600', color: '#222' },
  vehiclePlate: { fontSize: 12, color: '#666', marginTop: 2 },

  helper: { fontSize: 13, color: '#666', marginBottom: 12 },
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

  primaryButton: {
    backgroundColor: '#1f8a3e',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: { backgroundColor: '#bbb' },
  primaryButtonText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
