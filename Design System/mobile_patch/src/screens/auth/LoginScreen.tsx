import React, { useState } from 'react';
import { Text, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SettingsStackParamList } from '../../navigation/types';
import { login, AuthError } from '../../services/auth';
import { useTheme } from '../../theme';
import { Field, Input } from '../../components/Field';
import PrimaryButton from '../../components/PrimaryButton';
import LinkButton from '../../components/LinkButton';
import BrandStamp from '../../components/BrandStamp';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const { tokens: t } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigation.goBack();
    } catch (err) {
      setError(
        err instanceof AuthError ? err.message
          : err instanceof Error ? err.message
          : 'Could not sign in. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = email.trim().length > 0 && password.length > 0 && !submitting;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: t.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            />
          </Field>
        </View>

        {error ? (
          <Text style={{ color: t.severe, fontFamily: t.font, fontSize: t.fs.meta, fontWeight: t.fw.semibold, marginTop: 8 }}>{error}</Text>
        ) : null}

        <View style={{ marginTop: 18 }}>
          <PrimaryButton large onPress={handleLogin} disabled={!canSubmit} loading={submitting}>Sign in</PrimaryButton>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
          <Text style={{ fontFamily: t.font, fontSize: t.fs.bodySm, color: t.fg4, marginRight: 6 }}>Don't have an account?</Text>
          <LinkButton onPress={() => navigation.replace('Register')}>Register</LinkButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
