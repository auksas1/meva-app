import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../navigation/types';
import { DEFAULT_BACKEND_URL, IMAGE_QUALITY_PRESETS, type ImageQuality } from '../constants/config';
import { healthCheck, type AnalysisResponse } from '../services/api';
import {
  getStoredBackendUrl, setStoredBackendUrl,
  getStoredImageQuality, setStoredImageQuality,
} from '../services/storage';
import { saveSession, clearHistory } from '../services/historyStorage';
import { createVehicle, getVehicles, clearVehicles } from '../services/vehicleStorage';
import { getCurrentUser, logout, type AuthUser } from '../services/auth';
import { confirmAction } from '../components/confirmAction';
import type { AnalyzedPhoto } from '../types/analysis';

import { useTheme } from '../theme';
import BrandStamp from '../components/BrandStamp';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import { Field, Input } from '../components/Field';
import Segmented from '../components/Segmented';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import DangerButton from '../components/DangerButton';

// ---- Dev-tools test-session generator ----
// Emits the new AI contract shape and rotates through the agreed states so the
// UI (boxes, worded confidence, recommendation, no-damage / poor-quality /
// review banners) can be demoed without a live endpoint.
const MODEL_CLASSES = ['Broken Part', 'Crack', 'Dent', 'Paint Damage', 'Rust_Corrision', 'Scratch', 'Tire Damage'];
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

const CONF_TEXT = {
  high: 'high confidence',
  medium: 'medium confidence',
  low: 'low confidence',
  insufficient: 'insufficient confidence',
} as const;
const CONF_VALUE = { high: 0.82, medium: 0.55, low: 0.3, insufficient: 0.15 } as const;

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

// Normalized [x1,y1,x2,y2] boxes placed in a simple 2-column grid.
function fakeBbox(i: number): [number, number, number, number] {
  const col = i % 2;
  const row = Math.floor(i / 2) % 2;
  const x1 = 0.08 + col * 0.46;
  const y1 = 0.1 + row * 0.44;
  return [x1, y1, x1 + 0.36, y1 + 0.34];
}

function makeFakePhoto(seed: number): AnalyzedPhoto {
  const mode = seed % 4; // 0 normal · 1 no damage · 2 poor quality · 3 needs review
  const localUri = `https://picsum.photos/seed/meva${seed}-${Date.now()}/640/480`;
  const base = { id: Math.floor(Math.random() * 100000), image_filename: `test_${seed}.jpg`, created_at: new Date().toISOString() };

  if (mode === 1) {
    const result: AnalysisResponse = {
      ...base,
      status: 'no_damage',
      summary: { detections_count: 0, analysis_quality: 'good', requires_manual_review: false },
      detections: [],
      recommendation: { message: 'No visible damage was detected.' },
    };
    return { localUri, result };
  }

  const tier: keyof typeof CONF_VALUE = mode === 2 ? 'low' : mode === 3 ? 'insufficient' : seed % 2 ? 'high' : 'medium';
  const detCount = 1 + (seed % 3);
  const detections = Array.from({ length: detCount }, (_, i) => {
    const jitter = (Math.random() - 0.5) * 0.08;
    return {
      label: MODEL_CLASSES[(seed + i) % MODEL_CLASSES.length],
      confidence: Math.min(0.99, Math.max(0.05, CONF_VALUE[tier] + jitter)),
      confidence_text: CONF_TEXT[tier],
      bbox: fakeBbox(i),
    };
  });

  const partCount = 1 + (seed % 3);
  const parts = Array.from({ length: partCount }, (_, i) => {
    const p = FAKE_PARTS[(seed + i) % FAKE_PARTS.length];
    return { name: p.name, estimated_cost: p.cost };
  });
  const total = parts.reduce((sum, p) => sum + (p.estimated_cost ?? 0), 0);

  const quality = mode === 2 ? 'poor' : 'good';
  const review = mode === 3;
  const message = mode === 2
    ? 'Consider uploading a clearer image.'
    : mode === 3
      ? 'A service inspection is recommended.'
      : 'Please review the highlighted areas.';

  const status = mode === 2 ? 'poor_image_quality' : mode === 3 ? 'low_confidence' : 'damage_detected';

  const result: AnalysisResponse = {
    ...base,
    status,
    summary: {
      detections_count: detections.length,
      primary_damage: detections[0].label,
      analysis_quality: quality,
      requires_manual_review: review,
    },
    detections,
    recommendation: { message },
    affected_parts: parts,
    total_estimated_cost: total,
  };
  return { localUri, result };
}

