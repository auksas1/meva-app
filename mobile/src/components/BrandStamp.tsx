import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

export default function BrandStamp({ size = 36 }: { size?: number }) {
  const { tokens: t } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <LinearGradient
        colors={[t.scanGradStart, t.scanGradEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size, height: size,
          borderRadius: size * 0.28,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: t.primary,
          shadowOpacity: 0.35,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 4,
        }}>
        <Text style={{
          color: '#ffffff',
          fontFamily: t.font,
          fontWeight: t.fw.black,
          fontSize: size * 0.45,
          letterSpacing: -0.5,
        }}>AD</Text>
      </LinearGradient>
      <View style={{ marginLeft: 10 }}>
        <Text style={{
          fontFamily: t.font,
          fontWeight: t.fw.bold,
          fontSize: 15,
          color: t.fg1,
          letterSpacing: -0.1,
        }}>AutoDamage</Text>
        <Text style={{
          fontFamily: t.font,
          fontWeight: t.fw.medium,
          fontSize: 10,
          color: t.fg5,
          marginTop: 2,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}>by MEVA AI</Text>
      </View>
    </View>
  );
}
