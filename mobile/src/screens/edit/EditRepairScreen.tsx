import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { addRepair, getSession, updateRepair } from '../../services/historyStorage';
import { useTheme } from '../../theme';
import Card from '../../components/Card';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';

type EditRepairRoute = RouteProp<
  { EditRepair: { sessionId: string; repairId?: string } },
  'EditRepair'
>;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateInput(iso: string): string {
  return iso.slice(0, 10);
}

export default function EditRepairScreen() {
  const { tokens: t } = useTheme();
  const route = useRoute<EditRepairRoute>();
  const navigation = useNavigation();
  const { sessionId, repairId } = route.params;
  const isEdit = !!repairId;

  const [performedAt, setPerformedAt] = useState(todayIso());
  const [performedBy, setPerformedBy] = useState('');
  const [workDescription, setWorkDescription] = useState('');
  const [actualCost, setActualCost] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      if (isEdit) {
        const session = await getSession(sessionId);
        const r = session?.repairs?.find((x) => x.id === repairId);
        if (r) {
          setPerformedAt(formatDateInput(r.performedAt));
          setPerformedBy(r.performedBy ?? '');
          setWorkDescription(r.workDescription ?? '');
          setActualCost(r.actualCost !== undefined ? String(r.actualCost) : '');
          setNotes(r.notes ?? '');
        }
      }
      setLoading(false);
    })();
  }, [sessionId, repairId, isEdit]);

  const handleSave = async () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(performedAt.trim())) {
      Alert.alert('Invalid date', 'Use format YYYY-MM-DD (e.g. 2026-05-10).');
      return;
    }
    let cost: number | undefined;
    if (actualCost.trim() !== '') {
      const n = Number(actualCost);
      if (Number.isNaN(n) || n < 0) {
        Alert.alert('Invalid cost', 'Cost must be a positive number.');
        return;
      }
      cost = n;
    }

    setSaving(true);
    try {
      const data = {
        performedAt: new Date(performedAt + 'T00:00:00').toISOString(),
        performedBy: performedBy.trim() || undefined,
        workDescription: workDescription.trim() || undefined,
        actualCost: cost,
        notes: notes.trim() || undefined,
      };
      if (isEdit && repairId) {
        await updateRepair(sessionId, repairId, data);
      } else {
        await addRepair(sessionId, data);
      }
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save repair record.');
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
        {isEdit ? 'Edit repair record details.' : 'Log work performed on this vehicle.'}
      </Text>

      <Card padding={16}>
        <Field label="Date performed">
          <Input value={performedAt} onChangeText={setPerformedAt} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        </Field>
        <Field label="Performed by">
          <Input value={performedBy} onChangeText={setPerformedBy} placeholder="e.g. AutoFix Vilnius" />
        </Field>
        <Field label="Work description">
          <Input value={workDescription} onChangeText={setWorkDescription} placeholder="e.g. Replaced front bumper, repainted" multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
        </Field>
        <Field label="Actual cost (€)">
          <Input value={actualCost} onChangeText={setActualCost} placeholder="e.g. 580" keyboardType="decimal-pad" />
        </Field>
        <Field label="Notes">
          <Input value={notes} onChangeText={setNotes} placeholder="Optional" multiline style={{ minHeight: 80, textAlignVertical: 'top' }} />
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
