import React from 'react';
import { View, Text } from 'react-native';
import { useTheme } from '../theme';
import { scoreColor, scoreSoft, severityLabel } from './severity';

type Props = {
  score?: number;
  label?: string;
  color?: 'primary' | 'severe' | 'warning' | 'success' | 'neutral';
};

export default function StatusBadge({ score, label, color }: Props) {
  const { tokens: t } = useTheme();
  const useScore = typeof score === 'number';
  let fg: string;
  let bg: string;
  if (useScore) {
    fg = scoreColor(score, t);
    bg = scoreSoft(score, t);
  } else if (color === 'severe') { fg = t.severe; bg = t.severeSoft; }
  else if (color === 'warning') { fg = t.warning; bg = t.warningSoft; }
  else if (color === 'success') { fg = t.success; bg = t.successSoft; }
  else if (color === 'neutral') { fg = t.fg4; bg = t.surface2; }
  else { fg = t.primary; bg = t.primarySubtle; }

  const text = label || (useScore ? severityLabel(score!) : '');

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: t.rPill,
      backgroundColor: bg,
      alignSelf: 'flex-start',
    }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg, marginRight: 6 }} />
      <Text style={{
        color: fg,
        fontFamily: t.font,
        fontSize: t.fs.overline,
        fontWeight: t.fw.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
      }}>{text}</Text>
    </View>
  );
}
