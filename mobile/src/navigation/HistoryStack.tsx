import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VehicleListScreen from '../screens/history/VehicleListScreen';
import VehicleDetailScreen from '../screens/history/VehicleDetailScreen';
import HistorySessionScreen from '../screens/history/HistorySessionScreen';
import AddPhotosScreen from '../screens/analyze/AddPhotosScreen';
import ResultDetailScreen from '../screens/analyze/ResultDetailScreen';
import EditVehicleScreen from '../screens/edit/EditVehicleScreen';
import EditRepairScreen from '../screens/edit/EditRepairScreen';
import type { HistoryStackParamList } from './types';

const Stack = createNativeStackNavigator<HistoryStackParamList>();

export default function HistoryStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="VehicleList"
        component={VehicleListScreen}
        options={{ title: 'Vehicles' }}
      />
      <Stack.Screen
        name="VehicleDetail"
        component={VehicleDetailScreen}
        options={{ title: 'Vehicle' }}
      />
      <Stack.Screen
        name="HistorySession"
        component={HistorySessionScreen}
        options={{ title: 'Session' }}
      />
      <Stack.Screen
        name="AddPhotos"
        component={AddPhotosScreen}
        options={{ title: 'Add photos' }}
      />
      <Stack.Screen
        name="ResultDetail"
        component={ResultDetailScreen}
        options={{ title: 'Photo result' }}
      />
      <Stack.Screen
        name="EditVehicle"
        component={EditVehicleScreen}
        options={{ title: 'Edit vehicle' }}
      />
      <Stack.Screen
        name="EditRepair"
        component={EditRepairScreen}
        options={{ title: 'Repair record' }}
      />
    </Stack.Navigator>
  );
}
