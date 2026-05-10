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
import {
  DEFAULT_BACKEND_URL,
  IMAGE_QUALITY_PRESETS,
  type ImageQuality,
} from '../constants/config';
import { healthCheck, type AnalysisResponse } from '../services/api';
import {
  getStoredBackendUrl,
  setStoredBackendUrl,
  getStoredImageQuality,
  setStoredImageQuality,
} from '../services/storage';
import { saveSession, clearHistory } from '../services/historyStorage';
import { createVehicle, getVehicles, clearVehicles } from '../services/vehicleStorage';
import type { AnalyzedPhoto } from '../types/analysis';

const QUALITY_OPTIONS: { value: ImageQuality; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const FAKE_LABELS = ['Dent', 'Scratch', 'Crack', 'Bumper damage', 'Broken light'];
const FAKE_PARTS = [
  { name: 'Front bumper', cost: 420 },
  { name: 'Right headlight', cost: 180 },
  { name: 'Left fender', cost: 350 },
  { name: 'Hood', cost: 600 },
  { name: 'Rear door panel', cost: 290 },
  { name: 'Side mirror', cost: 110 },
];
const FAKE_VEHICLES = [
  { brand: 'Toyota', model: 'Corolla', year: 2018 },
  { brand: 'BMW', model: '3 Series', year: 2020 },
  { brand: 'Volkswagen', model: 'Golf', year: 2017 },
  { brand: 'Honda', model: 'Civic', year: 2019 },
  { brand: 'Audi', model: 'A4', year: 2021 },
];
const FAKE_RECOMMENDATIONS = [
  'Cosmetic damage — touch-up paint should be sufficient.',
  'Moderate damage — recommend body shop inspection.',
  'Significant damage — professional repair strongly advised before driving.',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function makeFakePhoto(seed: number, vehicle: (typeof FAKE_VEHICLES)[number]): AnalyzedPhoto {
  const zoneCount = 1 + (seed % 4);
  const zones = Array.from({ length: zoneCount }, (_, i) => ({
    label: FAKE_LABELS[(seed + i) % FAKE_LABELS.length],
    confidence: 0.5 + Math.random() * 0.5,
    bbox: [0.1, 0.2, 0.5, 0.6] as [number, number, number, number],
  }));
  const partCount = 1 + (seed % 3);
  const parts = Array.from({ length: partCount }, (_, i) => {
    const p = FAKE_PARTS[(seed + i) % FAKE_PARTS.length];
    return { name: p.name, estimated_cost: p.cost };
  });
  const total = parts.reduce((sum, p) => sum + (p.estimated_cost ?? 0), 0);
  const score = Math.random();
  const recIndex = score >= 0.66 ? 2 : score >= 0.33 ? 1 : 0;

  const result: AnalysisResponse = {
    id: Math.floor(Math.random() * 100000),
    image_filename: `test_${seed}.jpg`,
    damage_score: score,
    damage_zones: zones,
    status: 'completed',
    created_at: new Date().toISOString(),
    vehicle_brand: vehicle.brand,
    vehicle_model: vehicle.model,
    vehicle_year: vehicle.year,
    affected_parts: parts,
    total_estimated_cost: total,
    repair_recommendation: FAKE_RECOMMENDATIONS[recIndex],
  };
  return {
    localUri: `https://picsum.photos/seed/meva${seed}-${Date.now()}/640/480`,
    result,
  };
}

export default function SettingsScreen() {
  const [urlInput, setUrlInput] = useState(DEFAULT_BACKEND_URL);
  const [savedUrl, setSavedUrl] = useState(DEFAULT_BACKEND_URL);
  const [quality, setQuality] = useState<ImageQuality>('medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [storedUrl, storedQuality] = await Promise.all([
          getStoredBackendUrl(),
          getStoredImageQuality(),
        ]);
        setUrlInput(storedUrl);
        setSavedUrl(storedUrl);
        setQuality(storedQuality);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (trimmed.length === 0) {
      Alert.alert('Invalid URL', 'Backend URL cannot be empty.');
      return;
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      Alert.alert('Invalid URL', 'URL must start with http:// or https://');
      return;
    }
    try {
      setSaving(true);
      await setStoredBackendUrl(trimmed);
      const cleaned = trimmed.replace(/\/+$/, '');
      setSavedUrl(cleaned);
      setUrlInput(cleaned);
      Alert.alert('Saved', 'Backend URL updated.');
    } catch {
      Alert.alert('Error', 'Could not save backend URL.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    try {
      const ok = await healthCheck();
      if (ok) {
        Alert.alert('Connection OK', 'Backend connected successfully.');
      } else {
        Alert.alert(
          'Connection failed',
          'Could not connect to backend. Check URL or make sure backend is running.',
        );
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSelectQuality = async (next: ImageQuality) => {
    setQuality(next);
    try {
      await setStoredImageQuality(next);
    } catch {
      Alert.alert('Error', 'Could not save image quality.');
    }
  };

  const handleAddTestSession = async () => {
    try {
      const count = 1 + Math.floor(Math.random() * 3);
      const seedBase = Math.floor(Math.random() * 1000);
      const fakeVehicle = pick(FAKE_VEHICLES, seedBase);
      const photos = Array.from({ length: count }, (_, i) =>
        makeFakePhoto(seedBase + i + 1, fakeVehicle),
      );

      // Reuse existing vehicle if one matches by brand+model+year, else create new.
      const existing = await getVehicles();
      const match = existing.find(
        (v) =>
          v.brand === fakeVehicle.brand &&
          v.model === fakeVehicle.model &&
          v.year === fakeVehicle.year,
      );
      const vehicle =
        match ??
        (await createVehicle({
          brand: fakeVehicle.brand,
          model: fakeVehicle.model,
          year: fakeVehicle.year,
        }));

      await saveSession(vehicle.id, photos);
      Alert.alert(
        'Test session added',
        `${count} fake ${count === 1 ? 'photo' : 'photos'} (${fakeVehicle.brand} ${fakeVehicle.model}) saved${match ? ' to existing vehicle' : ' as new vehicle'}.`,
      );
    } catch {
      Alert.alert('Error', 'Could not save test session.');
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear all data?',
      'All saved vehicles and analysis sessions will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              await clearVehicles();
              Alert.alert('Cleared');
            } catch {
              Alert.alert('Error', 'Could not clear data.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
      </View>
    );
  }

  const urlDirty = urlInput.trim().replace(/\/+$/, '') !== savedUrl;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.sectionLabel}>Backend URL</Text>
      <TextInput
        value={urlInput}
        onChangeText={setUrlInput}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        placeholder="http://10.0.2.2:8000"
        style={styles.input}
      />
      <Text style={styles.helper}>Currently using: {savedUrl}</Text>

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, (!urlDirty || saving) && styles.buttonDisabled]}
          onPress={handleSaveUrl}
          disabled={!urlDirty || saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save URL</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary, checking && styles.buttonDisabled]}
          onPress={handleCheckConnection}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Check connection</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Image quality</Text>
      <View style={styles.segmented}>
        {QUALITY_OPTIONS.map((opt) => {
          const selected = quality === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.segment, selected && styles.segmentSelected]}
              onPress={() => handleSelectQuality(opt.value)}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.helper}>
        Capture quality: {IMAGE_QUALITY_PRESETS[quality].toFixed(1)}
      </Text>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>Dev tools</Text>
      <Text style={styles.helper}>For development testing only.</Text>
      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={handleAddTestSession}
        >
          <Text style={styles.buttonText}>Add test session</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleClearHistory}
        >
          <Text style={styles.buttonText}>Clear history</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, styles.sectionSpacing]}>About</Text>
      <Text style={styles.aboutLine}>MEVA AutoDamage</Text>
      <Text style={styles.aboutLine}>App version: Sprint 3 demo</Text>
      <Text style={styles.aboutLine}>React Native + Expo</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },

  sectionLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
  sectionSpacing: { marginTop: 24 },
  helper: { fontSize: 12, color: '#666', marginTop: 6 },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#fff',
  },

  row: { flexDirection: 'row', gap: 10, marginTop: 12 },
  button: {
    flex: 1,
    backgroundColor: '#1f6feb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonSecondary: { backgroundColor: '#3a7afc' },
  buttonDanger: { backgroundColor: '#d12f2f' },
  buttonDisabled: { backgroundColor: '#bbb' },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  segmented: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  segmentSelected: { backgroundColor: '#1f6feb' },
  segmentText: { fontSize: 14, color: '#333', fontWeight: '500' },
  segmentTextSelected: { color: '#fff', fontWeight: '700' },

  aboutLine: { fontSize: 14, color: '#444', marginBottom: 4 },
});
