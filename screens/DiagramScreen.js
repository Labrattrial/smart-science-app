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
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(20, SCREEN_WIDTH * 0.06, 28);
const fontSubtitle = clamp(12, SCREEN_WIDTH * 0.035, 16);
const fontPhase = clamp(14, SCREEN_WIDTH * 0.04, 19);
const fontSlider = clamp(12, SCREEN_WIDTH * 0.035, 15);
const fontInput = clamp(12, SCREEN_WIDTH * 0.035, 15);
const moleculeSize = clamp(60, SCREEN_WIDTH * 0.15, 74);
const inputWidth = clamp(80, SCREEN_WIDTH * 0.18, 120);
const inputHeight = clamp(24, SCREEN_HEIGHT * 0.03, 30);
const logoSize = clamp(60, SCREEN_WIDTH * 0.12, 62);
const thermometerHeight = clamp(120, SCREEN_HEIGHT * 0.15, 160);
const thermometerWidth = clamp(28, SCREEN_WIDTH * 0.07, 36);
const helpButtonSize = clamp(32, SCREEN_WIDTH * 0.08, 38);
const backButtonPadding = clamp(6, SCREEN_WIDTH * 0.010, 8);
const backButtonFont = clamp(14, SCREEN_WIDTH * 0.04, 16);

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
const T_CRITICAL = 647.096; // K
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
  
  // Supercritical region
  if (T >= T_CRITICAL && P >= P_CRITICAL) {
    return "Supercritical";
  }
  
  // Above critical temperature
  if (T >= T_CRITICAL) {
    if (P < P_CRITICAL) {
      return "Gas";
    }
    return "Supercritical";
  }
  
  // Below triple point temperature - only solid and gas phases exist
  if (T < T_TRIPLE) {
    // Check sublimation curve (solid-gas boundary)
    const sublimationP = sublimationPressure(T);
    
    if (P < sublimationP) {
      return "Gas";
    } else {
      return "Solid";
    }
  }
  
  // Between triple point and critical temperature
  if (T >= T_TRIPLE && T < T_CRITICAL) {
    // Check fusion curve (solid-liquid boundary)
    const fusionP = accurateFusionCurve(T);
    
    // If pressure is above fusion curve, check vaporization curve
    if (P >= fusionP) {
      const vaporP = accurateVaporPressure(T);
      
      if (P < vaporP) {
        return "Gas";
      } else {
        return "Liquid";
      }
    } else {
      // Pressure is below fusion curve - solid region
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

// Accurate fusion curve (solid-liquid boundary) using data points
function accurateFusionCurve(T) {
  // Data points for fusion curve (pressure in atm, temperature in K)
  // Note: As pressure increases, melting temperature decreases for water
  // More accurate data points for water fusion curve (IAPWS standard)
  const fusionData = [
    { P: 0.006117, T: 273.16 }, // triple point (exact)
    { P: 0.01, T: 273.14 },
    { P: 0.1, T: 273.00 },
    { P: 1, T: 272.25 },
    { P: 10, T: 270.2 },
    { P: 50, T: 263.0 },
    { P: 100, T: 252.0 },
    { P: 150, T: 245.0 },
    { P: 200, T: 240.0 },
    { P: 250, T: 235.0 },
    { P: 300, T: 230.0 },
    { P: 400, T: 220.0 },
    { P: 500, T: 210.0 },
    { P: 600, T: 200.0 },
    { P: 700, T: 190.0 },
    { P: 800, T: 180.0 },
    { P: 900, T: 170.0 },
    { P: 1000, T: 160.0 }
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

export default function DiagramScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();

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

  const [temperature, setTemperature] = useState(T_TRIPLE); // Start at triple point (273.16 K)
  const [pressure, setPressure] = useState(P_TRIPLE); // Start at triple point (0.006117 atm)
  const [pressureSliderValue, setPressureSliderValue] = useState(pressureToLogSlider(P_TRIPLE)); // Start at triple point pressure
  const [orientationLocked, setOrientationLocked] = useState(false);
  const [tempInput, setTempInput] = useState(T_TRIPLE.toString());
  const [pressureInput, setPressureInput] = useState(P_TRIPLE.toString());
  const [tempWarning, setTempWarning] = useState(false);
  const [pressureWarning, setPressureWarning] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

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

  // Responsive sidebar width
  const sidebarWidth = Math.max(70, Math.min(120, width * 0.14));

  // Responsive diagram size - adjusted for better fit on smaller screens
  const diagramWidth = Math.max(200, Math.min(width - sidebarWidth - 180, 400));
  const diagramHeight = Math.max(140, Math.min(height - 160, 240));

  // Responsive spacing and margins
  const mainPadding = Math.max(2, Math.min(6, width * 0.01));
  const centerPadding = Math.max(4, Math.min(8, width * 0.015));
  const rightPanelPadding = Math.max(4, Math.min(8, width * 0.015));
  const diagramMargin = Math.max(4, Math.min(8, height * 0.01));

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
  
  // Debug log for specific coordinates
  if (Math.abs(temperature - 254.69) < 0.1 && Math.abs(pressure - 300) < 0.1) {
    console.log(`Current phase at ${temperature}K, ${pressure}atm: ${phase}`);
  }

  // Calculate thermometer color based on temperature
  const thermometerColor = interpolateColor(temperature, minT, maxT);

  // Optimize handlers with useCallback
  const handleTempChange = useCallback((text) => {
    // Allow only numbers and one decimal point, max 5 characters
    if (/^[0-9]*\.?[0-9]*$/.test(text) && text.length <= 5) {
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
    // Allow only numbers and one decimal point, max 7 characters
    if (/^[0-9]*\.?[0-9]*$/.test(text) && text.length <= 7) {
      setPressureInput(text);
      const num = parseFloat(text);
      if (!isNaN(num)) {
        if (num >= minP && num <= maxP) {
          setPressure(num);
          setPressureSliderValue(pressureToLogSlider(num));
          setPressureWarning(false);
        } else {
          setPressureWarning(true);
        }
      }
    }
  }, [minP, maxP]);

  // Update input values when sliders change
  useEffect(() => {
    setTempInput(temperature.toString());
    setTempWarning(false);
  }, [temperature]);

  useEffect(() => {
    setPressureInput(pressure.toString());
    setPressureSliderValue(pressureToLogSlider(pressure));
    setPressureWarning(false);
  }, [pressure]);

  // Wait until orientation is locked AND the dimensions reflect landscape mode.
  // This prevents rendering with stale portrait dimensions.
  if (!orientationLocked || !isLandscape) {
    // Display a loading indicator while the screen orients itself.
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primaryAccent} />
        <Text style={[styles.loadingText, { color: theme.titleText }]}>Adjusting to landscape...</Text>
      </View>
    );
  }

  return (
    <View 
      key={theme.background}
      style={[styles.root, isLandscape && styles.rootLandscape, { backgroundColor: theme.background }]}
    >
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
        <Icon name="arrow-right" size={20} color={theme.titleText} />
      </TouchableOpacity>

      {/* Sidebar */}
      <View
        style={[
          styles.sidebar,
          isLandscape && styles.sidebarLandscape,
          { 
            width: sidebarWidth,
            backgroundColor: theme.cardBackground,
            borderRightColor: theme.borderColor,
            shadowColor: theme.shadowColor,
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
        <View style={styles.thermometerContainer}>
          <Svg height={thermometerHeight} width={thermometerWidth}>
            <Rect x="15" y="20" width="6" height="110" rx="3" fill={theme.isDarkTheme ? theme.cardBackground : '#B3E5FC'} />
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
              stroke={theme.isDarkTheme ? theme.cardBackground : '#B3E5FC'}
              strokeWidth="2"
            />
            {[...Array(9)].map((_, i) => (
              <Rect
                key={i}
                x="23"
                y={20 + i * 13.75}
                width="8"
                height="2"
                fill={theme.isDarkTheme ? theme.cardBackground : '#0288D1'}
                opacity={i % 2 === 0 ? 1 : 0.5}
                rx={1}
              />
            ))}
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
          }]}
          onPress={() => handlePress(() => navigation.navigate('Help'))}
        >
          <Text style={[styles.helpButtonText, { 
            color: theme.titleText,
            fontSize: fontSlider,
          }]}>?</Text>
        </TouchableOpacity>
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
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 4,
        }]}>
          {/* Left: Vertical Pressure Slider */}
          <View style={[styles.pressureControlContainer, { 
            height: diagramHeight,
            paddingHorizontal: mainPadding,
          }]}>
            <View
              style={[
                styles.verticalSliderWrapper,
                { height: diagramHeight * 0.7 },
              ]}
            >
              <Slider
                style={[styles.verticalSlider, { width: diagramHeight * 0.7 }]}
                minimumValue={0}
                maximumValue={1}
                value={pressureSliderValue}
                onValueChange={(value) => {
                  setPressureSliderValue(value);
                  const newPressure = logSliderToPressure(value);
                  setPressure(newPressure);
                }}
                minimumTrackTintColor="#ffa500"
                maximumTrackTintColor={theme.isDarkTheme ? theme.cardBackground : '#1976D2'}
                thumbTintColor="#7ed957"
                step={0.001}
                thumbStyle={{ width: 32, height: 32 }}
              />
            </View>
            <Text style={[styles.sliderLabelVertical, { 
              color: theme.titleText,
              fontSize: fontSlider,
            }]}>PRESSURE</Text>
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
              <Text style={styles.warningText}>
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
                  width: diagramWidth,
                  height: diagramHeight + diagramMargin,
                  marginBottom: diagramMargin,
                  marginTop: 0,
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.borderColor,
                  shadowColor: theme.shadowColor,
                  elevation: 6,
                },
              ]}
            >
              <Svg
                height={diagramHeight}
                width={diagramWidth}
                style={[styles.diagramSvg, { marginTop: -40, marginLeft: 40 }]}
              >
                {/* --- Phase regions (accurate for water) --- */}
                {/* --- Properly fill the gas region up to the critical point using accurate vaporization curve --- */}
                <Path
                  d={`
                    M${mapT(273.15)},${mapP(0.00604)}
                    L${mapT(274)},${mapP(0.006359)}
                    L${mapT(275)},${mapP(0.006835)}
                    L${mapT(276)},${mapP(0.007343)}
                    L${mapT(277)},${mapP(0.007884)}
                    L${mapT(278)},${mapP(0.00846)}
                    L${mapT(279)},${mapP(0.009072)}
                    L${mapT(280)},${mapP(0.009723)}
                    L${mapT(281)},${mapP(0.010415)}
                    L${mapT(282)},${mapP(0.01115)}
                    L${mapT(283)},${mapP(0.01193)}
                    L${mapT(284)},${mapP(0.012757)}
                    L${mapT(285)},${mapP(0.013635)}
                    L${mapT(286)},${mapP(0.014565)}
                    L${mapT(287)},${mapP(0.01555)}
                    L${mapT(288)},${mapP(0.016592)}
                    L${mapT(289)},${mapP(0.017696)}
                    L${mapT(290)},${mapP(0.018863)}
                    L${mapT(291)},${mapP(0.020097)}
                    L${mapT(292)},${mapP(0.021401)}
                    L${mapT(293)},${mapP(0.022778)}
                    L${mapT(294)},${mapP(0.024232)}
                    L${mapT(295)},${mapP(0.025766)}
                    L${mapT(296)},${mapP(0.027384)}
                    L${mapT(297)},${mapP(0.029091)}
                    L${mapT(298)},${mapP(0.030888)}
                    L${mapT(299)},${mapP(0.032782)}
                    L${mapT(300)},${mapP(0.034776)}
                    L${mapT(301)},${mapP(0.036875)}
                    L${mapT(302)},${mapP(0.039083)}
                    L${mapT(303)},${mapP(0.041405)}
                    L${mapT(304)},${mapP(0.043846)}
                    L${mapT(305)},${mapP(0.04641)}
                    L${mapT(306)},${mapP(0.049103)}
                    L${mapT(307)},${mapP(0.051931)}
                    L${mapT(308)},${mapP(0.054899)}
                    L${mapT(309)},${mapP(0.058013)}
                    L${mapT(310)},${mapP(0.061278)}
                    L${mapT(311)},${mapP(0.0647)}
                    L${mapT(312)},${mapP(0.068287)}
                    L${mapT(313)},${mapP(0.072044)}
                    L${mapT(314)},${mapP(0.075977)}
                    L${mapT(315)},${mapP(0.080095)}
                    L${mapT(316)},${mapP(0.084404)}
                    L${mapT(317)},${mapP(0.088911)}
                    L${mapT(318)},${mapP(0.093623)}
                    L${mapT(319)},${mapP(0.098549)}
                    L${mapT(320)},${mapP(0.103696)}
                    L${mapT(321)},${mapP(0.109072)}
                    L${mapT(322)},${mapP(0.114686)}
                    L${mapT(323)},${mapP(0.120546)}
                    L${mapT(324)},${mapP(0.126662)}
                    L${mapT(325)},${mapP(0.133041)}
                    L${mapT(326)},${mapP(0.139694)}
                    L${mapT(327)},${mapP(0.146629)}
                    L${mapT(328)},${mapP(0.153857)}
                    L${mapT(329)},${mapP(0.161388)}
                    L${mapT(330)},${mapP(0.169231)}
                    L${mapT(331)},${mapP(0.177398)}
                    L${mapT(332)},${mapP(0.185899)}
                    L${mapT(333)},${mapP(0.194746)}
                    L${mapT(334)},${mapP(0.203949)}
                    L${mapT(335)},${mapP(0.21352)}
                    L${mapT(336)},${mapP(0.22347)}
                    L${mapT(337)},${mapP(0.233813)}
                    L${mapT(338)},${mapP(0.244561)}
                    L${mapT(339)},${mapP(0.255726)}
                    L${mapT(340)},${mapP(0.26732)}
                    L${mapT(341)},${mapP(0.279359)}
                    L${mapT(342)},${mapP(0.291854)}
                    L${mapT(343)},${mapP(0.304821)}
                    L${mapT(344)},${mapP(0.318272)}
                    L${mapT(345)},${mapP(0.332223)}
                    L${mapT(346)},${mapP(0.346688)}
                    L${mapT(347)},${mapP(0.361683)}
                    L${mapT(348)},${mapP(0.377223)}
                    L${mapT(349)},${mapP(0.393324)}
                    L${mapT(350)},${mapP(0.410001)}
                    L${mapT(351)},${mapP(0.427271)}
                    L${mapT(352)},${mapP(0.445152)}
                    L${mapT(353)},${mapP(0.463659)}
                    L${mapT(354)},${mapP(0.48281)}
                    L${mapT(355)},${mapP(0.502623)}
                    L${mapT(356)},${mapP(0.523117)}
                    L${mapT(357)},${mapP(0.544308)}
                    L${mapT(358)},${mapP(0.566217)}
                    L${mapT(359)},${mapP(0.588862)}
                    L${mapT(360)},${mapP(0.612263)}
                    L${mapT(361)},${mapP(0.63644)}
                    L${mapT(362)},${mapP(0.661412)}
                    L${mapT(363)},${mapP(0.6872)}
                    L${mapT(364)},${mapP(0.713825)}
                    L${mapT(365)},${mapP(0.741309)}
                    L${mapT(366)},${mapP(0.769673)}
                    L${mapT(367)},${mapP(0.798938)}
                    L${mapT(368)},${mapP(0.829128)}
                    L${mapT(369)},${mapP(0.860265)}
                    L${mapT(370)},${mapP(0.892371)}
                    L${mapT(371)},${mapP(0.925472)}
                    L${mapT(372)},${mapP(0.959589)}
                    L${mapT(373)},${mapP(0.994748)}
                    L${mapT(374)},${mapP(1.030974)}
                    L${mapT(375)},${mapP(1.068291)}
                    L${mapT(376)},${mapP(1.106724)}
                    L${mapT(377)},${mapP(1.1463)}
                    L${mapT(378)},${mapP(1.187044)}
                    L${mapT(379)},${mapP(1.228984)}
                    L${mapT(380)},${mapP(1.272145)}
                    L${mapT(381)},${mapP(1.316557)}
                    L${mapT(382)},${mapP(1.362245)}
                    L${mapT(383)},${mapP(1.409239)}
                    L${mapT(384)},${mapP(1.457567)}
                    L${mapT(385)},${mapP(1.507257)}
                    L${mapT(386)},${mapP(1.55834)}
                    L${mapT(387)},${mapP(1.610845)}
                    L${mapT(388)},${mapP(1.664803)}
                    L${mapT(389)},${mapP(1.720243)}
                    L${mapT(390)},${mapP(1.777196)}
                    L${mapT(391)},${mapP(1.835695)}
                    L${mapT(392)},${mapP(1.895771)}
                    L${mapT(393)},${mapP(1.957456)}
                    L${mapT(394)},${mapP(2.020783)}
                    L${mapT(395)},${mapP(2.085785)}
                    L${mapT(396)},${mapP(2.152495)}
                    L${mapT(397)},${mapP(2.220947)}
                    L${mapT(398)},${mapP(2.291176)}
                    L${mapT(399)},${mapP(2.363216)}
                    L${mapT(400)},${mapP(2.437102)}
                    L${mapT(401)},${mapP(2.512869)}
                    L${mapT(402)},${mapP(2.590555)}
                    L${mapT(403)},${mapP(2.670194)}
                    L${mapT(404)},${mapP(2.751824)}
                    L${mapT(405)},${mapP(2.835482)}
                    L${mapT(406)},${mapP(2.921206)}
                    L${mapT(407)},${mapP(3.009033)}
                    L${mapT(408)},${mapP(3.099003)}
                    L${mapT(409)},${mapP(3.191153)}
                    L${mapT(410)},${mapP(3.285523)}
                    L${mapT(411)},${mapP(3.382153)}
                    L${mapT(412)},${mapP(3.481083)}
                    L${mapT(413)},${mapP(3.582353)}
                    L${mapT(414)},${mapP(3.686004)}
                    L${mapT(415)},${mapP(3.792078)}
                    L${mapT(416)},${mapP(3.900616)}
                    L${mapT(417)},${mapP(4.01166)}
                    L${mapT(418)},${mapP(4.125254)}
                    L${mapT(419)},${mapP(4.241439)}
                    L${mapT(420)},${mapP(4.36026)}
                    L${mapT(421)},${mapP(4.48176)}
                    L${mapT(422)},${mapP(4.605983)}
                    L${mapT(423)},${mapP(4.732974)}
                    L${mapT(424)},${mapP(4.862778)}
                    L${mapT(425)},${mapP(4.99544)}
                    L${mapT(426)},${mapP(5.131006)}
                    L${mapT(427)},${mapP(5.269522)}
                    L${mapT(428)},${mapP(5.411036)}
                    L${mapT(429)},${mapP(5.555593)}
                    L${mapT(430)},${mapP(5.703241)}
                    L${mapT(431)},${mapP(5.854029)}
                    L${mapT(432)},${mapP(6.008004)}
                    L${mapT(433)},${mapP(6.165215)}
                    L${mapT(434)},${mapP(6.32571)}
                    L${mapT(435)},${mapP(6.48954)}
                    L${mapT(436)},${mapP(6.656753)}
                    L${mapT(437)},${mapP(6.827401)}
                    L${mapT(438)},${mapP(7.001533)}
                    L${mapT(439)},${mapP(7.179201)}
                    L${mapT(440)},${mapP(7.360455)}
                    L${mapT(441)},${mapP(7.545348)}
                    L${mapT(442)},${mapP(7.733932)}
                    L${mapT(443)},${mapP(7.926258)}
                    L${mapT(444)},${mapP(8.12238)}
                    L${mapT(445)},${mapP(8.322351)}
                    L${mapT(446)},${mapP(8.526224)}
                    L${mapT(447)},${mapP(8.734053)}
                    L${mapT(448)},${mapP(8.945893)}
                    L${mapT(449)},${mapP(9.161797)}
                    L${mapT(450)},${mapP(9.381822)}
                    L${mapT(451)},${mapP(9.606022)}
                    L${mapT(452)},${mapP(9.834454)}
                    L${mapT(453)},${mapP(10.067172)}
                    L${mapT(454)},${mapP(10.304234)}
                    L${mapT(455)},${mapP(10.545695)}
                    L${mapT(456)},${mapP(10.791614)}
                    L${mapT(457)},${mapP(11.042048)}
                    L${mapT(458)},${mapP(11.297054)}
                    L${mapT(459)},${mapP(11.556691)}
                    L${mapT(460)},${mapP(11.821016)}
                    L${mapT(461)},${mapP(12.090089)}
                    L${mapT(462)},${mapP(12.363968)}
                    L${mapT(463)},${mapP(12.642714)}
                    L${mapT(464)},${mapP(12.926385)}
                    L${mapT(465)},${mapP(13.215042)}
                    L${mapT(466)},${mapP(13.508745)}
                    L${mapT(467)},${mapP(13.807555)}
                    L${mapT(468)},${mapP(14.111533)}
                    L${mapT(469)},${mapP(14.42074)}
                    L${mapT(470)},${mapP(14.735237)}
                    L${mapT(471)},${mapP(15.055087)}
                    L${mapT(472)},${mapP(15.380351)}
                    L${mapT(473)},${mapP(15.711093)}
                    L${mapT(474)},${mapP(16.047374)}
                    L${mapT(475)},${mapP(16.389258)}
                    L${mapT(476)},${mapP(16.736809)}
                    L${mapT(477)},${mapP(17.090089)}
                    L${mapT(478)},${mapP(17.449163)}
                    L${mapT(479)},${mapP(17.814095)}
                    L${mapT(480)},${mapP(18.184949)}
                    L${mapT(481)},${mapP(18.56179)}
                    L${mapT(482)},${mapP(18.944683)}
                    L${mapT(483)},${mapP(19.333693)}
                    L${mapT(484)},${mapP(19.728886)}
                    L${mapT(485)},${mapP(20.130327)}
                    L${mapT(486)},${mapP(20.538082)}
                    L${mapT(487)},${mapP(20.952218)}
                    L${mapT(488)},${mapP(21.372801)}
                    L${mapT(489)},${mapP(21.799898)}
                    L${mapT(490)},${mapP(22.233575)}
                    L${mapT(491)},${mapP(22.6739)}
                    L${mapT(492)},${mapP(23.120941)}
                    L${mapT(493)},${mapP(23.574764)}
                    L${mapT(494)},${mapP(24.035439)}
                    L${mapT(495)},${mapP(24.503032)}
                    L${mapT(496)},${mapP(24.977612)}
                    L${mapT(497)},${mapP(25.459247)}
                    L${mapT(498)},${mapP(25.948008)}
                    L${mapT(499)},${mapP(26.443961)}
                    L${mapT(500)},${mapP(26.947177)}
                    L${mapT(501)},${mapP(27.457724)}
                    L${mapT(502)},${mapP(27.975672)}
                    L${mapT(503)},${mapP(28.501092)}
                    L${mapT(504)},${mapP(29.034052)}
                    L${mapT(505)},${mapP(29.574623)}
                    L${mapT(506)},${mapP(30.122874)}
                    L${mapT(507)},${mapP(30.678878)}
                    L${mapT(508)},${mapP(31.242703)}
                    L${mapT(509)},${mapP(31.814421)}
                    L${mapT(510)},${mapP(32.394103)}
                    L${mapT(511)},${mapP(32.981819)}
                    L${mapT(512)},${mapP(33.577642)}
                    L${mapT(513)},${mapP(34.181642)}
                    L${mapT(514)},${mapP(34.793891)}
                    L${mapT(515)},${mapP(35.41446)}
                    L${mapT(516)},${mapP(36.043422)}
                    L${mapT(517)},${mapP(36.680848)}
                    L${mapT(518)},${mapP(37.326811)}
                    L${mapT(519)},${mapP(37.981382)}
                    L${mapT(520)},${mapP(38.644634)}
                    L${mapT(521)},${mapP(39.31664)}
                    L${mapT(522)},${mapP(39.997472)}
                    L${mapT(523)},${mapP(40.687202)}
                    L${mapT(524)},${mapP(41.385905)}
                    L${mapT(525)},${mapP(42.093651)}
                    L${mapT(526)},${mapP(42.810516)}
                    L${mapT(527)},${mapP(43.536571)}
                    L${mapT(528)},${mapP(44.27189)}
                    L${mapT(529)},${mapP(45.016546)}
                    L${mapT(530)},${mapP(45.770613)}
                    L${mapT(531)},${mapP(46.534163)}
                    L${mapT(532)},${mapP(47.307272)}
                    L${mapT(533)},${mapP(48.090012)}
                    L${mapT(534)},${mapP(48.882457)}
                    L${mapT(535)},${mapP(49.684681)}
                    L${mapT(536)},${mapP(50.496758)}
                    L${mapT(537)},${mapP(51.318762)}
                    L${mapT(538)},${mapP(52.150766)}
                    L${mapT(539)},${mapP(52.992845)}
                    L${mapT(540)},${mapP(53.845073)}
                    L${mapT(541)},${mapP(54.707524)}
                    L${mapT(542)},${mapP(55.580272)}
                    L${mapT(543)},${mapP(56.463392)}
                    L${mapT(544)},${mapP(57.356957)}
                    L${mapT(545)},${mapP(58.261043)}
                    L${mapT(546)},${mapP(59.175723)}
                    L${mapT(547)},${mapP(60.101072)}
                    L${mapT(548)},${mapP(61.037164)}
                    L${mapT(549)},${mapP(61.984074)}
                    L${mapT(550)},${mapP(62.941876)}
                    L${mapT(551)},${mapP(63.910644)}
                    L${mapT(552)},${mapP(64.890454)}
                    L${mapT(553)},${mapP(65.881379)}
                    L${mapT(554)},${mapP(66.883494)}
                    L${mapT(555)},${mapP(67.896874)}
                    L${mapT(556)},${mapP(68.921593)}
                    L${mapT(557)},${mapP(69.957725)}
                    L${mapT(558)},${mapP(71.005345)}
                    L${mapT(559)},${mapP(72.064528)}
                    L${mapT(560)},${mapP(73.135347)}
                    L${mapT(561)},${mapP(74.217878)}
                    L${mapT(562)},${mapP(75.312194)}
                    L${mapT(563)},${mapP(76.418371)}
                    L${mapT(564)},${mapP(77.536482)}
                    L${mapT(565)},${mapP(78.666601)}
                    L${mapT(566)},${mapP(79.808804)}
                    L${mapT(567)},${mapP(80.963164)}
                    L${mapT(568)},${mapP(82.129755)}
                    L${mapT(569)},${mapP(83.308652)}
                    L${mapT(570)},${mapP(84.499928)}
                    L${mapT(571)},${mapP(85.703659)}
                    L${mapT(572)},${mapP(86.919917)}
                    L${mapT(573)},${mapP(88.148777)}
                    L${mapT(574)},${mapP(89.390312)}
                    L${mapT(575)},${mapP(90.644597)}
                    L${mapT(576)},${mapP(91.911705)}
                    L${mapT(577)},${mapP(93.19171)}
                    L${mapT(578)},${mapP(94.484685)}
                    L${mapT(579)},${mapP(95.790705)}
                    L${mapT(580)},${mapP(97.109842)}
                    L${mapT(581)},${mapP(98.442169)}
                    L${mapT(582)},${mapP(99.787761)}
                    L${mapT(583)},${mapP(101.14669)}
                    L${mapT(584)},${mapP(102.51903)}
                    L${mapT(585)},${mapP(103.904853)}
                    L${mapT(586)},${mapP(105.304232)}
                    L${mapT(587)},${mapP(106.717241)}
                    L${mapT(588)},${mapP(108.143951)}
                    L${mapT(589)},${mapP(109.584436)}
                    L${mapT(590)},${mapP(111.038769)}
                    L${mapT(591)},${mapP(112.50702)}
                    L${mapT(592)},${mapP(113.989264)}
                    L${mapT(593)},${mapP(115.485571)}
                    L${mapT(594)},${mapP(116.996015)}
                    L${mapT(595)},${mapP(118.520666)}
                    L${mapT(596)},${mapP(120.059597)}
                    L${mapT(597)},${mapP(121.61288)}
                    L${mapT(598)},${mapP(123.180585)}
                    L${mapT(599)},${mapP(124.762785)}
                    L${mapT(600)},${mapP(126.359551)}
                    L${mapT(601)},${mapP(127.970954)}
                    L${mapT(602)},${mapP(129.597064)}
                    L${mapT(603)},${mapP(131.237954)}
                    L${mapT(604)},${mapP(132.893692)}
                    L${mapT(605)},${mapP(134.564351)}
                    L${mapT(606)},${mapP(136.250001)}
                    L${mapT(607)},${mapP(137.950711)}
                    L${mapT(608)},${mapP(139.666553)}
                    L${mapT(609)},${mapP(141.397595)}
                    L${mapT(610)},${mapP(143.143908)}
                    L${mapT(611)},${mapP(144.905562)}
                    L${mapT(612)},${mapP(146.682625)}
                    L${mapT(613)},${mapP(148.475168)}
                    L${mapT(614)},${mapP(150.283259)}
                    L${mapT(615)},${mapP(152.106968)}
                    L${mapT(616)},${mapP(153.946363)}
                    L${mapT(617)},${mapP(155.801513)}
                    L${mapT(618)},${mapP(157.672487)}
                    L${mapT(619)},${mapP(159.559352)}
                    L${mapT(620)},${mapP(161.462177)}
                    L${mapT(621)},${mapP(163.38103)}
                    L${mapT(622)},${mapP(165.315978)}
                    L${mapT(623)},${mapP(167.267089)}
                    L${mapT(624)},${mapP(169.234431)}
                    L${mapT(625)},${mapP(171.218071)}
                    L${mapT(626)},${mapP(173.218075)}
                    L${mapT(627)},${mapP(175.234511)}
                    L${mapT(628)},${mapP(177.267445)}
                    L${mapT(629)},${mapP(179.316943)}
                    L${mapT(630)},${mapP(181.383072)}
                    L${mapT(631)},${mapP(183.465898)}
                    L${mapT(632)},${mapP(185.565487)}
                    L${mapT(633)},${mapP(187.681903)}
                    L${mapT(634)},${mapP(189.815213)}
                    L${mapT(635)},${mapP(191.965482)}
                    L${mapT(636)},${mapP(194.132774)}
                    L${mapT(637)},${mapP(196.317155)}
                    L${mapT(638)},${mapP(198.518688)}
                    L${mapT(639)},${mapP(200.73744)}
                    L${mapT(640)},${mapP(202.973472)}
                    L${mapT(641)},${mapP(205.22685)}
                    L${mapT(642)},${mapP(207.497636)}
                    L${mapT(643)},${mapP(209.785896)}
                    L${mapT(644)},${mapP(212.09169)}
                    L${mapT(645)},${mapP(214.415084)}
                    L${mapT(646)},${mapP(216.756139)}
                    L${mapT(647.096)},${mapP(218.0)}
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
                  stroke={theme.titleText}
                  strokeWidth="2.2"
                  strokeDasharray="4,4"
                  opacity={0.9}
                />
                {/* Draw solid region (left) - using accurate fusion curve */}
                <Path
                  d={`
                    M${mapT(minT)},${mapP(300)}
                    L${mapT(minT)},${mapP(sublimationPressure(minT))}
                    Q${mapT(250)},${mapP(sublimationPressure(250))} ${mapT(T_TRIPLE)},${mapP(P_TRIPLE)}
                    L${mapT(273.16)},${mapP(0.006117)}
                    L${mapT(273.14)},${mapP(0.01)}
                    L${mapT(273.00)},${mapP(0.1)}
                    L${mapT(272.25)},${mapP(1)}
                    L${mapT(270.2)},${mapP(10)}
                    L${mapT(252.0)},${mapP(100)}
                    L${mapT(240.0)},${mapP(200)}
                    L${mapT(230.0)},${mapP(300)}
                    Z
                  `}
                  fill={phaseColors["Solid"]}
                  opacity="0.5"
                />
                {/* Draw liquid region (middle top) - using accurate vaporization curve and fusion curve */}
                <Path
                  d={`M${mapT(273.16)},${mapP(0.006117)}
                    L${mapT(273.14)},${mapP(0.01)}
                    L${mapT(273.00)},${mapP(0.1)}
                    L${mapT(272.25)},${mapP(1)}
                    L${mapT(270.2)},${mapP(10)}
                    L${mapT(252.0)},${mapP(100)}
                    L${mapT(240.0)},${mapP(200)}
                    L${mapT(230.0)},${mapP(300)}
                    L${mapT(647.096)},${mapP(300)}
                    L${mapT(647.096)},${mapP(217.75)}
                    L${mapT(647.096)},${mapP(218.0)}
                    L${mapT(646)},${mapP(216.756139)}
                    L${mapT(645)},${mapP(214.415084)}
                    L${mapT(644)},${mapP(212.09169)}
                    L${mapT(643)},${mapP(209.785896)}
                    L${mapT(642)},${mapP(207.497636)}
                    L${mapT(641)},${mapP(205.22685)}
                    L${mapT(640)},${mapP(202.973472)}
                    L${mapT(639)},${mapP(200.73744)}
                    L${mapT(638)},${mapP(198.518688)}
                    L${mapT(637)},${mapP(196.317155)}
                    L${mapT(636)},${mapP(194.132774)}
                    L${mapT(635)},${mapP(191.965482)}
                    L${mapT(634)},${mapP(189.815213)}
                    L${mapT(633)},${mapP(187.681903)}
                    L${mapT(632)},${mapP(185.565487)}
                    L${mapT(631)},${mapP(183.465898)}
                    L${mapT(630)},${mapP(181.383072)}
                    L${mapT(629)},${mapP(179.316943)}
                    L${mapT(628)},${mapP(177.267445)}
                    L${mapT(627)},${mapP(175.234511)}
                    L${mapT(626)},${mapP(173.218075)}
                    L${mapT(625)},${mapP(171.218071)}
                    L${mapT(624)},${mapP(169.234431)}
                    L${mapT(623)},${mapP(167.267089)}
                    L${mapT(622)},${mapP(165.315978)}
                    L${mapT(621)},${mapP(163.38103)}
                    L${mapT(620)},${mapP(161.462177)}
                    L${mapT(619)},${mapP(159.559352)}
                    L${mapT(618)},${mapP(157.672487)}
                    L${mapT(617)},${mapP(155.801513)}
                    L${mapT(616)},${mapP(153.946363)}
                    L${mapT(615)},${mapP(152.106968)}
                    L${mapT(614)},${mapP(150.283259)}
                    L${mapT(613)},${mapP(148.475168)}
                    L${mapT(612)},${mapP(146.682625)}
                    L${mapT(611)},${mapP(144.905562)}
                    L${mapT(610)},${mapP(143.143908)}
                    L${mapT(609)},${mapP(141.397595)}
                    L${mapT(608)},${mapP(139.666553)}
                    L${mapT(607)},${mapP(137.950711)}
                    L${mapT(606)},${mapP(136.250001)}
                    L${mapT(605)},${mapP(134.564351)}
                    L${mapT(604)},${mapP(132.893692)}
                    L${mapT(603)},${mapP(131.237954)}
                    L${mapT(602)},${mapP(129.597064)}
                    L${mapT(601)},${mapP(127.970954)}
                    L${mapT(600)},${mapP(126.359551)}
                    L${mapT(599)},${mapP(124.762785)}
                    L${mapT(598)},${mapP(123.180585)}
                    L${mapT(597)},${mapP(121.61288)}
                    L${mapT(596)},${mapP(120.059597)}
                    L${mapT(595)},${mapP(118.520666)}
                    L${mapT(594)},${mapP(116.996015)}
                    L${mapT(593)},${mapP(115.485571)}
                    L${mapT(592)},${mapP(113.989264)}
                    L${mapT(591)},${mapP(112.50702)}
                    L${mapT(590)},${mapP(111.038769)}
                    L${mapT(589)},${mapP(109.584436)}
                    L${mapT(588)},${mapP(108.143951)}
                    L${mapT(587)},${mapP(106.717241)}
                    L${mapT(586)},${mapP(105.304232)}
                    L${mapT(585)},${mapP(103.904853)}
                    L${mapT(584)},${mapP(102.51903)}
                    L${mapT(583)},${mapP(101.14669)}
                    L${mapT(582)},${mapP(99.787761)}
                    L${mapT(581)},${mapP(98.442169)}
                    L${mapT(580)},${mapP(97.109842)}
                    L${mapT(579)},${mapP(95.790705)}
                    L${mapT(578)},${mapP(94.484685)}
                    L${mapT(577)},${mapP(93.19171)}
                    L${mapT(576)},${mapP(91.911705)}
                    L${mapT(575)},${mapP(90.644597)}
                    L${mapT(574)},${mapP(89.390312)}
                    L${mapT(573)},${mapP(88.148777)}
                    L${mapT(572)},${mapP(86.919917)}
                    L${mapT(571)},${mapP(85.703659)}
                    L${mapT(570)},${mapP(84.499928)}
                    L${mapT(569)},${mapP(83.308652)}
                    L${mapT(568)},${mapP(82.129755)}
                    L${mapT(567)},${mapP(80.963164)}
                    L${mapT(566)},${mapP(79.808804)}
                    L${mapT(565)},${mapP(78.666601)}
                    L${mapT(564)},${mapP(77.536482)}
                    L${mapT(563)},${mapP(76.418371)}
                    L${mapT(562)},${mapP(75.312194)}
                    L${mapT(561)},${mapP(74.217878)}
                    L${mapT(560)},${mapP(73.135347)}
                    L${mapT(559)},${mapP(72.064528)}
                    L${mapT(558)},${mapP(71.005345)}
                    L${mapT(557)},${mapP(69.957725)}
                    L${mapT(556)},${mapP(68.921593)}
                    L${mapT(555)},${mapP(67.896874)}
                    L${mapT(554)},${mapP(66.883494)}
                    L${mapT(553)},${mapP(65.881379)}
                    L${mapT(552)},${mapP(64.890454)}
                    L${mapT(551)},${mapP(63.910644)}
                    L${mapT(550)},${mapP(62.941876)}
                    L${mapT(549)},${mapP(61.984074)}
                    L${mapT(548)},${mapP(61.037164)}
                    L${mapT(547)},${mapP(60.101072)}
                    L${mapT(546)},${mapP(59.175723)}
                    L${mapT(545)},${mapP(58.261043)}
                    L${mapT(544)},${mapP(57.356957)}
                    L${mapT(543)},${mapP(56.463392)}
                    L${mapT(542)},${mapP(55.580272)}
                    L${mapT(541)},${mapP(54.707524)}
                    L${mapT(540)},${mapP(53.845073)}
                    L${mapT(539)},${mapP(52.992845)}
                    L${mapT(538)},${mapP(52.150766)}
                    L${mapT(537)},${mapP(51.318762)}
                    L${mapT(536)},${mapP(50.496758)}
                    L${mapT(535)},${mapP(49.684681)}
                    L${mapT(534)},${mapP(48.882457)}
                    L${mapT(533)},${mapP(48.090012)}
                    L${mapT(532)},${mapP(47.307272)}
                    L${mapT(531)},${mapP(46.534163)}
                    L${mapT(530)},${mapP(45.770613)}
                    L${mapT(529)},${mapP(45.016546)}
                    L${mapT(528)},${mapP(44.27189)}
                    L${mapT(527)},${mapP(43.536571)}
                    L${mapT(526)},${mapP(42.810516)}
                    L${mapT(525)},${mapP(42.093651)}
                    L${mapT(524)},${mapP(41.385905)}
                    L${mapT(523)},${mapP(40.687202)}
                    L${mapT(522)},${mapP(39.997472)}
                    L${mapT(521)},${mapP(39.31664)}
                    L${mapT(520)},${mapP(38.644634)}
                    L${mapT(519)},${mapP(37.981382)}
                    L${mapT(518)},${mapP(37.326811)}
                    L${mapT(517)},${mapP(36.680848)}
                    L${mapT(516)},${mapP(36.043422)}
                    L${mapT(515)},${mapP(35.41446)}
                    L${mapT(514)},${mapP(34.793891)}
                    L${mapT(513)},${mapP(34.181642)}
                    L${mapT(512)},${mapP(33.577642)}
                    L${mapT(511)},${mapP(32.981819)}
                    L${mapT(510)},${mapP(32.394103)}
                    L${mapT(509)},${mapP(31.814421)}
                    L${mapT(508)},${mapP(31.242703)}
                    L${mapT(507)},${mapP(30.678878)}
                    L${mapT(506)},${mapP(30.122874)}
                    L${mapT(505)},${mapP(29.574623)}
                    L${mapT(504)},${mapP(29.034052)}
                    L${mapT(503)},${mapP(28.501092)}
                    L${mapT(502)},${mapP(27.975672)}
                    L${mapT(501)},${mapP(27.457724)}
                    L${mapT(500)},${mapP(26.947177)}
                    L${mapT(499)},${mapP(26.443961)}
                    L${mapT(498)},${mapP(25.948008)}
                    L${mapT(497)},${mapP(25.459247)}
                    L${mapT(496)},${mapP(24.977612)}
                    L${mapT(495)},${mapP(24.503032)}
                    L${mapT(494)},${mapP(24.035439)}
                    L${mapT(493)},${mapP(23.574764)}
                    L${mapT(492)},${mapP(23.120941)}
                    L${mapT(491)},${mapP(22.6739)}
                    L${mapT(490)},${mapP(22.233575)}
                    L${mapT(489)},${mapP(21.799898)}
                    L${mapT(488)},${mapP(21.372801)}
                    L${mapT(487)},${mapP(20.952218)}
                    L${mapT(486)},${mapP(20.538082)}
                    L${mapT(485)},${mapP(20.130327)}
                    L${mapT(484)},${mapP(19.728886)}
                    L${mapT(483)},${mapP(19.333693)}
                    L${mapT(482)},${mapP(18.944683)}
                    L${mapT(481)},${mapP(18.56179)}
                    L${mapT(480)},${mapP(18.184949)}
                    L${mapT(479)},${mapP(17.814095)}
                    L${mapT(478)},${mapP(17.449163)}
                    L${mapT(477)},${mapP(17.090089)}
                    L${mapT(476)},${mapP(16.736809)}
                    L${mapT(475)},${mapP(16.389258)}
                    L${mapT(474)},${mapP(16.047374)}
                    L${mapT(473)},${mapP(15.711093)}
                    L${mapT(472)},${mapP(15.380351)}
                    L${mapT(471)},${mapP(15.055087)}
                    L${mapT(470)},${mapP(14.735237)}
                    L${mapT(469)},${mapP(14.42074)}
                    L${mapT(468)},${mapP(14.111533)}
                    L${mapT(467)},${mapP(13.807555)}
                    L${mapT(466)},${mapP(13.508745)}
                    L${mapT(465)},${mapP(13.215042)}
                    L${mapT(464)},${mapP(12.926385)}
                    L${mapT(463)},${mapP(12.642714)}
                    L${mapT(462)},${mapP(12.363968)}
                    L${mapT(461)},${mapP(12.090089)}
                    L${mapT(460)},${mapP(11.821016)}
                    L${mapT(459)},${mapP(11.556691)}
                    L${mapT(458)},${mapP(11.297054)}
                    L${mapT(457)},${mapP(11.042048)}
                    L${mapT(456)},${mapP(10.791614)}
                    L${mapT(455)},${mapP(10.545695)}
                    L${mapT(454)},${mapP(10.304234)}
                    L${mapT(453)},${mapP(10.067172)}
                    L${mapT(452)},${mapP(9.834454)}
                    L${mapT(451)},${mapP(9.606022)}
                    L${mapT(450)},${mapP(9.381822)}
                    L${mapT(449)},${mapP(9.161797)}
                    L${mapT(448)},${mapP(8.945893)}
                    L${mapT(447)},${mapP(8.734053)}
                    L${mapT(446)},${mapP(8.526224)}
                    L${mapT(445)},${mapP(8.322351)}
                    L${mapT(444)},${mapP(8.12238)}
                    L${mapT(443)},${mapP(7.926258)}
                    L${mapT(442)},${mapP(7.733932)}
                    L${mapT(441)},${mapP(7.545348)}
                    L${mapT(440)},${mapP(7.360455)}
                    L${mapT(439)},${mapP(7.179201)}
                    L${mapT(438)},${mapP(7.001533)}
                    L${mapT(437)},${mapP(6.827401)}
                    L${mapT(436)},${mapP(6.656753)}
                    L${mapT(435)},${mapP(6.48954)}
                    L${mapT(434)},${mapP(6.32571)}
                    L${mapT(433)},${mapP(6.165215)}
                    L${mapT(432)},${mapP(6.008004)}
                    L${mapT(431)},${mapP(5.854029)}
                    L${mapT(430)},${mapP(5.703241)}
                    L${mapT(429)},${mapP(5.555593)}
                    L${mapT(428)},${mapP(5.411036)}
                    L${mapT(427)},${mapP(5.269522)}
                    L${mapT(426)},${mapP(5.131006)}
                    L${mapT(425)},${mapP(4.99544)}
                    L${mapT(424)},${mapP(4.862778)}
                    L${mapT(423)},${mapP(4.732974)}
                    L${mapT(422)},${mapP(4.605983)}
                    L${mapT(421)},${mapP(4.48176)}
                    L${mapT(420)},${mapP(4.36026)}
                    L${mapT(419)},${mapP(4.241439)}
                    L${mapT(418)},${mapP(4.125254)}
                    L${mapT(417)},${mapP(4.01166)}
                    L${mapT(416)},${mapP(3.900616)}
                    L${mapT(415)},${mapP(3.792078)}
                    L${mapT(414)},${mapP(3.686004)}
                    L${mapT(413)},${mapP(3.582353)}
                    L${mapT(412)},${mapP(3.481083)}
                    L${mapT(411)},${mapP(3.382153)}
                    L${mapT(410)},${mapP(3.285523)}
                    L${mapT(409)},${mapP(3.191153)}
                    L${mapT(408)},${mapP(3.099003)}
                    L${mapT(407)},${mapP(3.009033)}
                    L${mapT(406)},${mapP(2.921206)}
                    L${mapT(405)},${mapP(2.835482)}
                    L${mapT(404)},${mapP(2.751824)}
                    L${mapT(403)},${mapP(2.670194)}
                    L${mapT(402)},${mapP(2.590555)}
                    L${mapT(401)},${mapP(2.512869)}
                    L${mapT(400)},${mapP(2.437102)}
                    L${mapT(399)},${mapP(2.363216)}
                    L${mapT(398)},${mapP(2.291176)}
                    L${mapT(397)},${mapP(2.220947)}
                    L${mapT(396)},${mapP(2.152495)}
                    L${mapT(395)},${mapP(2.085785)}
                    L${mapT(394)},${mapP(2.020783)}
                    L${mapT(393)},${mapP(1.957456)}
                    L${mapT(392)},${mapP(1.895771)}
                    L${mapT(391)},${mapP(1.835695)}
                    L${mapT(390)},${mapP(1.777196)}
                    L${mapT(389)},${mapP(1.720243)}
                    L${mapT(388)},${mapP(1.664803)}
                    L${mapT(387)},${mapP(1.610845)}
                    L${mapT(386)},${mapP(1.55834)}
                    L${mapT(385)},${mapP(1.507257)}
                    L${mapT(384)},${mapP(1.457567)}
                    L${mapT(383)},${mapP(1.409239)}
                    L${mapT(382)},${mapP(1.362245)}
                    L${mapT(381)},${mapP(1.316557)}
                    L${mapT(380)},${mapP(1.272145)}
                    L${mapT(379)},${mapP(1.228984)}
                    L${mapT(378)},${mapP(1.187044)}
                    L${mapT(377)},${mapP(1.1463)}
                    L${mapT(376)},${mapP(1.106724)}
                    L${mapT(375)},${mapP(1.068291)}
                    L${mapT(374)},${mapP(1.030974)}
                    L${mapT(373)},${mapP(0.994748)}
                    L${mapT(372)},${mapP(0.959589)}
                    L${mapT(371)},${mapP(0.925472)}
                    L${mapT(370)},${mapP(0.892371)}
                    L${mapT(369)},${mapP(0.860265)}
                    L${mapT(368)},${mapP(0.829128)}
                    L${mapT(367)},${mapP(0.798938)}
                    L${mapT(366)},${mapP(0.769673)}
                    L${mapT(365)},${mapP(0.741309)}
                    L${mapT(364)},${mapP(0.713825)}
                    L${mapT(363)},${mapP(0.6872)}
                    L${mapT(362)},${mapP(0.661412)}
                    L${mapT(361)},${mapP(0.63644)}
                    L${mapT(360)},${mapP(0.612263)}
                    L${mapT(359)},${mapP(0.588862)}
                    L${mapT(358)},${mapP(0.566217)}
                    L${mapT(357)},${mapP(0.544308)}
                    L${mapT(356)},${mapP(0.523117)}
                    L${mapT(355)},${mapP(0.502623)}
                    L${mapT(354)},${mapP(0.48281)}
                    L${mapT(353)},${mapP(0.463659)}
                    L${mapT(352)},${mapP(0.445152)}
                    L${mapT(351)},${mapP(0.427271)}
                    L${mapT(350)},${mapP(0.410001)}
                    L${mapT(349)},${mapP(0.393324)}
                    L${mapT(348)},${mapP(0.377223)}
                    L${mapT(347)},${mapP(0.361683)}
                    L${mapT(346)},${mapP(0.346688)}
                    L${mapT(345)},${mapP(0.332223)}
                    L${mapT(344)},${mapP(0.318272)}
                    L${mapT(343)},${mapP(0.304821)}
                    L${mapT(342)},${mapP(0.291854)}
                    L${mapT(341)},${mapP(0.279359)}
                    L${mapT(340)},${mapP(0.26732)}
                    L${mapT(339)},${mapP(0.255726)}
                    L${mapT(338)},${mapP(0.244561)}
                    L${mapT(337)},${mapP(0.233813)}
                    L${mapT(336)},${mapP(0.22347)}
                    L${mapT(335)},${mapP(0.21352)}
                    L${mapT(334)},${mapP(0.203949)}
                    L${mapT(333)},${mapP(0.194746)}
                    L${mapT(332)},${mapP(0.185899)}
                    L${mapT(331)},${mapP(0.177398)}
                    L${mapT(330)},${mapP(0.169231)}
                    L${mapT(329)},${mapP(0.161388)}
                    L${mapT(328)},${mapP(0.153857)}
                    L${mapT(327)},${mapP(0.146629)}
                    L${mapT(326)},${mapP(0.139694)}
                    L${mapT(325)},${mapP(0.133041)}
                    L${mapT(324)},${mapP(0.126662)}
                    L${mapT(323)},${mapP(0.120546)}
                    L${mapT(322)},${mapP(0.114686)}
                    L${mapT(321)},${mapP(0.109072)}
                    L${mapT(320)},${mapP(0.103696)}
                    L${mapT(319)},${mapP(0.098549)}
                    L${mapT(318)},${mapP(0.093623)}
                    L${mapT(317)},${mapP(0.088911)}
                    L${mapT(316)},${mapP(0.084404)}
                    L${mapT(315)},${mapP(0.080095)}
                    L${mapT(314)},${mapP(0.075977)}
                    L${mapT(313)},${mapP(0.072044)}
                    L${mapT(312)},${mapP(0.068287)}
                    L${mapT(311)},${mapP(0.0647)}
                    L${mapT(310)},${mapP(0.061278)}
                    L${mapT(309)},${mapP(0.058013)}
                    L${mapT(308)},${mapP(0.054899)}
                    L${mapT(307)},${mapP(0.051931)}
                    L${mapT(306)},${mapP(0.049103)}
                    L${mapT(305)},${mapP(0.04641)}
                    L${mapT(304)},${mapP(0.043846)}
                    L${mapT(303)},${mapP(0.041405)}
                    L${mapT(302)},${mapP(0.039083)}
                    L${mapT(301)},${mapP(0.036875)}
                    L${mapT(300)},${mapP(0.034776)}
                    L${mapT(299)},${mapP(0.032782)}
                    L${mapT(298)},${mapP(0.030888)}
                    L${mapT(297)},${mapP(0.029091)}
                    L${mapT(296)},${mapP(0.027384)}
                    L${mapT(295)},${mapP(0.025766)}
                    L${mapT(294)},${mapP(0.024232)}
                    L${mapT(293)},${mapP(0.022778)}
                    L${mapT(292)},${mapP(0.021401)}
                    L${mapT(291)},${mapP(0.020097)}
                    L${mapT(290)},${mapP(0.018863)}
                    L${mapT(289)},${mapP(0.017696)}
                    L${mapT(288)},${mapP(0.016592)}
                    L${mapT(287)},${mapP(0.01555)}
                    L${mapT(286)},${mapP(0.014565)}
                    L${mapT(285)},${mapP(0.013635)}
                    L${mapT(284)},${mapP(0.012757)}
                    L${mapT(283)},${mapP(0.01193)}
                    L${mapT(282)},${mapP(0.01115)}
                    L${mapT(281)},${mapP(0.010415)}
                    L${mapT(280)},${mapP(0.009723)}
                    L${mapT(279)},${mapP(0.009072)}
                    L${mapT(278)},${mapP(0.00846)}
                    L${mapT(277)},${mapP(0.007884)}
                    L${mapT(276)},${mapP(0.007343)}
                    L${mapT(275)},${mapP(0.006835)}
                    L${mapT(274)},${mapP(0.006359)}
                    L${mapT(273)},${mapP(0.005911)}
                    L${mapT(273.15)},${mapP(0.00604)}
                    Z`}
                  fill={phaseColors.Liquid}
                  opacity="0.38"
                />
                {/* --- Phase boundaries --- */}
                {/* Sublimation curve (solid-gas) */}
                <Path
                  d={`M${mapT(minT)},${mapP(sublimationPressure(minT))}
                Q${mapT(250)},${mapP(sublimationPressure(250))} ${mapT(T_TRIPLE)},${mapP(P_TRIPLE)}`}
                  stroke={theme.titleText}
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Fusion curve (solid-liquid, nearly vertical) */}
                <Path
                  d={`M${mapT(273.16)},${mapP(0.006117)}
                    L${mapT(273.14)},${mapP(0.01)}
                    L${mapT(273.00)},${mapP(0.1)}
                    L${mapT(272.25)},${mapP(1)}
                    L${mapT(270.2)},${mapP(10)}
                    L${mapT(252.0)},${mapP(100)}
                    L${mapT(240.0)},${mapP(200)}
                    L${mapT(230.0)},${mapP(300)}`}
                  stroke={theme.titleText}
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Vaporization curve (liquid-gas) - using accurate data points */}
                <Path
                  d={`M${mapT(273.16)},${mapP(0.006117)}
                    L${mapT(274)},${mapP(0.006359)}
                    L${mapT(275)},${mapP(0.006835)}
                    L${mapT(276)},${mapP(0.007343)}
                    L${mapT(277)},${mapP(0.007884)}
                    L${mapT(278)},${mapP(0.00846)}
                    L${mapT(279)},${mapP(0.009072)}
                    L${mapT(280)},${mapP(0.009723)}
                    L${mapT(281)},${mapP(0.010415)}
                    L${mapT(282)},${mapP(0.01115)}
                    L${mapT(283)},${mapP(0.01193)}
                    L${mapT(284)},${mapP(0.012757)}
                    L${mapT(285)},${mapP(0.013635)}
                    L${mapT(286)},${mapP(0.014565)}
                    L${mapT(287)},${mapP(0.01555)}
                    L${mapT(288)},${mapP(0.016592)}
                    L${mapT(289)},${mapP(0.017696)}
                    L${mapT(290)},${mapP(0.018863)}
                    L${mapT(291)},${mapP(0.020097)}
                    L${mapT(292)},${mapP(0.021401)}
                    L${mapT(293)},${mapP(0.022778)}
                    L${mapT(294)},${mapP(0.024232)}
                    L${mapT(295)},${mapP(0.025766)}
                    L${mapT(296)},${mapP(0.027384)}
                    L${mapT(297)},${mapP(0.029091)}
                    L${mapT(298)},${mapP(0.030888)}
                    L${mapT(299)},${mapP(0.032782)}
                    L${mapT(300)},${mapP(0.034776)}
                    L${mapT(301)},${mapP(0.036875)}
                    L${mapT(302)},${mapP(0.039083)}
                    L${mapT(303)},${mapP(0.041405)}
                    L${mapT(304)},${mapP(0.043846)}
                    L${mapT(305)},${mapP(0.04641)}
                    L${mapT(306)},${mapP(0.049103)}
                    L${mapT(307)},${mapP(0.051931)}
                    L${mapT(308)},${mapP(0.054899)}
                    L${mapT(309)},${mapP(0.058013)}
                    L${mapT(310)},${mapP(0.061278)}
                    L${mapT(311)},${mapP(0.0647)}
                    L${mapT(312)},${mapP(0.068287)}
                    L${mapT(313)},${mapP(0.072044)}
                    L${mapT(314)},${mapP(0.075977)}
                    L${mapT(315)},${mapP(0.080095)}
                    L${mapT(316)},${mapP(0.084404)}
                    L${mapT(317)},${mapP(0.088911)}
                    L${mapT(318)},${mapP(0.093623)}
                    L${mapT(319)},${mapP(0.098549)}
                    L${mapT(320)},${mapP(0.103696)}
                    L${mapT(321)},${mapP(0.109072)}
                    L${mapT(322)},${mapP(0.114686)}
                    L${mapT(323)},${mapP(0.120546)}
                    L${mapT(324)},${mapP(0.126662)}
                    L${mapT(325)},${mapP(0.133041)}
                    L${mapT(326)},${mapP(0.139694)}
                    L${mapT(327)},${mapP(0.146629)}
                    L${mapT(328)},${mapP(0.153857)}
                    L${mapT(329)},${mapP(0.161388)}
                    L${mapT(330)},${mapP(0.169231)}
                    L${mapT(331)},${mapP(0.177398)}
                    L${mapT(332)},${mapP(0.185899)}
                    L${mapT(333)},${mapP(0.194746)}
                    L${mapT(334)},${mapP(0.203949)}
                    L${mapT(335)},${mapP(0.21352)}
                    L${mapT(336)},${mapP(0.22347)}
                    L${mapT(337)},${mapP(0.233813)}
                    L${mapT(338)},${mapP(0.244561)}
                    L${mapT(339)},${mapP(0.255726)}
                    L${mapT(340)},${mapP(0.26732)}
                    L${mapT(341)},${mapP(0.279359)}
                    L${mapT(342)},${mapP(0.291854)}
                    L${mapT(343)},${mapP(0.304821)}
                    L${mapT(344)},${mapP(0.318272)}
                    L${mapT(345)},${mapP(0.332223)}
                    L${mapT(346)},${mapP(0.346688)}
                    L${mapT(347)},${mapP(0.361683)}
                    L${mapT(348)},${mapP(0.377223)}
                    L${mapT(349)},${mapP(0.393324)}
                    L${mapT(350)},${mapP(0.410001)}
                    L${mapT(351)},${mapP(0.427271)}
                    L${mapT(352)},${mapP(0.445152)}
                    L${mapT(353)},${mapP(0.463659)}
                    L${mapT(354)},${mapP(0.48281)}
                    L${mapT(355)},${mapP(0.502623)}
                    L${mapT(356)},${mapP(0.523117)}
                    L${mapT(357)},${mapP(0.544308)}
                    L${mapT(358)},${mapP(0.566217)}
                    L${mapT(359)},${mapP(0.588862)}
                    L${mapT(371)},${mapP(0.76574)}
                    L${mapT(373.15)},${mapP(1.00000)}
                    
                    L${mapT(374)},${mapP(1.030974)}
                    L${mapT(375)},${mapP(1.068291)}
                    L${mapT(376)},${mapP(1.106724)}
                    L${mapT(377)},${mapP(1.1463)}
                    L${mapT(378)},${mapP(1.187044)}
                    L${mapT(379)},${mapP(1.228984)}
                    L${mapT(380)},${mapP(1.272145)}
                    L${mapT(381)},${mapP(1.316557)}
                    L${mapT(382)},${mapP(1.362245)}
                    L${mapT(383)},${mapP(1.409239)}
                    L${mapT(384)},${mapP(1.457567)}
                    L${mapT(385)},${mapP(1.507257)}
                    L${mapT(386)},${mapP(1.55834)}
                    L${mapT(387)},${mapP(1.610845)}
                    L${mapT(388)},${mapP(1.664803)}
                    L${mapT(389)},${mapP(1.720243)}
                    L${mapT(390)},${mapP(1.777196)}
                    L${mapT(391)},${mapP(1.835695)}
                    L${mapT(392)},${mapP(1.895771)}
                    L${mapT(393)},${mapP(1.957456)}
                    L${mapT(394)},${mapP(2.020783)}
                    L${mapT(395)},${mapP(2.085785)}
                    L${mapT(396)},${mapP(2.152495)}
                    L${mapT(397)},${mapP(2.220947)}
                    L${mapT(398)},${mapP(2.291176)}
                    L${mapT(399)},${mapP(2.363216)}
                    L${mapT(400)},${mapP(2.437102)}
                    L${mapT(401)},${mapP(2.512869)}
                    L${mapT(402)},${mapP(2.590555)}
                    L${mapT(403)},${mapP(2.670194)}
                    L${mapT(404)},${mapP(2.751824)}
                    L${mapT(405)},${mapP(2.835482)}
                    L${mapT(406)},${mapP(2.921206)}
                    L${mapT(407)},${mapP(3.009033)}
                    L${mapT(408)},${mapP(3.099003)}
                    L${mapT(409)},${mapP(3.191153)}
                    L${mapT(410)},${mapP(3.285523)}
                    L${mapT(411)},${mapP(3.382153)}
                    L${mapT(412)},${mapP(3.481083)}
                    L${mapT(413)},${mapP(3.582353)}
                    L${mapT(414)},${mapP(3.686004)}
                    L${mapT(415)},${mapP(3.792078)}
                    L${mapT(416)},${mapP(3.900616)}
                    L${mapT(417)},${mapP(4.01166)}
                    L${mapT(418)},${mapP(4.125254)}
                    L${mapT(419)},${mapP(4.241439)}
                    L${mapT(420)},${mapP(4.36026)}
                    L${mapT(421)},${mapP(4.48176)}
                    L${mapT(422)},${mapP(4.605983)}
                    L${mapT(423)},${mapP(4.732974)}
                    L${mapT(424)},${mapP(4.862778)}
                    L${mapT(425)},${mapP(4.99544)}
                    L${mapT(426)},${mapP(5.131006)}
                    L${mapT(427)},${mapP(5.269522)}
                    L${mapT(428)},${mapP(5.411036)}
                    L${mapT(429)},${mapP(5.555593)}
                    L${mapT(430)},${mapP(5.703241)}
                    L${mapT(431)},${mapP(5.854029)}
                    L${mapT(432)},${mapP(6.008004)}
                    L${mapT(433)},${mapP(6.165215)}
                    L${mapT(434)},${mapP(6.32571)}
                    L${mapT(435)},${mapP(6.48954)}
                    L${mapT(436)},${mapP(6.656753)}
                    L${mapT(437)},${mapP(6.827401)}
                    L${mapT(438)},${mapP(7.001533)}
                    L${mapT(439)},${mapP(7.179201)}
                    L${mapT(440)},${mapP(7.360455)}
                    L${mapT(441)},${mapP(7.545348)}
                    L${mapT(442)},${mapP(7.733932)}
                    L${mapT(443)},${mapP(7.926258)}
                    L${mapT(444)},${mapP(8.12238)}
                    L${mapT(445)},${mapP(8.322351)}
                    L${mapT(446)},${mapP(8.526224)}
                    L${mapT(447)},${mapP(8.734053)}
                    L${mapT(448)},${mapP(8.945893)}
                    L${mapT(449)},${mapP(9.161797)}
                    L${mapT(450)},${mapP(9.381822)}
                    L${mapT(451)},${mapP(9.606022)}
                    L${mapT(452)},${mapP(9.834454)}
                    L${mapT(453)},${mapP(10.067172)}
                    L${mapT(454)},${mapP(10.304234)}
                    L${mapT(455)},${mapP(10.545695)}
                    L${mapT(456)},${mapP(10.791614)}
                    L${mapT(457)},${mapP(11.042048)}
                    L${mapT(458)},${mapP(11.297054)}
                    L${mapT(459)},${mapP(11.556691)}
                    L${mapT(460)},${mapP(11.821016)}
                    L${mapT(461)},${mapP(12.090089)}
                    L${mapT(462)},${mapP(12.363968)}
                    L${mapT(463)},${mapP(12.642714)}
                    L${mapT(464)},${mapP(12.926385)}
                    L${mapT(465)},${mapP(13.215042)}
                    L${mapT(466)},${mapP(13.508745)}
                    L${mapT(467)},${mapP(13.807555)}
                    L${mapT(468)},${mapP(14.111533)}
                    L${mapT(469)},${mapP(14.42074)}
                    L${mapT(470)},${mapP(14.735237)}
                    L${mapT(471)},${mapP(15.055087)}
                    L${mapT(472)},${mapP(15.380351)}
                    L${mapT(473)},${mapP(15.711093)}
                    L${mapT(474)},${mapP(16.047374)}
                    L${mapT(475)},${mapP(16.389258)}
                    L${mapT(476)},${mapP(16.736809)}
                    L${mapT(477)},${mapP(17.090089)}
                    L${mapT(478)},${mapP(17.449163)}
                    L${mapT(479)},${mapP(17.814095)}
                    L${mapT(480)},${mapP(18.184949)}
                    L${mapT(481)},${mapP(18.56179)}
                    L${mapT(482)},${mapP(18.944683)}
                    L${mapT(483)},${mapP(19.333693)}
                    L${mapT(484)},${mapP(19.728886)}
                    L${mapT(485)},${mapP(20.130327)}
                    L${mapT(486)},${mapP(20.538082)}
                    L${mapT(487)},${mapP(20.952218)}
                    L${mapT(488)},${mapP(21.372801)}
                    L${mapT(489)},${mapP(21.799898)}
                    L${mapT(490)},${mapP(22.233575)}
                    L${mapT(491)},${mapP(22.6739)}
                    L${mapT(492)},${mapP(23.120941)}
                    L${mapT(493)},${mapP(23.574764)}
                    L${mapT(494)},${mapP(24.035439)}
                    L${mapT(495)},${mapP(24.503032)}
                    L${mapT(496)},${mapP(24.977612)}
                    L${mapT(497)},${mapP(25.459247)}
                    L${mapT(498)},${mapP(25.948008)}
                    L${mapT(499)},${mapP(26.443961)}
                    L${mapT(500)},${mapP(26.947177)}
                    L${mapT(501)},${mapP(27.457724)}
                    L${mapT(502)},${mapP(27.975672)}
                    L${mapT(503)},${mapP(28.501092)}
                    L${mapT(504)},${mapP(29.034052)}
                    L${mapT(505)},${mapP(29.574623)}
                    L${mapT(506)},${mapP(30.122874)}
                    L${mapT(507)},${mapP(30.678878)}
                    L${mapT(508)},${mapP(31.242703)}
                    L${mapT(509)},${mapP(31.814421)}
                    L${mapT(510)},${mapP(32.394103)}
                    L${mapT(511)},${mapP(32.981819)}
                    L${mapT(512)},${mapP(33.577642)}
                    L${mapT(513)},${mapP(34.181642)}
                    L${mapT(514)},${mapP(34.793891)}
                    L${mapT(515)},${mapP(35.41446)}
                    L${mapT(516)},${mapP(36.043422)}
                    L${mapT(517)},${mapP(36.680848)}
                    L${mapT(518)},${mapP(37.326811)}
                    L${mapT(519)},${mapP(37.981382)}
                    L${mapT(520)},${mapP(38.644634)}
                    L${mapT(521)},${mapP(39.31664)}
                    L${mapT(522)},${mapP(39.997472)}
                    L${mapT(523)},${mapP(40.687202)}
                    L${mapT(524)},${mapP(41.385905)}
                    L${mapT(525)},${mapP(42.093651)}
                    L${mapT(526)},${mapP(42.810516)}
                    L${mapT(527)},${mapP(43.536571)}
                    L${mapT(528)},${mapP(44.27189)}
                    L${mapT(529)},${mapP(45.016546)}
                    L${mapT(530)},${mapP(45.770613)}
                    L${mapT(531)},${mapP(46.534163)}
                    L${mapT(532)},${mapP(47.307272)}
                    L${mapT(533)},${mapP(48.090012)}
                    L${mapT(534)},${mapP(48.882457)}
                    L${mapT(535)},${mapP(49.684681)}
                    L${mapT(536)},${mapP(50.496758)}
                    L${mapT(537)},${mapP(51.318762)}
                    L${mapT(538)},${mapP(52.150766)}
                    L${mapT(539)},${mapP(52.992845)}
                    L${mapT(540)},${mapP(53.845073)}
                    L${mapT(541)},${mapP(54.707524)}
                    L${mapT(542)},${mapP(55.580272)}
                    L${mapT(543)},${mapP(56.463392)}
                    L${mapT(544)},${mapP(57.356957)}
                    L${mapT(545)},${mapP(58.261043)}
                    L${mapT(546)},${mapP(59.175723)}
                    L${mapT(547)},${mapP(60.101072)}
                    L${mapT(548)},${mapP(61.037164)}
                    L${mapT(549)},${mapP(61.984074)}
                    L${mapT(550)},${mapP(62.941876)}
                    L${mapT(551)},${mapP(63.910644)}
                    L${mapT(552)},${mapP(64.890454)}
                    L${mapT(553)},${mapP(65.881379)}
                    L${mapT(554)},${mapP(66.883494)}
                    L${mapT(555)},${mapP(67.896874)}
                    L${mapT(556)},${mapP(68.921593)}
                    L${mapT(557)},${mapP(69.957725)}
                    L${mapT(558)},${mapP(71.005345)}
                    L${mapT(559)},${mapP(72.064528)}
                    L${mapT(560)},${mapP(73.135347)}
                    L${mapT(561)},${mapP(74.217878)}
                    L${mapT(562)},${mapP(75.312194)}
                    L${mapT(563)},${mapP(76.418371)}
                    L${mapT(564)},${mapP(77.536482)}
                    L${mapT(565)},${mapP(78.666601)}
                    L${mapT(566)},${mapP(79.808804)}
                    L${mapT(567)},${mapP(80.963164)}
                    L${mapT(568)},${mapP(82.129755)}
                    L${mapT(569)},${mapP(83.308652)}
                    L${mapT(570)},${mapP(84.499928)}
                    L${mapT(571)},${mapP(85.703659)}
                    L${mapT(572)},${mapP(86.919917)}
                    L${mapT(573)},${mapP(88.148777)}
                    L${mapT(574)},${mapP(89.390312)}
                    L${mapT(575)},${mapP(90.644597)}
                    L${mapT(576)},${mapP(91.911705)}
                    L${mapT(577)},${mapP(93.19171)}
                    L${mapT(578)},${mapP(94.484685)}
                    L${mapT(579)},${mapP(95.790705)}
                    L${mapT(580)},${mapP(97.109842)}
                    L${mapT(581)},${mapP(98.442169)}
                    L${mapT(582)},${mapP(99.787761)}
                    L${mapT(583)},${mapP(101.14669)}
                    L${mapT(584)},${mapP(102.51903)}
                    L${mapT(585)},${mapP(103.904853)}
                    L${mapT(586)},${mapP(105.304232)}
                    L${mapT(587)},${mapP(106.717241)}
                    L${mapT(588)},${mapP(108.143951)}
                    L${mapT(589)},${mapP(109.584436)}
                    L${mapT(590)},${mapP(111.038769)}
                    L${mapT(591)},${mapP(112.50702)}
                    L${mapT(592)},${mapP(113.989264)}
                    L${mapT(593)},${mapP(115.485571)}
                    L${mapT(594)},${mapP(116.996015)}
                    L${mapT(595)},${mapP(118.520666)}
                    L${mapT(596)},${mapP(120.059597)}
                    L${mapT(597)},${mapP(121.61288)}
                    L${mapT(598)},${mapP(123.180585)}
                    L${mapT(599)},${mapP(124.762785)}
                    L${mapT(600)},${mapP(126.359551)}
                    L${mapT(601)},${mapP(127.970954)}
                    L${mapT(602)},${mapP(129.597064)}
                    L${mapT(603)},${mapP(131.237954)}
                    L${mapT(604)},${mapP(132.893692)}
                    L${mapT(605)},${mapP(134.564351)}
                    L${mapT(606)},${mapP(136.250001)}
                    L${mapT(607)},${mapP(137.950711)}
                    L${mapT(608)},${mapP(139.666553)}
                    L${mapT(609)},${mapP(141.397595)}
                    L${mapT(610)},${mapP(143.143908)}
                    L${mapT(611)},${mapP(144.905562)}
                    L${mapT(612)},${mapP(146.682625)}
                    L${mapT(613)},${mapP(148.475168)}
                    L${mapT(614)},${mapP(150.283259)}
                    L${mapT(615)},${mapP(152.106968)}
                    L${mapT(616)},${mapP(153.946363)}
                    L${mapT(617)},${mapP(155.801513)}
                    L${mapT(618)},${mapP(157.672487)}
                    L${mapT(619)},${mapP(159.559352)}
                    L${mapT(620)},${mapP(161.462177)}
                    L${mapT(621)},${mapP(163.38103)}
                    L${mapT(622)},${mapP(165.315978)}
                    L${mapT(623)},${mapP(167.267089)}
                    L${mapT(624)},${mapP(169.234431)}
                    L${mapT(625)},${mapP(171.218071)}
                    L${mapT(626)},${mapP(173.218075)}
                    L${mapT(627)},${mapP(175.234511)}
                    L${mapT(628)},${mapP(177.267445)}
                    L${mapT(629)},${mapP(179.316943)}
                    L${mapT(630)},${mapP(181.383072)}
                    L${mapT(631)},${mapP(183.465898)}
                    L${mapT(632)},${mapP(185.565487)}
                    L${mapT(633)},${mapP(187.681903)}
                    L${mapT(634)},${mapP(189.815213)}
                    L${mapT(635)},${mapP(191.965482)}
                    L${mapT(636)},${mapP(194.132774)}
                    L${mapT(637)},${mapP(196.317155)}
                    L${mapT(638)},${mapP(198.518688)}
                    L${mapT(639)},${mapP(200.73744)}
                    L${mapT(640)},${mapP(202.973472)}
                    L${mapT(641)},${mapP(205.22685)}
                    L${mapT(642)},${mapP(207.497636)}
                    L${mapT(643)},${mapP(209.785896)}
                    L${mapT(644)},${mapP(212.09169)}
                    L${mapT(645)},${mapP(214.415084)}
                    L${mapT(646)},${mapP(216.756139)}
                    L${mapT(647.096)},${mapP(218.0)}

                    L${mapT(647.096)},${mapP(217.75)}`}
                  stroke={theme.titleText}
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
                {/* Boiling point marker */}
                <Circle
                  cx={mapT(373.15)}
                  cy={mapP(1.00000)}
                  r="4"
                  fill={theme.titleText}
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(373.15) + 8}
                  y={mapP(0.2) - 8}
                  fontSize="12"
                  fill={theme.titleText}
                  fontWeight="bold"
                >
                  Boiling
                </SvgText>
                {/* Freezing point marker */}
                <Circle
                  cx={mapT(272.25)}
                  cy={mapP(1)}
                  r="4"
                  fill={theme.titleText}
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(272.25) + 8}
                  y={mapP(1) - 8}
                  fontSize="12"
                  fill={theme.titleText}
                  fontWeight="bold"
                >
                  Freezing
                </SvgText>
                {/* Axes */}
                <Path
                  d={`M${mapT(minT)},${mapP(0.001)} L${mapT(minT)},${mapP(300)}`}
                  stroke={theme.titleText}
                  strokeWidth="2"
                  opacity={0.9}
                />
                <Path
                  d={`M${mapT(minT)},${mapP(0.001)} L${mapT(maxT)},${mapP(0.001)}`}
                  stroke={theme.titleText}
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
                        stroke={theme.titleText}
                        strokeWidth="1.3"
                        opacity={0.6}
                      />
                      <SvgText
                        x={x}
                        y={diagramHeight - 18}
                        fontSize="11"
                        fill={theme.subtitleText}
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
                  fill={theme.subtitleText}
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
                        stroke={theme.titleText}
                        strokeWidth="1.3"
                        opacity={0.6}
                      />
                      <SvgText
                        x={38}
                        y={y + 4}
                        fontSize="11"
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
                  y={diagramHeight / 2}
                  fontSize="13"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  textAnchor="middle"
                  opacity={0.94}
                  transform={`rotate(-90 10,${diagramHeight / 2})`}
                >
                  PRESSURE (atm)
                </SvgText>
                {/* Interactive point */}
                <Circle
                  cx={mapT(temperature)}
                  cy={mapP(pressure)}
                  r="6"
                  fill="#00FFE5"
                  stroke={theme.titleText}
                  strokeWidth="2"
                  opacity={0.95}
                />
                {/* Triple point */}
                <Circle
                  cx={mapT(273.16)}
                  cy={mapP(0.00604)}
                  r="5"
                  fill={theme.titleText}
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(273.16) + 8}
                  y={mapP(0.00404)}
                  fontSize="12"
                  fill={theme.titleText}
                  fontWeight="bold"
                >
                  Triple
                </SvgText>
                {/* Critical point */}
                <Circle
                  cx={mapT(647.096)}
                  cy={mapP(217.75)}
                  r="5"
                  fill={theme.titleText}
                  opacity={0.9}
                />
                <SvgText
                  x={mapT(647.096) - 10}
                  y={mapP(110.75) - 10}
                  fontSize="12"
                  fill={theme.titleText}
                  fontWeight="bold"
                >
                  Critical
                </SvgText>
                {/* Phase labels */}
                <SvgText
                  x={mapT(210)}
                  y={mapP(10)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Solid
                </SvgText>
                <SvgText
                  x={mapT(350)}
                  y={mapP(170)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Liquid
                </SvgText>
                <SvgText
                  x={mapT(550)}
                  y={mapP(0.1)}
                  fontSize="15"
                  fill={theme.subtitleText}
                  fontWeight="bold"
                  opacity={0.94}
                >
                  Gas
                </SvgText>
                {/* Fusion curve (solid-liquid boundary) - using accurate data points */}
                <Path
                  d={`M${mapT(273.16)},${mapP(0.006117)}
                    L${mapT(273.14)},${mapP(0.01)}
                    L${mapT(273.00)},${mapP(0.1)}
                    L${mapT(272.25)},${mapP(1)}
                    L${mapT(270.2)},${mapP(10)}
                    L${mapT(252.0)},${mapP(100)}
                    L${mapT(240.0)},${mapP(200)}
                    L${mapT(230.0)},${mapP(300)}`}
                  stroke={theme.titleText}
                  strokeWidth="2.2"
                  fill="none"
                  opacity="0.9"
                />
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
                style={{ width: Math.max(140, diagramWidth - 100) }}
                minimumValue={minT}
                maximumValue={maxT}
                value={temperature}
                onValueChange={setTemperature}
                minimumTrackTintColor="#4a90e2"
                maximumTrackTintColor={theme.isDarkTheme ? theme.cardBackground : '#1976D2'}
                thumbTintColor="#e55"
                thumbStyle={{ width: 32, height: 32 }}
              />
              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.valueInput,
                    { 
                      color: tempWarning ? "#ff4444" : "#e55",
                      borderColor: tempWarning ? "#ff4444" : theme.borderColor,
                      backgroundColor: theme.cardBackground,
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
          <View style={[styles.rightPanel, { paddingHorizontal: rightPanelPadding }]}>
            <View style={[styles.phaseContainer, { 
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor,
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
                backgroundColor: phaseColors[phase === "Supercritical" ? "Gas" : phase] + '20',
                borderColor: phaseColors[phase === "Supercritical" ? "Gas" : phase],
              }]}>
                <Text
                  style={[
                    styles.phaseValueNew,
                    {
                      color: phaseColors[phase === "Supercritical" ? "Gas" : phase],
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
              elevation: 4,
              borderColor: theme.borderColor,
            }]}>
              <MoleculeSim
                phase={phase === "Supercritical" ? "Gas" : phase}
                width={70}
                height={70}
              />
            </View>
            <View style={[styles.moleculeCircle, { 
              backgroundColor: theme.cardBackground,
              shadowColor: theme.shadowColor,
              elevation: 4,
              borderColor: theme.borderColor,
            }]}>
              <PhaseTransitionSim
                phase={phase === "Supercritical" ? "gas" : phase.toLowerCase()}
                width={70}
                height={70}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    width: 110,
    alignItems: "center",
    paddingTop: 32,
    borderRightWidth: 2,
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
    borderWidth: 2,
  },
  thermometerContainer: { marginTop: 26, marginBottom: 12 },
  content: {
    flex: 1,
    flexDirection: "column",
    padding: 6,
    position: "relative",
  },
  headerRowNew: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
    marginBottom: 5,
  },
  titleNew: {
    fontSize: 28,
    fontWeight: "bold",
    letterSpacing: 1.2,
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
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    borderWidth: 2,
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
    borderRadius: 14,
    marginTop: 2,
    borderWidth: 2,
  },
  sliderLabel: {
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
    width: 120, // Fixed width
    height: 30, // Fixed height
  },
  valueInput: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    width: 85, // Fixed width instead of minWidth
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  inputUnit: {
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  phaseLabelNew: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 0.7,
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  phaseValueNew: {
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 15,
    letterSpacing: 0.7,
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
    textAlign: "center",
  },
  moleculeCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.13,
    shadowRadius: 8,
    borderWidth: 2,
    marginBottom: 12,
  },
  warningText: {
    color: "#ff4444",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 2,
    textAlign: "center",
    opacity: 0.9,
  },
  homeButtonNew: {
    position: "absolute",
    right: 13,
    bottom: 13,
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.09,
    shadowRadius: 3,
    zIndex: 10,
    borderWidth: 2,
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
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  phaseContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 12,
  },
  phaseValueContainer: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 2,
    borderRadius: 6,
  },
  helpButton: {
    width: 38,
    height: 38,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 8,
    shadowOpacity: 0.09,
    shadowRadius: 3,
    borderWidth: 2,
    elevation: 3,
  },
  helpButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 1)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalContent: {
    width: 500,
    maxHeight: 400,
    padding: 28,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalBody: {
    width: '100%',
    alignItems: 'center',
  },
  helpText: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'left',
    lineHeight: 22,
  },
  helpSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  colorLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 10,
  },
  colorItem: {
    alignItems: 'center',
    flex: 1,
  },
  colorBox: {
    width: 24,
    height: 24,
    marginBottom: 8,
    borderWidth: 2,
    borderRadius: 6,
    borderColor: '#333',
  },
  colorText: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});