export default function SettingsScreen() {
  const { tokens: t, pref, setPref } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<SettingsStackParamList, 'SettingsHome'>>();

  const [urlInput, setUrlInput] = useState(DEFAULT_BACKEND_URL);
  const [savedUrl, setSavedUrl] = useState(DEFAULT_BACKEND_URL);
  const [quality, setQuality] = useState<ImageQuality>('medium');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'ok' | 'failed' | null>(null);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      getCurrentUser().then(setCurrentUser).catch(() => setCurrentUser(null));
    }, []),
  );

  useEffect(() => {
    (async () => {
      try {
        const [storedUrl, storedQuality] = await Promise.all([getStoredBackendUrl(), getStoredImageQuality()]);
        setUrlInput(storedUrl);
        setSavedUrl(storedUrl);
        setQuality(storedQuality);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const urlDirty = urlInput.trim().replace(/\/+$/, '') !== savedUrl;

  const handleSaveUrl = async () => {
    const trimmed = urlInput.trim();
    if (!trimmed) { Alert.alert('Invalid URL', 'Backend URL cannot be empty.'); return; }
    if (!/^https?:\/\//i.test(trimmed)) { Alert.alert('Invalid URL', 'URL must start with http:// or https://'); return; }
    try {
      setSaving(true);
      await setStoredBackendUrl(trimmed);
      const cleaned = trimmed.replace(/\/+$/, '');
      setSavedUrl(cleaned);
      setUrlInput(cleaned);
    } catch {
      Alert.alert('Error', 'Could not save backend URL.');
    } finally {
      setSaving(false);
    }
  };

  const handleCheckConnection = async () => {
    setChecking(true);
    setConnectionStatus(null);
    try { setConnectionStatus((await healthCheck()) ? 'ok' : 'failed'); }
    finally { setChecking(false); }
  };

  const handleSelectQuality = async (next: ImageQuality) => {
    setQuality(next);
    try { await setStoredImageQuality(next); } catch { Alert.alert('Error', 'Could not save image quality.'); }
  };

  const handleSignOut = () => {
    confirmAction('Sign out?', 'You can sign back in at any time.', async () => {
      await logout();
      setCurrentUser(null);
    }, 'Sign out');
  };

  const handleAddTestSession = async () => {
    try {
      const count = 1 + Math.floor(Math.random() * 3);
      const seedBase = Math.floor(Math.random() * 1000);
      const fakeVehicle = pick(FAKE_VEHICLES, seedBase);
      const photos = Array.from({ length: count }, (_, i) =>
        makeFakePhoto(seedBase + i + 1),
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
        { text: 'Clear', style: 'destructive', onPress: async () => {
          try { await clearHistory(); await clearVehicles(); Alert.alert('Cleared'); }
          catch { Alert.alert('Error', 'Could not clear data.'); }
        }},
      ],
    );
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: t.bg }} />;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 28 }}>
      <View style={{ marginTop: 4, marginBottom: 18 }}>
        <BrandStamp />
      </View>

      {/* Account */}
      <SectionHeader title="Account" />
      <Card padding={16}>
        {currentUser ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: t.scanGradStart,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ color: '#fff', fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.h3 }}>
                  {(currentUser.name || currentUser.email || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1 }}>{currentUser.name ?? 'Signed in'}</Text>
                <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{currentUser.email}</Text>
              </View>
            </View>
            <View style={{ marginTop: 14 }}>
              <DangerButton onPress={handleSignOut}>Sign out</DangerButton>
            </View>
          </>
        ) : (
          <>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg3 }}>You are not signed in.</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}><PrimaryButton onPress={() => navigation.navigate('Login')}>Sign in</PrimaryButton></View>
              <View style={{ flex: 1 }}><SecondaryButton onPress={() => navigation.navigate('Register')}>Register</SecondaryButton></View>
            </View>
          </>
        )}
      </Card>

      {/* Appearance */}
      <SectionHeader title="Appearance" />
      <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.bodySm, color: t.fg1 }}>Theme</Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>Light, dark, or follow system</Text>
          </View>
          <View style={{ width: 220 }}>
            <Segmented<'light' | 'dark' | 'system'>
              options={[{value:'light',label:'Light'},{value:'dark',label:'Dark'},{value:'system',label:'Auto'}]}
              value={pref}
              onChange={setPref}
            />
          </View>
        </View>
      </Card>

      {/* Backend */}
      <SectionHeader title="Backend" />
      <Card padding={16}>
        <Field label="Backend URL">
          <Input value={urlInput} onChangeText={setUrlInput} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://10.0.2.2:8000" />
        </Field>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14, marginTop: -4 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, marginRight: 8, backgroundColor:
            connectionStatus === 'ok' ? t.success
            : connectionStatus === 'failed' ? t.severe
            : t.fg5,
          }} />
          <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, fontWeight: t.fw.semibold, color:
            connectionStatus === 'ok' ? t.success
            : connectionStatus === 'failed' ? t.severe
            : t.fg5,
          }}>
            {connectionStatus === 'ok' ? 'Connected'
              : connectionStatus === 'failed' ? 'Connection failed'
              : `Not tested · ${savedUrl}`}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <PrimaryButton onPress={handleSaveUrl} disabled={!urlDirty} loading={saving}>Save</PrimaryButton>
          </View>
          <View style={{ flex: 1 }}>
            <SecondaryButton onPress={handleCheckConnection} disabled={checking}>{checking ? 'Checking…' : 'Check'}</SecondaryButton>
          </View>
        </View>
      </Card>

      {/* Capture quality */}
      <SectionHeader title="Capture quality" hint="Lower quality uploads faster on poor networks" />
      <Card padding={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Segmented<ImageQuality>
          options={[{value:'low',label:'Low'},{value:'medium',label:'Medium'},{value:'high',label:'High'}]}
          value={quality}
          onChange={handleSelectQuality}
        />
        <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 8 }}>
          Capture quality: {IMAGE_QUALITY_PRESETS[quality].toFixed(1)}
        </Text>
      </Card>

      {/* Dev tools */}
      <SectionHeader title="Developer" hint="For development testing only" />
      <Card padding={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12 }}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5 }}>App version</Text>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg1, fontWeight: t.fw.semibold }}>Sprint 3 demo</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: t.hairline }}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg5 }}>Runtime</Text>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg1, fontWeight: t.fw.semibold }}>React Native + Expo</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <SecondaryButton onPress={handleAddTestSession}>Add test</SecondaryButton>
          </View>
          <View style={{ flex: 1 }}>
            <DangerButton onPress={handleClearHistory}>Clear data</DangerButton>
          </View>
        </View>
      </Card>
    </ScrollView>
  );
}
