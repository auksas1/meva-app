import React from 'react';
import { Pressable, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme';

type Props = {
  onPress?: () => void;
  title?: string;
  subtitle?: string;
};

/**
 * The AI Damage Scan hero CTA — the dominant action on AnalyzeHome.
 * Cobalt gradient · grid overlay · camera icon tile + sparkles overline.
 */
export default function ScanTile({ onPress, title = 'Take a photo', subtitle = "Capture the damaged area — we'll detect zones, parts and an estimated repair cost." }: Props) {
  const { tokens: t } = useTheme();
  // Single-color fallback if expo-linear-gradient isn't installed.
  // Recommended: `npx expo install expo-linear-gradient` and import below.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 20,
        borderRadius: t.rXl,
        backgroundColor: t.scanGradStart, // see note above re. gradient
        overflow: 'hidden',
        shadowColor: t.primary,
        shadowOpacity: 0.32,
        shadowRadius: 32,
        shadowOffset: { width: 0, height: 14 },
        elevation: 8,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      {/* Inner icon tile */}
      <View style={{
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.18)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="camera" size={26} color="#ffffff" />
      </View>

      <View style={{ flex: 1, marginLeft: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
          <Ionicons name="sparkles" size={14} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={{
            fontFamily: t.font,
            color: 'rgba(255,255,255,0.85)',
            fontSize: t.fs.overline,
            fontWeight: t.fw.semibold,
            letterSpacing: 0.8,
            textTransform: 'uppercase',
          }}>AI Damage Scan</Text>
        </View>
        <Text style={{
          fontFamily: t.font,
          color: '#ffffff',
          fontSize: 19,
          fontWeight: t.fw.bold,
          letterSpacing: -0.2,
          marginBottom: 4,
        }}>{title}</Text>
        <Text style={{
          fontFamily: t.font,
          color: 'rgba(255,255,255,0.85)',
          fontSize: t.fs.meta,
          lineHeight: 20,
        }}>{subtitle}</Text>
      </View>
    </Pressable>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Optional: enable a real gradient.
   1. `npx expo install expo-linear-gradient`
   2. Replace the Pressable body with:

       <LinearGradient
         colors={[t.scanGradStart, t.scanGradEnd]}
         start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
         style={{ borderRadius: t.rXl, padding: 20, ...rest }}
       > … </LinearGradient>
   ───────────────────────────────────────────────────────────────────────── */
