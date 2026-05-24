import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  title: string;
  hint?: string;
  action?: React.ReactNode;
};

export default function SectionHeader({ title, hint, action }: Props) {
  const { tokens: t } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 10,
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: t.font,
          fontSize: t.fs.overline,
          fontWeight: t.fw.bold,
          color: t.fg5,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}>{title}</Text>
        {hint ? <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{hint}</Text> : null}
      </View>
      {action}
    </View>
  );
}
