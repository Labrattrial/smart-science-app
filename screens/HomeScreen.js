import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, Image, Animated, TouchableOpacity, BackHandler } from 'react-native';
import MoleculeBackground from '../components/MoleculeBackground';
import MenuButton from '../components/MenuButton';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudio } from '../components/AudioContext';
import { useTheme } from '../components/ThemeContext';
import { useConfirmationDialog } from '../components/ConfirmationDialogContext';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(30, SCREEN_WIDTH * 0.10, 40);
const fontSubtitle = clamp(14, SCREEN_WIDTH * 0.045, 18);
const buttonPaddingVertical = clamp(6, SCREEN_WIDTH * 0.025, 12);
const buttonPaddingHorizontal = clamp(16, SCREEN_WIDTH * 0.05, 24);
const borderRadius = clamp(10, SCREEN_WIDTH * 0.03, 20);
const shadowRadius = clamp(2, SCREEN_WIDTH * 0.02, 6);
const logoSize = clamp(60, SCREEN_WIDTH * 0.30, 100);
const paddingTopTitle = clamp(20, SCREEN_HEIGHT * 0.1, 100);
const paddingBottomTitle = clamp(10, SCREEN_HEIGHT * 0.03, 40);

export default function HomeScreen({ navigation }) {
  const { stopBGM } = useAudio();
  const { theme } = useTheme();
  const { showConfirmation } = useConfirmationDialog();

  // Animation values with useRef
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const bounceStyle = {
    transform: [
      {
        scale: bounceAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [1, 1.2, 1],
        }),
      },
      {
        translateY: bounceAnim.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [0, -10, 0],
        }),
      },
    ],
  };

  const handleExit = async () => {
    try {
      await stopBGM();
      BackHandler.exitApp();
    } catch (error) {
      console.log('Error stopping BGM:', error);
      BackHandler.exitApp();
    }
  };

  const handleExitPress = () => {
    showConfirmation({
      title: "Do you want to Quit the App?",
      message: "Are you sure you want to exit Smart Science?",
      onConfirm: handleExit,
      onCancel: () => {},
      confirmText: "Yes",
      cancelText: "Cancel"
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <MoleculeBackground />

      <Animated.View
        style={[
          styles.titleContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              ...bounceStyle.transform,
            ],
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.primaryAccent }]}>Welcome to{'\n'}Smart Science!</Text>
        <Text style={[styles.subtitle, { color: theme.subtitleText }]}>
          Let's explore the amazing world of molecules together! 🧪✨
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.menu,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <MenuButton 
          title="🔍 Definition of Terms" 
          onPress={() => navigation.navigate('Definition')}
          style={{ 
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            paddingVertical: buttonPaddingVertical,
            paddingHorizontal: buttonPaddingHorizontal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: shadowRadius,
            elevation: 5,
          }}
        />
        <MenuButton 
          title="❄️ Phase Changes of Matter" 
          onPress={() => navigation.navigate('PhaseChange')}
          style={{ 
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            paddingVertical: buttonPaddingVertical,
            paddingHorizontal: buttonPaddingHorizontal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: shadowRadius,
            elevation: 5,
          }}
        />
        <MenuButton 
          title="📊 Phase Diagram" 
          onPress={() => navigation.navigate('Diagram')}
          style={{ 
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            paddingVertical: buttonPaddingVertical,
            paddingHorizontal: buttonPaddingHorizontal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: shadowRadius,
            elevation: 5,
          }}
        />
        <MenuButton 
          title="🔄 Flowchart" 
          onPress={() => navigation.navigate('Flowchart')}
          style={{ 
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            paddingVertical: buttonPaddingVertical,
            paddingHorizontal: buttonPaddingHorizontal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: shadowRadius,
            elevation: 5,
          }}
        />
        <MenuButton 
          title="❓ Guide Questions" 
          onPress={() => navigation.navigate('Questions')}
          style={{ 
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            paddingVertical: buttonPaddingVertical,
            paddingHorizontal: buttonPaddingHorizontal,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: shadowRadius,
            elevation: 5,
          }}
        />
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.logoRow}>
            <TouchableOpacity 
              style={[styles.sideButton, { 
                backgroundColor: theme.buttonPrimary,
                borderColor: theme.primaryAccent,
                shadowColor: theme.shadowColor,
              }]}
              onPress={handleExitPress}
            >
              <Text style={[styles.sideButtonText, { color: theme.titleText }]}>Exit</Text>
            </TouchableOpacity>
            
            <Image source={require('../assets/logo.png')} style={[styles.logo, { tintColor: theme.titleText }]} />
            
            <TouchableOpacity 
              style={[styles.sideButton, { 
                backgroundColor: theme.buttonPrimary,
                borderColor: theme.primaryAccent,
                shadowColor: theme.shadowColor,
              }]}
              onPress={() => navigation.navigate('Settings')}
            >
              <Icon name="settings" size={wp('6')} color={theme.primaryAccent} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: wp('5'),
    paddingTop: paddingTopTitle,
    paddingBottom: paddingBottomTitle,
  },
  title: {
    fontSize: fontTitle,
    fontWeight: '800',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: shadowRadius,
    letterSpacing: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  subtitle: {
    fontSize: fontSubtitle,
    textAlign: 'center',
    marginTop: hp('2'),
    opacity: 0.9,
    lineHeight: fontSubtitle * 1.4,
    fontWeight: '600',
    letterSpacing: 0.3,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  menu: {
    width: '90%',
    gap: hp('2'),
    paddingHorizontal: wp('2.5'),
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: hp('1'),
    padding: wp('2'),
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: wp('80'),
  },
  logo: {
    width: logoSize,
    height: logoSize,
    resizeMode: 'contain',
  },
  sideButton: {
    borderRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    width: wp('20'),
    height: wp('12'),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sideButtonText: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: 1,
  },
});
