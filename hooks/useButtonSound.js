import { useCallback } from 'react';
import { useAudio } from '../components/AudioContext';

export const useButtonSound = () => {
  const { playPopSound } = useAudio();

  const handlePress = useCallback(async (onPress) => {
    try {
      await playPopSound();
      onPress();
    } catch (error) {
      console.log('Error playing button sound:', error);
      onPress(); // Still execute the onPress even if sound fails
    }
  }, [playPopSound]);

  return handlePress;
}; 