import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AnalyzeHomeScreen from '../screens/analyze/AnalyzeHomeScreen';
import CameraScreen from '../screens/analyze/CameraScreen';
import PickVehicleScreen from '../screens/analyze/PickVehicleScreen';
import PickSessionScreen from '../screens/analyze/PickSessionScreen';
import AddPhotosScreen from '../screens/analyze/AddPhotosScreen';
import ResultsSummaryScreen from '../screens/analyze/ResultsSummaryScreen';
import ResultDetailScreen from '../screens/analyze/ResultDetailScreen';
import EditVehicleScreen from '../screens/edit/EditVehicleScreen';
import EditRepairScreen from '../screens/edit/EditRepairScreen';
import type { AnalyzeStackParamList } from './types';

const Stack = createNativeStackNavigator<AnalyzeStackParamList>();

export default function AnalyzeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="AnalyzeHome"
        component={AnalyzeHomeScreen}
        options={{ title: 'Analyze' }}
      />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PickVehicle"
        component={PickVehicleScreen}
        options={{ title: 'Save to vehicle', presentation: 'modal' }}
      />
      <Stack.Screen
        name="PickSession"
        component={PickSessionScreen}
        options={{ title: 'Save to session' }}
      />
      <Stack.Screen
        name="AddPhotos"
        component={AddPhotosScreen}
        options={{ title: 'Add photos' }}
      />
      <Stack.Screen
        name="ResultsSummary"
        component={ResultsSummaryScreen}
        options={{ title: 'Results' }}
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
