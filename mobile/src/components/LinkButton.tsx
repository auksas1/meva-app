import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  color?: 'primary' | 'severe';
};

export default function LinkButton({ children, onPress, leftIcon, color = 'primary' }: Props) {
  const { tokens: t } = useTheme();
  const fg = color === 'severe' ? t.severe : t.primary;
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        opacity: pressed ? 0.6 : 1,
      })}
    >
      {leftIcon ? <Ionicons name={leftIcon} size={16} color={fg} style={{ marginRight: 4 }} /> : null}
      <Text style={{ color: fg, fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: 14 }}>{children}</Text>
    </Pressable>
  );
}
