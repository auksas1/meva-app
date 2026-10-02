import React from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number | { paddingTop?: number; paddingBottom?: number; paddingHorizontal?: number; paddingVertical?: number };
  elevated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function Card({ children, onPress, padding = 16, elevated, style }: Props) {
  const { tokens: t } = useTheme();
  const padStyle: ViewStyle = typeof padding === 'number'
    ? { padding }
    : padding as ViewStyle;

  const cardStyle: ViewStyle = {
    backgroundColor: t.surface1,
    borderRadius: t.rLg,
    borderWidth: 1,
    borderColor: t.hairline,
    shadowColor: t.shadowColor,
    shadowOpacity: elevated ? 0.08 : 0.04,
    shadowRadius: elevated ? 14 : 3,
    shadowOffset: { width: 0, height: elevated ? 4 : 1 },
    elevation: elevated ? 4 : 1,
    ...padStyle,
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [cardStyle, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[cardStyle, style]}>{children}</View>;
}
