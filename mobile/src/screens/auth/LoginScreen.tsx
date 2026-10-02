import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Text, View, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { AuthStackParamList } from '../../navigation/types';
import { login, fetchDevAccounts, AuthError, type DevAccount, type LoginInput } from '../../services/auth';
import { getBaseUrl } from '../../services/api';
import { setStoredBackendUrl } from '../../services/storage';
import { useTheme } from '../../theme';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';
import LinkButton from '../../components/LinkButton';
import BrandStamp from '../../components/BrandStamp';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { tokens: t } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [devAccounts, setDevAccounts] = useState<DevAccount[]>([]);
  const [devOpen, setDevOpen] = useState(false);

  // Settings is behind login, so the server URL must be editable here too.
  const [serverOpen, setServerOpen] = useState(false);
  const [serverUrl, setServerUrl] = useState(getBaseUrl());

  const loadDevAccounts = useCallback(() => {
    if (__DEV__) fetchDevAccounts().then(setDevAccounts);
  }, []);
  useEffect(loadDevAccounts, [loadDevAccounts]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: devAccounts.length
        ? () => (
            <Pressable onPress={() => setDevOpen((o) => !o)} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
              <Ionicons name="code-slash" size={16} color={t.primary} />
              <Text style={{ color: t.primary, fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: 14, marginLeft: 4 }}>Dev</Text>
            </Pressable>
          )
        : undefined,
    });
  }, [navigation, devAccounts.length, t]);

  const submit = async (creds: LoginInput) => {
    if (submitting) return;
    setError(null);
    setDevOpen(false);
    setSubmitting(true);
    try {
      await login(creds);
      // AppNavigator swaps to the main tabs once the user is set.
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Could not sign in. Please try again.');
      setSubmitting(false);
    }
  };

  const handleSaveServer = async () => {
    const trimmed = serverUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) { setError('Server URL must start with http:// or https://'); return; }
    setError(null);
    await setStoredBackendUrl(trimmed);
    setServerUrl(getBaseUrl());
    setServerOpen(false);
    loadDevAccounts();
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {devOpen ? (
        <View style={{
          position: 'absolute', top: 8, right: 12, zIndex: 10, minWidth: 240,
          backgroundColor: t.surface1, borderRadius: t.rMd, borderWidth: 1, borderColor: t.hairline,
          paddingVertical: 4, shadowColor: t.shadowColor, shadowOpacity: 0.12, shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 }, elevation: 6,
        }}>
          {devAccounts.map((a) => (
            <Pressable
              key={a.email}
              onPress={() => submit({ email: a.email, password: a.password })}
              style={({ pressed }) => ({ paddingHorizontal: 14, paddingVertical: 10, opacity: pressed ? 0.6 : 1 })}
            >
              <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.bodySm, color: t.fg1 }}>
                {a.name ?? a.email}{a.role === 'admin' ? ' · admin' : ''}
              </Text>
              <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{a.email}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 32 }} keyboardShouldPersistTaps="handled">
        <BrandStamp size={36} />

        <View style={{ marginTop: 28 }}>
          <Text style={{ fontFamily: t.font, fontWeight: t.fw.bold, fontSize: t.fs.h1, color: t.fg1, letterSpacing: -0.3 }}>Welcome back</Text>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginTop: 6 }}>Sign in to sync your vehicles and analyses.</Text>
        </View>

        <View style={{ marginTop: 22 }}>
          <Field label="Email">
            <Input
              value={email} onChangeText={setEmail}
              autoCapitalize="none" autoCorrect={false}
              keyboardType="email-address" textContentType="emailAddress"
              placeholder="you@example.com" editable={!submitting}
            />
          </Field>
          <Field label="Password">
            <Input
              value={password} onChangeText={setPassword}
              secureTextEntry autoCapitalize="none" autoCorrect={false}
              textContentType="password" placeholder="Your password" editable={!submitting}
              onSubmitEditing={() => canSubmit && submit({ email, password })}
            />
          </Field>
        </View>

        {error ? (
          <Text style={{ color: t.severe, fontFamily: t.font, fontSize: t.fs.meta, fontWeight: t.fw.semibold, marginTop: 8 }}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 18 }}>
          <PrimaryButton large onPress={() => submit({ email, password })} disabled={!canSubmit} loading={submitting}>Sign in</PrimaryButton>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginRight: 6 }}>Don't have an account?</Text>
          <LinkButton onPress={() => navigation.replace('Register')}>Register</LinkButton>
        </View>

        <View style={{ marginTop: 32 }}>
          {serverOpen ? (
            <>
              <Field label="Server URL">
                <Input value={serverUrl} onChangeText={setServerUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="http://10.0.2.2:8000" />
              </Field>
              <PrimaryButton onPress={handleSaveServer}>Save server</PrimaryButton>
            </>
          ) : (
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginRight: 6 }}>Server: {getBaseUrl()}</Text>
              <LinkButton onPress={() => setServerOpen(true)}>Change</LinkButton>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
