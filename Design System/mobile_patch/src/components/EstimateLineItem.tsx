import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  label: string;
  value: string;
  sub?: string;
  total?: boolean;
};

export default function EstimateLineItem({ label, value, sub, total }: Props) {
  const { tokens: t } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderTopWidth: total ? 1 : 0,
      borderTopColor: t.hairline,
      marginTop: total ? 4 : 0,
    }}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{
          fontFamily: t.font,
          fontSize: total ? t.fs.body : t.fs.bodySm,
          color: total ? t.fg1 : t.fg2,
          fontWeight: total ? t.fw.bold : t.fw.medium,
        }}>{label}</Text>
        {sub ? <Text style={{ fontFamily: t.font, fontSize: t.fs.caption, color: t.fg5, marginTop: 2 }}>{sub}</Text> : null}
      </View>
      <Text style={{
        fontFamily: t.font,
        fontWeight: total ? t.fw.bold : t.fw.semibold,
        fontSize: total ? t.fs.h2 : t.fs.bodySm,
        color: total ? t.primary : t.fg2,
        fontVariant: ['tabular-nums'],
      }}>{value}</Text>
    </View>
  );
}
