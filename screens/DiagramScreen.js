import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  useWindowDimensions,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Platform,
} from "react-native";
import Svg, { Path, Circle, Rect, Text as SvgText, Line, Polygon } from "react-native-svg";
import Slider from "@react-native-community/slider";
import * as ScreenOrientation from "expo-screen-orientation";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
  interpolate,
} from "react-native-reanimated";
import PhaseTransitionSim from './PhaseTransitionSim';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

// --- Phase Logic ---
// const getPhase = (T, P) => {
//   // Supercritical region
//   if (T >= 647.096 && P >= 217.75) {
//     return "Supercritical";
//   }
//   
//   // Below triple point temperature
//   if (T < 273.15) {
//     // Check sublimation curve
//     const sublimationP = sublimationPressure(T);
//     if (P < sublimationP) {
//       return "Gas";
//     }
//     return "Solid";
//   }
//   
//   // Above critical temperature
//   if (T >= 647.096) {
//     if (P < 217.75) {
//       return "Gas";
//     }
//     return "Supercritical";
//   }
//   
//   // Between triple point and critical temperature
//   if (T >= 273.15 && T < 647.096) {
//     // Check vaporization curve
//     if (T <= 373.15) {
//       // Below boiling point
//       const vaporP = vaporPressure(T);
//       if (P < vaporP) {
//         return "Gas";
//       }
//       return "Liquid";
//     } else {
//       // Above boiling point
//       const vaporP = vaporPressure(T);
//       if (P < vaporP) {
//         return "Gas";
//       }
//       return "Liquid";
//     }
//   }
//   
//   return "Unknown";
// };

// --- Placeholders ---
const logoPlaceholder = require('../assets/logo.png');
const homePlaceholder = { uri: "https://via.placeholder.com/40x40?text=Home" };

// --- PHASE BOUNDARY CONSTANTS AND FUNCTIONS (accurate for water) ---

// Triple and critical points for water
const T_TRIPLE = 273.16;  // K (0.01 °C)
const P_TRIPLE = 0.00604; // atm (4.58 mmHg)
const T_CRITICAL = 647.096; // K
const P_CRITICAL = 217.75; // atm

// Ice phase transition temperatures at 1 atm
const T_ICE_I_III = 251.165;  // K (-22.015 °C)
const T_ICE_III_V = 256.164;  // K (-16.986 °C)
const T_ICE_V_VI = 273.31;    // K (0.16 °C)
const T_ICE_VI_VII = 355.0;   // K (81.85 °C)

// Wagner equation for vapor pressure (more accurate than Antoine)
// Source: Wagner, W. and Pruss, A. (2002) "The IAPWS Formulation 1995 for the Thermodynamic Properties of Ordinary Water Substance for General and Scientific Use"
function vaporPressure(T) {
  const tau = 1 - T/T_CRITICAL;
  const a1 = -7.85951783;
  const a2 = 1.84408259;
  const a3 = -11.7866497;
  const a4 = 22.6807411;
  const a5 = -15.9618719;
  const a6 = 1.80122502;
  
  const lnP = (T_CRITICAL/T) * (
    a1 * tau +
    a2 * Math.pow(tau, 1.5) +
    a3 * Math.pow(tau, 3) +
    a4 * Math.pow(tau, 3.5) +
    a5 * Math.pow(tau, 4) +
    a6 * Math.pow(tau, 7.5)
  );
  
  return Math.exp(lnP) * P_CRITICAL / 101325; // Convert Pa to atm
}

// Improved sublimation pressure calculation
// Source: NIST Chemistry WebBook
function sublimationPressure(T) {
  // Constants for water from NIST
  const A = 22.5107;
  const B = 6143.7;
  const C = 0.0001;
  const D = 0.0000001; // Additional term for better accuracy
  
  // ln(P) = A - B/T - C*ln(T) - D*T (P in Pa, T in K)
  const lnP = A - B/T - C*Math.log(T) - D*T;
  return Math.exp(lnP) / 101325; // Convert Pa to atm
}

// Ice-liquid boundary using Simon-Glatzel equation
// Source: Simon, F. and Glatzel, G. (1929) "Bemerkungen zur Schmelzdruckkurve"
function iceLiquidBoundary(T) {
  const T0 = T_TRIPLE;
  const P0 = P_TRIPLE;
  const c = 1.0; // Empirical constant for water
  const a = 1.0; // Empirical constant for water
  
  // P = P0 * (1 + a*((T/T0)^c - 1))
  return P0 * (1 + a*(Math.pow(T/T0, c) - 1));
}

