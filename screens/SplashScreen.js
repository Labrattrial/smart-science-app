import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform, TouchableOpacity, Image } from 'react-native';
import MoleculeBackground from '../components/MoleculeBackground';
import { useAudio } from '../components/AudioContext';
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const logoSize = clamp(120, SCREEN_WIDTH * 0.25, 200);
const fontTitle = clamp(40, SCREEN_WIDTH * 0.08,52);
const fontSubtitle = clamp(16, SCREEN_WIDTH * 0.06, 24);
const fontButton = clamp(18, SCREEN_WIDTH * 0.07, 24);
const buttonPaddingVertical = clamp(12, SCREEN_HEIGHT * 0.02, 20);
const buttonPaddingHorizontal = clamp(32, SCREEN_WIDTH * 0.08, 48);
const logoMarginBottom = clamp(20, SCREEN_HEIGHT * 0.03, 40);
const buttonMarginTop = clamp(40, SCREEN_HEIGHT * 0.08, 80);
const contentPadding = clamp(15, SCREEN_WIDTH * 0.04, 25);

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
        }]} numberOfLines={1}>SMART SCIENCE</Text>
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
    marginBottom: logoMarginBottom,
  },
  logo: {
    width: logoSize,
    height: logoSize,
    tintColor: '#FFFFFF',
  },
  content: {
    alignItems: 'center',
    padding: contentPadding,
  },
  title: {
    color: '#4CC9F0',
    fontSize: fontTitle,
    fontWeight: '800',
    textAlign: 'center',
    textShadowColor: 'rgba(76, 201, 240, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    flexShrink: 0,
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: fontSubtitle,
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
    marginTop: buttonMarginTop,
  },
  button: {
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    paddingVertical: buttonPaddingVertical,
    paddingHorizontal: buttonPaddingHorizontal,
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
    fontSize: fontButton,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 