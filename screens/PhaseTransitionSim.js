import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const phaseColors = {
  solid: '#4a90e2',    // Blue for ice
  solidLight: '#5a9fe2', // Lighter blue for ice highlights
  solidDark: '#3a80d2',  // Darker blue for ice shadows
  liquid: '#7ed957',   // Green for water
  liquidLight: '#8ee967', // Lighter green for water highlights
  liquidDark: '#6ec947',  // Darker green for water shadows
  gas: '#ffa500',      // Orange for steam
};

export default function PhaseTransitionSim({ width = 70, height = 70, phase = 'solid' }) {
  const progress = useSharedValue(0);
  const shineProgress = useSharedValue(0);
  const rippleProgress = useSharedValue(0);
  
  const steamParticles = useRef(
    Array.from({ length: 5 }, () => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      scale: useSharedValue(1),
      opacity: useSharedValue(0)
    }))
  ).current;

  useEffect(() => {
    // Main animation sequence
    progress.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    // Shine effect animation
    shineProgress.value = withRepeat(
      withTiming(1, { 
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      true
    );

    // Ripple effect animation
    rippleProgress.value = withRepeat(
      withTiming(1, { 
        duration: 3000,
        easing: Easing.inOut(Easing.ease)
      }),
      -1,
      false
    );

    // Animate steam particles
    if (phase === 'gas') {
      steamParticles.forEach((particle, index) => {
        const delay = index * 200;
        setTimeout(() => {
          particle.y.value = withRepeat(
            withSequence(
              withTiming(-25, { duration: 2000 }),
              withTiming(0, { duration: 0 })
            ),
            -1,
            false
          );
          particle.x.value = withRepeat(
            withSequence(
              withTiming(Math.random() * 10 - 5, { duration: 1000 }),
              withTiming(Math.random() * 10 - 5, { duration: 1000 })
            ),
            -1,
            true
          );
          particle.opacity.value = withRepeat(
            withSequence(
              withTiming(0.8, { duration: 1000 }),
              withTiming(0, { duration: 1000 })
            ),
            -1,
            false
          );
        }, delay);
      });
    }
  }, [phase]);

  const mainShapeProps = useAnimatedProps(() => {
    if (phase === 'solid') {
      // Classic ice cube with crystalline pattern - wider
      const shine = Math.sin(shineProgress.value * Math.PI * 2) * 0.1;
      return {
        d: `
          M${width/2},${height/2 - 20}
          L${width/2 + 30},${height/2 - 10}
          L${width/2 + 30},${height/2 + 10}
          L${width/2},${height/2 + 20}
          L${width/2 - 30},${height/2 + 10}
          L${width/2 - 30},${height/2 - 10}
          Z
        `,
        fill: phaseColors.solid,
        opacity: 1
      };
    } else if (phase === 'liquid') {
      // More irregular puddle shape with dynamic edges
      const ripple1 = Math.sin(rippleProgress.value * Math.PI * 2) * 2;
      const ripple2 = Math.sin(rippleProgress.value * Math.PI * 3) * 1.5;
      const ripple3 = Math.cos(rippleProgress.value * Math.PI * 2.5) * 1;
      return {
        d: `
          M${width/2 - 28},${height/2 + 5 + ripple1}
          C${width/2 - 32},${height/2 - 8 + ripple2} ${width/2 - 22},${height/2 - 12 + ripple3} ${width/2 - 12},${height/2 - 8 + ripple1}
          C${width/2 - 6},${height/2 - 15 + ripple2} ${width/2 + 6},${height/2 - 15 + ripple3} ${width/2 + 12},${height/2 - 8 + ripple1}
          C${width/2 + 22},${height/2 - 12 + ripple2} ${width/2 + 32},${height/2 - 8 + ripple3} ${width/2 + 28},${height/2 + 5 + ripple1}
          C${width/2 + 32},${height/2 + 18 + ripple2} ${width/2 + 22},${height/2 + 22 + ripple3} ${width/2 + 12},${height/2 + 18 + ripple1}
          C${width/2 + 6},${height/2 + 25 + ripple2} ${width/2 - 6},${height/2 + 25 + ripple3} ${width/2 - 12},${height/2 + 18 + ripple1}
          C${width/2 - 22},${height/2 + 22 + ripple2} ${width/2 - 32},${height/2 + 18 + ripple3} ${width/2 - 28},${height/2 + 5 + ripple1}
          Z
        `,
        fill: phaseColors.liquid,
        opacity: 0.9
      };
    } else {
      // Enhanced gas phase with more dynamic evaporation
      const scale = 1 + progress.value * 0.3;
      const opacity = 1 - progress.value * 0.8;
      const ripple = Math.sin(progress.value * Math.PI * 4) * 3;
      
      return {
        d: `
          M${width/2 - 25 * scale},${height/2}
          Q${width/2},${height/2 + (10 + ripple) * scale} ${width/2 + 25 * scale},${height/2}
          Q${width/2},${height/2 - (10 + ripple) * scale} ${width/2 - 25 * scale},${height/2}
          Z
        `,
        fill: phaseColors.gas,
        opacity: opacity
      };
    }
  });

  const surfaceDetailsProps = useAnimatedProps(() => {
    if (phase === 'solid') {
      // Ice crystal inner details - wider
      const shine = Math.sin(shineProgress.value * Math.PI * 2) * 0.1;
      return {
        d: `
          M${width/2},${height/2 - 15}
          L${width/2 + 22},${height/2 - 7}
          L${width/2 + 22},${height/2 + 7}
          L${width/2},${height/2 + 15}
          L${width/2 - 22},${height/2 + 7}
          L${width/2 - 22},${height/2 - 7}
          Z
        `,
        fill: phaseColors.solidLight,
        opacity: 0.3 + shine
      };
    } else if (phase === 'liquid') {
      // Enhanced puddle surface details with multiple ripple layers
      const ripple1 = Math.sin(rippleProgress.value * Math.PI * 2) * 1.5;
      const ripple2 = Math.sin(rippleProgress.value * Math.PI * 3) * 1;
      const ripple3 = Math.cos(rippleProgress.value * Math.PI * 2.5) * 0.8;
      return {
        d: `
          M${width/2 - 22},${height/2 + 3 + ripple1}
          C${width/2 - 25},${height/2 - 5 + ripple2} ${width/2 - 18},${height/2 - 8 + ripple3} ${width/2 - 10},${height/2 - 5 + ripple1}
          C${width/2 - 5},${height/2 - 12 + ripple2} ${width/2 + 5},${height/2 - 12 + ripple3} ${width/2 + 10},${height/2 - 5 + ripple1}
          C${width/2 + 18},${height/2 - 8 + ripple2} ${width/2 + 25},${height/2 - 5 + ripple3} ${width/2 + 22},${height/2 + 3 + ripple1}
          C${width/2 + 25},${height/2 + 15 + ripple2} ${width/2 + 18},${height/2 + 18 + ripple3} ${width/2 + 10},${height/2 + 15 + ripple1}
          C${width/2 + 5},${height/2 + 22 + ripple2} ${width/2 - 5},${height/2 + 22 + ripple3} ${width/2 - 10},${height/2 + 15 + ripple1}
          C${width/2 - 18},${height/2 + 18 + ripple2} ${width/2 - 25},${height/2 + 15 + ripple3} ${width/2 - 22},${height/2 + 3 + ripple1}
          Z
        `,
        fill: phaseColors.liquidLight,
        opacity: 0.3 + ripple1 * 0.1
      };
    }
    return { opacity: 0 };
  });

  const iceCrystalDetailsProps = useAnimatedProps(() => {
    if (phase !== 'solid') return { opacity: 0 };

    const shine = Math.sin(shineProgress.value * Math.PI * 2) * 0.1;
    
    // Inner crystal pattern - wider
    const innerPattern = `
      M${width/2},${height/2 - 12}
      L${width/2 + 18},${height/2 - 6}
      L${width/2 + 18},${height/2 + 6}
      L${width/2},${height/2 + 12}
      L${width/2 - 18},${height/2 + 6}
      L${width/2 - 18},${height/2 - 6}
      Z
    `;

    // Crystal highlights - wider
    const highlights = `
      M${width/2 - 10},${height/2 - 12}
      L${width/2 - 4},${height/2 - 8}
      L${width/2 + 4},${height/2 - 8}
      L${width/2 + 10},${height/2 - 12}
    `;

    // Crystal facets - wider
    const facets = `
      M${width/2},${height/2 - 20}
      L${width/2 + 30},${height/2 - 10}
      L${width/2 + 22},${height/2 - 7}
      L${width/2},${height/2 - 15}
      Z
      M${width/2 + 30},${height/2 - 10}
      L${width/2 + 30},${height/2 + 10}
      L${width/2 + 22},${height/2 + 7}
      L${width/2 + 22},${height/2 - 7}
      Z
      M${width/2 + 30},${height/2 + 10}
      L${width/2},${height/2 + 20}
      L${width/2},${height/2 + 15}
      L${width/2 + 22},${height/2 + 7}
      Z
      M${width/2},${height/2 + 20}
      L${width/2 - 30},${height/2 + 10}
      L${width/2 - 22},${height/2 + 7}
      L${width/2},${height/2 + 15}
      Z
      M${width/2 - 30},${height/2 + 10}
      L${width/2 - 30},${height/2 - 10}
      L${width/2 - 22},${height/2 - 7}
      L${width/2 - 22},${height/2 + 7}
      Z
      M${width/2 - 30},${height/2 - 10}
      L${width/2},${height/2 - 20}
      L${width/2},${height/2 - 15}
      L${width/2 - 22},${height/2 - 7}
      Z
    `;

    return {
      d: `${innerPattern} ${highlights} ${facets}`,
      fill: phaseColors.solidLight,
      opacity: 0.4 + shine
    };
  });

  const steamProps = steamParticles.map((particle, index) => {
    return useAnimatedProps(() => {
      if (phase !== 'gas') return { opacity: 0 };
      
      const angle = (index * Math.PI * 2) / 5;
      const radius = 15;
      const x = Math.cos(angle) * radius;
      
      return {
        cx: width/2 + x + particle.x.value,
        cy: height/2 + particle.y.value,
        r: 2.5 * particle.scale.value,
        fill: phaseColors.gas,
        opacity: particle.opacity.value
      };
    });
  });

  const liquidDetailsProps = useAnimatedProps(() => {
    if (phase !== 'liquid') return { opacity: 0 };

    const ripple1 = Math.sin(rippleProgress.value * Math.PI * 2) * 1.5;
    const ripple2 = Math.sin(rippleProgress.value * Math.PI * 3) * 1;
    const ripple3 = Math.cos(rippleProgress.value * Math.PI * 2.5) * 0.8;
    
    // Multiple ripple patterns with varying sizes
    const ripplePattern = `
      M${width/2 - 18},${height/2 + 2 + ripple1}
      C${width/2 - 20},${height/2 - 4 + ripple2} ${width/2 - 15},${height/2 - 6 + ripple3} ${width/2 - 8},${height/2 - 4 + ripple1}
      C${width/2 - 4},${height/2 - 10 + ripple2} ${width/2 + 4},${height/2 - 10 + ripple3} ${width/2 + 8},${height/2 - 4 + ripple1}
      C${width/2 + 15},${height/2 - 6 + ripple2} ${width/2 + 20},${height/2 - 4 + ripple3} ${width/2 + 18},${height/2 + 2 + ripple1}
      C${width/2 + 20},${height/2 + 14 + ripple2} ${width/2 + 15},${height/2 + 16 + ripple3} ${width/2 + 8},${height/2 + 14 + ripple1}
      C${width/2 + 4},${height/2 + 20 + ripple2} ${width/2 - 4},${height/2 + 20 + ripple3} ${width/2 - 8},${height/2 + 14 + ripple1}
      C${width/2 - 15},${height/2 + 16 + ripple2} ${width/2 - 20},${height/2 + 14 + ripple3} ${width/2 - 18},${height/2 + 2 + ripple1}
      Z
    `;

    // Enhanced surface highlights with multiple layers
    const highlights = `
      M${width/2 - 15},${height/2 - 2 + ripple1}
      C${width/2 - 12},${height/2 - 6 + ripple2} ${width/2 - 6},${height/2 - 6 + ripple3} ${width/2 - 3},${height/2 - 2 + ripple1}
      C${width/2 + 3},${height/2 - 6 + ripple2} ${width/2 + 6},${height/2 - 6 + ripple3} ${width/2 + 15},${height/2 - 2 + ripple1}
      M${width/2 - 12},${height/2 + 8 + ripple2}
      C${width/2 - 10},${height/2 + 6 + ripple3} ${width/2 - 8},${height/2 + 6 + ripple1} ${width/2 - 6},${height/2 + 8 + ripple2}
      M${width/2 + 6},${height/2 + 8 + ripple3}
      C${width/2 + 8},${height/2 + 6 + ripple1} ${width/2 + 10},${height/2 + 6 + ripple2} ${width/2 + 12},${height/2 + 8 + ripple3}
    `;

    // Multiple small surface ripples with varying positions
    const smallRipples = `
      M${width/2 - 10},${height/2 + 5 + ripple1}
      C${width/2 - 8},${height/2 + 3 + ripple2} ${width/2 - 6},${height/2 + 3 + ripple3} ${width/2 - 4},${height/2 + 5 + ripple1}
      M${width/2 + 4},${height/2 + 5 + ripple2}
      C${width/2 + 6},${height/2 + 3 + ripple3} ${width/2 + 8},${height/2 + 3 + ripple1} ${width/2 + 10},${height/2 + 5 + ripple2}
      M${width/2 - 5},${height/2 - 3 + ripple3}
      C${width/2 - 3},${height/2 - 5 + ripple1} ${width/2 - 1},${height/2 - 5 + ripple2} ${width/2 + 1},${height/2 - 3 + ripple3}
    `;

    return {
      d: `${ripplePattern} ${highlights} ${smallRipples}`,
      fill: phaseColors.liquidLight,
      opacity: 0.4 + ripple1 * 0.1
    };
  });

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="iceGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={phaseColors.solidLight} stopOpacity="0.3" />
            <Stop offset="1" stopColor={phaseColors.solidDark} stopOpacity="0.3" />
          </LinearGradient>
          <LinearGradient id="waterGradient" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={phaseColors.liquidLight} stopOpacity="0.4" />
            <Stop offset="1" stopColor={phaseColors.liquidDark} stopOpacity="0.4" />
          </LinearGradient>
        </Defs>
        
        {/* Main shape */}
        <AnimatedPath
          animatedProps={mainShapeProps}
          stroke="#222"
          strokeWidth="1.5"
        />
        
        {/* Ice crystal details */}
        {phase === 'solid' && (
          <AnimatedPath
            animatedProps={iceCrystalDetailsProps}
            stroke="#222"
            strokeWidth="0.5"
          />
        )}
        
        {/* Surface details */}
        <AnimatedPath
          animatedProps={surfaceDetailsProps}
          stroke="#222"
          strokeWidth="0.5"
        />
        
        {/* Liquid details */}
        {phase === 'liquid' && (
          <AnimatedPath
            animatedProps={liquidDetailsProps}
            stroke="#222"
            strokeWidth="0.5"
          />
        )}
        
        {/* Steam particles */}
        {steamParticles.map((_, index) => (
          <AnimatedCircle
            key={index}
            animatedProps={steamProps[index]}
            stroke="#222"
            strokeWidth="0.5"
          />
        ))}
      </Svg>
    </View>
  );
} 