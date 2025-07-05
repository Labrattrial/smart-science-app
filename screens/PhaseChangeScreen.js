import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, ImageBackground, Platform, Image, LayoutAnimation } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import Icons from 'react-native-vector-icons/FontAwesome6';
import Feather from 'react-native-vector-icons/Feather';
import { LinearGradient } from 'expo-linear-gradient';
import MoleculeBackground from '../components/MoleculeBackground';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Custom composite icon components
const EvaporationIcon = ({ color, size, style }) => (
  <View style={[styles.compositeIcon, style]}>
    <Icons name="water" size={size * 0.5} color={color} style={[styles.iconBase, { bottom: -size * 0.2 }]} />
    <Feather name="upload-cloud" size={size * 0.7} color={color} style={[styles.iconBase, { top: -size * 0.1 }]} />
  </View>
);

const DepositionIcon = ({ color, size, style }) => (
  <View style={[styles.compositeIcon, style]}>
    <Feather name="download-cloud" size={size * 0.7} color={color} style={[styles.iconBase, { top: -size * 0.1 }]} />
    <Icons name="snowflake" size={size * 0.5} color={color} style={[styles.iconBase, { bottom: -size * 0.2}]} />
  </View>
);

export default function PhaseChangeScreen({ navigation }) {
  const { theme } = useTheme();
  const handlePress = useButtonSound();

  const phases = [
    { 
      name: 'Condensation', 
      screen: 'CondensationScreen',
      icon: 'cloud-rain',
      description: 'Gas to Liquid',
      color: '#00B0FF',
      iconType: 'fontawesome'
    },
    { 
      name: 'Sublimation', 
      screen: 'SublimationScreen',
      icon: 'snowflake-melt',
      description: 'Solid to Gas',
      color: '#00E5FF',
      iconType: 'material'
    },
    { 
      name: 'Melting', 
      screen: 'MeltingScreen',
      icon: 'fire',
      description: 'Solid to Liquid',
      color: '#FF7043',
      iconType: 'material'
    },
    { 
      name: 'Freezing', 
      screen: 'FreezingScreen',
      icon: 'snowflake',
      description: 'Liquid to Solid',
      color: '#00B0FF',
      iconType: 'material'
    },
    { 
      name: 'Evaporation', 
      screen: 'EvaporationScreen',
      description: 'Liquid to Gas',
      color: '#00E5FF',
      iconType: 'composite',
      component: EvaporationIcon
    },
    { 
      name: 'Deposition', 
      screen: 'DepositionScreen',
      description: 'Gas to Solid',
      color: '#FF7043',
      iconType: 'composite',
      component: DepositionIcon
    },
  ];

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonAnims = useRef(phases.map(() => new Animated.Value(0))).current;

  // Verify reactivity with useEffect
  useEffect(() => {
    console.log('PhaseChangeScreen theme changed:', theme.background);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [theme]);

  useEffect(() => {
    // Title animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.12, duration: 350, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Staggered button animations
    Animated.stagger(
      100,
      buttonAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View 
      key={theme.background}
      style={[styles.container, { backgroundColor: theme.background }]}
    >
      <MoleculeBackground />
      
      <TouchableOpacity 
        style={[styles.backButton, { 
          backgroundColor: theme.buttonPrimary,
          borderColor: theme.primaryAccent,
          shadowColor: theme.shadowColor,
          elevation: 5,
        }]}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={[styles.backButtonText, { color: theme.titleText }]}>Back</Text>
        <EntypoIcon name="back" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <ImageBackground
        source={require('../assets/logo.png')}
        style={styles.backgroundImage}
        imageStyle={[styles.backgroundImageStyle, { tintColor: theme.titleText }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.borderColor,
                shadowColor: theme.shadowColor,
                elevation: 8,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <Image 
              source={require('../assets/logo.png')}
              style={[styles.headerLogo, { tintColor: theme.titleText }]}
              resizeMode="contain"
            />
            <Text style={[styles.title, { color: theme.titleText }]}>Phase Changes</Text>
            <Text style={[styles.subtitle, { color: theme.subtitleText }]}>Explore how molecules transform!</Text>
          </Animated.View>

          <View style={styles.phasesGrid}>
            {phases.map((phase, index) => (
              <Animated.View
                key={phase.name}
                style={[
                  styles.buttonContainer,
                  {
                    transform: [
                      { 
                        translateY: buttonAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [50, 0]
                        })
                      },
                      {
                        scale: buttonAnims[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1]
                        })
                      }
                    ],
                    opacity: buttonAnims[index]
                  }
                ]}
              >
                <TouchableOpacity
                  style={[styles.button, { 
                    borderColor: phase.color,
                    shadowColor: theme.shadowColor,
                    elevation: 5,
                  }]}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate(phase.screen)}
                >
                  <LinearGradient
                    colors={[phase.color + '20', phase.color + '10']}
                    style={styles.buttonGradient}
                  >
                    {phase.iconType === 'composite' ? (
                      <phase.component color={phase.color} size={32} style={styles.buttonIcon} />
                    ) : phase.iconType === 'fontawesome' ? (
                      <Icons name={phase.icon} size={32} color={phase.color} style={styles.buttonIcon} />
                    ) : (
                      <Icon name={phase.icon} size={32} color={phase.color} style={styles.buttonIcon} />
                    )}
                    <View style={styles.buttonTextContainer}>
                      <Text style={[styles.buttonText, { color: phase.color }]}>{phase.name}</Text>
                      <Text style={[styles.buttonDescription, { color: theme.subtitleText }]}>{phase.description}</Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  backgroundImageStyle: {
    opacity: 0.1,
  },
  scrollContent: {
    padding: wp('3'),
    paddingTop: Platform.OS === 'ios' ? hp('15') : hp('13'),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: hp('4'),
    padding: wp('4'),
    borderRadius: wp('4'),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: wp('4'),
  },
  headerLogo: {
    width: wp('15'),
    height: wp('15'),
    marginBottom: hp('1'),
  },
  title: {
    fontSize: wp('7'),
    fontWeight: '700',
    fontFamily: 'System',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: wp('2'),
  },
  subtitle: {
    fontSize: wp('4'),
    marginTop: hp('0.5'),
    textAlign: 'center',
  },
  phasesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: wp('1'),
  },
  buttonContainer: {
    width: '48%',
    marginBottom: hp('2'),
  },
  button: {
    borderRadius: wp('3'),
    overflow: 'hidden',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: wp('2'),
  },
  buttonGradient: {
    padding: wp('3'),
    alignItems: 'center',
  },
  buttonIcon: {
    marginBottom: hp('0.5'),
  },
  buttonTextContainer: {
    alignItems: 'center',
  },
  buttonText: {
    fontSize: wp('4'),
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: hp('0.3'),
  },
  buttonDescription: {
    fontSize: wp('2.8'),
    textAlign: 'center',
  },
  compositeIcon: {
    width: wp('7'),
    height: wp('7'),
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBase: {
    position: 'absolute',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('7') : hp('5'),
    right: wp('4'),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('1.5'),
    paddingHorizontal: wp('2.5'),
    borderRadius: wp('2.5'),
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
  },
  backButtonText: {
    fontSize: wp('3.5'),
    fontWeight: "700",
    marginRight: wp('1'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
});
