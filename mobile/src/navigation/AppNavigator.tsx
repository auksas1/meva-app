import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import MainTabs from './MainTabs';
import AuthStack from './AuthStack';
import { SelectedPhotosProvider } from '../state/selectedPhotos';
import { hydrateSettings } from '../services/storage';
import { restoreSession, useCurrentUser } from '../services/auth';
import { useTheme } from '../theme';

export default function AppNavigator() {
  const { tokens, isDark } = useTheme();
  const user = useCurrentUser();

  useEffect(() => {
    hydrateSettings()
      .catch(() => {
        // Fall back to default URL silently if AsyncStorage read fails.
      })
      .then(restoreSession);
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

  // Still restoring the saved session — avoid flashing the Login screen.
  if (user === undefined) return null;

  return (
    <SelectedPhotosProvider key={user?.id}>
      <NavigationContainer theme={navTheme}>
        {user ? <MainTabs /> : <AuthStack />}
      </NavigationContainer>
    </SelectedPhotosProvider>
  );
}
