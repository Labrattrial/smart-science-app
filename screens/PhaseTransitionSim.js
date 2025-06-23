import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

const phaseVideos = {
  solid: require('../assets/Phase_Sim/BSOLID.mp4'),
  liquid: require('../assets/Phase_Sim/BLIQUID.mp4'),
  gas: require('../assets/Phase_Sim/BGAS.mp4'),
};

export default function PhaseTransitionSim({ width = 70, height = 70, phase = 'solid' }) {
  return (
    <View style={{ width, height }}>
      <Video
        source={phaseVideos[phase]}
        style={{ width: '100%', height: '100%', borderRadius: width / 2 || 37 }}
        resizeMode="contain"
        isLooping
        shouldPlay
        isMuted
      />
    </View>
  );
} 