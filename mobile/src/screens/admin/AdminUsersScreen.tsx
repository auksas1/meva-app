import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import StatusBadge from '../../components/StatusBadge';
import { listAdminUsers, type AdminUser } from '../../services/admin';
import type { AdminStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme';

type Props = NativeStackScreenProps<AdminStackParamList, 'AdminUsers'>;

export default function AdminUsersScreen({ navigation }: Props) {
  const { tokens: t } = useTheme();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      setUsers(await listAdminUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load users.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}><ActivityIndicator color={t.primary} /></View>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bg }}>
      <FlatList
        data={users}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: t.screenPad, paddingBottom: 32, flexGrow: users.length ? undefined : 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
        ListHeaderComponent={
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.h2, fontWeight: t.fw.bold, color: t.fg1 }}>Registered users</Text>
            <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg5, marginTop: 4 }}>
              {users.length} account{users.length === 1 ? '' : 's'} · tap an account to manage it
            </Text>
            {error ? <Text style={{ color: t.severe, marginTop: 8 }}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={<EmptyState title="No users" body="No registered user accounts were found." />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('AdminUserDetail', { userId: item.id })} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={{ fontFamily: t.font, fontSize: t.fs.body, fontWeight: t.fw.semibold, color: t.fg1 }}>
                  {item.name || '(no username)'}
                </Text>
                <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginTop: 3 }}>{item.email}</Text>
                <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 6 }}>Role: {item.role}</Text>
              </View>
              <StatusBadge label={item.is_blocked ? 'Blocked' : 'Active'} color={item.is_blocked ? 'severe' : 'success'} />
            </View>
          </Card>
        )}
      />
    </View>
  );
}
