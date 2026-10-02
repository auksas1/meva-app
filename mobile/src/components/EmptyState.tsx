import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title?: string;
  body?: string;
  action?: React.ReactNode;
};

export default function EmptyState({ icon = 'images-outline', title, body, action }: Props) {
  const { tokens: t } = useTheme();
  return (
    <View style={{
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 32,
      paddingHorizontal: 20,
      backgroundColor: t.surface2,
      borderRadius: t.rLg,
      borderWidth: 1.5,
      borderColor: t.border,
      borderStyle: 'dashed',
    }}>
      <View style={{
        width: 56, height: 56, borderRadius: 16,
        backgroundColor: t.surface1,
        alignItems: 'center', justifyContent: 'center',
        shadowColor: t.shadowColor, shadowOpacity: 0.05, shadowRadius: 3, shadowOffset: { width: 0, height: 1 },
        elevation: 1, marginBottom: 12,
      }}>
        <Ionicons name={icon} size={26} color={t.fg4} />
      </View>
      {title ? (
        <Text style={{ fontFamily: t.font, fontWeight: t.fw.semibold, fontSize: t.fs.body, color: t.fg1, marginBottom: 4 }}>{title}</Text>
      ) : null}
      {body ? (
        <Text style={{ fontFamily: t.font, fontSize: t.fs.meta, color: t.fg4, textAlign: 'center', lineHeight: 20, maxWidth: 280 }}>{body}</Text>
      ) : null}
      {action ? <View style={{ marginTop: 14 }}>{action}</View> : null}
    </View>
  );
}
