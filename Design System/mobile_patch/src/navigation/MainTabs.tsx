import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AnalyzeStack from './AnalyzeStack';
import HistoryStack from './HistoryStack';
import SettingsStack from './SettingsStack';
import type { MainTabParamList } from './types';
import { useTheme } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<keyof MainTabParamList, [React.ComponentProps<typeof Ionicons>['name'], React.ComponentProps<typeof Ionicons>['name']]> = {
  // [unfocused, focused]
  Analyze: ['scan-outline', 'scan'],
  History: ['time-outline', 'time'],
  Settings: ['settings-outline', 'settings'],
};

export default function MainTabs() {
  const { tokens: t, isDark } = useTheme();

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
          height: 70,
          paddingTop: 8,
          paddingBottom: 14,
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
          marginTop: 2,
        },
        tabBarIcon: ({ color, focused }) => {
          const [unfocused, focusedIcon] = ICONS[route.name];
          return (
            <View style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999,
              backgroundColor: focused ? t.primarySubtle : 'transparent',
            }}>
              <Ionicons name={focused ? focusedIcon : unfocused} size={20} color={color} />
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Analyze" component={AnalyzeStack} />
      <Tab.Screen name="History" component={HistoryStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
