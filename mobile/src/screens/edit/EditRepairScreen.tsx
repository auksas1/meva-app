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
import { addRepair, getSession, updateRepair } from '../../services/historyStorage';

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
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.helper}>
        {isEdit ? 'Edit repair record details.' : 'Log work performed on this vehicle.'}
      </Text>

      <Text style={styles.label}>Date performed</Text>
      <TextInput
        value={performedAt}
        onChangeText={setPerformedAt}
        placeholder="YYYY-MM-DD"
        style={styles.input}
      />

      <Text style={styles.label}>Performed by</Text>
      <TextInput
        value={performedBy}
        onChangeText={setPerformedBy}
        placeholder="e.g. AutoFix Vilnius"
        style={styles.input}
      />

      <Text style={styles.label}>Work description</Text>
      <TextInput
        value={workDescription}
        onChangeText={setWorkDescription}
        placeholder="e.g. Replaced front bumper, repainted"
        multiline
        style={[styles.input, styles.inputMulti]}
      />

      <Text style={styles.label}>Actual cost (€)</Text>
      <TextInput
        value={actualCost}
        onChangeText={setActualCost}
        placeholder="e.g. 580"
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Optional"
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
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
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