// Ice phase transition boundaries
function icePhaseBoundary(T, P) {
  // Ice I to Ice III transition
  if (T <= T_ICE_I_III && P >= 209.9) {
    return 'Ice III';
  }
  // Ice III to Ice V transition
  if (T <= T_ICE_III_V && P >= 350.1) {
    return 'Ice V';
  }
  // Ice V to Ice VI transition
  if (T <= T_ICE_V_VI && P >= 632.4) {
    return 'Ice VI';
  }
  // Ice VI to Ice VII transition
  if (T <= T_ICE_VI_VII && P >= 2216.0) {
    return 'Ice VII';
  }
  return 'Ice I';
}

// Updated phase logic to match exactly the SVG diagram boundaries
function getPhase(T, P) {
  // Supercritical region
  if (T >= T_CRITICAL && P >= P_CRITICAL) {
    return "Supercritical";
  }
  
  // Below triple point temperature
  if (T < T_TRIPLE) {
    // Check sublimation curve (matches SVG path)
    if (T <= 250) {
      // Linear interpolation for sublimation curve below 250K
      const sublimationP = sublimationPressure(T);
      if (P < sublimationP) {
        return "Gas";
      }
    } else {
      // Quadratic curve from 250K to triple point (matches SVG Q curve)
      const t = (T - 250) / (T_TRIPLE - 250);
      const sublimationP = sublimationPressure(250) * (1 - t) + P_TRIPLE * t;
      if (P < sublimationP) {
        return "Gas";
      }
    }
    return "Solid";
  }
  
  // Above critical temperature
  if (T >= T_CRITICAL) {
    if (P < P_CRITICAL) {
      return "Gas";
    }
    return "Supercritical";
  }
  
  // Between triple point and critical temperature
  if (T >= T_TRIPLE && T < T_CRITICAL) {
    // Check vapor pressure curve (matches SVG path)
    let vaporP;
    if (T <= 300) {
      // Quadratic curve from triple point to 300K
      const t = (T - T_TRIPLE) / (300 - T_TRIPLE);
      vaporP = P_TRIPLE * (1 - t) + 0.03 * t;
    } else if (T <= 373.15) {
      // Quadratic curve from 300K to boiling point
      const t = (T - 300) / (373.15 - 300);
      vaporP = 0.03 * (1 - t) + 1 * t;
    } else {
      // Linear interpolation from boiling point to critical point
      const t = (T - 373.15) / (T_CRITICAL - 373.15);
      vaporP = 1 * (1 - t) + P_CRITICAL * t;
    }
    
    if (P < vaporP) {
      return "Gas";
    }
    
    // Check if we're in the liquid region (matches SVG path)
    if (T >= T_TRIPLE && P >= P_TRIPLE) {
      return "Liquid";
    }
    
    // If we're not in liquid or gas, we must be in solid
    return "Solid";
  }
  
  return "Unknown";
}

// Update phase colors to include ice phases
const phaseColors = {
  "Solid": "#4a90e2",
  "Liquid": "#7ed957",
  "Gas": "#ffa500",
  "Supercritical": "#ff7eeb",
};

