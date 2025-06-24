import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Video } from 'expo-av';

const phaseVideos = {
  solid: require('../assets/Phase_Sim/BSOLID.mp4'),
  liquid: require('../assets/Phase_Sim/BLIQUID.mp4'),
  gas: require('../assets/Phase_Sim/BGAS.mp4'),
  sublimation: require('../assets/Phase_Sim/BDRYICE.mp4'),
};

export default function PhaseTransitionSim({ width = 70, height = 70, phase = 'solid' }) {
  // Different sizes for different phases
  const getVideoSize = () => {
    switch (phase) {
      case 'solid':
        return 120;
      case 'liquid':
        return 120;
      case 'gas':
        return 120;
      case 'sublimation':
        return 120;
      default:
        return 120;
    }
  };

  const videoSize = getVideoSize();
  const offset = (videoSize - 100) / 2;
  // Move solid a bit higher, but not sublimation
  const topOffset = phase === 'solid' ? `-${offset + 10}%` : `-${offset}%`;

  return (
    <View style={{ width, height, alignItems: 'center', justifyContent: 'center' }}>
      <Video
        source={phaseVideos[phase]}
        style={{ 
          width: `${videoSize}%`, 
          height: `${videoSize}%`, 
          borderRadius: width / 2 || 37,
          position: 'absolute',
          top: topOffset,
          left: `-${offset}%`
        }}
        resizeMode="contain"
        isLooping
        shouldPlay
        isMuted
      />
    </View>
  );
} 