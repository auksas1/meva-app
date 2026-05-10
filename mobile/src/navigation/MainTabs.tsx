import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import AnalyzeStack from './AnalyzeStack';
import HistoryStack from './HistoryStack';
import SettingsStack from './SettingsStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof MainTabParamList, IoniconName> = {
  Analyze: 'scan',
  History: 'time',
  Settings: 'settings',
};

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Analyze" component={AnalyzeStack} />
      <Tab.Screen name="History" component={HistoryStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
}
