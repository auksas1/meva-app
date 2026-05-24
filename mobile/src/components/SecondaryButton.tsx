import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  children: string;
  onPress?: () => void;
  disabled?: boolean;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: any;
};

export default function SecondaryButton({ children, onPress, disabled, leftIcon, style }: Props) {
  const { tokens: t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        {
          minHeight: t.touch,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: t.rMd,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? t.surface2 : 'transparent',
          borderWidth: 1,
          borderColor: t.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {leftIcon ? <Ionicons name={leftIcon} size={20} color={t.fg2} style={{ marginRight: 8 }} /> : null}
      <Text style={{
        color: t.fg2,
        fontFamily: t.font,
        fontWeight: t.fw.semibold,
        fontSize: 15,
      }}>{children}</Text>
    </Pressable>
  );
}
