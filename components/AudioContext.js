import React, { createContext, useContext, useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import { AppState } from 'react-native';

const AudioContext = createContext();

export const AudioProvider = ({ children }) => {
  const [bgMusic, setBgMusic] = useState(null);
  const [popSound, setPopSound] = useState(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  const [appState, setAppState] = useState(AppState.currentState);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [bgMusic]);

  const handleAppStateChange = async (nextAppState) => {
    if (appState.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground
      if (bgMusic) {
        try {
          await bgMusic.playAsync();
        } catch (error) {
          console.log('Error resuming BGM:', error);
        }
      }
    } else if (appState === 'active' && nextAppState.match(/inactive|background/)) {
      // App has gone to the background
      if (bgMusic) {
        try {
          await bgMusic.pauseAsync();
        } catch (error) {
          console.log('Error pausing BGM:', error);
        }
      }
    }
    setAppState(nextAppState);
  };

  // Initialize audio
  useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        // Set up audio mode
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false, // Changed to false to stop music when app is in background
          shouldDuckAndroid: true,
        });

        // Load background music
        const { sound: music } = await Audio.Sound.createAsync(
          require('../assets/music/bgm.mp3'),
          { 
            isLooping: true,
            shouldPlay: true,
            volume: musicVolume,
          },
          onPlaybackStatusUpdate
        );
        
        if (isMounted) {
          setBgMusic(music);
        }

        // Load pop sound effect
        const { sound: pop } = await Audio.Sound.createAsync(
          require('../assets/sound_effects/pop.mp3'),
          { volume: sfxVolume }
        );
        
        if (isMounted) {
          setPopSound(pop);
          setIsAudioReady(true);
        }
      } catch (error) {
        console.log('Error loading audio:', error);
        if (isMounted) {
          setIsAudioReady(true);
        }
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      if (bgMusic) {
        bgMusic.unloadAsync();
      }
      if (popSound) {
        popSound.unloadAsync();
      }
    };
  }, []);

  // Callback for playback status updates
  const onPlaybackStatusUpdate = (status) => {
    if (status.isLoaded) {
      // BGM Status logging removed
    }
  };

  // Update BGM volume when it changes
  useEffect(() => {
    const updateBGMVolume = async () => {
      if (bgMusic) {
        try {
          const status = await bgMusic.getStatusAsync();
          if (status.isLoaded) {
            await bgMusic.setVolumeAsync(musicVolume);
            console.log('BGM volume updated to:', musicVolume);
          }
        } catch (error) {
          console.log('Error updating BGM volume:', error);
        }
      }
    };
    updateBGMVolume();
  }, [musicVolume, bgMusic]);

  // Update SFX volume when it changes
  useEffect(() => {
    const updateSFXVolume = async () => {
      if (popSound) {
        try {
          await popSound.setVolumeAsync(sfxVolume);
        } catch (error) {
          console.log('Error updating SFX volume:', error);
        }
      }
    };
    updateSFXVolume();
  }, [sfxVolume, popSound]);

  const playPopSound = async () => {
    if (!isAudioReady || !popSound) return;
    
    try {
      await popSound.setPositionAsync(0);
      await popSound.playAsync();
    } catch (error) {
      console.log('Error playing pop sound:', error);
    }
  };

  const setMusicVolumeAsync = async (volume) => {
    console.log('Setting music volume to:', volume);
    setMusicVolume(volume);
    if (bgMusic) {
      try {
        const status = await bgMusic.getStatusAsync();
        if (status.isLoaded) {
          await bgMusic.setVolumeAsync(volume);
          console.log('BGM volume set successfully');
        }
      } catch (error) {
        console.log('Error setting BGM volume:', error);
      }
    }
  };

  const setSFXVolumeAsync = async (volume) => {
    setSfxVolume(volume);
    if (popSound) {
      try {
        await popSound.setVolumeAsync(volume);
      } catch (error) {
        console.log('Error setting SFX volume:', error);
      }
    }
  };

  const stopBGM = async () => {
    if (bgMusic) {
      try {
        await bgMusic.stopAsync();
        await bgMusic.setPositionAsync(0);
      } catch (error) {
        console.log('Error stopping BGM:', error);
      }
    }
  };

  return (
    <AudioContext.Provider 
      value={{ 
        playPopSound, 
        isAudioReady,
        musicVolume,
        sfxVolume,
        setMusicVolumeAsync,
        setSFXVolumeAsync,
        stopBGM
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}; 
