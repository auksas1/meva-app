import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  children: string;
  onPress?: () => void;
  leftIcon?: React.ComponentProps<typeof Ionicons>['name'];
  style?: any;
};

export default function DangerButton({ children, onPress, leftIcon, style }: Props) {
  const { tokens: t } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: t.touch,
          paddingHorizontal: 18,
          paddingVertical: 12,
          borderRadius: t.rMd,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? t.severeSoft : 'transparent',
          borderWidth: 1,
          borderColor: t.severe,
        },
        style,
      ]}
    >
      {leftIcon ? <Ionicons name={leftIcon} size={20} color={t.severe} style={{ marginRight: 8 }} /> : null}
      <Text style={{
        color: t.severe,
        fontFamily: t.font,
        fontWeight: t.fw.semibold,
        fontSize: 15,
      }}>{children}</Text>
    </Pressable>
  );
}
