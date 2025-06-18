import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Text, Platform, TouchableOpacity, Image, Dimensions } from "react-native";
import Svg, { Circle, Path, Defs, Marker, Text as SvgText, G, LinearGradient, Stop } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
  cancelAnimation,
  interpolateColor,
  interpolate,
} from "react-native-reanimated";
import * as ScreenOrientation from 'expo-screen-orientation';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(20, SCREEN_WIDTH * 0.06, 32);
const fontPhaseLabel = clamp(14, SCREEN_WIDTH * 0.04, 18);
const fontArrowLabel = clamp(10, SCREEN_WIDTH * 0.03, 14);
const fontArrowLabelLarge = clamp(12, SCREEN_WIDTH * 0.035, 14);
const backButtonFont = clamp(14, SCREEN_WIDTH * 0.04, 16);
const logoSize = clamp(50, SCREEN_WIDTH * 0.12, 70);
const flaskSize = clamp(80, SCREEN_WIDTH * 0.22, 110);
const flaskNeckWidth = clamp(35, SCREEN_WIDTH * 0.09, 45);
const flaskNeckHeight = clamp(40, SCREEN_HEIGHT * 0.05, 55);
const arrowGap = clamp(30, SCREEN_WIDTH * 0.08, 50);
const mainPadding = clamp(10, SCREEN_WIDTH * 0.025, 20);
const contentPadding = clamp(15, SCREEN_HEIGHT * 0.02, 30);
const titlePadding = clamp(20, SCREEN_HEIGHT * 0.03, 40);

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedG = Animated.createAnimatedComponent(G);

const phaseColors = {
  Solid: "#4a90e2", // Ice blue
  Liquid: "#7ed957", // Water blue-green
  Gas: "#ffa500", // Steam orange
};

// Add new color constants for better theme consistency
const themeColors = {
  primary: '#4CC9F0',
  secondary: '#4361EE',
  accent: '#3A0CA3',
  background: {
    dark: '#0B0F12',
    medium: '#14181C',
    light: '#1F2428',
  },
  glow: {
    primary: 'rgba(76, 201, 240, 0.3)',
    secondary: 'rgba(67, 97, 238, 0.3)',
    accent: 'rgba(58, 12, 163, 0.3)',
  },
  arrow: {
    red: {
      primary: '#FF4D4D',
      secondary: '#FF8080',
      glow: 'rgba(255, 77, 77, 0.4)',
    },
    blue: {
      primary: '#4361EE',
      secondary: '#4895EF',
      glow: 'rgba(67, 97, 238, 0.4)',
    }
  }
};

// H2O phase transition temperatures (in Kelvin)
const PHASE_TRANSITIONS = {
  MELTING_POINT: 273.15,    // 0°C
  BOILING_POINT: 373.15,    // 100°C
  SUBLIMATION_POINT: 273.15 // 0°C (at low pressure)
};

