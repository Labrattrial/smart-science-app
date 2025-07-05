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
  LayoutAnimation,
  Dimensions,
  ScrollView,
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
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import TwoPhaseMoleculeSimulator from '../components/TwoPhaseMoleculeSimulator';


// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Temperature conversion helper
const kelvinToCelsius = (kelvin) => kelvin - 273.15;
const celsiusToKelvin = (celsius) => celsius + 273.15;

// Responsive values - comprehensive and dynamic
const fontTitle = clamp(20, SCREEN_WIDTH * 0.06, 28);
const fontSubtitle = clamp(12, SCREEN_WIDTH * 0.035, 16);
const fontPhase = clamp(14, SCREEN_WIDTH * 0.04, 19);
const fontSlider = clamp(11, SCREEN_WIDTH * 0.025, 14);
const fontInput = clamp(11, SCREEN_WIDTH * 0.030, 15);
const fontPhaseLabel = clamp(16, SCREEN_WIDTH * 0.045, 22);
const fontPhaseValue = clamp(16, SCREEN_WIDTH * 0.045, 22);
const fontWarning = clamp(10, SCREEN_WIDTH * 0.025, 14);
const fontLinkLabel = clamp(12, SCREEN_WIDTH * 0.035, 16);
const fontBackButton = clamp(14, SCREEN_WIDTH * 0.04, 18);
const fontHelpButton = clamp(20, SCREEN_WIDTH * 0.045, 26);

// Component sizes
const moleculeSize = clamp(60, SCREEN_WIDTH * 0.15, 80);
const inputWidth = clamp(80, SCREEN_WIDTH * 0.18, 140);
const inputHeight = clamp(24, SCREEN_HEIGHT * 0.03, 36);
const logoSize = clamp(50, SCREEN_WIDTH * 0.10, 70);
const thermometerHeight = clamp(130, SCREEN_HEIGHT * 0.12, 180);
const thermometerWidth = clamp(60, SCREEN_WIDTH * 0.08, 60);
const helpButtonSize = clamp(40, SCREEN_WIDTH * 0.06, 48);
const linkButtonSize = clamp(40, SCREEN_WIDTH * 0.06, 48);
const backButtonSize = clamp(32, SCREEN_WIDTH * 0.08, 48);

// Spacing and margins
const mainPadding = clamp(4, SCREEN_WIDTH * 0.01, 8);
const centerPadding = clamp(6, SCREEN_WIDTH * 0.015, 12);
const rightPanelPadding = clamp(4, SCREEN_WIDTH * 0.01, 8);
const diagramMargin = clamp(2, SCREEN_HEIGHT * 0.05, 10);
const sidebarPadding = clamp(20, SCREEN_HEIGHT * 0.02, 40);
const contentPadding = clamp(4, SCREEN_WIDTH * 0.01, 8);
const headerMargin = clamp(4, SCREEN_HEIGHT * 0.005, 8);
const sliderMargin = clamp(6, SCREEN_HEIGHT * 0.008, 12);
const inputMargin = clamp(3, SCREEN_HEIGHT * 0.004, 6);
const phaseMargin = clamp(8, SCREEN_HEIGHT * 0.01, 16);
const moleculeMargin = clamp(8, SCREEN_HEIGHT * 0.01, 16);

// Border radius and shadows
const borderRadius = clamp(8, SCREEN_WIDTH * 0.02, 20);
const shadowRadius = clamp(3, SCREEN_WIDTH * 0.015, 8);
const elevation = clamp(3, SCREEN_WIDTH * 0.01, 8);

// Position values
const backButtonTop = Platform.OS === 'ios' ? clamp(30, SCREEN_HEIGHT * 0.04, 60) : clamp(15, SCREEN_HEIGHT * 0.02, 30);
const backButtonRight = clamp(15, SCREEN_WIDTH * 0.04, 25);
const sidebarWidth = clamp(120, SCREEN_WIDTH * 0.15, 200);
const diagramMaxWidth = clamp(800, SCREEN_WIDTH * 0.25, 400);
const diagramMaxHeight = clamp(200, SCREEN_HEIGHT * 0.50, 300);
const rightPanelMinWidth = clamp(80, SCREEN_WIDTH * 0.08, 120);

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

