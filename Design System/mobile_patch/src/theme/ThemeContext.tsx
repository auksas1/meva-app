import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens, Tokens } from './tokens';

type ThemePref = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  tokens: Tokens;
  isDark: boolean;
  pref: ThemePref;
  setPref: (next: ThemePref) => void;
};

const STORAGE_KEY = 'autodamage.theme.pref';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [pref, setPrefState] = useState<ThemePref>('dark'); // default dark

  // Hydrate stored preference on mount
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem(STORAGE_KEY);
        if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v);
      } catch {
        /* noop */
      }
    })();
  }, []);

  const setPref = (next: ThemePref) => {
    setPrefState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  };

  const isDark = pref === 'system' ? systemScheme === 'dark' : pref === 'dark';
  const tokens = isDark ? darkTokens : lightTokens;

  const value = useMemo<ThemeContextValue>(() => ({ tokens, isDark, pref, setPref }), [tokens, isDark, pref]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme must be used inside ThemeProvider');
  return v;
}
