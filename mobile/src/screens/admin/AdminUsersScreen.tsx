import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import DangerButton from '../../components/DangerButton';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';
import SecondaryButton from '../../components/SecondaryButton';
import Segmented from '../../components/Segmented';
import StatusBadge from '../../components/StatusBadge';
import {
  deleteAdminUser,
  getAdminUser,
  setAdminUserBlocked,
  updateAdminUser,
  type AdminUser,
} from '../../services/admin';
import type { AdminStackParamList } from '../../navigation/types';
import { useCurrentUser } from '../../services/auth';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUserDetail'>;

export default function AdminUserDetailScreen({ route, navigation }: Props) {
  const { tokens: t } = useTheme();
  const signedInUser = useCurrentUser();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const next = await getAdminUser(route.params.userId);
      setUser(next);
      setName(next.name ?? '');
      setEmail(next.email);
      setRole(next.role);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not load user.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [navigation, route.params.userId]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const updated = await updateAdminUser(user.id, { name, email, role });
      setUser(updated);
      setName(updated.name ?? '');
      setEmail(updated.email);
      setRole(updated.role);
      Alert.alert('Saved', 'User account changes were saved.');
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlocked = async () => {
    if (!user) return;
    try {
      const updated = await setAdminUserBlocked(user.id, !user.is_blocked);
      setUser(updated);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not change account status.');
    }
  };

  const remove = () => {
    if (!user) return;
    Alert.alert('Delete account?', `Delete ${user.email}? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteAdminUser(user.id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e instanceof Error ? e.message : 'Could not delete account.');
          }
        },
      },
    ]);
  };

  if (loading || !user) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color={t.primary} /></View>;
  }

  const isSelf = signedInUser?.id === user.id;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: t.bg }} contentContainerStyle={{ padding: t.screenPad, paddingBottom: 32 }}>
      <Card padding={16}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <View>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.body, fontWeight: t.fw.semibold, color: t.fg1 }}>Account #{user.id}</Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{isSelf ? 'Current admin account' : 'Managed account'}</Text>
          </View>
          <StatusBadge label={user.is_blocked ? 'Blocked' : 'Active'} color={user.is_blocked ? 'severe' : 'success'} />
        </View>

        <Field label="Username">
          <Input value={name} onChangeText={setName} placeholder="Username" />
        </Field>
        <Field label="Email">
          <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="user@example.com" />
        </Field>
        <Field label="Access level">
          <Segmented<'user' | 'admin'>
            options={[{ value: 'user', label: 'User' }, { value: 'admin', label: 'Admin' }]}
            value={role}
            onChange={setRole}
          />
        </Field>

        <PrimaryButton onPress={save} loading={saving}>Save changes</PrimaryButton>
      </Card>

      <View style={{ marginTop: 14 }}>
        <Card padding={16}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, fontWeight: t.fw.semibold, color: t.fg1, marginBottom: 10 }}>Account actions</Text>
          <SecondaryButton onPress={toggleBlocked} disabled={isSelf} leftIcon={user.is_blocked ? 'lock-open-outline' : 'ban-outline'}>
            {user.is_blocked ? 'Unblock account' : 'Block account'}
          </SecondaryButton>
          <View style={{ height: 10 }} />
          <DangerButton onPress={isSelf ? undefined : remove} style={isSelf ? { opacity: 0.5 } : undefined}>
            {isSelf ? 'Cannot delete current admin' : 'Delete account'}
          </DangerButton>
        </Card>
      </View>

      <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 12 }}>
        This admin module is intentionally MVP-level for requirement and test evaluation.
      </Text>
    </ScrollView>
  );
}
