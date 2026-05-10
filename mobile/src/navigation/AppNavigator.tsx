import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainTabs from './MainTabs';
import { SelectedPhotosProvider } from '../state/selectedPhotos';
import { hydrateSettings } from '../services/storage';
import { migrateLegacySessions } from '../services/historyStorage';

export default function AppNavigator() {
  useEffect(() => {
    hydrateSettings().catch(() => {
      // Fall back to default URL silently if AsyncStorage read fails.
    });
    migrateLegacySessions().catch(() => {
      // Migration failure shouldn't crash the app.
    });
  }, []);

  return (
    <SelectedPhotosProvider>
      <NavigationContainer>
        <MainTabs />
      </NavigationContainer>
    </SelectedPhotosProvider>
  );
}