// Triple and critical points for water (IAPWS standard)
const T_TRIPLE = 273.16;  // K (0.01 °C)
const P_TRIPLE = 0.006117; // atm (4.58 mmHg) - corrected to match fusion curve
const T_CRITICAL = 647.15; // K (374.0 °C) - updated to match boundary points
const P_CRITICAL = 218.0; // atm - corrected to match vapor pressure data

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
// Source: NIST Chemistry WebBook and IAPWS standards
function sublimationPressure(T) {
  // For temperatures below triple point, use accurate sublimation data
  if (T < T_TRIPLE) {
    // Constants for water from NIST (more accurate)
    const A = 22.5107;
    const B = 6143.7;
    const C = 0.0001;
    const D = 0.0000001; // Additional term for better accuracy
    
    // ln(P) = A - B/T - C*ln(T) - D*T (P in Pa, T in K)
    const lnP = A - B/T - C*Math.log(T) - D*T;
    return Math.exp(lnP) / 101325; // Convert Pa to atm
  }
  
  // At triple point, return triple point pressure
  if (Math.abs(T - T_TRIPLE) < 0.01) {
    return P_TRIPLE;
  }
  
  // For temperatures above triple point, this shouldn't be called
  // but return a very small value as fallback
  return 0.000001;
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

// Improved vapor pressure calculation using exact data points
function accurateVaporPressure(T) {
  // Use the exact data points for accurate vapor pressure
  const vaporPressureData = [
    { T: 273.0, P: 0.005911 }, { T: 274.0, P: 0.006359 }, { T: 275.0, P: 0.006835 },
    { T: 276.0, P: 0.007343 }, { T: 277.0, P: 0.007884 }, { T: 278.0, P: 0.00846 },
    { T: 279.0, P: 0.009072 }, { T: 280.0, P: 0.009723 }, { T: 281.0, P: 0.010415 },
    { T: 282.0, P: 0.01115 }, { T: 283.0, P: 0.01193 }, { T: 284.0, P: 0.012757 },
    { T: 285.0, P: 0.013635 }, { T: 286.0, P: 0.014565 }, { T: 287.0, P: 0.01555 },
    { T: 288.0, P: 0.016592 }, { T: 289.0, P: 0.017696 }, { T: 290.0, P: 0.018863 },
    { T: 291.0, P: 0.020097 }, { T: 292.0, P: 0.021401 }, { T: 293.0, P: 0.022778 },
    { T: 294.0, P: 0.024232 }, { T: 295.0, P: 0.025766 }, { T: 296.0, P: 0.027384 },
    { T: 297.0, P: 0.029091 }, { T: 298.0, P: 0.030888 }, { T: 299.0, P: 0.032782 },
    { T: 300.0, P: 0.034776 }, { T: 301.0, P: 0.036875 }, { T: 302.0, P: 0.039083 },
    { T: 303.0, P: 0.041405 }, { T: 304.0, P: 0.043846 }, { T: 305.0, P: 0.04641 },
    { T: 306.0, P: 0.049103 }, { T: 307.0, P: 0.051931 }, { T: 308.0, P: 0.054899 },
    { T: 309.0, P: 0.058013 }, { T: 310.0, P: 0.061278 }, { T: 311.0, P: 0.0647 },
    { T: 312.0, P: 0.068287 }, { T: 313.0, P: 0.072044 }, { T: 314.0, P: 0.075977 },
    { T: 315.0, P: 0.080095 }, { T: 316.0, P: 0.084404 }, { T: 317.0, P: 0.088911 },
    { T: 318.0, P: 0.093623 }, { T: 319.0, P: 0.098549 }, { T: 320.0, P: 0.103696 },
    { T: 321.0, P: 0.109072 }, { T: 322.0, P: 0.114686 }, { T: 323.0, P: 0.120546 },
    { T: 324.0, P: 0.126662 }, { T: 325.0, P: 0.133041 }, { T: 326.0, P: 0.139694 },
    { T: 327.0, P: 0.146629 }, { T: 328.0, P: 0.153857 }, { T: 329.0, P: 0.161388 },
    { T: 330.0, P: 0.169231 }, { T: 331.0, P: 0.177398 }, { T: 332.0, P: 0.185899 },
    { T: 333.0, P: 0.194746 }, { T: 334.0, P: 0.203949 }, { T: 335.0, P: 0.21352 },
    { T: 336.0, P: 0.22347 }, { T: 337.0, P: 0.233813 }, { T: 338.0, P: 0.244561 },
    { T: 339.0, P: 0.255726 }, { T: 340.0, P: 0.26732 }, { T: 341.0, P: 0.279359 },
    { T: 342.0, P: 0.291854 }, { T: 343.0, P: 0.304821 }, { T: 344.0, P: 0.318272 },
    { T: 345.0, P: 0.332223 }, { T: 346.0, P: 0.346688 }, { T: 347.0, P: 0.361683 },
    { T: 348.0, P: 0.377223 }, { T: 349.0, P: 0.393324 }, { T: 350.0, P: 0.410001 },
    { T: 351.0, P: 0.427271 }, { T: 352.0, P: 0.445152 }, { T: 353.0, P: 0.463659 },
    { T: 354.0, P: 0.48281 }, { T: 355.0, P: 0.502623 }, { T: 356.0, P: 0.523117 },
    { T: 357.0, P: 0.544308 }, { T: 358.0, P: 0.566217 }, { T: 359.0, P: 0.588862 },
    { T: 360.0, P: 0.612263 }, { T: 361.0, P: 0.63644 }, { T: 362.0, P: 0.661412 },
    { T: 363.0, P: 0.6872 }, { T: 364.0, P: 0.713825 }, { T: 365.0, P: 0.741309 },
    { T: 366.0, P: 0.769673 }, { T: 367.0, P: 0.798938 }, { T: 368.0, P: 0.829128 },
    { T: 369.0, P: 0.860265 }, { T: 370.0, P: 0.892371 }, { T: 371.0, P: 0.925472 },
    { T: 372.0, P: 0.959589 }, { T: 373.0, P: 0.994748 }, { T: 374.0, P: 1.030974 },
    { T: 375.0, P: 1.068291 }, { T: 376.0, P: 1.106724 }, { T: 377.0, P: 1.1463 },
    { T: 378.0, P: 1.187044 }, { T: 379.0, P: 1.228984 }, { T: 380.0, P: 1.272145 },
    { T: 381.0, P: 1.316557 }, { T: 382.0, P: 1.362245 }, { T: 383.0, P: 1.409239 },
    { T: 384.0, P: 1.457567 }, { T: 385.0, P: 1.507257 }, { T: 386.0, P: 1.55834 },
    { T: 387.0, P: 1.610845 }, { T: 388.0, P: 1.664803 }, { T: 389.0, P: 1.720243 },
    { T: 390.0, P: 1.777196 }, { T: 391.0, P: 1.835695 }, { T: 392.0, P: 1.895771 },
    { T: 393.0, P: 1.957456 }, { T: 394.0, P: 2.020783 }, { T: 395.0, P: 2.085785 },
    { T: 396.0, P: 2.152495 }, { T: 397.0, P: 2.220947 }, { T: 398.0, P: 2.291176 },
    { T: 399.0, P: 2.363216 }, { T: 400.0, P: 2.437102 }, { T: 401.0, P: 2.512869 },
    { T: 402.0, P: 2.590555 }, { T: 403.0, P: 2.670194 }, { T: 404.0, P: 2.751824 },
    { T: 405.0, P: 2.835482 }, { T: 406.0, P: 2.921206 }, { T: 407.0, P: 3.009033 },
    { T: 408.0, P: 3.099003 }, { T: 409.0, P: 3.191153 }, { T: 410.0, P: 3.285523 },
    { T: 411.0, P: 3.382153 }, { T: 412.0, P: 3.481083 }, { T: 413.0, P: 3.582353 },
    { T: 414.0, P: 3.686004 }, { T: 415.0, P: 3.792078 }, { T: 416.0, P: 3.900616 },
    { T: 417.0, P: 4.01166 }, { T: 418.0, P: 4.125254 }, { T: 419.0, P: 4.241439 },
    { T: 420.0, P: 4.36026 }, { T: 421.0, P: 4.48176 }, { T: 422.0, P: 4.605983 },
    { T: 423.0, P: 4.732974 }, { T: 424.0, P: 4.862778 }, { T: 425.0, P: 4.99544 },
    { T: 426.0, P: 5.131006 }, { T: 427.0, P: 5.269522 }, { T: 428.0, P: 5.411036 },
    { T: 429.0, P: 5.555593 }, { T: 430.0, P: 5.703241 }, { T: 431.0, P: 5.854029 },
    { T: 432.0, P: 6.008004 }, { T: 433.0, P: 6.165215 }, { T: 434.0, P: 6.32571 },
    { T: 435.0, P: 6.48954 }, { T: 436.0, P: 6.656753 }, { T: 437.0, P: 6.827401 },
    { T: 438.0, P: 7.001533 }, { T: 439.0, P: 7.179201 }, { T: 440.0, P: 7.360455 },
    { T: 441.0, P: 7.545348 }, { T: 442.0, P: 7.733932 }, { T: 443.0, P: 7.926258 },
    { T: 444.0, P: 8.12238 }, { T: 445.0, P: 8.322351 }, { T: 446.0, P: 8.526224 },
    { T: 447.0, P: 8.734053 }, { T: 448.0, P: 8.945893 }, { T: 449.0, P: 9.161797 },
    { T: 450.0, P: 9.381822 }, { T: 451.0, P: 9.606022 }, { T: 452.0, P: 9.834454 },
    { T: 453.0, P: 10.067172 }, { T: 454.0, P: 10.304234 }, { T: 455.0, P: 10.545695 },
    { T: 456.0, P: 10.791614 }, { T: 457.0, P: 11.042048 }, { T: 458.0, P: 11.297054 },
    { T: 459.0, P: 11.556691 }, { T: 460.0, P: 11.821016 }, { T: 461.0, P: 12.090089 },
    { T: 462.0, P: 12.363968 }, { T: 463.0, P: 12.642714 }, { T: 464.0, P: 12.926385 },
    { T: 465.0, P: 13.215042 }, { T: 466.0, P: 13.508745 }, { T: 467.0, P: 13.807555 },
    { T: 468.0, P: 14.111533 }, { T: 469.0, P: 14.42074 }, { T: 470.0, P: 14.735237 },
    { T: 471.0, P: 15.055087 }, { T: 472.0, P: 15.380351 }, { T: 473.0, P: 15.711093 },
    { T: 474.0, P: 16.047374 }, { T: 475.0, P: 16.389258 }, { T: 476.0, P: 16.736809 },
    { T: 477.0, P: 17.090089 }, { T: 478.0, P: 17.449163 }, { T: 479.0, P: 17.814095 },
    { T: 480.0, P: 18.184949 }, { T: 481.0, P: 18.56179 }, { T: 482.0, P: 18.944683 },
    { T: 483.0, P: 19.333693 }, { T: 484.0, P: 19.728886 }, { T: 485.0, P: 20.130327 },
    { T: 486.0, P: 20.538082 }, { T: 487.0, P: 20.952218 }, { T: 488.0, P: 21.372801 },
    { T: 489.0, P: 21.799898 }, { T: 490.0, P: 22.233575 }, { T: 491.0, P: 22.6739 },
    { T: 492.0, P: 23.120941 }, { T: 493.0, P: 23.574764 }, { T: 494.0, P: 24.035439 },
    { T: 495.0, P: 24.503032 }, { T: 496.0, P: 24.977612 }, { T: 497.0, P: 25.459247 },
    { T: 498.0, P: 25.948008 }, { T: 499.0, P: 26.443961 }, { T: 500.0, P: 26.947177 },
    { T: 501.0, P: 27.457724 }, { T: 502.0, P: 27.975672 }, { T: 503.0, P: 28.501092 },
    { T: 504.0, P: 29.034052 }, { T: 505.0, P: 29.574623 }, { T: 506.0, P: 30.122874 },
    { T: 507.0, P: 30.678878 }, { T: 508.0, P: 31.242703 }, { T: 509.0, P: 31.814421 },
    { T: 510.0, P: 32.394103 }, { T: 511.0, P: 32.981819 }, { T: 512.0, P: 33.577642 },
    { T: 513.0, P: 34.181642 }, { T: 514.0, P: 34.793891 }, { T: 515.0, P: 35.41446 },
    { T: 516.0, P: 36.043422 }, { T: 517.0, P: 36.680848 }, { T: 518.0, P: 37.326811 },
    { T: 519.0, P: 37.981382 }, { T: 520.0, P: 38.644634 }, { T: 521.0, P: 39.31664 },
    { T: 522.0, P: 39.997472 }, { T: 523.0, P: 40.687202 }, { T: 524.0, P: 41.385905 },
    { T: 525.0, P: 42.093651 }, { T: 526.0, P: 42.810516 }, { T: 527.0, P: 43.536571 },
    { T: 528.0, P: 44.27189 }, { T: 529.0, P: 45.016546 }, { T: 530.0, P: 45.770613 },
    { T: 531.0, P: 46.534163 }, { T: 532.0, P: 47.307272 }, { T: 533.0, P: 48.090012 },
    { T: 534.0, P: 48.882457 }, { T: 535.0, P: 49.684681 }, { T: 536.0, P: 50.496758 },
    { T: 537.0, P: 51.318762 }, { T: 538.0, P: 52.150766 }, { T: 539.0, P: 52.992845 },
    { T: 540.0, P: 53.845073 }, { T: 541.0, P: 54.707524 }, { T: 542.0, P: 55.580272 },
    { T: 543.0, P: 56.463392 }, { T: 544.0, P: 57.356957 }, { T: 545.0, P: 58.261043 },
    { T: 546.0, P: 59.175723 }, { T: 547.0, P: 60.101072 }, { T: 548.0, P: 61.037164 },
    { T: 549.0, P: 61.984074 }, { T: 550.0, P: 62.941876 }, { T: 551.0, P: 63.910644 },
    { T: 552.0, P: 64.890454 }, { T: 553.0, P: 65.881379 }, { T: 554.0, P: 66.883494 },
    { T: 555.0, P: 67.896874 }, { T: 556.0, P: 68.921593 }, { T: 557.0, P: 69.957725 },
    { T: 558.0, P: 71.005345 }, { T: 559.0, P: 72.064528 }, { T: 560.0, P: 73.135347 },
    { T: 561.0, P: 74.217878 }, { T: 562.0, P: 75.312194 }, { T: 563.0, P: 76.418371 },
    { T: 564.0, P: 77.536482 }, { T: 565.0, P: 78.666601 }, { T: 566.0, P: 79.808804 },
    { T: 567.0, P: 80.963164 }, { T: 568.0, P: 82.129755 }, { T: 569.0, P: 83.308652 },
    { T: 570.0, P: 84.499928 }, { T: 571.0, P: 85.703659 }, { T: 572.0, P: 86.919917 },
    { T: 573.0, P: 88.148777 }, { T: 574.0, P: 89.390312 }, { T: 575.0, P: 90.644597 },
    { T: 576.0, P: 91.911705 }, { T: 577.0, P: 93.19171 }, { T: 578.0, P: 94.484685 },
    { T: 579.0, P: 95.790705 }, { T: 580.0, P: 97.109842 }, { T: 581.0, P: 98.442169 },
    { T: 582.0, P: 99.787761 }, { T: 583.0, P: 101.14669 }, { T: 584.0, P: 102.51903 },
    { T: 585.0, P: 103.904853 }, { T: 586.0, P: 105.304232 }, { T: 587.0, P: 106.717241 },
    { T: 588.0, P: 108.143951 }, { T: 589.0, P: 109.584436 }, { T: 590.0, P: 111.038769 },
    { T: 591.0, P: 112.50702 }, { T: 592.0, P: 113.989264 }, { T: 593.0, P: 115.485571 },
    { T: 594.0, P: 116.996015 }, { T: 595.0, P: 118.520666 }, { T: 596.0, P: 120.059597 },
    { T: 597.0, P: 121.61288 }, { T: 598.0, P: 123.180585 }, { T: 599.0, P: 124.762785 },
    { T: 600.0, P: 126.359551 }, { T: 601.0, P: 127.970954 }, { T: 602.0, P: 129.597064 },
    { T: 603.0, P: 131.237954 }, { T: 604.0, P: 132.893692 }, { T: 605.0, P: 134.564351 },
    { T: 606.0, P: 136.250001 }, { T: 607.0, P: 137.950711 }, { T: 608.0, P: 139.666553 },
    { T: 609.0, P: 141.397595 }, { T: 610.0, P: 143.143908 }, { T: 611.0, P: 144.905562 },
    { T: 612.0, P: 146.682625 }, { T: 613.0, P: 148.475168 }, { T: 614.0, P: 150.283259 },
    { T: 615.0, P: 152.106968 }, { T: 616.0, P: 153.946363 }, { T: 617.0, P: 155.801513 },
    { T: 618.0, P: 157.672487 }, { T: 619.0, P: 159.559352 }, { T: 620.0, P: 161.462177 },
    { T: 621.0, P: 163.38103 }, { T: 622.0, P: 165.315978 }, { T: 623.0, P: 167.267089 },
    { T: 624.0, P: 169.234431 }, { T: 625.0, P: 171.218071 }, { T: 626.0, P: 173.218075 },
    { T: 627.0, P: 175.234511 }, { T: 628.0, P: 177.267445 }, { T: 629.0, P: 179.316943 },
    { T: 630.0, P: 181.383072 }, { T: 631.0, P: 183.465898 }, { T: 632.0, P: 185.565487 },
    { T: 633.0, P: 187.681903 }, { T: 634.0, P: 189.815213 }, { T: 635.0, P: 191.965482 },
    { T: 636.0, P: 194.132774 }, { T: 637.0, P: 196.317155 }, { T: 638.0, P: 198.518688 },
    { T: 639.0, P: 200.73744 }, { T: 640.0, P: 202.973472 }, { T: 641.0, P: 205.22685 },
    { T: 642.0, P: 207.497636 }, { T: 643.0, P: 209.785896 }, { T: 644.0, P: 212.09169 },
    { T: 645.0, P: 214.415084 }, { T: 646.0, P: 216.756139 }, { T: 647.096, P: 218.0 }
  ];

  // Handle critical point exactly
  if (Math.abs(T - T_CRITICAL) < 0.01) {
    return P_CRITICAL;
  }

  // Find the appropriate data points for interpolation
  for (let i = 0; i < vaporPressureData.length - 1; i++) {
    if (T >= vaporPressureData[i].T && T <= vaporPressureData[i + 1].T) {
      const t = (T - vaporPressureData[i].T) / (vaporPressureData[i + 1].T - vaporPressureData[i].T);
      return vaporPressureData[i].P * (1 - t) + vaporPressureData[i + 1].P * t;
    }
  }

  // Handle edge cases
  if (T <= vaporPressureData[0].T) return vaporPressureData[0].P;
  if (T >= vaporPressureData[vaporPressureData.length - 1].T) return vaporPressureData[vaporPressureData.length - 1].P;
  
  return 0; // Fallback
}

// Updated phase logic to match exactly the SVG diagram boundaries
function getPhase(T, P) {
  // Handle triple point exactly (all three phases can coexist)
  if (Math.abs(T - T_TRIPLE) < 0.01 && Math.abs(P - P_TRIPLE) < 0.001) {
    return "Liquid"; // Default to liquid at triple point for simulation
  }
  
  // Handle critical point exactly (374.1°C, 218 atm)
  if (Math.abs(T - T_CRITICAL) < 0.01 && Math.abs(P - P_CRITICAL) < 0.1) {
    return "Critical"; // Special phase at critical point
  }
  
  // Supercritical region (strictly above critical point)
  if (T > T_CRITICAL && P > P_CRITICAL) {
    return "Supercritical";
  }
  
  // Above critical temperature but below critical pressure
  if (T > T_CRITICAL && P <= P_CRITICAL) {
      return "Gas";
    }
  
  // At critical temperature but above critical pressure
  if (Math.abs(T - T_CRITICAL) < 0.01 && P > P_CRITICAL) {
    return "Supercritical";
  }
  
  // Below triple point temperature - use visual boundary for gas/solid
  if (T < T_TRIPLE) {
    // Use visual boundary (main vaporization curve) for gas/solid region under 0°C
    const visualBoundaryP = getVisualCurvePressure(T);
    if (P < visualBoundaryP) {
      return "Gas";
    } else {
      return "Solid";
    }
  }
  
  // Between triple point and critical temperature
  if (T >= T_TRIPLE && T < T_CRITICAL) {
    // Check vaporization curve (liquid-gas boundary)
    const vaporP = accurateVaporPressure(T);
    
    // Check fusion curve (solid-liquid boundary)
    const fusionP = accurateFusionCurve(T);
    
    // If pressure is below vaporization curve, it's gas
    if (P < vaporP) {
      return "Gas";
    }
    // If pressure is above fusion curve, it's liquid
    else if (P >= fusionP) {
      return "Liquid";
    }
    // If pressure is between vaporization and fusion curves, it's solid
    else {
      return "Solid";
    }
  }
  
  // Fallback
  return "Solid";
}

// Update phase colors to include ice phases
const phaseColors = {
  "Solid": "#4a90e2",
  "Liquid": "#7ed957",
  "Gas": "#ffa500",
  "Critical": "#ff1493", // Deep pink for critical point
  "Supercritical": "#ff7eeb",
};

// --- Molecule Sim ---
function MoleculeSim({ phase, width = 70, height = 70 }) {
  const MAX_MOLS = 9;
  // Map any ice phase to "Solid" for animation, and handle Critical phase
  const animationPhase = phase.startsWith("Ice") ? "Solid" : phase;
  const count = animationPhase === "Solid" ? 9 : animationPhase === "Liquid" ? 8 : animationPhase === "Critical" ? 7 : 6;
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
//LINK MODE
// Accurate fusion curve (solid-liquid boundary) using data points
function accurateFusionCurve(T) {
  // Data points for fusion curve (pressure in atm, temperature in K)
  // Note: As pressure increases, melting temperature decreases for water
  // More accurate data points for water fusion curve (IAPWS standard)
  const fusionData = [
    { P: 0.006117, T: 273.16 }, // triple point (exact)
    { P: 0.01, T: 273.15 },
    { P: 0.1, T: 273.15 },
    { P: 1, T: 273.15 },        // freezing point at 1 atm and 0°C (273.15 K)
    { P: 10, T: 273.14 },
    { P: 50, T: 273.13 },
    { P: 100, T: 273.12 },
    { P: 130, T: 273.11 },
    { P: 150, T: 273.10 },
    { P: 200, T: 273.09 },
    { P: 250, T: 273.08 },
    { P: 300, T: 273.07 },      // Extended to 300 atm - nearly vertical
  ];
  
  // Find the appropriate segment for interpolation
  for (let i = 0; i < fusionData.length - 1; i++) {
    const current = fusionData[i];
    const next = fusionData[i + 1];
    
    // Check if temperature falls between these two pressure points
    if (T <= current.T && T >= next.T) {
      // Linear interpolation between points
      const t = (current.T - T) / (current.T - next.T);
      return current.P * (1 - t) + next.P * t;
    }
  }
  
  // If temperature is outside the range, use the closest endpoint
  if (T > fusionData[0].T) {
    return fusionData[0].P; // Triple point pressure
  }
  if (T < fusionData[fusionData.length - 1].T) {
    return fusionData[fusionData.length - 1].P; // Highest pressure
  }
  
  return fusionData[0].P; // Default to triple point pressure
}

// Add color interpolation function before DiagramScreen
const interpolateColor = (temp, minT, maxT) => {
  // Convert temperature from Kelvin to Celsius
  const tempCelsius = kelvinToCelsius(temp);
  
  // Define color ranges based on temperature and phase
  if (tempCelsius <= 0) {
    // -73°C to 0°C: Solid / Freezing - Dark Blue → Blue
    const normalizedTemp = Math.max(0, (tempCelsius + 73) / 73); // Normalize from -73 to 0°C
    const darkBlue = { r: 0, g: 0, b: 139 }; // Dark Blue
    const blue = { r: 0, g: 0, b: 255 };     // Blue
    const r = Math.round(darkBlue.r + (blue.r - darkBlue.r) * normalizedTemp);
    const g = Math.round(darkBlue.g + (blue.g - darkBlue.g) * normalizedTemp);
    const b = Math.round(darkBlue.b + (blue.b - darkBlue.b) * normalizedTemp);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (tempCelsius <= 25) {
    // 0°C to 25°C: Melting → Room Temp - Blue → Cyan → Green
    const normalizedTemp = (tempCelsius - 0) / 25; // Normalize from 0 to 25°C
    const blue = { r: 0, g: 0, b: 255 };     // Blue
    const cyan = { r: 0, g: 255, b: 255 };   // Cyan
    const green = { r: 0, g: 255, b: 0 };    // Green
    
    if (normalizedTemp <= 0.5) {
      // Blue to Cyan
      const t = normalizedTemp * 2;
      const r = Math.round(blue.r + (cyan.r - blue.r) * t);
      const g = Math.round(blue.g + (cyan.g - blue.g) * t);
      const b = Math.round(blue.b + (cyan.b - blue.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Cyan to Green
      const t = (normalizedTemp - 0.5) * 2;
      const r = Math.round(cyan.r + (green.r - cyan.r) * t);
      const g = Math.round(cyan.g + (green.g - cyan.g) * t);
      const b = Math.round(cyan.b + (green.b - cyan.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else if (tempCelsius <= 100) {
    // 25°C to 100°C: Liquid - Green → Yellow → Orange
    const normalizedTemp = (tempCelsius - 25) / 75; // Normalize from 25 to 100°C
    const green = { r: 0, g: 255, b: 0 };    // Green
    const yellow = { r: 255, g: 255, b: 0 }; // Yellow
    const orange = { r: 255, g: 165, b: 0 }; // Orange
    
    if (normalizedTemp <= 0.5) {
      // Green to Yellow
      const t = normalizedTemp * 2;
      const r = Math.round(green.r + (yellow.r - green.r) * t);
      const g = Math.round(green.g + (yellow.g - green.g) * t);
      const b = Math.round(green.b + (yellow.b - green.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Yellow to Orange
      const t = (normalizedTemp - 0.5) * 2;
      const r = Math.round(yellow.r + (orange.r - yellow.r) * t);
      const g = Math.round(yellow.g + (orange.g - yellow.g) * t);
      const b = Math.round(yellow.b + (orange.b - yellow.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  } else if (tempCelsius <= 374) {
    // 100°C to 374°C: Gas - Orange → Red
    const normalizedTemp = (tempCelsius - 100) / 274; // Normalize from 100 to 374°C
    const orange = { r: 255, g: 165, b: 0 }; // Orange
    const red = { r: 255, g: 0, b: 0 };      // Red
    const r = Math.round(orange.r + (red.r - orange.r) * normalizedTemp);
    const g = Math.round(orange.g + (red.g - orange.g) * normalizedTemp);
    const b = Math.round(orange.b + (red.b - orange.b) * normalizedTemp);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (tempCelsius <= 374.1) {
    // 374°C (critical point): Transition - Crimson
    return `rgb(220, 20, 60)`; // Crimson
  } else {
    // 374°C to 427°C: Supercritical fluid - Red → Magenta → Purple
    const normalizedTemp = Math.min(1, (tempCelsius - 374) / 53); // Normalize from 374 to 427°C
    const red = { r: 255, g: 0, b: 0 };        // Red
    const magenta = { r: 255, g: 0, b: 255 };  // Magenta
    const purple = { r: 128, g: 0, b: 128 };   // Purple
    
    if (normalizedTemp <= 0.5) {
      // Red to Magenta
      const t = normalizedTemp * 2;
      const r = Math.round(red.r + (magenta.r - red.r) * t);
      const g = Math.round(red.g + (magenta.g - red.g) * t);
      const b = Math.round(red.b + (magenta.b - red.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    } else {
      // Magenta to Purple
      const t = (normalizedTemp - 0.5) * 2;
      const r = Math.round(magenta.r + (purple.r - magenta.r) * t);
      const g = Math.round(magenta.g + (purple.g - magenta.g) * t);
      const b = Math.round(magenta.b + (purple.b - magenta.b) * t);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
};

// Function to calculate pressure based on the visual boundary (using smooth interpolation)
const getVisualCurvePressure = (temperature) => {
  // Use the exact boundary points that are shown as dots on the diagram
  // Added more intermediate points for smoother interpolation
  const boundaryPoints = [
    [200, 0.001], // Start point (red dot)
    [225, 0.002], // Intermediate point
    [250, 0.003], // Control point 1 (orange dot)
    [260, 0.004], // Intermediate point
    [270, 0.005], // Intermediate point
    [273.16, 0.006117], // Triple point (yellow dot)
    [275, 0.0065], // Intermediate point
    [280, 0.007117], // Intermediate point
    [285, 0.009117], // Intermediate point
    [290, 0.011117], // Intermediate point
    [291, 0.015117], // 18°C - adjusted to be lower
    [292, 0.016], // Intermediate point
    [293, 0.017], // Intermediate point
    [294, 0.018], // Intermediate point
    [295, 0.013117], // Intermediate point
    [296, 0.020], // Intermediate point
    [297, 0.021], // Intermediate point
    [298, 0.022], // Intermediate point
    [299, 0.023], // Intermediate point
    [300, 0.019117], // Intermediate point - adjusted
    [301, 0.025], // Intermediate point
    [302, 0.026], // Intermediate point
    [303, 0.027], // Intermediate point
    [304, 0.028], // Intermediate point
    [305, 0.031117], // Intermediate point
    [306, 0.032], // Intermediate point
    [307, 0.033], // Intermediate point
    [308, 0.034], // Intermediate point
    [309, 0.035], // Intermediate point
    [310, 0.043117], // Intermediate point
    [311, 0.044], // Intermediate point
    [312, 0.045], // Intermediate point
    [313, 0.046], // Intermediate point
    [314, 0.047], // Intermediate point
    [315, 0.056117], // Intermediate point
    [316, 0.057], // Intermediate point
    [317, 0.058], // Intermediate point
    [318, 0.059], // Intermediate point
    [319, 0.060], // Intermediate point
    [320, 0.067117], // Intermediate point
    [321, 0.068], // Intermediate point
    [322, 0.069], // Intermediate point
    [323, 0.070], // Intermediate point
    [324, 0.071], // Intermediate point
    [325, 0.079117], // Intermediate point
    [326, 0.080], // Intermediate point
    [327, 0.081], // Intermediate point
    [328, 0.082], // Intermediate point
    [329, 0.083], // Intermediate point
    [330, 0.091117], // Intermediate point
    [331, 0.092], // Intermediate point
    [332, 0.093], // Intermediate point
    [333, 0.094], // Intermediate point
    [334, 0.095], // Intermediate point
    [335, 0.199], // Intermediate point
    [336, 0.200], // Intermediate point
    [337, 0.201], // Intermediate point
    [338, 0.202], // Intermediate point
    [339, 0.203], // Intermediate point
    [340, 0.230], // Intermediate point
    [341, 0.231], // Intermediate point
    [342, 0.232], // Intermediate point
    [343, 0.233], // Intermediate point
    [344, 0.234], // Intermediate point
    [345, 0.292], // Intermediate point
    [346, 0.293], // Intermediate point
    [347, 0.294], // Intermediate point
    [348, 0.295], // Intermediate point
    [349, 0.296], // Intermediate point
    [350, 0.380], // Control point 2 (green dot) - adjusted
    [351, 0.390], // Intermediate point
    [352, 0.400], // Intermediate point
    [353, 0.410], // Intermediate point
    [354, 0.420], // Intermediate point
    [355, 0.490], // Intermediate point
    [356, 0.500], // Intermediate point
    [357, 0.510], // Intermediate point
    [358, 0.520], // Intermediate point
    [359, 0.530], // Intermediate point
    [360, 0.580], // Intermediate point
    [361, 0.590], // Intermediate point
    [362, 0.600], // Intermediate point
    [363, 0.610], // Intermediate point
    [364, 0.620], // Intermediate point
    [365, 0.690], // Intermediate point
    [366, 0.700], // Intermediate point
    [367, 0.710], // Intermediate point
    [368, 0.720], // Intermediate point
    [369, 0.730], // Intermediate point
    [370, 0.800], // Intermediate point
    [371, 0.810], // Intermediate point
    [372, 0.820], // Intermediate point
    [373, 0.830], // Intermediate point
    [373.15, 1], // Boiling point (light green dot) - adjusted
    [374, 1.005], // Intermediate point
    [375, 1.010], // Intermediate point
    [376, 1.015], // Intermediate point
    [377, 1.020], // Intermediate point
    [378, 1.025], // Intermediate point
    [379, 1.030], // Intermediate point
    [380, 1.05], // Intermediate point
    [381, 1.06], // Intermediate point
    [382, 1.07], // Intermediate point
    [383, 1.08], // Intermediate point
    [384, 1.09], // Intermediate point
    [385, 1.1], // Intermediate point
    [386, 1.11], // Intermediate point
    [387, 1.12], // Intermediate point
    [388, 1.13], // Intermediate point
    [389, 1.14], // Intermediate point
    [390, 1.2], // Intermediate point
    [391, 1.25], // Intermediate point
    [392, 1.30], // Intermediate point
    [393, 1.35], // Intermediate point
    [394, 1.40], // Intermediate point
    [395, 1.4], // Intermediate point
    [396, 1.45], // Intermediate point
    [397, 1.50], // Intermediate point
    [398, 1.55], // Intermediate point
    [399, 1.60], // Intermediate point
    [400, 1.7], // Intermediate point
    [401, 1.75], // Intermediate point
    [402, 1.80], // Intermediate point
    [403, 1.85], // Intermediate point
    [404, 1.90], // Intermediate point
    [405, 1.95], // Intermediate point
    [406, 2.00], // Intermediate point
    [407, 2.05], // Intermediate point
    [408, 2.10], // Intermediate point
    [409, 2.15], // Intermediate point
    [410, 2.4], // Intermediate point
    [411, 2.5], // Intermediate point
    [412, 2.6], // Intermediate point
    [413, 2.7], // Intermediate point
    [414, 2.8], // Intermediate point
    [415, 2.9], // Intermediate point
    [416, 3.0], // Intermediate point
    [417, 3.1], // Intermediate point
    [418, 3.2], // Intermediate point
    [419, 3.3], // Intermediate point
    [420, 3], // Intermediate point
    [421, 3.1], // Intermediate point
    [422, 3.2], // Intermediate point
    [423, 3.3], // Intermediate point
    [424, 3.4], // Intermediate point
    [425, 3.5], // Intermediate point
    [426, 3.6], // Intermediate point
    [427, 3.7], // Intermediate point
    [428, 3.8], // Intermediate point
    [429, 3.9], // Intermediate point
    [430, 3.9], // Intermediate point
    [431, 4.0], // Intermediate point
    [432, 4.1], // Intermediate point
    [433, 4.2], // Intermediate point
    [434, 4.3], // Intermediate point
    [435, 4.4], // Intermediate point
    [436, 4.5], // Intermediate point
    [437, 4.6], // Intermediate point
    [438, 4.7], // Intermediate point
    [439, 4.8], // Intermediate point
    [440, 4.9], // Intermediate point
    [441, 5.0], // Intermediate point
    [442, 5.1], // Intermediate point
    [443, 5.2], // Intermediate point
    [444, 5.3], // Intermediate point
    [445, 5.4], // Intermediate point
    [446, 5.5], // Intermediate point
    [447, 5.6], // Intermediate point
    [448, 5.7], // Intermediate point
    [449, 5.8], // Intermediate point
    [450, 5.9], // Intermediate point
    [451, 6.0], // Intermediate point
    [452, 6.1], // Intermediate point
    [453, 6.2], // Intermediate point
    [454, 6.3], // Intermediate point
    [455, 6.4], // Intermediate point
    [456, 6.5], // Intermediate point
    [457, 6.6], // Intermediate point
    [458, 6.7], // Intermediate point
    [459, 6.8], // Intermediate point
    [460, 6.9], // Intermediate point
    [461, 7.0], // Intermediate point
    [462, 7.1], // Intermediate point
    [463, 7.2], // Intermediate point
    [464, 7.3], // Intermediate point
    [465, 7.4], // Intermediate point
    [466, 7.5], // Intermediate point
    [467, 7.6], // Intermediate point
    [468, 7.7], // Intermediate point
    [469, 7.8], // Intermediate point
    [470, 7.7], // Intermediate point
    [471, 7.8], // Intermediate point
    [472, 7.9], // Intermediate point
    [473, 8.0], // Intermediate point
    [474, 8.1], // Intermediate point
    [475, 8.2], // Intermediate point
    [476, 8.3], // Intermediate point
    [477, 8.4], // Intermediate point
    [478, 8.5], // Intermediate point
    [479, 8.6], // Intermediate point
    [480, 8.6], // Intermediate point
    [481, 8.7], // Intermediate point
    [482, 8.8], // Intermediate point
    [483, 8.9], // Intermediate point
    [484, 9.0], // Intermediate point
    [485, 9.1], // Intermediate point
    [486, 9.2], // Intermediate point
    [487, 9.3], // Intermediate point
    [488, 9.4], // Intermediate point
    [489, 9.5], // Intermediate point
    [490, 9.5], // Intermediate point
    [491, 9.6], // Intermediate point
    [492, 9.7], // Intermediate point
    [493, 9.8], // Intermediate point
    [494, 9.9], // Intermediate point
    [495, 10.0], // Intermediate point
    [496, 10.1], // Intermediate point
    [497, 10.2], // Intermediate point
    [498, 10.3], // Intermediate point
    [499, 10.4], // Intermediate point
    [500, 10.4], // Intermediate point
    [501, 10.5], // Intermediate point
    [502, 10.6], // Intermediate point
    [503, 10.7], // Intermediate point
    [504, 10.8], // Intermediate point
    [505, 10.9], // Intermediate point
    [506, 11.0], // Intermediate point
    [507, 11.1], // Intermediate point
    [508, 11.2], // Intermediate point
    [509, 11.3], // Intermediate point
    [510, 11.4], // Intermediate point
    [511, 11.5], // Intermediate point
    [512, 11.6], // Intermediate point
    [513, 11.7], // Intermediate point
    [514, 11.8], // Intermediate point
    [515, 11.9], // Intermediate point
    [516, 12.0], // Intermediate point
    [517, 12.1], // Intermediate point
    [518, 12.2], // Intermediate point
    [519, 12.3], // Intermediate point
    [520, 12.5], // Intermediate point
    [521, 12.6], // Intermediate point
    [522, 12.7], // Intermediate point
    [523, 12.8], // Intermediate point
    [524, 12.9], // Intermediate point
    [525, 13.0], // Intermediate point
    [526, 13.1], // Intermediate point
    [527, 13.2], // Intermediate point
    [528, 13.3], // Intermediate point
    [529, 13.4], // Intermediate point
    [530, 21], // Intermediate point
    [531, 22], // Intermediate point
    [532, 23], // Intermediate point
    [533, 24], // Intermediate point
    [534, 25], // Intermediate point
    [535, 26], // Intermediate point
    [536, 27], // Intermediate point
    [537, 28], // Intermediate point
    [538, 29], // Intermediate point
    [539, 30], // Intermediate point
    [540, 34], // Intermediate point
    [541, 35], // Intermediate point
    [542, 36], // Intermediate point
    [543, 37], // Intermediate point
    [544, 38], // Intermediate point
    [545, 39], // Intermediate point
    [546, 40], // Intermediate point
    [547, 41], // Intermediate point
    [548, 42], // Intermediate point
    [549, 43], // Intermediate point
    [550, 44], // Intermediate point
    [551, 45], // Intermediate point
    [552, 46], // Intermediate point
    [553, 47], // Intermediate point
    [554, 48], // Intermediate point
    [555, 49], // Intermediate point
    [556, 50], // Intermediate point
    [557, 51], // Intermediate point
    [558, 52], // Intermediate point
    [559, 53], // Intermediate point
    [560, 60], // Intermediate point
    [561, 61], // Intermediate point
    [562, 62], // Intermediate point
    [563, 63], // Intermediate point
    [564, 64], // Intermediate point
    [565, 65], // Intermediate point
    [566, 66], // Intermediate point
    [567, 67], // Intermediate point
    [568, 68], // Intermediate point
    [569, 69], // Intermediate point
    [570, 80], // Intermediate point
    [571, 81], // Intermediate point
    [572, 82], // Intermediate point
    [573, 83], // Intermediate point
    [574, 84], // Intermediate point
    [575, 85], // Intermediate point
    [576, 86], // Intermediate point
    [577, 87], // Intermediate point
    [578, 88], // Intermediate point
    [579, 89], // Intermediate point
    [580, 95], // Intermediate point
    [581, 96], // Intermediate point
    [582, 97], // Intermediate point
    [583, 98], // Intermediate point
    [584, 99], // Intermediate point
    [585, 100], // Intermediate point
    [586, 101], // Intermediate point
    [587, 102], // Intermediate point
    [588, 103], // Intermediate point
    [589, 104], // Intermediate point
    [590, 105], // Intermediate point
    [591, 106], // Intermediate point
    [592, 107], // Intermediate point
    [593, 108], // Intermediate point
    [594, 109], // Intermediate point
    [595, 110], // Intermediate point
    [596, 111], // Intermediate point
    [597, 112], // Intermediate point
    [598, 113], // Intermediate point
    [599, 114], // Intermediate point
    [600, 115], // Intermediate point
    [601, 116], // Intermediate point
    [602, 117], // Intermediate point
    [603, 118], // Intermediate point
    [604, 119], // Intermediate point
    [605, 120], // Intermediate point
    [606, 121], // Intermediate point
    [607, 122], // Intermediate point
    [608, 123], // Intermediate point
    [609, 124], // Intermediate point
    [610, 125], // Intermediate point
    [611, 126], // Intermediate point
    [612, 127], // Intermediate point
    [613, 128], // Intermediate point
    [614, 129], // Intermediate point
    [615, 130], // Intermediate point
    [616, 131], // Intermediate point
    [617, 132], // Intermediate point
    [618, 133], // Intermediate point
    [619, 134], // Intermediate point
    [620, 135], // Intermediate point
    [621, 136], // Intermediate point
    [622, 137], // Intermediate point
    [623, 138], // Intermediate point
    [624, 139], // Intermediate point
    [625, 140], // Intermediate point
    [626, 141], // Intermediate point
    [627, 142], // Intermediate point
    [628, 143], // Intermediate point
    [629, 144], // Intermediate point
    [630, 155], // Intermediate point
    [631, 156], // Intermediate point
    [632, 157], // Intermediate point
    [633, 158], // Intermediate point
    [634, 159], // Intermediate point
    [635, 160], // Intermediate point
    [636, 161], // Intermediate point
    [637, 162], // Intermediate point
    [638, 163], // Intermediate point
    [639, 164], // Intermediate point
    [640, 180], // Intermediate point
    [641, 181], // Intermediate point
    [642, 182], // Intermediate point
    [643, 183], // Intermediate point
    [644, 184], // Intermediate point
    [645, 185], // Intermediate point
    [646, 186], // Intermediate point
    [647, 187], // Intermediate point
    [647.15, 218] // Critical point (purple dot) - fixed value
  ];
  
  // Handle edge cases
  if (temperature <= 200) return 0.001;
  if (temperature >= 647.096) return 218.0;
  
  // Find the two boundary points to interpolate between
  for (let i = 0; i < boundaryPoints.length - 1; i++) {
    const currentPoint = boundaryPoints[i];
    const nextPoint = boundaryPoints[i + 1];
    
    if (temperature >= currentPoint[0] && temperature <= nextPoint[0]) {
      // Linear interpolation between the two points
      const t = (temperature - currentPoint[0]) / (nextPoint[0] - currentPoint[0]);
      return currentPoint[1] + t * (nextPoint[1] - currentPoint[1]);
    }
  }
  
  // Fallback to nearest point if interpolation fails
  let fallbackPoint = boundaryPoints[0];
  let fallbackDistance = Math.abs(temperature - boundaryPoints[0][0]);
  
  for (let i = 1; i < boundaryPoints.length; i++) {
    const distance = Math.abs(temperature - boundaryPoints[i][0]);
    if (distance < fallbackDistance) {
      fallbackDistance = distance;
      fallbackPoint = boundaryPoints[i];
    }
  }
  
  return fallbackPoint[1];
};

// Function to find temperature based on pressure along the visual boundary (using smooth interpolation)
const getVisualCurveTemperature = (pressure) => {
  // Use the exact boundary points that are shown as dots on the diagram
  // Added more intermediate points for smoother interpolation
  const boundaryPoints = [
    [200, 0.001], // Start point (red dot)
    [225, 0.002], // Intermediate point
    [250, 0.003], // Control point 1 (orange dot)
    [260, 0.004], // Intermediate point
    [270, 0.005], // Intermediate point
    [273.16, 0.006117], // Triple point (yellow dot)
    [275, 0.0065], // Intermediate point
    [280, 0.007117], // Intermediate point
    [285, 0.009117], // Intermediate point
    [290, 0.011117], // Intermediate point
    [291, 0.015117], // 18°C - adjusted to be lower
    [292, 0.016], // Intermediate point
    [293, 0.017], // Intermediate point
    [294, 0.018], // Intermediate point
    [295, 0.013117], // Intermediate point
    [296, 0.020], // Intermediate point
    [297, 0.021], // Intermediate point
    [298, 0.022], // Intermediate point
    [299, 0.023], // Intermediate point
    [300, 0.019117], // Intermediate point - adjusted
    [301, 0.025], // Intermediate point
    [302, 0.026], // Intermediate point
    [303, 0.027], // Intermediate point
    [304, 0.028], // Intermediate point
    [305, 0.031117], // Intermediate point
    [306, 0.032], // Intermediate point
    [307, 0.033], // Intermediate point
    [308, 0.034], // Intermediate point
    [309, 0.035], // Intermediate point
    [310, 0.043117], // Intermediate point
    [311, 0.044], // Intermediate point
    [312, 0.045], // Intermediate point
    [313, 0.046], // Intermediate point
    [314, 0.047], // Intermediate point
    [315, 0.056117], // Intermediate point
    [316, 0.057], // Intermediate point
    [317, 0.058], // Intermediate point
    [318, 0.059], // Intermediate point
    [319, 0.060], // Intermediate point
    [320, 0.067117], // Intermediate point
    [321, 0.068], // Intermediate point
    [322, 0.069], // Intermediate point
    [323, 0.070], // Intermediate point
    [324, 0.071], // Intermediate point
    [325, 0.079117], // Intermediate point
    [326, 0.080], // Intermediate point
    [327, 0.081], // Intermediate point
    [328, 0.082], // Intermediate point
    [329, 0.083], // Intermediate point
    [330, 0.091117], // Intermediate point
    [331, 0.092], // Intermediate point
    [332, 0.093], // Intermediate point
    [333, 0.094], // Intermediate point
    [334, 0.095], // Intermediate point
    [335, 0.199], // Intermediate point
    [336, 0.200], // Intermediate point
    [337, 0.201], // Intermediate point
    [338, 0.202], // Intermediate point
    [339, 0.203], // Intermediate point
    [340, 0.230], // Intermediate point
    [341, 0.231], // Intermediate point
    [342, 0.232], // Intermediate point
    [343, 0.233], // Intermediate point
    [344, 0.234], // Intermediate point
    [345, 0.292], // Intermediate point
    [346, 0.293], // Intermediate point
    [347, 0.294], // Intermediate point
    [348, 0.295], // Intermediate point
    [349, 0.296], // Intermediate point
    [350, 0.380], // Control point 2 (green dot) - adjusted
    [351, 0.390], // Intermediate point
    [352, 0.400], // Intermediate point
    [353, 0.410], // Intermediate point
    [354, 0.420], // Intermediate point
    [355, 0.490], // Intermediate point
    [356, 0.500], // Intermediate point
    [357, 0.510], // Intermediate point
    [358, 0.520], // Intermediate point
    [359, 0.530], // Intermediate point
    [360, 0.580], // Intermediate point
    [361, 0.590], // Intermediate point
    [362, 0.600], // Intermediate point
    [363, 0.610], // Intermediate point
    [364, 0.620], // Intermediate point
    [365, 0.690], // Intermediate point
    [366, 0.700], // Intermediate point
    [367, 0.710], // Intermediate point
    [368, 0.720], // Intermediate point
    [369, 0.730], // Intermediate point
    [370, 0.800], // Intermediate point
    [371, 0.810], // Intermediate point
    [372, 0.820], // Intermediate point
    [373, 0.830], // Intermediate point
    [373.15, 1], // Boiling point (light green dot) - adjusted
    [374, 1.005], // Intermediate point
    [375, 1.010], // Intermediate point
    [376, 1.015], // Intermediate point
    [377, 1.020], // Intermediate point
    [378, 1.025], // Intermediate point
    [379, 1.030], // Intermediate point
    [380, 1.05], // Intermediate point
    [381, 1.06], // Intermediate point
    [382, 1.07], // Intermediate point
    [383, 1.08], // Intermediate point
    [384, 1.09], // Intermediate point
    [385, 1.1], // Intermediate point
    [386, 1.11], // Intermediate point
    [387, 1.12], // Intermediate point
    [388, 1.13], // Intermediate point
    [389, 1.14], // Intermediate point
    [390, 1.2], // Intermediate point
    [391, 1.25], // Intermediate point
    [392, 1.30], // Intermediate point
    [393, 1.35], // Intermediate point
    [394, 1.40], // Intermediate point
    [395, 1.4], // Intermediate point
    [396, 1.45], // Intermediate point
    [397, 1.50], // Intermediate point
    [398, 1.55], // Intermediate point
    [399, 1.60], // Intermediate point
    [400, 1.7], // Intermediate point
    [401, 1.75], // Intermediate point
    [402, 1.80], // Intermediate point
    [403, 1.85], // Intermediate point
    [404, 1.90], // Intermediate point
    [405, 1.95], // Intermediate point
    [406, 2.00], // Intermediate point
    [407, 2.05], // Intermediate point
    [408, 2.10], // Intermediate point
    [409, 2.15], // Intermediate point
    [410, 2.4], // Intermediate point
    [411, 2.5], // Intermediate point
    [412, 2.6], // Intermediate point
    [413, 2.7], // Intermediate point
    [414, 2.8], // Intermediate point
    [415, 2.9], // Intermediate point
    [416, 3.0], // Intermediate point
    [417, 3.1], // Intermediate point
    [418, 3.2], // Intermediate point
    [419, 3.3], // Intermediate point
    [420, 3], // Intermediate point
    [421, 3.1], // Intermediate point
    [422, 3.2], // Intermediate point
    [423, 3.3], // Intermediate point
    [424, 3.4], // Intermediate point
    [425, 3.5], // Intermediate point
    [426, 3.6], // Intermediate point
    [427, 3.7], // Intermediate point
    [428, 3.8], // Intermediate point
    [429, 3.9], // Intermediate point
    [430, 3.9], // Intermediate point
    [431, 4.0], // Intermediate point
    [432, 4.1], // Intermediate point
    [433, 4.2], // Intermediate point
    [434, 4.3], // Intermediate point
    [435, 4.4], // Intermediate point
    [436, 4.5], // Intermediate point
    [437, 4.6], // Intermediate point
    [438, 4.7], // Intermediate point
    [439, 4.8], // Intermediate point
    [440, 4.9], // Intermediate point
    [441, 5.0], // Intermediate point
    [442, 5.1], // Intermediate point
    [443, 5.2], // Intermediate point
    [444, 5.3], // Intermediate point
    [445, 5.4], // Intermediate point
    [446, 5.5], // Intermediate point
    [447, 5.6], // Intermediate point
    [448, 5.7], // Intermediate point
    [449, 5.8], // Intermediate point
    [450, 5.9], // Intermediate point
    [451, 6.0], // Intermediate point
    [452, 6.1], // Intermediate point
    [453, 6.2], // Intermediate point
    [454, 6.3], // Intermediate point
    [455, 6.4], // Intermediate point
    [456, 6.5], // Intermediate point
    [457, 6.6], // Intermediate point
    [458, 6.7], // Intermediate point
    [459, 6.8], // Intermediate point
    [460, 6.9], // Intermediate point
    [461, 7.0], // Intermediate point
    [462, 7.1], // Intermediate point
    [463, 7.2], // Intermediate point
    [464, 7.3], // Intermediate point
    [465, 7.4], // Intermediate point
    [466, 7.5], // Intermediate point
    [467, 7.6], // Intermediate point
    [468, 7.7], // Intermediate point
    [469, 7.8], // Intermediate point
    [470, 7.7], // Intermediate point
    [471, 7.8], // Intermediate point
    [472, 7.9], // Intermediate point
    [473, 8.0], // Intermediate point
    [474, 8.1], // Intermediate point
    [475, 8.2], // Intermediate point
    [476, 8.3], // Intermediate point
    [477, 8.4], // Intermediate point
    [478, 8.5], // Intermediate point
    [479, 8.6], // Intermediate point
    [480, 8.6], // Intermediate point
    [481, 8.7], // Intermediate point
    [482, 8.8], // Intermediate point
    [483, 8.9], // Intermediate point
    [484, 9.0], // Intermediate point
    [485, 9.1], // Intermediate point
    [486, 9.2], // Intermediate point
    [487, 9.3], // Intermediate point
    [488, 9.4], // Intermediate point
    [489, 9.5], // Intermediate point
    [490, 9.5], // Intermediate point
    [491, 9.6], // Intermediate point
    [492, 9.7], // Intermediate point
    [493, 9.8], // Intermediate point
    [494, 9.9], // Intermediate point
    [495, 10.0], // Intermediate point
    [496, 10.1], // Intermediate point
    [497, 10.2], // Intermediate point
    [498, 10.3], // Intermediate point
    [499, 10.4], // Intermediate point
    [500, 10.4], // Intermediate point
    [501, 10.5], // Intermediate point
    [502, 10.6], // Intermediate point
    [503, 10.7], // Intermediate point
    [504, 10.8], // Intermediate point
    [505, 10.9], // Intermediate point
    [506, 11.0], // Intermediate point
    [507, 11.1], // Intermediate point
    [508, 11.2], // Intermediate point
    [509, 11.3], // Intermediate point
    [510, 11.4], // Intermediate point
    [511, 11.5], // Intermediate point
    [512, 11.6], // Intermediate point
    [513, 11.7], // Intermediate point
    [514, 11.8], // Intermediate point
    [515, 11.9], // Intermediate point
    [516, 12.0], // Intermediate point
    [517, 12.1], // Intermediate point
    [518, 12.2], // Intermediate point
    [519, 12.3], // Intermediate point
    [520, 12.5], // Intermediate point
    [521, 12.6], // Intermediate point
    [522, 12.7], // Intermediate point
    [523, 12.8], // Intermediate point
    [524, 12.9], // Intermediate point
    [525, 13.0], // Intermediate point
    [526, 13.1], // Intermediate point
    [527, 13.2], // Intermediate point
    [528, 13.3], // Intermediate point
    [529, 13.4], // Intermediate point
    [530, 21], // Intermediate point
    [531, 22], // Intermediate point
    [532, 23], // Intermediate point
    [533, 24], // Intermediate point
    [534, 25], // Intermediate point
    [535, 26], // Intermediate point
    [536, 27], // Intermediate point
    [537, 28], // Intermediate point
    [538, 29], // Intermediate point
    [539, 30], // Intermediate point
    [540, 34], // Intermediate point
    [541, 35], // Intermediate point
    [542, 36], // Intermediate point
    [543, 37], // Intermediate point
    [544, 38], // Intermediate point
    [545, 39], // Intermediate point
    [546, 40], // Intermediate point
    [547, 41], // Intermediate point
    [548, 42], // Intermediate point
    [549, 43], // Intermediate point
    [550, 44], // Intermediate point
    [551, 45], // Intermediate point
    [552, 46], // Intermediate point
    [553, 47], // Intermediate point
    [554, 48], // Intermediate point
    [555, 49], // Intermediate point
    [556, 50], // Intermediate point
    [557, 51], // Intermediate point
    [558, 52], // Intermediate point
    [559, 53], // Intermediate point
    [560, 60], // Intermediate point
    [561, 61], // Intermediate point
    [562, 62], // Intermediate point
    [563, 63], // Intermediate point
    [564, 64], // Intermediate point
    [565, 65], // Intermediate point
    [566, 66], // Intermediate point
    [567, 67], // Intermediate point
    [568, 68], // Intermediate point
    [569, 69], // Intermediate point
    [570, 80], // Intermediate point
    [571, 81], // Intermediate point
    [572, 82], // Intermediate point
    [573, 83], // Intermediate point
    [574, 84], // Intermediate point
    [575, 85], // Intermediate point
    [576, 86], // Intermediate point
    [577, 87], // Intermediate point
    [578, 88], // Intermediate point
    [579, 89], // Intermediate point
    [580, 95], // Intermediate point
    [581, 96], // Intermediate point
    [582, 97], // Intermediate point
    [583, 98], // Intermediate point
    [584, 99], // Intermediate point
    [585, 100], // Intermediate point
    [586, 101], // Intermediate point
    [587, 102], // Intermediate point
    [588, 103], // Intermediate point
    [589, 104], // Intermediate point
    [590, 105], // Intermediate point
    [591, 106], // Intermediate point
    [592, 107], // Intermediate point
    [593, 108], // Intermediate point
    [594, 109], // Intermediate point
    [595, 110], // Intermediate point
    [596, 111], // Intermediate point
    [597, 112], // Intermediate point
    [598, 113], // Intermediate point
    [599, 114], // Intermediate point
    [600, 115], // Intermediate point
    [601, 116], // Intermediate point
    [602, 117], // Intermediate point
    [603, 118], // Intermediate point
    [604, 119], // Intermediate point
    [605, 120], // Intermediate point
    [606, 121], // Intermediate point
    [607, 122], // Intermediate point
    [608, 123], // Intermediate point
    [609, 124], // Intermediate point
    [610, 125], // Intermediate point
    [611, 126], // Intermediate point
    [612, 127], // Intermediate point
    [613, 128], // Intermediate point
    [614, 129], // Intermediate point
    [615, 130], // Intermediate point
    [616, 131], // Intermediate point
    [617, 132], // Intermediate point
    [618, 133], // Intermediate point
    [619, 134], // Intermediate point
    [620, 135], // Intermediate point
    [621, 136], // Intermediate point
    [622, 137], // Intermediate point
    [623, 138], // Intermediate point
    [624, 139], // Intermediate point
    [625, 140], // Intermediate point
    [626, 141], // Intermediate point
    [627, 142], // Intermediate point
    [628, 143], // Intermediate point
    [629, 144], // Intermediate point
    [630, 155], // Intermediate point
    [631, 156], // Intermediate point
    [632, 157], // Intermediate point
    [633, 158], // Intermediate point
    [634, 159], // Intermediate point
    [635, 160], // Intermediate point
    [636, 161], // Intermediate point
    [637, 162], // Intermediate point
    [638, 163], // Intermediate point
    [639, 164], // Intermediate point
    [640, 180], // Intermediate point
    [641, 181], // Intermediate point
    [642, 182], // Intermediate point
    [643, 183], // Intermediate point
    [644, 184], // Intermediate point
    [645, 185], // Intermediate point
    [646, 186], // Intermediate point
    [647, 187], // Intermediate point
    [647.15, 218] // Critical point (purple dot) - fixed value
  ];
  
  // Handle edge cases
  if (pressure <= 0.001) return 200;
  if (pressure >= 218.0) return 647.096;
  
  // Find the two boundary points to interpolate between
  for (let i = 0; i < boundaryPoints.length - 1; i++) {
    const currentPoint = boundaryPoints[i];
    const nextPoint = boundaryPoints[i + 1];
    
    if (pressure >= currentPoint[1] && pressure <= nextPoint[1]) {
      // Linear interpolation between the two points
      const t = (pressure - currentPoint[1]) / (nextPoint[1] - currentPoint[1]);
      return currentPoint[0] + t * (nextPoint[0] - currentPoint[0]);
    }
  }
  
  // Fallback to nearest point if interpolation fails
  let fallbackPoint = boundaryPoints[0];
  let fallbackDistance = Math.abs(pressure - boundaryPoints[0][1]);
  
  for (let i = 1; i < boundaryPoints.length; i++) {
    const distance = Math.abs(pressure - boundaryPoints[i][1]);
    if (distance < fallbackDistance) {
      fallbackDistance = distance;
      fallbackPoint = boundaryPoints[i];
    }
  }
  
  return fallbackPoint[0];
};

export default function DiagramScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

  const handleBackPress = () => {
    handlePress(() => navigation.goBack());
  };

  // Helper functions for logarithmic pressure slider - moved to top
  const logSliderToPressure = (sliderValue) => {
    // Convert linear slider value (0-1) to logarithmic pressure (0.001-300)
    const minLog = Math.log10(0.001);
    const maxLog = Math.log10(300);
    const logValue = minLog + sliderValue * (maxLog - minLog);
    return Math.pow(10, logValue);
  };

  const pressureToLogSlider = (pressure) => {
    // Convert pressure to linear slider value (0-1)
    const minLog = Math.log10(0.001);
    const maxLog = Math.log10(300);
    const logValue = Math.log10(pressure);
    return (logValue - minLog) / (maxLog - minLog);
  };

  const [temperature, setTemperature] = useState(273.15); // Start at 0°C (273.15 K)
  const [pressure, setPressure] = useState(1); // Start at freezing point (1 atm)
  const [pressureSliderValue, setPressureSliderValue] = useState(pressureToLogSlider(1)); // Start at freezing point pressure
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [tempInput, setTempInput] = useState("0"); // Start at 0°C
  const [pressureInput, setPressureInput] = useState("1");
  const [pressureWarning, setPressureWarning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLinked, setIsLinked] = useState(false); // Add state for linking toggle
  const [lastControlUsed, setLastControlUsed] = useState(null); // Track which control was last used: 'temperature' or 'pressure'
  const [startingDirection, setStartingDirection] = useState(null); // Track which boundary to follow when starting from triple point

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const handlePress = useButtonSound();

  // Verify reactivity with useEffect
  useEffect(() => {
    console.log('DiagramScreen theme changed:', theme.background);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [theme]);

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

  // Use predefined responsive values for dynamic sizing
  const currentSidebarWidth = sidebarWidth;
  const currentDiagramWidth = Math.max(200, Math.min(width - currentSidebarWidth - wp('15'), diagramMaxWidth));
  const currentDiagramHeight = Math.max(140, Math.min(height - hp('20'), diagramMaxHeight));

  // Use predefined responsive spacing values
  const currentMainPadding = mainPadding;
  const currentCenterPadding = centerPadding;
  const currentRightPanelPadding = rightPanelPadding;
  const currentDiagramMargin = diagramMargin;

  // --- Phase diagram axes ---
  const minT = 200, maxT = 700;
  const minP = 0.001, maxP = 300;

  // Helper function for continuous temperature mapping
  const getStretchedTemperature = (t) => {
    // We want 100°C (373.15K) to appear at the 523.15K tick position
    // This means we need to map the visual position to the actual temperature
    if (t <= 373.15) {
      // For temperatures up to 100°C, stretch them to fill the space up to 523.15K position
      const stretchRatio = (523.15 - minT) / (373.15 - minT);
      return minT + (t - minT) * stretchRatio;
    } else if (t <= 647.096) {
      // For temperatures between 100°C and critical point, create a smooth transition
      const transitionStart = 373.15;
      const transitionEnd = 647.096;
      const transitionRatio = (t - transitionStart) / (transitionEnd - transitionStart);
      
      // The stretched end position (where 100°C appears)
      const stretchedEnd = minT + (transitionStart - minT) * ((523.15 - minT) / (373.15 - minT));
      const linearEnd = transitionEnd;
      
      return stretchedEnd + (linearEnd - stretchedEnd) * transitionRatio;
    } else {
      // For temperatures above critical point, use linear mapping
      return t;
    }
  };

  // Reverse mapping function to convert visual position back to actual temperature
  const getActualTemperature = (stretchedT) => {
    if (stretchedT <= 523.15) {
      // Reverse the stretch mapping for temperatures up to 100°C
      const stretchRatio = (523.15 - minT) / (373.15 - minT);
      return minT + (stretchedT - minT) / stretchRatio;
    } else if (stretchedT <= 647.096) {
      // Reverse the transition mapping
      const transitionStart = 373.15;
      const transitionEnd = 647.096;
      const stretchedEnd = minT + (transitionStart - minT) * ((523.15 - minT) / (373.15 - minT));
      const linearEnd = transitionEnd;
      
      const transitionRatio = (stretchedT - stretchedEnd) / (linearEnd - stretchedEnd);
      return transitionStart + (transitionEnd - transitionStart) * transitionRatio;
    } else {
      // For temperatures above critical point, use linear mapping
      return stretchedT;
    }
  };

  // Add snapping function for important temperature points
  const snapToImportantTemperatures = (stretchedValue) => {
    const actualTemp = getActualTemperature(stretchedValue);
    
    // Define important temperature points with tolerance
    const importantPoints = [
      { temp: 273.15, tolerance: 2, name: "Freezing Point" },    // 0°C
      { temp: 373.15, tolerance: 2, name: "Boiling Point" },     // 100°C
      { temp: 647.096, tolerance: 2, name: "Critical Point" },   // 374°C
    ];
    
    // Check if we're close to any important point
    for (const point of importantPoints) {
      if (Math.abs(actualTemp - point.temp) <= point.tolerance) {
        console.log(`Snapping to ${point.name}: ${Math.round(kelvinToCelsius(point.temp))}°C`);
        return getStretchedTemperature(point.temp);
      }
    }
    
    return stretchedValue;
  };

  // Map T and P to SVG coordinates
  // Modified to stretch 100°C (373.15K) to the 523.15K tick position with smooth transition
  const mapT = t => {
    const stretchedT = getStretchedTemperature(t);
    return 60 + ((stretchedT - minT) / (maxT - minT)) * (currentDiagramWidth - 120);
  };
  
  const mapP = (pressure) => {
    // Define fixed pressure values for tick marks
    const pressures = [0.001, 0.01, 0.1, 1, 10, 100, 200, 300];
    
    // Find the appropriate segment for interpolation
    for (let i = 0; i < pressures.length - 1; i++) {
      if (pressure >= pressures[i] && pressure <= pressures[i + 1]) {
        const segmentHeight = (currentDiagramHeight - 80) / 7; // 7 segments for 8 points, accounting for margins
        const baseY = currentDiagramHeight - 40 - (i * segmentHeight); // 40px margin at top and bottom
        const ratio = (pressure - pressures[i]) / (pressures[i + 1] - pressures[i]);
        return baseY - (segmentHeight * ratio);
      }
    }
    
    // Handle values outside the range
    if (pressure <= pressures[0]) return currentDiagramHeight - 40; // Bottom margin
    if (pressure >= pressures[pressures.length - 1]) return 40; // Top margin
    return 40;
  };

  const phasePoint = {
    x: mapT(temperature),
    y: mapP(pressure),
  };

  // Use corrected phase logic
  const phase = getPhase(temperature, pressure);
  
  // Enhanced debug logging for phase detection
  const vaporP = accurateVaporPressure(temperature);
  const fusionP = accurateFusionCurve(temperature);
  const sublimationP = sublimationPressure(temperature);
  
  // Debug log for phase transitions
  if (Math.abs(temperature - 273.15) < 0.1 && Math.abs(pressure - 1) < 0.1) {
    console.log(`Freezing point: T=${temperature}K, P=${pressure}atm, Phase=${phase}`);
    console.log(`  VaporP=${vaporP}, FusionP=${fusionP}, SublimationP=${sublimationP}`);
  }
  
  if (Math.abs(temperature - 373.15) < 0.1 && Math.abs(pressure - 1) < 0.1) {
    console.log(`Boiling point: T=${temperature}K, P=${pressure}atm, Phase=${phase}`);
    console.log(`  VaporP=${vaporP}, FusionP=${fusionP}, SublimationP=${sublimationP}`);
  }
  
  if (Math.abs(temperature - 647.096) < 0.1 && Math.abs(pressure - 218.0) < 0.1) {
    console.log(`Critical point: T=${temperature}K, P=${pressure}atm, Phase=${phase}`);
    console.log(`  VaporP=${vaporP}, FusionP=${fusionP}, SublimationP=${sublimationP}`);
  }
  
  // Debug log for phase changes (when moving between regions)
  const prevPhase = useRef(phase);
  if (prevPhase.current !== phase) {
    console.log(`Phase change: ${prevPhase.current} → ${phase} at T=${Math.round(kelvinToCelsius(temperature))}°C, P=${pressure}atm`);
    console.log(`  VaporP=${vaporP}, FusionP=${fusionP}, SublimationP=${sublimationP}`);
    prevPhase.current = phase;
  }

  // Debug log for specific coordinates
  if (Math.abs(temperature - 254.69) < 0.1 && Math.abs(pressure - 300) < 0.1) {
    console.log(`Current phase at ${Math.round(kelvinToCelsius(temperature))}°C, ${pressure}atm: ${phase}`);
  }
  
  // Debug log for freezing point
  if (Math.abs(temperature - 273.15) < 0.1 && Math.abs(pressure - 1) < 0.1) {
    console.log(`Freezing point at ${Math.round(kelvinToCelsius(temperature))}°C, ${pressure}atm: ${phase}`);
  }

  // Debug log for triple point
  if (Math.abs(temperature - T_TRIPLE) < 0.01 && Math.abs(pressure - P_TRIPLE) < 0.001) {
    console.log(`Triple point at ${Math.round(kelvinToCelsius(temperature))}°C, ${pressure}atm: ${phase}`);
    console.log(`  Last control used: ${lastControlUsed}, Is linked: ${isLinked}, Starting direction: ${startingDirection}`);
  }

  // Debug log for starting direction behavior
  if (startingDirection && isLinked) {
    console.log(`Starting direction active: ${startingDirection}, T=${Math.round(kelvinToCelsius(temperature))}°C, P=${pressure}atm`);
  }

  // Debug log for 100°C to verify mapping
  if (Math.abs(temperature - 373.15) < 0.1) {
    console.log(`100°C mapping: temperature=${temperature}K, mapped position=${mapT(temperature)}, 523.15K position=${mapT(523.15)}`);
  }

  // Debug log for critical point to verify mapping
  if (Math.abs(temperature - 647.096) < 0.1) {
    console.log(`Critical point mapping: temperature=${temperature}K, mapped position=${mapT(temperature)}`);
  }

  // Debug log for slider values
  console.log(`Slider debug: actual temp=${temperature}K (${Math.round(kelvinToCelsius(temperature))}°C), stretched=${getStretchedTemperature(temperature)}`);

  // Calculate thermometer color based on temperature
  const thermometerColor = interpolateColor(temperature, minT, maxT);

  // Optimize handlers with useCallback
  const handleTempChange = useCallback((text) => {
    setIsTyping(true);
    setLastControlUsed('temperature'); // Track that temperature control was used
    
    // Allow any text input - no validation constraints
    setTempInput(text);
    const num = parseFloat(text);
    if (!isNaN(num)) {
      // Convert Celsius to Kelvin for internal calculations
      const kelvinTemp = celsiusToKelvin(num);
      // Allow any temperature value without range restrictions
      setTemperature(kelvinTemp);
      
      // If linked, automatically adjust pressure to stay on phase boundary
      if (isLinked) {
        // Check for starting point behavior first
        const startingPointResult = handleStartingPointBehavior(kelvinTemp, 'temperature');
        
        if (startingPointResult) {
          // Use starting point behavior
          setTemperature(startingPointResult.newTemperature);
          setPressure(startingPointResult.newPressure);
          setPressureSliderValue(pressureToLogSlider(startingPointResult.newPressure));
        } else {
          // Use normal boundary logic
          let newPressure = getBoundaryPressure(kelvinTemp, 'temperature');
          // Clamp pressure to valid range
          newPressure = Math.max(minP, Math.min(maxP, newPressure));
          setPressure(newPressure);
          setPressureSliderValue(pressureToLogSlider(newPressure));
        }
      }
    }
    // Reset typing state after a short delay
    setTimeout(() => setIsTyping(false), 100);
  }, [isLinked, minP, maxP, pressure, lastControlUsed, temperature]);

  const handlePressureChange = useCallback((text) => {
    setIsTyping(true);
    setLastControlUsed('pressure');
    // Allow only up to 4 digits and at most one decimal point
    // Acceptable: 1234, 12.34, 1.234, .123, 0.123, 1234.
    // Not acceptable: 12345, 12.345, 1.2345, 123.45, 12345.6, etc.
    // Regex: up to 4 digits, optional decimal, up to 4 digits after decimal, but total digits (excluding decimal) <= 4
    let valid = false;
    if (/^\d{0,4}$/.test(text)) {
      valid = true;
    } else if (/^\d{0,4}\.$/.test(text)) {
      valid = true;
    } else if (/^\d{0,4}\.(\d{0,4})$/.test(text)) {
      // Only allow if total digits <= 4
      const [whole, frac] = text.split('.');
      if ((whole.length + frac.length) <= 4) valid = true;
    } else if (/^\.\d{0,4}$/.test(text)) {
      // Leading decimal, e.g. .123
      if (text.replace('.', '').length <= 4) valid = true;
    }
    if (valid) {
      setPressureInput(text);
      const num = parseFloat(text);
      if (!isNaN(num)) {
        if (num >= minP && num <= maxP) {
          setPressure(num);
          setPressureSliderValue(pressureToLogSlider(num));
          setPressureWarning(false);
          if (isLinked) {
            const startingPointResult = handleStartingPointBehavior(num, 'pressure');
            if (startingPointResult) {
              setTemperature(startingPointResult.newTemperature);
              setPressure(startingPointResult.newPressure);
              setPressureSliderValue(pressureToLogSlider(startingPointResult.newPressure));
            } else {
              if (startingDirection === 'pressure') {
                const boundaryTemperature = getFusionCurveTemperature(num);
                setTemperature(boundaryTemperature);
              } else {
                const newActualTemp = getVisualCurveTemperature(num);
                setTemperature(newActualTemp);
              }
            }
          }
        } else {
          setPressureWarning(true);
        }
      }
    }
    // Reset typing state after a short delay
    setTimeout(() => setIsTyping(false), 100);
  }, [isLinked, minP, maxP, temperature, pressure, startingDirection]);

  // Update input values when sliders change (but not when typing)
  const [isTyping, setIsTyping] = useState(false);

  // Removed redundant useEffect that was causing conflicts with link button handler
  // The triple point snapping is now handled only in the link button onPress

  useEffect(() => {
    if (!isTyping) {
      setTempInput(Math.round(kelvinToCelsius(temperature)).toString());
    }
  }, [temperature, isTyping]);

  useEffect(() => {
    if (!isTyping) {
      setPressureInput(pressure.toString());
      setPressureSliderValue(pressureToLogSlider(pressure));
      setPressureWarning(false);
    }
  }, [pressure, isTyping]);

  // Wait until orientation is locked AND the dimensions reflect landscape mode.
  // This prevents rendering with stale portrait dimensions.
  if (!orientationLocked || !isLandscape) {
    // Display a loading indicator while the screen orients itself.
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryAccent} />
        <Text style={[styles.loadingText, { 
          color: theme.titleText,
          fontSize: fontSubtitle,
          marginTop: hp('1.5'),
        }]}>Adjusting to landscape...</Text>
      </View>
    );
  }

  const boilingData = [
    [273.16, 0.006117],
    [300, 0.03],
    [323.15, 0.1],
    [350, 0.4],
    [373.15, 1],        // Boiling point
    [400, 2.4],
    [450, 9.4],
    [500, 27],
    [550, 63],
    [600, 126],
    [647.096, 218.0]    // Critical point
  ];
  
  const boilingPath = boilingData.map(([T, P], i) => {
    const x = mapT(T).toFixed(2);
    const y = mapP(P).toFixed(2);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  // Helper functions for triple point logic
  const getFusionCurvePressure = (temperature) => {
    // Use the fusion curve data points for pressure calculation
    const fusionData = [
      { P: 0.006117, T: 273.16 }, // triple point (exact)
      { P: 0.01, T: 273.15 },
      { P: 0.1, T: 273.15 },
      { P: 1, T: 273.15 },        // freezing point at 1 atm and 0°C (273.15 K) - FIXED
      { P: 10, T: 273.14 },
      { P: 50, T: 273.13 },
      { P: 100, T: 273.12 },
      { P: 130, T: 273.11 },
      { P: 150, T: 273.10 },
      { P: 200, T: 273.09 },
      { P: 250, T: 273.08 },
      { P: 300, T: 273.07 },      // Extended to 300 atm - nearly vertical
    ];
    
    // Handle edge cases
    if (temperature <= fusionData[fusionData.length - 1].T) {
      return fusionData[fusionData.length - 1].P;
    }
    if (temperature >= fusionData[0].T) {
      return fusionData[0].P;
    }
    
    // Find the two boundary points to interpolate between
    for (let i = 0; i < fusionData.length - 1; i++) {
      const currentPoint = fusionData[i];
      const nextPoint = fusionData[i + 1];
      
      if (temperature >= nextPoint.T && temperature <= currentPoint.T) {
        // Linear interpolation between the two points
        const t = (currentPoint.T - temperature) / (currentPoint.T - nextPoint.T);
        return currentPoint.P * (1 - t) + nextPoint.P * t;
      }
    }
    
    return fusionData[0].P; // Default to triple point pressure
  };

  const getVaporizationCurvePressure = (temperature) => {
    // Use the vaporization curve (same as getVisualCurvePressure)
    return getVisualCurvePressure(temperature);
  };

  // Function to determine which boundary to follow at triple point
  const getBoundaryPressure = (temperature, controlType) => {
    // Check if we're at triple point (0.01°C = 273.16K)
    const isAtTriplePoint = Math.abs(temperature - T_TRIPLE) < 0.01;
    
    if (isAtTriplePoint) {
      // At triple point, follow different boundaries based on control type
      if (controlType === 'temperature') {
        // Follow vaporization curve (triple to boiling point)
        return getVisualCurvePressure(temperature);
      } else if (controlType === 'pressure') {
        // Follow fusion curve (triple to freezing point)
        return getFusionCurvePressure(temperature);
      }
    }
    
    // Default behavior: follow the vaporization curve
    return getVisualCurvePressure(temperature);
  };

  const getFusionCurveTemperature = (pressure) => {
    // Use the fusion curve data points for temperature calculation
    // The fusion curve should be nearly vertical (temperature stays around 273K)
    const fusionData = [
      { P: 0.006117, T: 273.16 }, // triple point (exact)
      { P: 0.01, T: 273.15 },
      { P: 0.1, T: 273.15 },
      { P: 1, T: 273.15 },        // freezing point at 1 atm and 0°C (273.15 K)
      { P: 10, T: 273.14 },
      { P: 50, T: 273.13 },
      { P: 100, T: 273.12 },
      { P: 130, T: 273.11 },
      { P: 150, T: 273.10 },
      { P: 200, T: 273.09 },
      { P: 250, T: 273.08 },
      { P: 300, T: 273.07 },      // Extended to 300 atm - nearly vertical
    ];
    
    // Handle edge cases
    if (pressure <= fusionData[0].P) {
      console.log(`getFusionCurveTemperature: pressure ${pressure} <= ${fusionData[0].P}, returning ${fusionData[0].T}K`);
      return fusionData[0].T;
    }
    if (pressure >= fusionData[fusionData.length - 1].P) {
      console.log(`getFusionCurveTemperature: pressure ${pressure} >= ${fusionData[fusionData.length - 1].P}, returning ${fusionData[fusionData.length - 1].T}K`);
      return fusionData[fusionData.length - 1].T;
    }
    
    // Find the two boundary points to interpolate between
    for (let i = 0; i < fusionData.length - 1; i++) {
      const currentPoint = fusionData[i];
      const nextPoint = fusionData[i + 1];
      
      if (pressure >= currentPoint.P && pressure <= nextPoint.P) {
        // Linear interpolation between the two points
        const t = (pressure - currentPoint.P) / (nextPoint.P - currentPoint.P);
        const result = currentPoint.T * (1 - t) + nextPoint.T * t;
        console.log(`getFusionCurveTemperature: interpolating between P=${currentPoint.P}atm(T=${currentPoint.T}K) and P=${nextPoint.P}atm(T=${nextPoint.T}K), result T=${result}K`);
        return result;
      }
    }
    
    console.log(`getFusionCurveTemperature: no interpolation found, returning default ${fusionData[0].T}K`);
    return fusionData[0].T; // Default to triple point temperature
  };

  // Helper: interpolate temperature along fusion curve from triple point to freezing point
  const getTripleToFreezingTemp = (pressure) => {
    // Triple point: (273.16 K, 0.006117 atm)
    // Freezing point: (273.15 K, 1 atm)
    const P1 = 0.006117, T1 = 273.16;
    const P2 = 1, T2 = 273.15;
    if (pressure <= P1) return T1;
    if (pressure >= P2) return T2;
    // Linear interpolation (since the segment is nearly vertical)
    const t = (pressure - P1) / (P2 - P1);
    return T1 + (T2 - T1) * t;
  };

  // Helper function to check if we're at starting point and determine boundary behavior
  const handleStartingPointBehavior = (newValue, controlType) => {
    // Check if we're currently at the starting point (triple point: 0.01°C, 0.006117 atm)
    const isAtStartingPoint = Math.abs(temperature - T_TRIPLE) < 0.01 && Math.abs(pressure - P_TRIPLE) < 0.001;
    
    console.log(`handleStartingPointBehavior: newValue=${newValue}, controlType=${controlType}, T=${temperature}K, P=${pressure}atm`);
    console.log(`  isAtStartingPoint=${isAtStartingPoint}, isLinked=${isLinked}, startingDirection=${startingDirection}`);
    
    // If we're at the starting point and linked, set the starting direction
    if (isAtStartingPoint && isLinked) {
      setStartingDirection(controlType);
      console.log(`Starting point behavior: controlType=${controlType}, newValue=${newValue}, setting direction to ${controlType}`);
      
      // Immediately return the appropriate behavior based on control type
      if (controlType === 'pressure') {
        // User started with pressure control - follow fusion curve (NEARLY VERTICAL LINE)
        const boundaryTemperature = getFusionCurveTemperature(newValue);
        console.log(`TRIPLE POINT: Following fusion curve to P=${newValue}atm, T=${boundaryTemperature}K`);
        return {
          newTemperature: boundaryTemperature,
          newPressure: newValue
        };
      } else if (controlType === 'temperature') {
        // User started with temperature control - follow vaporization curve
        const boundaryPressure = getVisualCurvePressure(newValue);
        console.log(`TRIPLE POINT: Following vaporization curve to T=${newValue}K, P=${boundaryPressure}atm`);
        return {
          newTemperature: newValue,
          newPressure: Math.max(minP, Math.min(maxP, boundaryPressure))
        };
      }
    }
    
    // If user switches control types, reset the starting direction
    if (startingDirection && startingDirection !== controlType) {
      console.log(`Control type switched from ${startingDirection} to ${controlType}, resetting starting direction`);
      setStartingDirection(null);
      return null;
    }
    
    // If we have a starting direction and we're linked, follow that direction
    if (startingDirection && isLinked) {
      console.log(`Following starting direction: ${startingDirection}, controlType=${controlType}, newValue=${newValue}`);
      
      if (startingDirection === 'temperature') {
        // User started with temperature control - follow vaporization curve
        const boundaryPressure = getVisualCurvePressure(newValue);
        console.log(`Following vaporization curve to T=${newValue}K, P=${boundaryPressure}atm`);
        return {
          newTemperature: newValue,
          newPressure: Math.max(minP, Math.min(maxP, boundaryPressure))
        };
      } else if (startingDirection === 'pressure') {
        // User started with pressure control - follow fusion curve (NEARLY VERTICAL LINE)
        // Clamp pressure to maximum value to prevent going beyond 300 atm
        const clampedPressure = Math.min(newValue, maxP);
        const boundaryTemperature = getFusionCurveTemperature(clampedPressure);
        console.log(`Following fusion curve to P=${clampedPressure}atm, T=${boundaryTemperature}K`);
        
        // If we're at the maximum pressure, stay there and don't reset
        if (clampedPressure >= maxP) {
          console.log(`Reached maximum pressure (${maxP}atm), staying at fusion curve endpoint`);
          return {
            newTemperature: boundaryTemperature,
            newPressure: maxP
          };
        }
        
        return {
          newTemperature: boundaryTemperature,
          newPressure: clampedPressure
        };
      }
    }
    
    // Not at starting point or not linked, use normal boundary logic
    console.log(`Returning null - not at starting point or not linked`);
    return null;
  };

  return (
    <>
      <View 
        key={theme.background}
        style={[styles.root, isLandscape && styles.rootLandscape, { backgroundColor: theme.background }]}
      >
      <TouchableOpacity 
        style={[styles.backButton, { 
          backgroundColor: theme.buttonPrimary,
          borderColor: theme.primaryAccent,
          shadowColor: theme.shadowColor,
          elevation: elevation,
          top: backButtonTop,
          right: backButtonRight,
          padding: wp('2'),
          paddingHorizontal: wp('3'),
          borderRadius: borderRadius,
          borderWidth: 2,
          borderBottomWidth: 4,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: shadowRadius,
        }]}
        onPress={handleBackPress}
      >
        <Text style={[styles.backButtonText, { 
          color: theme.titleText,
          fontSize: fontBackButton,
          marginRight: wp('1.5'),
        }]}>Back</Text>
        <EntypoIcon name="back" size={fontBackButton} color={theme.titleText} />
      </TouchableOpacity>

      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          isLandscape && styles.sidebarLandscape,
          { 
            width: currentSidebarWidth,
            backgroundColor: theme.cardBackground,
            borderRightColor: theme.borderColor,
            shadowColor: theme.shadowColor,
            overflow: 'hidden',
            justifyContent: 'flex-start',
            paddingBottom: hp('2'),
          },
        ]}
      >
        <Image source={logoPlaceholder} style={[styles.logo, { 
          backgroundColor: theme.isDarkTheme ? theme.buttonSecondary : '#B3E5FC',
          borderColor: theme.isDarkTheme ? theme.borderColor : '#0288D1',
          tintColor: '#000',
          width: logoSize,
          height: logoSize,
        }]} />
        <View style={[styles.thermometerContainer, {
          marginTop: hp('2'), 
          marginBottom: hp('1'), 
          marginLeft: wp('3'),
          alignItems: 'center',
          justifyContent: 'center',
        }]}>
          <Svg height={thermometerHeight} width={thermometerWidth} style={{ marginLeft: wp('2') }}>
            {/* Calculate responsive dimensions */}
            {(() => {
              const tubeWidth = Math.max(6, thermometerWidth * 0.12);
              const tubeHeight = Math.max(80, thermometerHeight * 0.7);
              const tubeX = Math.max(12, thermometerWidth * 0.2);
              const tubeY = Math.max(20, thermometerHeight * 0.15);
              const bulbRadius = Math.max(8, thermometerWidth * 0.15);
              const bulbX = tubeX + tubeWidth / 2;
              const bulbY = tubeY + tubeHeight + bulbRadius;
              const scaleX = tubeX + tubeWidth + 8;
              const displayWidth = Math.max(20, thermometerWidth * 0.4);
              const displayHeight = Math.max(12, thermometerHeight * 0.1);
              const displayX = Math.max(8, thermometerWidth * 0.15);
              const displayY = Math.max(4, thermometerHeight * 0.05);
              
              return (
                <>
                  {/* Main glass tube */}
                  <Rect 
                    x={tubeX} 
                    y={tubeY} 
                    width={tubeWidth} 
                    height={tubeHeight} 
                    rx={tubeWidth / 2} 
                    fill={theme.isDarkTheme ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)'} 
                    stroke={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'} 
                    strokeWidth="1"
                  />
                  
                  {/* Inner glass tube (transparent) */}
                  <Rect 
                    x={tubeX + 2} 
                    y={tubeY + 2} 
                    width={tubeWidth - 4} 
                    height={tubeHeight - 4} 
                    rx={(tubeWidth - 4) / 2} 
                    fill={theme.isDarkTheme ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.2)'} 
                    stroke="none"
                  />
                  
                  {/* Mercury/fluid column */}
                  <Rect
                    x={tubeX + 2}
                    y={bulbY - bulbRadius - ((getStretchedTemperature(temperature) - minT) / (maxT - minT)) * (tubeHeight - 4)}
                    width={tubeWidth - 4}
                    height={((getStretchedTemperature(temperature) - minT) / (maxT - minT)) * (tubeHeight - 4)}
                    fill={thermometerColor}
                    rx={(tubeWidth - 4) / 2}
                  />
                  
                  {/* Bulb at bottom */}
                  <Circle
                    cx={bulbX}
                    cy={bulbY}
                    r={bulbRadius}
                    fill={thermometerColor}
                    stroke={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'}
                    strokeWidth="1"
                  />
                  
                  {/* Bulb highlight */}
                  <Circle
                    cx={bulbX - 2}
                    cy={bulbY - 2}
                    r={bulbRadius * 0.3}
                    fill={theme.isDarkTheme ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)'}
                    stroke="none"
                  />
                  
                  {/* Scale markings - major ticks */}
                  {[273.15, 223.15, 323.15, 373.15, 646.15].map((temp, i) => {
                    const stretchedT = getStretchedTemperature(temp);
                    const y = bulbY - bulbRadius - ((stretchedT - minT) / (maxT - minT)) * (tubeHeight - 4);
                    return (
                      <React.Fragment key={`major-${temp}`}>
                        <Rect
                          x={scaleX}
                          y={y - 1}
                          width={6}
                          height={2}
                          fill={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'}
                          rx="1"
                        />
                        <SvgText
                          x={scaleX + 10}
                          y={y + 4}
                          fontSize={Math.max(8, fontSlider * 0.8)}
                          fill={theme.subtitleText}
                          fontWeight="bold"
                        >
                          {Math.round(kelvinToCelsius(temp))}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}
                  {/* Add 50°C tick */}
                  {(() => {
                    const temp = 273.15 + 50;
                    const stretchedT = getStretchedTemperature(temp);
                    const y = bulbY - bulbRadius - ((stretchedT - minT) / (maxT - minT)) * (tubeHeight - 4);
                    return (
                      <React.Fragment key="major-50">
                        <Rect
                          x={scaleX}
                          y={y - 1}
                          width={6}
                          height={2}
                          fill={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'}
                          rx="1"
                        />
                        <SvgText
                          x={scaleX + 10}
                          y={y + 4}
                          fontSize={Math.max(8, fontSlider * 0.8)}
                          fill={theme.subtitleText}
                          fontWeight="bold"
                        >
                          50
                        </SvgText>
                      </React.Fragment>
                    );
                  })()}
                  {/* Add -50°C tick */}
                  {(() => {
                    const temp = 273.15 - 50;
                    const stretchedT = getStretchedTemperature(temp);
                    const y = bulbY - bulbRadius - ((stretchedT - minT) / (maxT - minT)) * (tubeHeight - 4);
                    return (
                      <React.Fragment key="major--50">
                        <Rect
                          x={scaleX}
                          y={y - 1}
                          width={6}
                          height={2}
                          fill={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'}
                          rx="1"
                        />
                        <SvgText
                          x={scaleX + 10}
                          y={y + 4}
                          fontSize={Math.max(8, fontSlider * 0.8)}
                          fill={theme.subtitleText}
                          fontWeight="bold"
                        >
                          -50
                        </SvgText>
                      </React.Fragment>
                    );
                  })()}
                  
                  {/* Scale markings - minor ticks */}
                  {[273.15, 373.15, 646.15].map((temp, i) => {
                    const stretchedT = getStretchedTemperature(temp);
                    const y = bulbY - bulbRadius - ((stretchedT - minT) / (maxT - minT)) * (tubeHeight - 4);
                    return (
                      <Rect
                        key={`minor-${temp}`}
                        x={scaleX + 2}
                        y={y - 0.5}
                        width={3}
                        height={1}
                        fill={theme.isDarkTheme ? '#4895EF' : '#64B5F6'}
                        rx="0.5"
                      />
                    );
                  })}
                  
                  {/* Temperature value display */}
                  <Rect
                    x={displayX}
                    y={displayY}
                    width={displayWidth}
                    height={displayHeight}
                    rx={3}
                    fill={theme.isDarkTheme ? 'rgba(76, 201, 240, 0.2)' : 'rgba(255,255,255,0.95)'}
                    stroke={theme.isDarkTheme ? '#4CC9F0' : '#1976D2'}
                    strokeWidth="1"
                  />
                  <SvgText
                    x={displayX + displayWidth / 2}
                    y={displayY + displayHeight * 0.7}
                    fontSize={Math.max(8, fontSlider * 0.8)}
                    fill={thermometerColor}
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {Math.round(kelvinToCelsius(temperature))}
                  </SvgText>
                  <SvgText
                    x={displayX + displayWidth + 2}
                    y={displayY + displayHeight * 0.7}
                    fontSize={Math.max(8, fontSlider * 0.8)}
                    fill={thermometerColor}
                    fontWeight="bold"
                    textAnchor="start"
                  >
                    °C
                  </SvgText>
                  
                  {/* Glass reflection */}
                  <Rect
                    x={tubeX + 1}
                    y={tubeY + 2}
                    width={2}
                    height={tubeHeight - 4}
                    fill={theme.isDarkTheme ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)'}
                    rx="1"
                  />
                </>
              );
            })()}
          </Svg>
        </View>
        
        {/* Help button */}
        <TouchableOpacity
          style={[styles.helpButton, {
            backgroundColor: theme.buttonSecondary,
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
            width: helpButtonSize,
            height: helpButtonSize,
            borderRadius: helpButtonSize / 2,
            marginTop: moleculeMargin,
            marginBottom: moleculeMargin,
            shadowOpacity: 0.09,
            shadowRadius: shadowRadius,
            borderWidth: 2,
            elevation: elevation,
          }]}
          onPress={() => handlePress(() => navigation.navigate('Help'))}
        >
          <Text style={[styles.helpButtonText, { 
            color: theme.titleText,
            fontSize: fontHelpButton,
          }]}>?</Text>
        </TouchableOpacity>
        
        {/* Link toggle button */}
        <TouchableOpacity
          style={[styles.linkButton, {
            backgroundColor: isLinked ? theme.primaryAccent : theme.buttonSecondary,
            borderColor: isLinked ? theme.primaryAccent : theme.borderColor,
            shadowColor: theme.shadowColor,
            width: linkButtonSize,
            height: linkButtonSize,
            borderRadius: linkButtonSize / 2,
            marginTop: moleculeMargin,
            marginBottom: moleculeMargin,
            shadowOpacity: 0.09,
            shadowRadius: shadowRadius,
            borderWidth: 2,
            elevation: elevation,
          }]}
          onPress={() => handlePress(() => {
            // Reset all state variables to their initial values
            setTemperature(273.15); // Reset to 0°C (273.15 K)
            setPressure(1); // Reset to freezing point (1 atm)
            setPressureSliderValue(pressureToLogSlider(1)); // Reset pressure slider
            setTempInput("0"); // Reset temperature input
            setPressureInput("1"); // Reset pressure input
            setPressureWarning(false); // Reset pressure warning
            setLastControlUsed(null); // Reset last control used
            setStartingDirection(null); // Reset starting direction
            
            // Toggle linking state
            setIsLinked(!isLinked);
            
            // If turning on linking, snap to triple point
            if (!isLinked) {
              const triplePointTemp = 273.16; // 0.01°C in Kelvin
              const triplePointPressure = 0.006117; // Triple point pressure in atm
              setTemperature(triplePointTemp);
              setPressure(triplePointPressure);
              setPressureSliderValue(pressureToLogSlider(triplePointPressure));
              setTempInput("0.01"); // Update input to show triple point
              setPressureInput("0.006"); // Update input to show triple point
            }
          })}
        >
          <Icon 
            name={isLinked ? "link-variant" : "link-variant-off"} 
            size={fontSlider} 
            color={isLinked ? theme.titleText : theme.subtitleText} 
          />
        </TouchableOpacity>
        
        {/* Link label */}
        <Text style={[styles.linkLabel, { 
          color: theme.subtitleText,
          fontSize: fontLinkLabel,
        }]}>
          {isLinked ? "LINKED" : "LINK"}
        </Text>
      </View>

      {/* Main Content */}
      <View style={[styles.content, { backgroundColor: theme.background }]}>
        <View style={styles.headerRowNew}>
          <Text style={[styles.titleNew, { 
            color: theme.primaryAccent,
            fontSize: fontTitle,
          }]}>Phase Diagram</Text>
        </View>

        <View style={[styles.mainDisplayArea, { 
          flex: 1,
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          paddingHorizontal: mainPadding,
        }]}>
          {/* Left: Vertical Pressure Slider */}
          <View style={[styles.pressureControlContainer, { 
            height: currentDiagramHeight + currentDiagramMargin,
            paddingHorizontal: mainPadding,
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
            borderWidth: 2,
            borderRadius: borderRadius,
            shadowOpacity: 0.1,
            shadowRadius: shadowRadius,
            elevation: 6,
            paddingVertical: contentPadding,
            justifyContent: "space-between",
          }]}>
            <Text style={[styles.sliderLabelVertical, { 
              color: theme.titleText,
              fontSize: fontSlider,
            }]}>PRESSURE</Text>
            <View
              style={[
                styles.verticalSliderWrapper,
                { height: currentDiagramHeight * 0.6 },
              ]}
            >
              <Slider
                style={[styles.verticalSlider, { width: currentDiagramHeight * 0.6 }]}
                minimumValue={isLinked ? 0.006 : 0}
                maximumValue={1}
                value={pressureSliderValue}
                onValueChange={(value) => {
                  setPressureSliderValue(value);
                  setLastControlUsed('pressure'); // Track that pressure control was used
                  let newPressure = logSliderToPressure(value);
                  if (isLinked && newPressure < 0.006) newPressure = 0.006;
                  setPressure(newPressure);
                  
                  // If linked, automatically adjust temperature to stay on phase boundary
                  if (isLinked) {
                    // Check for starting point behavior first
                    const startingPointResult = handleStartingPointBehavior(newPressure, 'pressure');
                    
                    if (startingPointResult) {
                      // Use starting point behavior
                      console.log(`Pressure slider: Using starting point behavior - T=${startingPointResult.newTemperature}K, P=${startingPointResult.newPressure}atm`);
                      setTemperature(startingPointResult.newTemperature);
                      setPressure(startingPointResult.newPressure);
                      
                      // If we're at maximum pressure, ensure slider stays at 1.0
                      if (startingPointResult.newPressure >= maxP) {
                        console.log(`At maximum pressure, setting slider to 1.0`);
                        setPressureSliderValue(1.0);
                      } else {
                        setPressureSliderValue(pressureToLogSlider(startingPointResult.newPressure));
                      }
                    } else {
                      // Use boundary logic based on starting direction
                      if (startingDirection === 'pressure') {
                        // Follow fusion curve (nearly vertical)
                        const boundaryTemperature = getFusionCurveTemperature(newPressure);
                        console.log(`Pressure slider: Following fusion curve - P=${newPressure}atm, T=${boundaryTemperature}K`);
                        setTemperature(boundaryTemperature);
                      } else {
                        // Follow vaporization curve (default)
                        const newActualTemp = getVisualCurveTemperature(newPressure);
                        console.log(`Pressure slider: Following vaporization curve - P=${newPressure}atm, T=${newActualTemp}K`);
                        setTemperature(newActualTemp);
                      }
                    }
                  }
                }}
                minimumTrackTintColor="#ffa500"
                maximumTrackTintColor={theme.isDarkTheme ? theme.cardBackground : '#1976D2'}
                thumbTintColor="#7ed957"
                step={0.001}
                thumbStyle={{ width: 32, height: 32 }}
              />
            </View>
            <View style={[styles.inputContainer, {
              width: inputWidth,
              height: inputHeight,
            }]}>
              <TextInput
                style={[
                  styles.valueInput,
                  { 
                    color: pressureWarning ? "#ff4444" : "#ffa500",
                    borderColor: pressureWarning ? "#ff4444" : theme.borderColor,
                    backgroundColor: theme.cardBackground,
                    fontSize: fontInput,
                    width: inputWidth * 0.7,
                  }
                ]}
                value={pressureInput}
                onChangeText={handlePressureChange}
                keyboardType="decimal-pad"
                selectTextOnFocus
                maxLength={5}
                placeholder="0.001"
                placeholderTextColor="#ffa50080"
              />
              <Text style={[styles.inputUnit, { 
                color: pressureWarning ? "#ff4444" : "#ffa500",
                fontSize: fontInput,
              }]}> atm</Text>
            </View>
            {pressureWarning && (
              <Text style={[styles.warningText, {
                fontSize: fontWarning,
                marginTop: inputMargin,
              }]}>
                Max: 300.000 atm
              </Text>
            )}
          </View>

          {/* Center: Diagram and Temperature Slider */}
          <View style={[styles.centerColumn, { paddingHorizontal: centerPadding }]}>
            <View
              style={[
                styles.diagramContainerNew,
                {
                  width: currentDiagramWidth,
                  height: currentDiagramHeight + currentDiagramMargin,
                  marginTop: 0,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderColor,
                  shadowColor: theme.shadowColor,
                  elevation: 6,
                },
              ]}
            >
              <Svg
                height={currentDiagramHeight}
                width={currentDiagramWidth}
                style={[styles.diagramSvg, { marginTop: -40, marginLeft: 40 }]}
              >
                {/* Vertical axis line */}
                <Path
                  d={`M60,39 L60,${currentDiagramHeight - 40}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  opacity="0.7"
                  fill="none"
                />
                {/* Horizontal axis line */}
                <Path
                  d={`M60,${currentDiagramHeight - 40} L${currentDiagramWidth - 60},${currentDiagramHeight - 40}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  opacity="0.7"
                  fill="none"
                />
                {/* --- Phase regions (accurate for water) --- */}
                {/* Gas region (below vaporization curve and sublimation curve) */}
                <Path
                  d={(() => {
                    // Generate sublimation curve points for gas region boundary
                    const sublimationPoints = [];
                    for (let T = 200; T <= 273.16; T += 5) {
                      const P = sublimationPressure(T);
                      if (P > 0.00001 && P < 0.01) {
                        sublimationPoints.push([T, P]);
                      }
                    }
                    
                    // Create gas region path
                    let pathData = `M${mapT(minT)},${mapP(minP)} `;
                    
                    // Add sublimation curve boundary (from minT to triple point)
                    if (sublimationPoints.length > 0) {
                      sublimationPoints.forEach(([T, P], i) => {
                        const x = mapT(T);
                        const y = mapP(P);
                        pathData += `${i === 0 ? 'L' : 'L'}${x},${y} `;
                      });
                    }
                    
                    // Add vaporization curve boundary (from triple point to critical point)
                    // Start from the exact triple point coordinates
                    pathData += `M${mapT(273.16)},${mapP(0.006117)} `;
                    pathData += `Q${mapT(350)},${mapP(0.4)} ${mapT(373.15)},${mapP(1)} `;
                    pathData += `Q${mapT(580)},${mapP(30)} ${mapT(647.096)},${mapP(218.0)} `;
                    // Extend to maximum temperature at critical pressure
                    pathData += `L${mapT(maxT)},${mapP(218.0)} `;
                    // Close the path
                    pathData += `L${mapT(maxT)},${mapP(minP)} L${mapT(minT)},${mapP(minP)} Z`;
                    return pathData;
                  })()}
                  fill={phaseColors.Gas}
                  opacity="0.25"
                />
                
                {/* Solid region (above fusion curve and sublimation curve) */}
                <Path
                  d={(() => {
                    // Generate sublimation curve points for solid region boundary
                    const sublimationPoints = [];
                    for (let T = 200; T <= 273.16; T += 5) {
                      const P = sublimationPressure(T);
                      if (P > 0.00001 && P < 0.01) {
                        sublimationPoints.push([T, P]);
                      }
                    }
                    
                    // Create solid region path
                    let pathData = `M${mapT(273.16)},${mapP(0.006117)} `;
                    
                    // Add fusion curve boundary
                    pathData += `L${mapT(273.15)},${mapP(1)} L${mapT(273.14)},${mapP(10)} L${mapT(273.13)},${mapP(50)} L${mapT(273.12)},${mapP(100)} L${mapT(273.11)},${mapP(130)} L${mapT(273.10)},${mapP(150)} L${mapT(273.09)},${mapP(200)} L${mapT(273.08)},${mapP(250)} L${mapT(273.07)},${mapP(maxP)} `;
                    pathData += `L${mapT(minT)},${mapP(maxP)} `;
                    pathData += `L${mapT(minT)},${mapP(minP)} `;
                    
                    // Add sublimation curve boundary (from minT to triple point, in reverse)
                    if (sublimationPoints.length > 0) {
                      for (let i = sublimationPoints.length - 1; i >= 0; i--) {
                        const [T, P] = sublimationPoints[i];
                        const x = mapT(T);
                        const y = mapP(P);
                        pathData += `L${x},${y} `;
                      }
                    }
                    
                    // Close the path
                    pathData += `Z`;
                    
                    return pathData;
                  })()}
                  fill={phaseColors.Solid}
                  opacity="0.25"
                />
                
                {/* Liquid region (between vaporization and fusion curves) */}
                <Path
                  d={(() => {
                    // Create liquid region path
                    let pathData = `M${mapT(273.16)},${mapP(0.006117)} `;
                    // Add vaporization curve boundary (from triple point to critical point)
                    pathData += `Q${mapT(350)},${mapP(0.4)} ${mapT(373.15)},${mapP(1)} `;
                    pathData += `Q${mapT(580)},${mapP(30)} ${mapT(647.096)},${mapP(218.0)} `;
                    // Extend to maximum pressure at critical temperature
                    pathData += `L${mapT(647.096)},${mapP(maxP)} `;
                    // Add fusion curve boundary (from critical temperature to minimum temperature)
                    pathData += `L${mapT(273.07)},${mapP(maxP)} `;
                    pathData += `L${mapT(273.08)},${mapP(250)} `;
                    pathData += `L${mapT(273.09)},${mapP(200)} `;
                    pathData += `L${mapT(273.10)},${mapP(150)} `;
                    pathData += `L${mapT(273.11)},${mapP(130)} `;
                    pathData += `L${mapT(273.12)},${mapP(100)} `;
                    pathData += `L${mapT(273.13)},${mapP(50)} `;
                    pathData += `L${mapT(273.14)},${mapP(10)} `;
                    pathData += `L${mapT(273.15)},${mapP(1)} `;
                    // Close the path
                    pathData += `Z`;
                    return pathData;
                  })()}
                  fill={phaseColors.Liquid}
                  opacity="0.38"
                />
                
                {/* Supercritical region (above critical point) */}
                <Path
                  d={`
                    M${mapT(647.096)},${mapP(218.0)} L${mapT(647.096)},${mapP(300)}
                    L${mapT(maxT)},${mapP(300)}
                    L${mapT(maxT)},${mapP(218.0)}
                    Z`}
                  fill={phaseColors.Supercritical}
                  opacity="0.25"
                />
                
                {/* Phase labels - adjust x positions for stretched scale */}
                <SvgText
                  x={mapT(220)}
                  y={mapP(100)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Solid
                </SvgText>
                <SvgText
                  x={mapT(320)}
                  y={mapP(170)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Liquid
                </SvgText>
                <SvgText
                  x={mapT(500)}
                  y={mapP(0.050)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Gas
                </SvgText>
                <SvgText
                  x={mapT(650)}
                  y={mapP(250)}
                  fontSize="10"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Supercritical
                </SvgText>
                
                {/* --- Phase boundaries --- */}
                {/* Sublimation curve (solid-gas) */}
                <Path
                  d={(() => {
                    // Generate accurate sublimation curve data points
                    const sublimationPoints = [];
                    for (let T = 200; T <= 273.16; T += 5) {
                      const P = sublimationPressure(T);
                      if (P > 0.00001 && P < 0.01) { // Only include reasonable pressure values
                        sublimationPoints.push([T, P]);
                      }
                    }
                    
                    // Create SVG path from sublimation points
                    if (sublimationPoints.length > 0) {
                      const pathData = sublimationPoints.map(([T, P], i) => {
                        const x = mapT(T);
                        const y = mapP(P);
                        return `${i === 0 ? 'M' : 'L'}${x},${y}`;
                      }).join(' ');
                      return pathData;
                    }
                    return '';
                  })()}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                />
                
                {/* Fusion curve (solid-liquid, nearly vertical) - REMOVED */}
                {/* Vaporization curve (liquid-gas) - using accurate data points - REMOVED */}
                {/* X-axis ticks and labels - REMOVED */}
                {/* X-axis minor ticks - REMOVED */}
                {/* X-axis label */}
                <SvgText
                  x={currentDiagramWidth / 2}
                  y={currentDiagramHeight - 5}
                  fontSize={fontSubtitle}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.94}
                >
                  TEMPERATURE (°C)
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
                        stroke={theme.titleText}
                        strokeWidth="1.3"
                        opacity={0.6}
                      />
                      <SvgText
                        x={38}
                        y={y + 4}
                        fontSize={fontSlider}
                        fill={theme.subtitleText}
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
                  x={10}
                  y={currentDiagramHeight / 2}
                  fontSize={fontSubtitle}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.94}
                  transform={`rotate(-90 10,${currentDiagramHeight / 2})`}
                >
                  PRESSURE (atm)
                </SvgText>
                {/* Interactive point - REMOVED */}
                {/* Triple point */}
                
                {/* Critical point */}
                
                {/* First temperature tick */}
                <Path
                  d={`M${mapT(273.15)},${currentDiagramHeight - 40} L${mapT(273.15)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(273.15)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  0
                </SvgText>
                {/* -50°C tick */}
                <Path
                  d={`M${mapT(273.15 - 50)},${currentDiagramHeight - 40} L${mapT(273.15 - 50)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(273.15 - 50)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  -50
                </SvgText>
                {/* Midpoint tick (50°C) */}
                <Path
                  d={`M${mapT(273.15 + 50)},${currentDiagramHeight - 40} L${mapT(273.15 + 50)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(273.15 + 50)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  50
                </SvgText>
                {/* Second temperature tick - moved to actual 100°C position in stretched scale */}
                <Path
                  d={`M${mapT(373.15)},${currentDiagramHeight - 40} L${mapT(373.15)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(373.15)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  100
                </SvgText>
                
                {/* Third temperature tick - critical point */}
                <Path
                  d={`M${mapT(647.096)},${currentDiagramHeight - 40} L${mapT(647.096)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(647.096)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  374
                </SvgText>
                {/* Critical point dot */}
                <Circle
                  cx={mapT(647.096)}
                  cy={mapP(218.0)}
                  r="4"
                  fill={theme.titleText}
                  opacity="0.9"
                />
                {/* Critical point label */}
                <SvgText
                  x={mapT(647.096)}
                  y={mapP(218.0) + 20}
                  fontSize={fontSlider}
                  fill={theme.titleText}
                  fontWeight="bold"
                  opacity="0.9"
                >
                  Critical Point
                </SvgText>
                <SvgText
                  x={mapT(647.096)}
                  y={mapP(218.0) + 32}
                  fontSize={fontWarning}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity="0.8"
                >
                  (374°C, 218 atm)
                </SvgText>
                
                {/* Fourth temperature tick (maximum) */}
                <Path
                  d={`M${mapT(700)},${currentDiagramHeight - 40} L${mapT(700)},${currentDiagramHeight - 32}`}
                  stroke={theme.titleText}
                  strokeWidth="1.3"
                  opacity={0.6}
                />
                <SvgText
                  x={mapT(700)}
                  y={currentDiagramHeight - 18}
                  fontSize={fontSlider}
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.93}
                >
                  427
                </SvgText>
                
                {/* Triple point */}
                <Circle
                  cx={mapT(273.16)}
                  cy={mapP(0.006)}
                  r="4"
                  fill={theme.titleText}
                  opacity="0.9"
                />
                
                {/* Boiling point */}
                <Circle
                  cx={mapT(373.15)}
                  cy={mapP(1)}
                  r="4"
                  fill={theme.titleText}
                  opacity="0.9"
                />
                
                {/* Freezing point (0°C, 1 atm) */}
                <Circle
                  cx={mapT(273.15)}
                  cy={mapP(1)}
                  r="4"
                  fill={theme.titleText}
                  opacity="0.9"
                />
                
                {/* Lines connecting the three points */}
                <Path
                  d={`M${mapT(minT)},${mapP(minP)} Q${mapT(250)},${mapP(0.003)} ${mapT(273.16)},${mapP(0.006117)} Q${mapT(350)},${mapP(0.4)} ${mapT(373.15)},${mapP(1)} Q${mapT(580)},${mapP(30)} ${mapT(647.096)},${mapP(218.0)}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                />

                {/* Fusion curve (Solid-Liquid) */}
                <Path
                  d={`M${mapT(273.16)},${mapP(0.006117)} L${mapT(273.15)},${mapP(1)} L${mapT(273.14)},${mapP(10)} L${mapT(273.13)},${mapP(50)} L${mapT(273.12)},${mapP(100)} L${mapT(273.11)},${mapP(130)} L${mapT(273.10)},${mapP(150)} L${mapT(273.09)},${mapP(200)} L${mapT(273.08)},${mapP(250)} L${mapT(273.07)},${mapP(300)}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  fill="none"
                  opacity="0.8"
                />
                
                {/* Dotted line: Liquid to Supercritical boundary */}
                <Path
                  d={`M${mapT(647.096)},${mapP(218.0)} L${mapT(647.096)},${mapP(maxP)}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  opacity="0.6"
                />
                
                {/* Dotted line: Gas to Supercritical boundary */}
                <Path
                  d={`M${mapT(647.096)},${mapP(218.0)} L${mapT(maxT)},${mapP(218.0)}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  fill="none"
                  opacity="0.6"
                />
                
                {/* Dynamic coordinate point */}
                <Circle
                  cx={phasePoint.x}
                  cy={phasePoint.y}
                  r="6"
                  fill={phaseColors[phase]}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  opacity="0.9"
                />
                
                {/* Coordinate point highlight */}
                <Circle
                  cx={phasePoint.x}
                  cy={phasePoint.y}
                  r="3"
                  fill={theme.titleText}
                  opacity="0.8"
                />
                
                {/* Point labels */}
                {/* Triple point label */}
                <SvgText
                  x={mapT(273.16) + 5}
                  y={mapP(0.006) - 12}
                  fontSize="10"
                  fill={theme.titleText}
                  fontWeight="bold"
                  opacity="0.9"
                  transform={`rotate(-27 ${mapT(273.15) - 25}, ${mapP(1) - 15})`}
                >
                  Triple Point
                </SvgText>
                <SvgText
                  x={mapT(273.16) - 10}
                  y={mapP(0.006) - 1} 
                  fontSize="9"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity="0.8"
                  transform={`rotate(-27 ${mapT(273.15) - 25}, ${mapP(1) - 15})`}
                >
                  (0.01°C, 0.006 atm)
                </SvgText>
                
                {/* Boiling point label */}
                <SvgText
                  x={mapT(373.15) + 15}
                  y={mapP(0.850) - 8}
                  fontSize="10"
                  fill={theme.titleText}
                  fontWeight="bold"
                  opacity="0.9"
                >
                  Boiling Point
                </SvgText>
                <SvgText
                  x={mapT(373.15) + 15}
                  y={mapP(0.850) + 4}
                  fontSize="9"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity="0.8"
                >
                  (100°C, 1 atm)
                </SvgText>
                
                {/* Freezing point label */}
                <SvgText
                  x={mapT(273.15) - 5}
                  y={mapP(1) - 10}
                  fontSize="10"
                  fill={theme.titleText}
                  fontWeight="bold"
                  opacity="0.9"
                  textAnchor="end"
                  transform={`rotate(-90 ${mapT(273.15) - 25}, ${mapP(1) - 15})`}
                >
                  Freezing Point
                </SvgText>
                <SvgText
                  x={mapT(273.15) - 5}
                  y={mapP(2) + 15}
                  fontSize="9"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity="0.8"
                  textAnchor="end"
                  transform={`rotate(-90 ${mapT(273.15) - 25}, ${mapP(1) - 3})`}
                >
                  (0°C, 1 atm)
                </SvgText>
              </Svg>
            </View>

            <View style={[styles.sliderContainerNew, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor,
              elevation: 6,
            }]}>
              <Text style={[styles.sliderLabel, { 
                color: theme.titleText,
                fontSize: fontSlider,
              }]}>TEMPERATURE</Text>
              <Slider
                style={{ width: Math.max(140, currentDiagramWidth - 100) }}
                minimumValue={getStretchedTemperature(minT)}
                maximumValue={getStretchedTemperature(maxT)}
                value={getStretchedTemperature(temperature)} // Use stretched temperature
                onValueChange={(stretchedValue) => {
                  // Convert stretched value back to actual temperature
                  const actualTemp = getActualTemperature(stretchedValue);
                  setTemperature(actualTemp);
                  setLastControlUsed('temperature'); // Track that temperature control was used
                  
                  if (isLinked) {
                    // Check for starting point behavior first
                    const startingPointResult = handleStartingPointBehavior(actualTemp, 'temperature');
                    
                    if (startingPointResult) {
                      // Use starting point behavior
                      setTemperature(startingPointResult.newTemperature);
                      setPressure(startingPointResult.newPressure);
                      setPressureSliderValue(pressureToLogSlider(startingPointResult.newPressure));
                    } else {
                      // Use normal boundary logic
                      let boundaryPressureChange = getBoundaryPressure(actualTemp, 'temperature');
                      // Clamp pressure to valid range
                      boundaryPressureChange = Math.max(minP, Math.min(maxP, boundaryPressureChange));
                      setPressure(boundaryPressureChange);
                      setPressureSliderValue(pressureToLogSlider(boundaryPressureChange));
                    }
                  }
                }}
                onSlidingComplete={(stretchedValue) => {
                    const actualTemp = getActualTemperature(stretchedValue);
                  setLastControlUsed('temperature'); // Track that temperature control was used
                  
                  if (isLinked) {
                    // Check for starting point behavior first
                    const startingPointResult = handleStartingPointBehavior(actualTemp, 'temperature');
                    
                    if (startingPointResult) {
                      // Use starting point behavior
                      setTemperature(startingPointResult.newTemperature);
                      setPressure(startingPointResult.newPressure);
                      setPressureSliderValue(pressureToLogSlider(startingPointResult.newPressure));
                    } else {
                      // Use normal boundary logic
                      if (startingDirection === 'temperature') {
                        // Follow vaporization curve (horizontal)
                        let boundaryPressureComplete = getVisualCurvePressure(actualTemp);
                        boundaryPressureComplete = Math.max(minP, Math.min(maxP, boundaryPressureComplete));
                        setPressure(boundaryPressureComplete);
                        setPressureSliderValue(pressureToLogSlider(boundaryPressureComplete));
                      } else {
                        // Follow fusion curve (nearly vertical) - default for temperature control
                        let boundaryPressureComplete = getBoundaryPressure(actualTemp, 'temperature');
                        boundaryPressureComplete = Math.max(minP, Math.min(maxP, boundaryPressureComplete));
                        setPressure(boundaryPressureComplete);
                        setPressureSliderValue(pressureToLogSlider(boundaryPressureComplete));
                      }
                    }
                  }
                  // The temperature is already correctly set in onValueChange
                }}
                minimumTrackTintColor="#4a90e2"
                maximumTrackTintColor={theme.isDarkTheme ? theme.cardBackground : '#1976D2'}
                thumbTintColor="#e55"
                thumbStyle={{ width: 32, height: 32 }}
                step={0.1} // Smaller step for smoother movement
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.valueInput,
                    { 
                      color: "#e55",
                      borderColor: theme.borderColor,
                      backgroundColor: theme.cardBackground,
                    }
                  ]}
                  value={Math.round(kelvinToCelsius(temperature)).toString()}
                  onChangeText={handleTempChange}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  maxLength={7}
                  placeholder="0"
                  placeholderTextColor="#e55"
                />
                <Text style={[styles.inputUnit, { color: "#e55" }]}> °C</Text>
              </View>
              {/* {tempWarning && (
                <Text style={styles.warningText}>
                  Max: 427 °C
                </Text>
              )} */}
            </View>
          </View>

          {/* Right: Molecule Sims and Phase Label */}
          <View style={[styles.rightPanel, { paddingHorizontal: currentRightPanelPadding }]}>
            <View style={[styles.phaseContainer, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor,
              marginTop: hp('4'),
            }]}>
              <Text
                style={[
                  styles.phaseLabelNew,
                  {
                    color: theme.titleText,
                  },
                ]}
              >
                PHASE
              </Text>
              <View style={[styles.phaseValueContainer, {
                backgroundColor: phaseColors[phase === "Supercritical" || phase === "Critical" ? "Gas" : phase] + '20',
                borderColor: phaseColors[phase === "Supercritical" || phase === "Critical" ? "Gas" : phase],
              }]}>
                <Text
                  style={[
                    styles.phaseValueNew,
                    {
                      color: phaseColors[phase === "Supercritical" || phase === "Critical" ? "Gas" : phase],
                    },
                  ]}
                >
                  {phase}
                </Text>
              </View>
            </View>
            <View style={[styles.moleculeCircle, { 
              backgroundColor: theme.cardBackground,
              shadowColor: theme.shadowColor,
              elevation: elevation,
              borderColor: theme.borderColor,
              width: moleculeSize,
              height: moleculeSize,
              borderRadius: moleculeSize / 2,
              marginBottom: moleculeMargin,
              alignItems: 'center', // Ensure centering
              justifyContent: 'center', // Ensure centering
              display: 'flex', // Ensure flex centering
              overflow: 'hidden', // Ensure children are clipped to the container
            }]}> 
              {isLinked ? (() => {
                const tol = 0.02; // Slightly increased tolerance for robustness
                // Triple point: show all three phases
                if (Math.abs(temperature - T_TRIPLE) < 0.01 && Math.abs(pressure - P_TRIPLE) < 0.001) {
                  return <TwoPhaseMoleculeSimulator boundary="triple" width={moleculeSize} height={moleculeSize} />;
                }
                // Special case: vertical segment from triple point to freezing point
                if (
                  temperature <= T_TRIPLE && temperature >= 273.15 &&
                  pressure >= P_TRIPLE && pressure <= 1
                ) {
                  return <TwoPhaseMoleculeSimulator boundary="fusion" width={moleculeSize} height={moleculeSize} />;
                }
                // Additional special case: vertical segment for fusion between 0.007 and 0.018 atm
                if (
                  temperature <= T_TRIPLE && temperature >= 273.15 &&
                  pressure >= 0.007 && pressure <= 0.018
                ) {
                  return <TwoPhaseMoleculeSimulator boundary="fusion" width={moleculeSize} height={moleculeSize} />;
                }
                // Sublimation: below triple point line
                if (temperature < T_TRIPLE && pressure < sublimationPressure(temperature) + tol) {
                  return <TwoPhaseMoleculeSimulator boundary="sublimation" width={moleculeSize} height={moleculeSize} />;
                }
                // Vaporization: from triple point up to critical point (visual curve)
                if (
                  temperature >= T_TRIPLE && temperature <= T_CRITICAL &&
                  Math.abs(pressure - getVisualCurvePressure(temperature)) < tol
                ) {
                  return <TwoPhaseMoleculeSimulator boundary="vaporization" width={moleculeSize} height={moleculeSize} />;
                }
                // Dramatically extended fusion: for T <= T_TRIPLE + 1 and wide tolerance
                if (
                  temperature <= T_TRIPLE + 1 &&
                  Math.abs(pressure - accurateFusionCurve(temperature)) < (tol * 3)
                ) {
                  return <TwoPhaseMoleculeSimulator boundary="fusion" width={moleculeSize} height={moleculeSize} />;
                }
                // Default: single phase
                return (
                  <MoleculeSim
                    phase={phase === "Supercritical" || phase === "Critical" ? "Gas" : phase}
                    width={moleculeSize}
                    height={moleculeSize}
                  />
                );
              })() : (
                <MoleculeSim
                  phase={phase === "Supercritical" || phase === "Critical" ? "Gas" : phase}
                  width={moleculeSize}
                  height={moleculeSize}
                />
              )}
            </View>
            <View style={[styles.moleculeCircle, { 
              backgroundColor: theme.cardBackground,
              shadowColor: theme.shadowColor,
              elevation: elevation,
              borderColor: theme.borderColor,
              width: moleculeSize * 1.7,
              height: moleculeSize * 1.7,
              borderRadius: (moleculeSize * 1.7) / 2,
              marginBottom: moleculeMargin,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }]}> 
              {isLinked && Math.abs(temperature - T_TRIPLE) < 0.01 && Math.abs(pressure - P_TRIPLE) < 0.001 ? (
                <PhaseTransitionSim
                  phase="liquid"
                  width={"100%"}
                  height={"100%"}
                />
              ) : isLinked && temperature < T_TRIPLE && pressure < sublimationPressure(temperature) + 0.02 ? (
                <PhaseTransitionSim
                  phase="sublimation"
                  width={"100%"}
                  height={"100%"}
                />
              ) : (
                <PhaseTransitionSim
                  phase={phase === "Supercritical" || phase === "Critical" ? "gas" : phase.toLowerCase()}
                  width={"100%"}
                  height={"100%"}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    </View>

    
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: hp('1.5'),
    fontSize: fontSubtitle,
    fontWeight: "bold",
  },
  root: {
    flex: 1,
    flexDirection: "row",
  },
  rootLandscape: {
    flexDirection: "row",
  },
  sidebar: {
    alignItems: "center",
    paddingTop: sidebarPadding,
    borderRightWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: shadowRadius,
    overflow: 'hidden',
    justifyContent: 'flex-start',
    paddingBottom: hp('2'),
  },
  sidebarLandscape: {
    // Width is set dynamically in component
  },
  logo: {
    marginBottom: hp('1.5'),
    borderRadius: borderRadius,
    borderWidth: 2,
  },
  thermometerContainer: { 
    marginTop: hp('2'), 
    marginBottom: hp('1'), 
    marginLeft: wp('3'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    flexDirection: "column",
    padding: contentPadding,
    position: "relative",
  },
  headerRowNew: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: headerMargin,
    marginBottom: headerMargin,
  },
  titleNew: {
    fontSize: fontTitle,
    fontWeight: "bold",
    letterSpacing: 1.2,
    textShadowOffset: { width: 1.5, height: 1.5 },
    textShadowRadius: 4,
    marginBottom: 2,
  },
  mainDisplayArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: mainPadding,
  },
  pressureControlContainer: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: mainPadding,
    borderRadius: borderRadius,
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: shadowRadius,
    paddingVertical: contentPadding,
  },
  verticalSliderWrapper: {
    width: wp('12'),
    justifyContent: "center",
    alignItems: "center",
    marginVertical: sliderMargin,
  },
  verticalSlider: {
    height: hp('6'),
    transform: [{ rotate: "-90deg" }],
  },
  sliderLabelVertical: {
    fontSize: fontSlider,
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginBottom: hp('1'),
    textAlign: "center",
  },
  centerColumn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: centerPadding,
  },
  diagramContainerNew: {
    borderRadius: borderRadius,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 2,
    shadowOpacity: 0.1,
    shadowRadius: shadowRadius,
    paddingVertical: contentPadding,
  },
  diagramSvg: {
    backgroundColor: "transparent",
    borderRadius: borderRadius,
  },
  rightPanel: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: rightPanelPadding,
    minWidth: rightPanelMinWidth,
    paddingBottom: hp('6'),
  },
  sliderContainerNew: {
    width: "100%",
    marginBottom: sliderMargin,
    alignItems: "center",
    paddingVertical: contentPadding,
    borderRadius: borderRadius,
    marginTop: sliderMargin,
    borderWidth: 2,
  },
  sliderLabel: {
    fontSize: fontSlider,
    fontWeight: "bold",
    marginBottom: sliderMargin,
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: inputMargin,
    marginBottom: inputMargin,
    width: inputWidth,
    height: inputHeight,
  },
  valueInput: {
    fontSize: fontInput,
    fontWeight: 'bold',
    textAlign: 'center',
    width: inputWidth * 0.7,
    paddingHorizontal: wp('2'),
    paddingVertical: hp('0.5'),
    borderRadius: borderRadius,
    borderWidth: 1,
  },
  inputUnit: {
    fontSize: fontInput,
    fontWeight: 'bold',
    marginLeft: wp('1'),
  },
  phaseLabelNew: {
    fontSize: fontPhaseLabel,
    fontWeight: "bold",
    marginBottom: phaseMargin,
    letterSpacing: 0.7,
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  phaseValueNew: {
    fontSize: fontPhaseValue,
    fontWeight: "bold",
    marginBottom: phaseMargin,
    letterSpacing: 0.7,
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  moleculeCircle: {
    width: moleculeSize,
    height: moleculeSize,
    borderRadius: moleculeSize / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.13,
    shadowRadius: shadowRadius,
    borderWidth: 2,
    marginBottom: moleculeMargin,
  },
  warningText: {
    color: "#ff4444",
    fontSize: fontWarning,
    fontWeight: "bold",
    marginTop: inputMargin,
    textAlign: "center",
    opacity: 0.9,
  },
  homeButtonNew: {
    position: "absolute",
    right: wp('3'),
    bottom: hp('2'),
    width: helpButtonSize,
    height: helpButtonSize,
    borderRadius: helpButtonSize / 2,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.09,
    shadowRadius: shadowRadius,
    zIndex: 10,
    borderWidth: 2,
  },
  backButton: {
    position: 'absolute',
    top: backButtonTop,
    right: backButtonRight,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('2'),
    paddingHorizontal: wp('3'),
    borderRadius: borderRadius,
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: shadowRadius,
  },
  backButtonText: {
    fontSize: fontBackButton,
    fontWeight: "700",
    marginRight: wp('1.5'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  phaseContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: contentPadding,
    paddingHorizontal: wp('2'),
    borderWidth: 1,
    borderRadius: borderRadius,
    marginBottom: moleculeMargin,
  },
  phaseValueContainer: {
    paddingHorizontal: wp('1'),
    paddingVertical: hp('0.2'),
    borderWidth: 2,
    borderRadius: borderRadius,
  },
  helpButton: {
    width: helpButtonSize,
    height: helpButtonSize,
    borderRadius: helpButtonSize / 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: moleculeMargin,
    marginBottom: moleculeMargin,
    shadowOpacity: 0.09,
    shadowRadius: shadowRadius,
    borderWidth: 2,
    elevation: elevation,
  },
  helpButtonText: {
    fontSize: fontHelpButton,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp('8'),
  },
  modalContent: {
    width: wp('80'),
    maxHeight: hp('60'),
    padding: wp('7'),
    borderRadius: borderRadius,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: shadowRadius,
    elevation: elevation,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('2'),
  },
  modalTitle: {
    fontSize: fontTitle,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: wp('11'),
    height: wp('11'),
    borderRadius: wp('5.5'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: shadowRadius,
    elevation: elevation,
  },
  closeButtonText: {
    fontSize: fontHelpButton,
    fontWeight: 'bold',
  },
  modalBody: {
    width: '100%',
    alignItems: 'center',
  },
  helpText: {
    fontSize: fontSubtitle,
    marginBottom: hp('1.5'),
    textAlign: 'left',
    lineHeight: hp('2.8'),
  },
  helpSection: {
    marginBottom: hp('2.5'),
  },
  sectionTitle: {
    fontSize: fontPhase,
    fontWeight: 'bold',
    marginBottom: hp('1.2'),
  },
  colorLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: hp('1.2'),
  },
  colorItem: {
    alignItems: 'center',
    flex: 1,
  },
  colorBox: {
    width: wp('6'),
    height: wp('6'),
    marginBottom: hp('1'),
    borderWidth: 2,
    borderRadius: borderRadius,
    borderColor: '#333',
  },
  colorText: {
    fontSize: fontSlider,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  linkButton: {
    width: linkButtonSize,
    height: linkButtonSize,
    borderRadius: linkButtonSize / 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: moleculeMargin,
    marginBottom: moleculeMargin,
    shadowOpacity: 0.09,
    shadowRadius: shadowRadius,
    borderWidth: 2,
    elevation: elevation,
  },
  linkLabel: {
    fontSize: fontLinkLabel,
    fontWeight: "bold",
    marginTop: hp('0.5'),
    marginBottom: hp('1'),
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});