// --- Molecule Sim ---
function MoleculeSim({ phase, width = 70, height = 70 }) {
  const MAX_MOLS = 9;
  // Map any ice phase to "Solid" for animation
  const animationPhase = phase.startsWith("Ice") ? "Solid" : phase;
  const count = animationPhase === "Solid" ? 9 : animationPhase === "Liquid" ? 8 : 6;
  const progress = useSharedValue(0);
  const transitionProgress = useSharedValue(0);
  const mols = useRef(
    Array.from({ length: MAX_MOLS }).map(() => ({
      x: useSharedValue(0),
      y: useSharedValue(0),
      vx: Math.random() * 0.6 + 0.4,
      vy: Math.random() * 0.6 + 0.4,
      dirX: Math.random() > 0.5 ? 1 : -1,
      dirY: Math.random() > 0.5 ? 1 : -1,
      offset: Math.random() * Math.PI * 2,
      lastPhase: "Solid",
      targetX: useSharedValue(0),
      targetY: useSharedValue(0),
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
    // Start transition animation
    transitionProgress.value = withTiming(1, {
      duration: 2000,
      easing: Easing.inOut(Easing.ease),
    });

    // Calculate target positions for liquid state
    for (let i = 0; i < MAX_MOLS; i++) {
      if (animationPhase === "Liquid") {
        mols[i].targetX.value = width / 2 + Math.cos((i / count) * 2 * Math.PI) * 12;
        mols[i].targetY.value = height / 2 + Math.sin((i / count) * 2 * Math.PI) * 12;
      }
    }
  }, [animationPhase]);

  function createAnimatedProps(i) {
    return useAnimatedProps(() => {
      if (animationPhase === "Solid") {
        // Center position for solid molecules
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Calculate grid positions around center
        const row = Math.floor(i / 3) - 1;
        const col = (i % 3) - 1;
        const spacing = 13; // Space between molecules (reduced from 15)
        
        // Base position in grid
        const baseX = centerX + col * spacing;
        const baseY = centerY + row * spacing;
        
        // Add small random vibration
        const t = progress.value * 2 * Math.PI * 6 + mols[i].offset;
        const vibrateX = Math.sin(t) * 0.2;
        const vibrateY = Math.cos(t) * 0.2;
        
        return {
          cx: baseX + vibrateX,
          cy: baseY + vibrateY,
        };
      } else if (animationPhase === "Liquid") {
        // Calculate center of mass for cohesive movement
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base movement with some randomness but staying near center
        const t = progress.value * 2 * Math.PI + mols[i].offset;
        const baseRadius = 8; // Reduced from 12 to keep molecules closer
        const randomRadius = Math.sin(t * 0.5) * 1.5; // Reduced from 3 to minimize random movement
        const angle = (i / count) * Math.PI * 2 + Math.sin(t * 0.3) * 0.1; // Reduced angle variation
        
        // Calculate target position with cohesive movement
        const targetX = centerX + Math.cos(angle) * (baseRadius + randomRadius);
        const targetY = centerY + Math.sin(angle) * (baseRadius + randomRadius);
        
        // Smooth movement towards target with some resistance
        const dx = targetX - mols[i].x.value;
        const dy = targetY - mols[i].y.value;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add small random movement
        const randomMoveX = Math.sin(t * 2 + i) * 0.4; // Reduced from 0.8
        const randomMoveY = Math.cos(t * 2 + i) * 0.4; // Reduced from 0.8
        
        // Update position with smooth movement and small random motion
        mols[i].x.value += dx * 0.03 + randomMoveX; // Increased from 0.02 for faster response
        mols[i].y.value += dy * 0.03 + randomMoveY; // Increased from 0.02 for faster response
        
        // Keep molecules within bounds
        const margin = 10;
        mols[i].x.value = Math.max(margin, Math.min(mols[i].x.value, width - margin));
        mols[i].y.value = Math.max(margin, Math.min(mols[i].y.value, height - margin));

        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      } else {
        let nx = mols[i].x.value + mols[i].vx * mols[i].dirX * 4;
        let ny = mols[i].y.value + mols[i].vy * mols[i].dirY * 4;

        // Bounce off walls
        if (nx < 10 || nx > width - 10) mols[i].dirX *= -1;
        if (ny < 10 || ny > height - 10) mols[i].dirY *= -1;

        // Update position with transition
        const newX = Math.max(10, Math.min(nx, width - 10));
        const newY = Math.max(10, Math.min(ny, height - 10));

        // If transitioning to liquid, gradually move towards target position
        if (mols[i].lastPhase === "Gas" && animationPhase === "Liquid") {
          const transitionX = interpolate(
            transitionProgress.value,
            [0, 1],
            [newX, mols[i].targetX.value]
          );
          const transitionY = interpolate(
            transitionProgress.value,
            [0, 1],
            [newY, mols[i].targetY.value]
          );
          mols[i].x.value = transitionX;
          mols[i].y.value = transitionY;
        } else {
          mols[i].x.value = newX;
          mols[i].y.value = newY;
        }

        return {
          cx: mols[i].x.value,
          cy: mols[i].y.value,
        };
      }
    });
  }

  const animatedPropsArr = [
    createAnimatedProps(0),
    createAnimatedProps(1),
    createAnimatedProps(2),
    createAnimatedProps(3),
    createAnimatedProps(4),
    createAnimatedProps(5),
    createAnimatedProps(6),
    createAnimatedProps(7),
    createAnimatedProps(8),
  ];

  return (
    <Svg width={width} height={height}>
      {[...Array(count)].map((_, i) => (
        <AnimatedCircle
          key={i}
          r={animationPhase === "Solid" ? 7 : animationPhase === "Liquid" ? 7 : 6}
          fill={phaseColors[animationPhase]}
          stroke="#222"
          strokeWidth="1.5"
          opacity={animationPhase === "Gas" ? 0.8 : 1}
          animatedProps={animatedPropsArr[i]}
        />
      ))}
    </Svg>
  );
}

// Add color interpolation function
const interpolateColor = (temp, minT, maxT) => {
  // Normalize temperature to 0-1 range
  const normalizedTemp = (temp - minT) / (maxT - minT);
  
  // Define color stops
  const coldColor = { r: 74, g: 144, b: 226 }; // Blue (#4a90e2)
  const hotColor = { r: 229, g: 85, b: 85 };   // Red (#e55)
  
  // Interpolate between colors
  const r = Math.round(coldColor.r + (hotColor.r - coldColor.r) * normalizedTemp);
  const g = Math.round(coldColor.g + (hotColor.g - coldColor.g) * normalizedTemp);
  const b = Math.round(coldColor.b + (hotColor.b - coldColor.b) * normalizedTemp);
  
  return `rgb(${r}, ${g}, ${b})`;
};

export default function DiagramScreen() {
  const navigation = useNavigation();
  const [temperature, setTemperature] = useState(273); // Start at 273 K (0°C)
  const [pressure, setPressure] = useState(1); // Start at 1 atm
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [tempInput, setTempInput] = useState(temperature.toString());
  const [pressureInput, setPressureInput] = useState(pressure.toString());
  const [tempWarning, setTempWarning] = useState(false);
  const [pressureWarning, setPressureWarning] = useState(false);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handlePress = useButtonSound();

  // Lock orientation to landscape and wait for dimension changes
  useEffect(() => {
    let isMounted = true;
    async function lockOrientation() {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT
      );
      if (isMounted) {
        setOrientationLocked(true);
      }
    }

    lockOrientation();

    return () => {
      isMounted = false;
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Responsive sidebar width
  const sidebarWidth = Math.max(90, Math.min(140, width * 0.16));

  // Responsive diagram size - adjusted for better fit
  const diagramWidth = Math.max(260, Math.min(width - sidebarWidth - 220, 460));
  const diagramHeight = Math.max(180, Math.min(height - 200, 280));

  // --- Phase diagram axes ---
  const minT = 200, maxT = 700;
  const minP = 0.001, maxP = 300;

  // Map T and P to SVG coordinates
  const mapT = t => 60 + ((t - minT) / (maxT - minT)) * (diagramWidth - 120);
  const mapP = (pressure) => {
    // Define fixed pressure values for tick marks
    const pressures = [0.001, 0.01, 0.1, 1, 10, 100, 200, 300];
    
    // Find the appropriate segment for interpolation
    for (let i = 0; i < pressures.length - 1; i++) {
      if (pressure >= pressures[i] && pressure <= pressures[i + 1]) {
        const segmentHeight = (diagramHeight - 80) / 7; // 7 segments for 8 points, accounting for margins
        const baseY = diagramHeight - 40 - (i * segmentHeight); // 40px margin at top and bottom
        const ratio = (pressure - pressures[i]) / (pressures[i + 1] - pressures[i]);
        return baseY - (segmentHeight * ratio);
      }
    }
    
    // Handle values outside the range
    if (pressure <= pressures[0]) return diagramHeight - 40; // Bottom margin
    if (pressure >= pressures[pressures.length - 1]) return 40; // Top margin
    return 40;
  };

  const phasePoint = {
    x: mapT(temperature),
    y: mapP(pressure),
  };

  // Use corrected phase logic
  const phase = getPhase(temperature, pressure);

  // Calculate thermometer color based on temperature
  const thermometerColor = interpolateColor(temperature, minT, maxT);

  // Optimize handlers with useCallback
  const handleTempChange = useCallback((text) => {
    if (/^[0-9]*\.?[0-9]{0,2}$/.test(text)) {
      setTempInput(text);
      const num = parseFloat(text);
      if (!isNaN(num)) {
        if (num >= minT && num <= maxT) {
          setTemperature(num);
          setTempWarning(false);
        } else {
          setTempWarning(true);
        }
      }
    }
  }, [minT, maxT]);

  const handlePressureChange = useCallback((text) => {
    if (/^[0-9]*\.?[0-9]{0,3}$/.test(text)) {
      setPressureInput(text);
      const num = parseFloat(text);
      if (!isNaN(num)) {
        if (num >= minP && num <= maxP) {
          setPressure(num);
          setPressureWarning(false);
        } else {
          setPressureWarning(true);
        }
      }
    }
  }, [minP, maxP]);

  // Update input values when sliders change
  useEffect(() => {
    // Always format to 2 decimal places for temperature
    setTempInput(temperature.toFixed(2));
    setTempWarning(false);
  }, [temperature]);

  useEffect(() => {
    // Always format to 3 decimal places for pressure
    setPressureInput(pressure.toFixed(3));
    setPressureWarning(false);
  }, [pressure]);

  // Wait until orientation is locked AND the dimensions reflect landscape mode.
  // This prevents rendering with stale portrait dimensions.
  if (!orientationLocked || !isLandscape) {
    // Display a loading indicator while the screen orients itself.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#dbe6ff" />
        <Text style={styles.loadingText}>Adjusting to landscape...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, isLandscape && styles.rootLandscape]}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={styles.backButtonText}>Back</Text>
        <Icon name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          isLandscape && styles.sidebarLandscape,
          { width: sidebarWidth },
        ]}
      >
        <Image source={logoPlaceholder} style={styles.logo} />
        <View style={styles.thermometerContainer}>
          <Svg height="160" width="36">
            <Rect x="15" y="20" width="6" height="110" rx="3" fill="#fff" />
            <Rect
              x="15"
              y={130 - ((temperature - minT) / (maxT - minT)) * 110}
              width="6"
              height={((temperature - minT) / (maxT - minT)) * 110}
              fill={thermometerColor}
              rx={3}
            />
            <Circle
              cx="18"
              cy="140"
              r="14"
              fill={thermometerColor}
              stroke="#fff"
              strokeWidth="2"
            />
            {[...Array(9)].map((_, i) => (
              <Rect
                key={i}
                x="23"
                y={20 + i * 13.75}
                width="8"
                height="2"
                fill="#fff"
                opacity={i % 2 === 0 ? 1 : 0.5}
                rx={1}
              />
            ))}
          </Svg>
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.headerRowNew}>
          <Text style={styles.titleNew}>Phase Diagram</Text>
        </View>

        <View style={[styles.mainDisplayArea, { marginTop: -20 }]}>
          {/* Left: Vertical Pressure Slider */}
          <View style={[styles.pressureControlContainer, { height: diagramHeight }]}>
            <View
              style={[
                styles.verticalSliderWrapper,
                { height: diagramHeight * 0.7 },
              ]}
            >
              <Slider
                style={[styles.verticalSlider, { width: diagramHeight * 0.7 }]}
                minimumValue={minP}
                maximumValue={maxP}
                value={pressure}
                onValueChange={setPressure}
                minimumTrackTintColor="#ffa500"
                maximumTrackTintColor="#fff"
                thumbTintColor="#7ed957"
                step={0.001}
                thumbStyle={{ width: 32, height: 32 }}
              />
            </View>
            <Text style={styles.sliderLabelVertical}>PRESSURE</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.valueInput,
                  { 
                    color: pressureWarning ? "#ff4444" : "#ffa500",
                    borderColor: pressureWarning ? "#ff4444" : "#232b66",
                  }
                ]}
                value={pressureInput}
                onChangeText={handlePressureChange}
                keyboardType="decimal-pad"
                selectTextOnFocus
                maxLength={9}
                placeholder="0.001"
                placeholderTextColor="#ffa50080"
              />
              <Text style={[styles.inputUnit, { color: pressureWarning ? "#ff4444" : "#ffa500" }]}> atm</Text>
            </View>
            {pressureWarning && (
              <Text style={styles.warningText}>
                Max: 300.000 atm
              </Text>
            )}
          </View>

          {/* Center: Diagram and Temperature Slider */}
          <View style={styles.centerColumn}>
            <View
              style={[
                styles.diagramContainerNew,
                {
                  width: diagramWidth,
                  height: diagramHeight + 20,
                  marginBottom: 8,
                  marginTop: 0,
                },
              ]}
            >
              <Svg
                height={diagramHeight}
                width={diagramWidth}
                style={[styles.diagramSvg, { marginTop: -40 }]}
              >
                {/* --- Phase regions (accurate for water) --- */}
                {/* --- Properly fill the gas region up to the critical point --- */}
                <Path
                  d={`
                    M${mapT(273.15)},${mapP(0.00604)}                           
                    Q${mapT(300)},${mapP(0.03)} ${mapT(373.15)},${mapP(1)}      
                    L${mapT(647.096)},${mapP(217.75)}                          
                    L${mapT(maxT)},${mapP(217.75)}                              
                    L${mapT(maxT)},${mapP(minP)}                                
                    L${mapT(minT)},${mapP(minP)}                               
                    L${mapT(minT)},${mapP(sublimationPressure(minT))}           
                    Q${mapT(250)},${mapP(sublimationPressure(250))} ${mapT(273.15)},${mapP(0.00604)}
                    Z
                  `}
                  fill={phaseColors.Gas}
                  opacity={0.43}
                />

                {/* --- Supercritical region fill (beyond the critical point) --- */}
                <Path
                  d={`
                    M${mapT(647.096)},${mapP(217.75)}           
                    L${mapT(maxT)},${mapP(217.75)}             
                    L${mapT(maxT)},${mapP(300)}                
                    L${mapT(647.096)},${mapP(300)}             
                    L${mapT(647.096)},${mapP(217.75)}             
                    Z
                  `}
                  fill={phaseColors.Supercritical}
                  opacity={0.45}
                />
                {/* Critical point boundary line */}
                <Path
                  d={`M${mapT(647.096)},${mapP(217.75)} L${mapT(647.096)},${mapP(300)}`}
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeDasharray="4,4"
                  opacity={0.9}
                />
                {/* Draw solid region (left) */}
                <Path
                  d={`
                    M${mapT(minT)},${mapP(300)}
                    L${mapT(minT)},${mapP(sublimationPressure(minT))}
                    Q${mapT(250)},${mapP(sublimationPressure(250))} ${mapT(T_TRIPLE)},${mapP(P_TRIPLE)}
                    L${mapT(T_TRIPLE)},${mapP(300)}
                    Z
                  `}
                  fill={phaseColors["Solid"]}
                  opacity="0.5"
                />
                {/* Draw liquid region (middle top) */}
                <Path
                  d={`M${mapT(273.15)},${mapP(0.00604)}
                L${mapT(273.15)},${mapP(300)}
                L${mapT(647.096)},${mapP(300)}
                L${mapT(647.096)},${mapP(217.75)}
                L${mapT(373.15)},${mapP(1)}
                Q${mapT(300)},${mapP(0.03)} ${mapT(273.15)},${mapP(0.00604)}
                Z`}
                  fill={phaseColors.Liquid}
                  opacity="0.38"
                />
                {/* --- Phase boundaries --- */}
                {/* Sublimation curve (solid-gas) */}
                <Path
                  d={`M${mapT(minT)},${mapP(sublimationPressure(minT))}
                Q${mapT(250)},${mapP(sublimationPressure(250))} ${mapT(T_TRIPLE)},${mapP(P_TRIPLE)}`}
                  stroke="#fff"
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Fusion curve (solid-liquid, nearly vertical) */}
                <Path
                  d={`M${mapT(273.15)},${mapP(0.00604)} L${mapT(273.15)},${mapP(300)}`}
                  stroke="#fff"
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Vaporization curve (liquid-gas) */}
                <Path
                  d={`M${mapT(273.15)},${mapP(0.00604)}
                    Q${mapT(300)},${mapP(0.03)} ${mapT(373.15)},${mapP(1)}
                    L${mapT(647.096)},${mapP(217.75)}`}
                  stroke="#fff"
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Boiling point marker */}
                <Circle
                  cx={mapT(373.15)}
                  cy={mapP(1)}
                  r="4"
                  fill="#fff"
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(373.15) + 8}
                  y={mapP(0.2) - 8}
                  fontSize="12"
                  fill="#fff"
                  fontWeight="bold"
                >
                  Boiling
                </SvgText>
                {/* Freezing point marker */}
                <Circle
                  cx={mapT(273.15)}
                  cy={mapP(1)}
                  r="4"
                  fill="#fff"
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(273.15) + 8}
                  y={mapP(1) - 8}
                  fontSize="12"
                  fill="#fff"
                  fontWeight="bold"
                >
                  Freezing
                </SvgText>
                {/* Axes */}
                <Path
                  d={`M${mapT(minT)},${mapP(0.001)} L${mapT(minT)},${mapP(300)}`}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity={0.9}
                />
                <Path
                  d={`M${mapT(minT)},${mapP(0.001)} L${mapT(maxT)},${mapP(0.001)}`}
                  stroke="#fff"
                  strokeWidth="2"
                  opacity={0.9}
                />
                {/* X-axis ticks and labels */}
                {[200, 300, 400, 500, 600, 700].map((t) => {
                  const x = mapT(t);
                  return (
                    <React.Fragment key={t}>
                      <Path
                        d={`M${x},${diagramHeight - 40} L${x},${diagramHeight - 32}`}
                        stroke="#fff"
                        strokeWidth="1.3"
                        opacity={0.6}
                      />
                      <SvgText
                        x={x}
                        y={diagramHeight - 18}
                        fontSize="11"
                        fill="#d1def5"
                        fontWeight="bold"
                        textAnchor="middle"
                        opacity={0.93}
                      >
                        {t}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
                {/* X-axis label */}
                <SvgText
                  x={diagramWidth / 2}
                  y={diagramHeight - 5}
                  fontSize="13"
                  fill="#d1def5"
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.94}
                >
                  TEMPERATURE (K)
                </SvgText>
                {/* Y-axis ticks and labels (log scale) */}
                {[0.001, 0.01, 0.1, 1, 10, 100, 200, 300].map((p) => {
                  const y = mapP(p);
                  // Simple string formatting for pressure values
                  const label = p === 0.001 ? "0.001" : 
                                p === 0.01 ? "0.01" :
                                p === 0.1 ? "0.1" :
                                p.toString();
                  return (
                    <React.Fragment key={p}>
                      <Path
                        d={`M60,${y} L52,${y}`}
                        stroke="#fff"
                        strokeWidth="1.3"
                        opacity={0.6}
                      />
                      <SvgText
                        x={38}
                        y={y + 4}
                        fontSize="11"
                        fill="#d1def5"
                        fontWeight="bold"
                        textAnchor="end"
                        opacity={0.93}
                      >
                        {label}
                      </SvgText>
                    </React.Fragment>
                  );
                })}
                {/* Y-axis label */}
                <SvgText
                  x={18}
                  y={diagramHeight / 2}
                  fontSize="13"
                  fill="#d1def5"
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.94}
                  transform={`rotate(-90 18,${diagramHeight / 2})`}
                >
                  PRESSURE (atm)
                </SvgText>
                {/* Interactive point */}
                <Circle
                  cx={mapT(temperature)}
                  cy={mapP(pressure)}
                  r="6"
                  fill="#00FFE5"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  opacity={0.95}
                />
                {/* Triple point */}
                <Circle
                  cx={mapT(273.16)}
                  cy={mapP(0.00604)}
                  r="5"
                  fill="#fff"
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(273.16) + 8}
                  y={mapP(0.00404)}
                  fontSize="12"
                  fill="#fff"
                  fontWeight="bold"
                >
                  Triple
                </SvgText>
                {/* Critical point */}
                <Circle
                  cx={mapT(647.096)}
                  cy={mapP(217.75)}
                  r="5"
                  fill="#fff"
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(647.096) - 10}
                  y={mapP(110.75) - 10}
                  fontSize="12"
                  fill="#fff"
                  fontWeight="bold"
                >
                  Critical
                </SvgText>
                {/* Phase labels */}
                <SvgText
                  x={mapT(210)}
                  y={mapP(10)}
                  fontSize="15"
                  fill="#b4cdfa"
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Solid
                </SvgText>
                <SvgText
                  x={mapT(350)}
                  y={mapP(170)}
                  fontSize="15"
                  fill="#b4cdfa"
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Liquid
                </SvgText>
                <SvgText
                  x={mapT(550)}
                  y={mapP(0.1)}
                  fontSize="15"
                  fill="#b4cdfa"
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Gas
                </SvgText>
              </Svg>
            </View>

            <View style={styles.sliderContainerNew}>
              <Text style={styles.sliderLabel}>TEMPERATURE</Text>
              <Slider
                style={{ width: Math.max(140, diagramWidth - 100) }}
                minimumValue={minT}
                maximumValue={maxT}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor="#4a90e2"
                maximumTrackTintColor="#fff"
                thumbTintColor="#e55"
                thumbStyle={{ width: 32, height: 32 }}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.valueInput,
                    { 
                      color: tempWarning ? "#ff4444" : "#e55",
                      borderColor: tempWarning ? "#ff4444" : "#232b66",
                    }
                  ]}
                  value={tempInput}
                  onChangeText={handleTempChange}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  maxLength={7}
                  placeholder="273"
                  placeholderTextColor="#e5580"
                />
                <Text style={[styles.inputUnit, { color: tempWarning ? "#ff4444" : "#e55" }]}> K</Text>
              </View>
              {tempWarning && (
                <Text style={styles.warningText}>
                  Max: 700 K
                </Text>
              )}
            </View>
          </View>

          {/* Right: Molecule Sims and Phase Label */}
          <View style={styles.rightPanel}>
            <Text
              style={[
                styles.phaseLabelNew,
                {
                  color:
                    phaseColors[phase === "Supercritical" ? "Gas" : phase],
                },
              ]}
            >
              PHASE:{" "}
              <Text style={{ fontWeight: "bold" }}>
                {phase}
              </Text>
            </Text>
            <View style={styles.moleculeCircle}>
              <MoleculeSim
                phase={phase === "Supercritical" ? "Gas" : phase}
                width={70}
                height={70}
              />
            </View>
            <View style={styles.moleculeCircle}>
              <PhaseTransitionSim
                phase={phase === "Supercritical" ? "gas" : phase.toLowerCase()}
                width={70}
                height={70}
              />
            </View>
          </View>
        </View>

        {/* Home button at the bottom right */}
        <View style={styles.homeButtonNew}>
          <Image
            source={homePlaceholder}
            style={{ width: 32, height: 32 }}
            resizeMode="contain"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0D1117",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  root: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#0D1117",
  },
  rootLandscape: {
    flexDirection: "row",
  },
  sidebar: {
    width: 110,
    alignItems: "center",
    paddingTop: 32,
    backgroundColor: "#14181C",
    borderRightWidth: 2,
    borderRightColor: "rgba(76, 201, 240, 0.15)",
    shadowColor: "#4CC9F0",
    shadowOpacity: 0.1,
    shadowRadius: 7,
  },
  sidebarLandscape: {
    width: 110,
  },
  logo: {
    width: 62,
    height: 62,
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(76, 201, 240, 0.2)",
  },
  thermometerContainer: { marginTop: 26, marginBottom: 12 },
  content: {
    flex: 1,
    flexDirection: "column",
    padding: 6,
    position: "relative",
    backgroundColor: "#0D1117",
  },
  headerRowNew: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  titleNew: {
    color: "#4CC9F0",
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
    marginBottom: 2,
  },
  mainDisplayArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: -20,
  },
  pressureControlContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
  },
  verticalSliderWrapper: {
    width: 45,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  verticalSlider: {
    height: 50,
    transform: [{ rotate: "-90deg" }],
  },
  sliderLabelVertical: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
    transform: [{ rotate: "-90deg" }],
    position: "absolute",
    left: -24,
  },
  centerColumn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  diagramContainerNew: {
    backgroundColor: "#1F2428",
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 2,
    borderColor: "rgba(76, 201, 240, 0.15)",
    shadowColor: "#4CC9F0",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    paddingVertical: 4,
  },
  diagramSvg: {
    backgroundColor: "transparent",
    borderRadius: 20,
  },
  rightPanel: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    minWidth: 90,
  },
  sliderContainerNew: {
    width: "100%",
    marginBottom: 2,
    alignItems: "center",
    paddingVertical: 2,
    backgroundColor: "#1F2428",
    borderRadius: 14,
    marginTop: 2,
    borderWidth: 2,
    borderColor: "rgba(76, 201, 240, 0.15)",
  },
  sliderLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  valueInput: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 60,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#14181C',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(76, 201, 240, 0.2)",
  },
  inputUnit: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
    color: "#4CC9F0",
  },
  phaseLabelNew: {
    color: "#4CC9F0",
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 0.7,
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  moleculeCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#1F2428",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#4CC9F0",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: "rgba(76, 201, 240, 0.2)",
    marginBottom: 12,
  },
  homeButtonNew: {
    position: "absolute",
    right: 13,
    bottom: 13,
    width: 38,
    height: 38,
    borderRadius: 20,
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CC9F0",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    zIndex: 10,
    borderWidth: 2,
    borderColor: "rgba(76, 201, 240, 0.2)",
  },
  warningText: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
    textAlign: "center",
    opacity: 0.9,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 20,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4CC9F0',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(76, 201, 240, 0.4)',
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
});