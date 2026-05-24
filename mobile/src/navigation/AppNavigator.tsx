import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import MainTabs from './MainTabs';
import { SelectedPhotosProvider } from '../state/selectedPhotos';
import { hydrateSettings } from '../services/storage';
import { migrateLegacySessions } from '../services/historyStorage';
import { useTheme } from '../theme';

export default function AppNavigator() {
  const { tokens, isDark } = useTheme();

  useEffect(() => {
    hydrateSettings().catch(() => {
      // Fall back to default URL silently if AsyncStorage read fails.
    });
    migrateLegacySessions().catch(() => {
      // Migration failure shouldn't crash the app.
    });
  }, []);

  const navTheme: Theme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      background: tokens.bg,
      card: tokens.surface1,
      text: tokens.fg1,
      border: tokens.hairline,
      primary: tokens.primary,
      notification: tokens.severe,
    },
  };

  return (
    <SelectedPhotosProvider>
      <NavigationContainer theme={navTheme}>
        <MainTabs />
      </NavigationContainer>
    </SelectedPhotosProvider>
  );
}
