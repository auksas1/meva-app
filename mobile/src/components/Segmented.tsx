import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTheme } from '../theme';

type Option<T> = { value: T; label: string };

type Props<T> = {
  options: Option<T>[];
  value: T;
  onChange: (next: T) => void;
};

export default function Segmented<T extends string | number | boolean>({ options, value, onChange }: Props<T>) {
  const { tokens: t } = useTheme();
  return (
    <View style={{
      flexDirection: 'row',
      padding: 4,
      backgroundColor: t.surface2,
      borderRadius: t.rMd,
      gap: 2,
    }}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            onPress={() => onChange(o.value)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: 'center',
              borderRadius: 8,
              backgroundColor: selected ? t.surface1 : 'transparent',
              shadowColor: t.shadowColor,
              shadowOpacity: selected ? 0.06 : 0,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: selected ? 1 : 0,
            }}
          >
            <Text style={{
              color: selected ? t.fg1 : t.fg4,
              fontFamily: t.font,
              fontWeight: t.fw.semibold,
              fontSize: t.fs.meta,
            }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
