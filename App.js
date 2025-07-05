// App.js
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, Platform } from 'expo-status-bar';
import { View } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { AudioProvider } from './components/AudioContext';
import { ThemeProvider } from './components/ThemeContext';
import { ConfirmationDialogProvider } from './components/ConfirmationDialogContext';
import Immersive from 'react-native-immersive';

import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import DefinitionScreen from './screens/DefinitionScreen';
import PhaseChangeScreen from './screens/PhaseChangeScreen';
import DiagramScreen from './screens/DiagramScreen';
import FlowchartScreen from './screens/FlowchartScreen';
import QuestionsScreen from './screens/QuestionsScreen';
import AboutScreen from './screens/AboutScreen';
import SettingsScreen from './screens/SettingsScreen';
import HelpScreen from './screens/HelpScreen';

// Import all PhaseChangeScreens
import MeltingScreen from './PhaseChangeScreens/MeltingScreen';
import CondensationScreen from './PhaseChangeScreens/CondensationScreen';
import SublimationScreen from './PhaseChangeScreens/SublimationScreen';
import FreezingScreen from './PhaseChangeScreens/FreezingScreen';
import EvaporationScreen from './PhaseChangeScreens/EvaporationScreen';
import DepositionScreen from './PhaseChangeScreens/DepositionScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    // Set system navigation background color
    SystemUI.setBackgroundColorAsync('#10163a');
    // Enable immersive mode on Android
    // if (Platform.OS === 'android') {
    //   Immersive.on();
    //   Immersive.setImmersive(true);
    // }
    // No need for StatusBar.setHidden() here
  }, []);

  return (
    <ThemeProvider>
    <AudioProvider>
    <ConfirmationDialogProvider>
      <View style={{ flex: 1, backgroundColor: '#10163a' }}>
        {/* Correct usage of StatusBar */}
        <StatusBar hidden />
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Splash" component={SplashScreen} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Definition" component={DefinitionScreen} />
            <Stack.Screen name="PhaseChange" component={PhaseChangeScreen} />
            <Stack.Screen name="Diagram" component={DiagramScreen} />
            <Stack.Screen name="Flowchart" component={FlowchartScreen} />
            <Stack.Screen name="Questions" component={QuestionsScreen} />
            <Stack.Screen name="About" component={AboutScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Help" component={HelpScreen} />

            {/* Add all Phase Change Screens here */}
            <Stack.Screen name="MeltingScreen" component={MeltingScreen} />
            <Stack.Screen name="CondensationScreen" component={CondensationScreen} />
            <Stack.Screen name="SublimationScreen" component={SublimationScreen} />
            <Stack.Screen name="FreezingScreen" component={FreezingScreen} />
            <Stack.Screen name="EvaporationScreen" component={EvaporationScreen} />
            <Stack.Screen name="DepositionScreen" component={DepositionScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </ConfirmationDialogProvider>
    </AudioProvider>
    </ThemeProvider>
  );
}
