import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AnalyzeStack from './AnalyzeStack';
import HistoryStack from './HistoryStack';
import SettingsStack from './SettingsStack';
import AdminStack from './AdminStack';
import type { MainTabParamList } from './types';
import { useTheme } from '../theme';
import { useCurrentUser } from '../services/auth';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, [React.ComponentProps<typeof Ionicons>['name'], React.ComponentProps<typeof Ionicons>['name']]> = {
  // [unfocused, focused]
  Analyze: ['scan-outline', 'scan'],
  History: ['time-outline', 'time'],
  Settings: ['settings-outline', 'settings'],
  Admin: ['people-outline', 'people'],
};

export default function MainTabs() {
  const { tokens: t, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const currentUser = useCurrentUser();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.fg5,
        tabBarStyle: {
          backgroundColor: t.surface1,
          borderTopColor: t.hairline,
          borderTopWidth: 1,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          shadowColor: isDark ? '#000' : t.shadowColor,
          shadowOpacity: isDark ? 0 : 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontFamily: t.font,
          fontWeight: t.fw.semibold,
          fontSize: 10.5,
          letterSpacing: 0.1,
        },
        tabBarIcon: ({ color, focused }) => {
          const [unfocused, focusedIcon] = ICONS[route.name];
          return <Ionicons name={focused ? focusedIcon : unfocused} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Analyze" component={AnalyzeStack} />
      <Tab.Screen name="History" component={HistoryStack} />
      {currentUser?.role === 'admin' ? <Tab.Screen name="Admin" component={AdminStack} /> : null}
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
