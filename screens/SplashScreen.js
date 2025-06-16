import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, TouchableOpacity, Image } from 'react-native';
import MoleculeBackground from '../components/MoleculeBackground';
import { useAudio } from '../components/AudioContext';
import { useTheme } from '../components/ThemeContext';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation }) {
  const { playPopSound } = useAudio();
  const { theme, isDarkTheme } = useTheme();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Add effect to listen for theme changes
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [isDarkTheme]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const logoAnim = useRef(new Animated.Value(0)).current;
  const isNavigating = useRef(false);

  const startAnimations = () => {
    // Reset animation values
    fadeAnim.setValue(0);
    buttonAnim.setValue(0);
    logoAnim.setValue(0);

    // Start animations
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(fadeAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(buttonAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    startAnimations();

    // Cleanup function
    return () => {
      // Reset animation values when component unmounts
      fadeAnim.setValue(0);
      buttonAnim.setValue(0);
      logoAnim.setValue(0);
    };
  }, []);

  const handleExplore = async () => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    try {
      // Start fade out animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(logoAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(async () => {
        try {
          await playPopSound();
          navigation.replace('Home');
        } catch (error) {
          console.log('Error during navigation:', error);
          navigation.replace('Home');
        }
      });
    } catch (error) {
      console.log('Error during animation:', error);
      navigation.replace('Home');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MoleculeBackground />
      
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: logoAnim,
            transform: [
              { scale: logoAnim },
              { translateY: logoAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}
            ]
          }
        ]}
      >
        <Image 
          source={require('../assets/logo2.png')} 
          style={[styles.logo, { tintColor: theme.titleText }]}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              { scale: fadeAnim },
              { translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-50, 0]
              })}
            ]
          }
        ]}
      >
        <Text style={[styles.title, { 
          color: theme.primaryAccent,
          textShadowColor: isDarkTheme ? 'rgba(76, 201, 240, 0.4)' : 'rgba(76, 201, 240, 0.2)',
        }]}>Smart Science</Text>
        <Text style={[styles.subtitle, { 
          color: theme.subtitleText,
          textShadowColor: isDarkTheme ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
        }]}>LEARNING APP FOR PHASE CHANGES OF MATTER</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.buttonContainer,
          {
            opacity: buttonAnim,
            transform: [
              { scale: buttonAnim },
              { translateY: buttonAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0]
              })}
            ]
          }
        ]}
      >
        <TouchableOpacity
          style={[styles.button, { 
            backgroundColor: isDarkTheme ? 'rgba(76, 201, 240, 0.25)' : 'rgba(76, 201, 240, 0.15)',
            borderColor: theme.primaryAccent,
            borderBottomColor: isDarkTheme ? 'rgba(76, 201, 240, 0.4)' : 'rgba(76, 201, 240, 0.2)',
            shadowColor: theme.primaryAccent,
          }]}
          onPress={handleExplore}
          activeOpacity={0.85}
        >
          <Text style={[styles.buttonText, { color: theme.titleText }]}>Explore</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    width: 200,
    height: 200,
    tintColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  title: {
    color: '#4CC9F0',
    fontSize: 48,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(76, 201, 240, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 24,
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.9,
    fontWeight: '600',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  buttonContainer: {
    marginTop: 60,
  },
  button: {
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#4CC9F0',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(76, 201, 240, 0.4)',
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 