function MoleculeSim({ phase, width = flaskSize, height = flaskSize }) {
  const MAX_MOLS = 9;
  // Adjust molecule count based on phase (more molecules in liquid than gas)
  const count = phase === "Solid" ? 9 : phase === "Liquid" ? 8 : 6;
  const progress = useSharedValue(0);

  const mols = useRef(
    Array.from({ length: MAX_MOLS }).map(() => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      vx: Math.random() * 0.6 + 0.4,
      vy: Math.random() * 0.6 + 0.4,
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: Math.random() > 0.5 ? 1 : -1,
      offset: Math.random() * Math.PI * 2,
      targetX: useSharedValue(0),
      targetY: useSharedValue(0),
      lastPhase: "Solid",
    }))
  ).current;

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    return () => cancelAnimation(progress);
  }, []);

  useEffect(() => {
    for (let i = 0; i < MAX_MOLS; i++) {
      if (phase === "Solid") {
        // Hexagonal ice lattice structure (approximated in 2D)
        const row = Math.floor(i / 3);
        const col = i % 3;
        const hexOffset = row % 2 === 0 ? 0 : 7; // Offset every other row for hexagonal pattern
        mols[i].x.value = 20 + col * 14 + hexOffset;
        mols[i].y.value = 30 + row * 12; // Slightly closer rows for hexagonal packing
      } else if (phase === "Liquid") {
        // Water molecules are closer together but still mobile
        if (mols[i].lastPhase !== "Liquid") {
          const angle = Math.random() * Math.PI * 2;
          const distance = 8 + Math.random() * 13; // Tighter packing for liquid
          mols[i].x.value = (width / 2 - 20) + Math.cos(angle) * distance;
          mols[i].y.value = height / 2 + Math.sin(angle) * distance;
        }
        // Set target to random point with minimum distance from center
        const angle = Math.random() * Math.PI * 2;
        const distance = 8 + Math.random() * 13; // Tighter packing for liquid
        mols[i].targetX.value = (width / 2 - 20) + Math.cos(angle) * distance;
        mols[i].targetY.value = height / 2 + Math.sin(angle) * distance;
      } else if (phase === "Gas") {
        // Gas molecules are more spread out and move faster
        if (mols[i].lastPhase !== "Gas") {
          mols[i].x.value = Math.random() * (width - 40) + 20;
          mols[i].y.value = Math.random() * (height - 40) + 20;
          mols[i].vx = Math.random() * 0.8 + 0.6; // Faster movement for gas
          mols[i].vy = Math.random() * 0.8 + 0.6;
          mols[i].dirX = Math.random() > 0.5 ? 1 : -1;
          mols[i].dirY = Math.random() > 0.5 ? 1 : -1;
        }
      }
      mols[i].lastPhase = phase;
    }
  }, [phase, width, height, count]);

  const animatedPropsArr = Array.from({ length: MAX_MOLS }).map((_, i) =>
    useAnimatedProps(() => {
      if (phase === "Solid") {
        // Simulate molecular vibration in ice (smaller amplitude)
        const fastFreq = progress.value * Math.PI * 8;
        const slowFreq = progress.value * Math.PI * 2;
        const phaseOffset = i * 0.3;
        
        // Reduced vibration amplitude for ice
        const jitterX = (
          Math.sin(fastFreq + phaseOffset) * 0.2 + // Reduced from 0.4
          Math.sin(slowFreq + phaseOffset) * 0.1   // Reduced from 0.2
        );
        const jitterY = (
          Math.cos(fastFreq + phaseOffset) * 0.2 + // Reduced from 0.4
          Math.cos(slowFreq + phaseOffset) * 0.1   // Reduced from 0.2
        );
        
        const baseX = mols[i].x.value;
        const baseY = mols[i].y.value;

        return {
          cx: baseX + jitterX,
          cy: baseY + jitterY,
        };
      } else if (phase === "Liquid") {
        // Slower, more cohesive movement for liquid water
        const lerpFactor = 0.01; // Reduced from 0.015 for more cohesive movement
        mols[i].x.value += (mols[i].targetX.value - mols[i].x.value) * lerpFactor;
        mols[i].y.value += (mols[i].targetY.value - mols[i].y.value) * lerpFactor;

        const dx = mols[i].targetX.value - mols[i].x.value;
        const dy = mols[i].targetY.value - mols[i].y.value;
        const distSq = dx * dx + dy * dy;

        if (distSq < 4) { // Reduced from 6 for tighter packing
          const angle = Math.random() * Math.PI * 2;
          const distance = 6 + Math.random() * 10; // Reduced range for tighter packing
          mols[i].targetX.value = (width / 2 - 20) + Math.cos(angle) * distance;
          mols[i].targetY.value = height / 2 + Math.sin(angle) * distance;
        }

        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      } else {
        // Gas — faster, more energetic movement
        let nx = mols[i].x.value + mols[i].vx * mols[i].dirX * 3; // Increased from 2
        let ny = mols[i].y.value + mols[i].vy * mols[i].dirY * 3; // Increased from 2
        if (nx < 20 || nx > width - 35) mols[i].dirX *= -1;
        if (ny < 20 || ny > height - 20) mols[i].dirY *= -1;
        mols[i].x.value = Math.max(20, Math.min(nx, width - 35));
        mols[i].y.value = Math.max(20, Math.min(ny, height - 20));
        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      }
    })
  );

  return (
    <View style={styles.flaskContainer}>
      <View style={styles.flaskNeck} />
      <View style={[styles.simulationContainer, { backgroundColor: "white" }]}>
        <Svg width={width} height={height}>
          {[...Array(count)].map((_, i) => (
            <AnimatedCircle
              key={i}
              r={phase === "Solid" ? 6 : phase === "Liquid" ? 6 : 5} // Slightly smaller molecules
              fill={phaseColors[phase]}
              stroke="#222"
              strokeWidth="1.5"
              opacity={phase === "Gas" ? 0.7 : 1} // More transparent for gas
              animatedProps={animatedPropsArr[i]}
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

export default function MoleculeSimRow() {
  const navigation = useNavigation();
  const handlePress = useButtonSound();
  const { theme, isDarkTheme } = useTheme();
  const glowProgress = useSharedValue(0);
  const particleProgress = useSharedValue(0);
  const blueParticleProgress = useSharedValue(0);
  const middleParticleProgress = useSharedValue(0);
  const middleBlueParticleProgress = useSharedValue(0);

  useEffect(() => {
    glowProgress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    particleProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    blueParticleProgress.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.linear }),
      -1,
      false
    );
    middleParticleProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    middleBlueParticleProgress.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
    return () => {
      cancelAnimation(glowProgress);
      cancelAnimation(particleProgress);
      cancelAnimation(blueParticleProgress);
      cancelAnimation(middleParticleProgress);
      cancelAnimation(middleBlueParticleProgress);
    };
  }, []);

  const totalRowWidth = 3 * flaskSize + 2 * arrowGap;
  const flaskCenterX = {
    solid: arrowGap,
    liquid: arrowGap + flaskSize + arrowGap,
    gas: 2 * arrowGap + 2 * flaskSize + arrowGap,
  };

  const arrowGlowProps = useAnimatedProps(() => {
    const redColor = theme.arrowRed || '#FF4D4D';
    const redSecondary = theme.arrowRedSecondary || '#FF8080';
    return {
      stroke: interpolateColor(
        glowProgress.value,
        [0, 0.5, 1],
        [redColor, redSecondary, redColor]
      ),
      strokeWidth: 4 + Math.sin(glowProgress.value * Math.PI) * 1.5,
      filter: `drop-shadow(0 0 ${3 + Math.sin(glowProgress.value * Math.PI) * 2}px ${theme.arrowRedGlow || 'rgba(255, 77, 77, 0.4)'})`,
    };
  });

  const blueArrowGlowProps = useAnimatedProps(() => {
    const blueColor = theme.arrowBlue || '#4361EE';
    const blueSecondary = theme.arrowBlueSecondary || '#4895EF';
    return {
      stroke: interpolateColor(
        glowProgress.value,
        [0, 0.5, 1],
        [blueColor, blueSecondary, blueColor]
      ),
      strokeWidth: 4 + Math.sin(glowProgress.value * Math.PI) * 1.5,
      filter: `drop-shadow(0 0 ${3 + Math.sin(glowProgress.value * Math.PI) * 2}px ${theme.arrowBlueGlow || 'rgba(67, 97, 238, 0.4)'})`,
    };
  });

  const particleGlowProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: interpolate(
        particleProgress.value,
        [0, 1],
        [0, -1000]
      ),
    };
  });

  const blueParticleGlowProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: interpolate(
        blueParticleProgress.value,
        [0, 1],
        [-1000, 0]
      ),
    };
  });

  const middleParticleGlowProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: interpolate(
        middleParticleProgress.value,
        [0, 1],
        [0, -1000]
      ),
    };
  });

  const middleBlueParticleGlowProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: interpolate(
        middleBlueParticleProgress.value,
        [0, 1],
        [-1000, 0]
      ),
    };
  });

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  return (
    <ExpoLinearGradient
      colors={[
        theme.background,
        theme.cardBackground,
        theme.background
      ]}
      style={styles.container}
    >
      <Image 
        source={require('../assets/logo.png')}
        style={[styles.logo, { 
          tintColor: theme.titleText,
          width: logoSize,
          height: logoSize,
        }]}
        resizeMode="contain"
      />

      <TouchableOpacity 
        style={[styles.backButton, { 
          backgroundColor: theme.buttonPrimary,
          borderColor: theme.primaryAccent,
          shadowColor: theme.shadowColor,
        }]}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={[styles.backButtonText, { 
          color: theme.titleText,
          fontSize: backButtonFont,
        }]}>Back</Text>
        <Icon name="arrow-right" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <Text style={[styles.title, { 
          color: theme.titleText,
          textShadowColor: theme.glowColor,
          fontSize: fontTitle,
        }]}>CHANGING STATES OF MATTER</Text>
      </View>
      
      <View style={[styles.mainContentContainer, {
        paddingHorizontal: mainPadding,
        paddingVertical: contentPadding,
        paddingTop: titlePadding,
      }]}>
        <ExpoLinearGradient
          colors={[
            theme.cardBackground,
            theme.background
          ]}
          style={[styles.flowchartContainer, {
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
          }]}
        >
          <View style={styles.contentContainer}>
            {/* Sublimation Arrow (Solid to Gas) */}
            <Svg style={styles.sublimationArrowSvg} width={totalRowWidth} height={80}>
              <Defs>
                <Marker id="arrowheadRed" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <Path d="M 0 0 L 10 5 L 0 10 z" fill={theme.arrowRed || '#FF4D4D'} stroke={theme.arrowRedSecondary || '#FF8080'} strokeWidth="0.5" />
                </Marker>
                <LinearGradient id="redParticleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                  <Stop offset="45%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                  <Stop offset="50%" stopColor={theme.arrowRed || '#FF4D4D'} />
                  <Stop offset="55%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                  <Stop offset="100%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                </LinearGradient>
              </Defs>
              <AnimatedG animatedProps={arrowGlowProps}>
                <Path
                  d={`M ${flaskCenterX.solid} 60 Q ${totalRowWidth / 2} 20 ${flaskCenterX.gas} 60`}
                  stroke={theme.arrowRed}
                  strokeWidth="4"
                  fill="none"
                  markerEnd="url(#arrowheadRed)"
                />
                <AnimatedPath
                  d={`M ${flaskCenterX.solid} 60 Q ${totalRowWidth / 2} 20 ${flaskCenterX.gas} 60`}
                  stroke="url(#redParticleGradient)"
                  strokeWidth="6"
                  strokeDasharray="20,1000"
                  fill="none"
                  animatedProps={particleGlowProps}
                />
              </AnimatedG>
              <SvgText
                fill={theme.arrowRed}
                fontSize={fontArrowLabelLarge}
                fontWeight="bold"
                x={totalRowWidth / 2}
                y="35"
                textAnchor="middle"
                style={[styles.arrowLabel, { textShadowColor: theme.glowColor }]}
              >
                SUBLIMATION
              </SvgText>
            </Svg>

            <View style={[styles.rowContainer, { gap: arrowGap }]}>
              <View style={styles.phaseContainer}>
                <MoleculeSim phase="Solid" width={flaskSize} height={flaskSize} />
                <Text style={[styles.phaseLabel, { 
                  color: phaseColors.Solid,
                  textShadowColor: theme.glowColor,
                  fontSize: fontPhaseLabel,
                }]}>SOLID</Text>
              </View>

              <View style={styles.horizontalArrowContainer}>
                <Svg width="100" height="80">
                  <Defs>
                    <Marker id="arrowheadRedH" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                      <Path d="M 0 0 L 10 5 L 0 10 z" fill={theme.arrowRed || '#FF4D4D'} stroke={theme.arrowRedSecondary || '#FF8080'} strokeWidth="0.5" />
                    </Marker>
                    <Marker id="arrowheadBlueH" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                      <Path d="M 10 0 L 0 5 L 10 10 z" fill={theme.arrowBlue || '#4361EE'} stroke={theme.arrowBlueSecondary || '#4895EF'} strokeWidth="0.5" />
                    </Marker>
                    <LinearGradient id="redParticleGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="40%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="45%" stopColor={`${theme.arrowRed || '#FF4D4D'}80`} />
                      <Stop offset="50%" stopColor={theme.arrowRed || '#FF4D4D'} />
                      <Stop offset="55%" stopColor={`${theme.arrowRed || '#FF4D4D'}80`} />
                      <Stop offset="60%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="100%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                    </LinearGradient>
                    <LinearGradient id="blueParticleGradientH" x1="100%" y1="0%" x2="0%" y2="0%">
                      <Stop offset="0%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="40%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="45%" stopColor={`${theme.arrowBlue || '#4361EE'}80`} />
                      <Stop offset="50%" stopColor={theme.arrowBlue || '#4361EE'} />
                      <Stop offset="55%" stopColor={`${theme.arrowBlue || '#4361EE'}80`} />
                      <Stop offset="60%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="100%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                    </LinearGradient>
                  </Defs>
                  {/* Melting */}
                  <AnimatedG animatedProps={arrowGlowProps}>
                    <Path
                      d="M 0 15 L 95 15"
                      stroke={theme.arrowRed}
                      strokeWidth="3"
                      fill="none"
                      markerEnd="url(#arrowheadRedH)"
                    />
                    <AnimatedPath
                      d="M 0 15 L 95 15"
                      stroke="url(#redParticleGradientH)"
                      strokeWidth="6"
                      strokeDasharray="30,1000"
                      fill="none"
                      animatedProps={middleParticleGlowProps}
                    />
                  </AnimatedG>
                  <SvgText
                    fill={theme.arrowRed}
                    fontSize={fontArrowLabel}
                    fontWeight="bold"
                    x="50"
                    y="8"
                    textAnchor="middle"
                    style={styles.arrowLabel}
                  >
                    MELTING
                  </SvgText>

                  {/* Freezing */}
                  <AnimatedG animatedProps={blueArrowGlowProps}>
                    <Path
                      d="M 0 50 L 95 50"
                      stroke={theme.arrowBlue}
                      strokeWidth="3"
                      fill="none"
                      markerStart="url(#arrowheadBlueH)"
                    />
                    <AnimatedPath
                      d="M 0 50 L 95 50"
                      stroke="url(#blueParticleGradientH)"
                      strokeWidth="6"
                      strokeDasharray="30,1000"
                      fill="none"
                      animatedProps={middleBlueParticleGlowProps}
                    />
                  </AnimatedG>
                  <SvgText
                    fill={theme.arrowBlue}
                    fontSize={fontArrowLabel}
                    fontWeight="bold"
                    x="50"
                    y="40"
                    textAnchor="middle"
                    style={styles.arrowLabel}
                  >
                    FREEZING
                  </SvgText>
                </Svg>
              </View>

              <View style={styles.phaseContainer}>
                <MoleculeSim phase="Liquid" width={flaskSize} height={flaskSize} />
                <Text style={[styles.phaseLabel, { 
                  color: phaseColors.Liquid,
                  textShadowColor: theme.glowColor,
                  fontSize: fontPhaseLabel,
                }]}>LIQUID</Text>
              </View>

              <View style={styles.horizontalArrowContainer}>
                <Svg width="100" height="80">
                  <Defs>
                    <Marker id="arrowheadRedH" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                      <Path d="M 0 0 L 10 5 L 0 10 z" fill={theme.arrowRed || '#FF4D4D'} stroke={theme.arrowRedSecondary || '#FF8080'} strokeWidth="0.5" />
                    </Marker>
                    <Marker id="arrowheadBlueH" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                      <Path d="M 10 0 L 0 5 L 10 10 z" fill={theme.arrowBlue || '#4361EE'} stroke={theme.arrowBlueSecondary || '#4895EF'} strokeWidth="0.5" />
                    </Marker>
                    <LinearGradient id="redParticleGradientH" x1="0%" y1="0%" x2="100%" y2="0%">
                      <Stop offset="0%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="40%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="45%" stopColor={`${theme.arrowRed || '#FF4D4D'}80`} />
                      <Stop offset="50%" stopColor={theme.arrowRed || '#FF4D4D'} />
                      <Stop offset="55%" stopColor={`${theme.arrowRed || '#FF4D4D'}80`} />
                      <Stop offset="60%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                      <Stop offset="100%" stopColor={`${theme.arrowRed || '#FF4D4D'}00`} />
                    </LinearGradient>
                    <LinearGradient id="blueParticleGradientH" x1="100%" y1="0%" x2="0%" y2="0%">
                      <Stop offset="0%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="40%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="45%" stopColor={`${theme.arrowBlue || '#4361EE'}80`} />
                      <Stop offset="50%" stopColor={theme.arrowBlue || '#4361EE'} />
                      <Stop offset="55%" stopColor={`${theme.arrowBlue || '#4361EE'}80`} />
                      <Stop offset="60%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                      <Stop offset="100%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                    </LinearGradient>
                  </Defs>
                  {/* Evaporation */}
                  <AnimatedG animatedProps={arrowGlowProps}>
                    <Path
                      d="M 0 15 L 95 15"
                      stroke={theme.arrowRed}
                      strokeWidth="3"
                      fill="none"
                      markerEnd="url(#arrowheadRedH)"
                    />
                    <AnimatedPath
                      d="M 0 15 L 95 15"
                      stroke="url(#redParticleGradientH)"
                      strokeWidth="6"
                      strokeDasharray="30,1000"
                      fill="none"
                      animatedProps={middleParticleGlowProps}
                    />
                  </AnimatedG>
                  <SvgText
                    fill={theme.arrowRed}
                    fontSize={fontArrowLabel}
                    fontWeight="bold"
                    x="50"
                    y="8"
                    textAnchor="middle"
                    style={styles.arrowLabel}
                  >
                    EVAPORATION
                  </SvgText>

                  {/* Condensation */}
                  <AnimatedG animatedProps={blueArrowGlowProps}>
                    <Path
                      d="M 0 50 L 95 50"
                      stroke={theme.arrowBlue}
                      strokeWidth="3"
                      fill="none"
                      markerStart="url(#arrowheadBlueH)"
                    />
                    <AnimatedPath
                      d="M 0 50 L 95 50"
                      stroke="url(#blueParticleGradientH)"
                      strokeWidth="6"
                      strokeDasharray="30,1000"
                      fill="none"
                      animatedProps={middleBlueParticleGlowProps}
                    />
                  </AnimatedG>
                  <SvgText
                    fill={theme.arrowBlue}
                    fontSize={fontArrowLabel}
                    fontWeight="bold"
                    x="50"
                    y="40"
                    textAnchor="middle"
                    style={styles.arrowLabel}
                  >
                    CONDENSATION
                  </SvgText>
                </Svg>
              </View>

              <View style={styles.phaseContainer}>
                <MoleculeSim phase="Gas" width={flaskSize} height={flaskSize} />
                <Text style={[styles.phaseLabel, { 
                  color: phaseColors.Gas,
                  textShadowColor: theme.glowColor,
                  fontSize: fontPhaseLabel,
                }]}>GAS</Text>
              </View>
            </View>

            {/* Deposition Arrow (Gas to Solid) */}
            <Svg style={styles.depositionArrowSvg} width={totalRowWidth} height={80}>
              <Defs>
                <Marker id="arrowheadBlue" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                  <Path d="M 10 0 L 0 5 L 10 10 z" fill={theme.arrowBlue || '#4361EE'} stroke={theme.arrowBlueSecondary || '#4895EF'} strokeWidth="0.5" />
                </Marker>
                <LinearGradient id="blueParticleGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                  <Stop offset="0%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                  <Stop offset="45%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                  <Stop offset="50%" stopColor={theme.arrowBlue || '#4361EE'} />
                  <Stop offset="55%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                  <Stop offset="100%" stopColor={`${theme.arrowBlue || '#4361EE'}00`} />
                </LinearGradient>
              </Defs>
              <AnimatedG animatedProps={blueArrowGlowProps}>
                <Path
                  d={`M ${flaskCenterX.solid} 20 Q ${totalRowWidth / 2} 60 ${flaskCenterX.gas} 20`}
                  stroke={theme.arrowBlue}
                  strokeWidth="4"
                  fill="none"
                  markerStart="url(#arrowheadBlue)"
                />
                <AnimatedPath
                  d={`M ${flaskCenterX.solid} 20 Q ${totalRowWidth / 2} 60 ${flaskCenterX.gas} 20`}
                  stroke="url(#blueParticleGradient)"
                  strokeWidth="6"
                  strokeDasharray="20,1000"
                  fill="none"
                  animatedProps={blueParticleGlowProps}
                />
              </AnimatedG>
              <SvgText
                fill={theme.arrowBlue}
                fontSize={fontArrowLabelLarge}
                fontWeight="bold"
                x={totalRowWidth / 2}
                y="55"
                textAnchor="middle"
                style={[styles.arrowLabel, { textShadowColor: theme.glowColor }]}
              >
                DEPOSITION
              </SvgText>
            </Svg>
          </View>
        </ExpoLinearGradient>
      </View>
    </ExpoLinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  titleContainer: {
    width: '100%',
    paddingTop: titlePadding,
    paddingBottom: 5,
    alignItems: 'center',
  },
  mainContentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  flowchartContainer: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: 30,
    paddingTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
    letterSpacing: 2.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 50,
    zIndex: 2,
    marginTop: 20,
  },
  phaseContainer: {
    alignItems: 'center',
    gap: 10,
  },
  simulationContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    padding: 15,
    paddingTop: 15,
    width: 110,
    height: 110,
    borderTopLeftRadius: 75,
    borderTopRightRadius: 75,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    marginTop: 15,
    zIndex: 2,
  },
  phaseLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    letterSpacing: 1.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    marginTop: 8,
  },
  arrowLabel: {
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    letterSpacing: 2,
    fontWeight: '600',
  },
  flaskContainer: {
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  flaskNeck: {
    width: 45,
    height: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.97)',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1.5,
    position: 'absolute',
    top: -28,
    zIndex: 0,
    transform: [
      { perspective: 1000000 },
      { rotateX: '20deg' },
      { scaleY: 1.2 }
    ],
    borderBottomWidth: 0,
    clipPath: 'polygon(50% 0, 70% 0, 90% 100%, 70% 90%)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  horizontalArrowContainer: {
    width: 90,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sublimationArrowSvg: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    zIndex: 1,
  },
  depositionArrowSvg: {
    position: 'absolute',
    bottom: -20,
    alignSelf: 'center',
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderBottomWidth: 3,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  logo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    width: 70,
    height: 70,
    zIndex: 10,
  },
});
  