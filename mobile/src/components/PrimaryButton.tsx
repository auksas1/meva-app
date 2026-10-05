import React from 'react';
import { Pressable, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  large?: boolean;
  style?: any;
};

export default function PrimaryButton({ children, onPress, disabled, loading, leftIcon, large, style }: Props) {
  const { tokens: t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          minHeight: large ? 56 : t.touch,
          paddingHorizontal: large ? 20 : 18,
          paddingVertical: large ? 16 : 12,
          borderRadius: t.rMd,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: disabled ? t.surface2 : t.primary,
          opacity: pressed && !disabled ? 0.92 : 1,
          transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
          shadowColor: t.primary,
          shadowOpacity: disabled ? 0 : 0.25,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 4 },
          elevation: disabled ? 0 : 3,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={t.primaryFg} />
      ) : (
        <>
          {leftIcon ? <Ionicons name={leftIcon} size={20} color={disabled ? t.fg5 : t.primaryFg} style={s.icon} /> : null}
          <Text style={{
            color: disabled ? t.fg5 : t.primaryFg,
            fontFamily: t.font,
            fontWeight: t.fw.semibold,
            fontSize: large ? 16 : 15,
            letterSpacing: -0.1,
          }}>{children}</Text>
        </>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  icon: { marginRight: 8 },
});
