import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { useTheme } from '../theme';

export function Field({ label, optional, children, style }: { label: string; optional?: boolean; children: React.ReactNode; style?: any }) {
  const { tokens: t } = useTheme();
  return (
    <View style={[{ marginBottom: 14 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginBottom: 6 }}>
        <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.meta, color: t.fg2 }}>{label}</Text>
        {optional ? <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginLeft: 8 }}>optional</Text> : null}
      </View>
      {children}
    </View>
  );
}

export function Input(props: TextInputProps) {
  const { tokens: t } = useTheme();
  const [focused, setFocused] = React.useState(false);
  return (
    <TextInput
      placeholderTextColor={t.fg5}
      {...props}
      onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
      style={[
        {
          borderRadius: t.rMd,
          borderWidth: 1,
          borderColor: focused ? t.primary : t.border,
          paddingHorizontal: 14,
          paddingVertical: 14,
          fontSize: t.fs.body,
          color: t.fg1,
          backgroundColor: t.surface1,
          fontFamily: t.font,
        },
        focused ? {
          shadowColor: t.primary,
          shadowOpacity: 0.18,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
          elevation: 2,
        } : null,
        props.style,
      ]}
    />
  );
}
