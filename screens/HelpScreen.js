import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
  ScrollView,
  LayoutAnimation,
  useWindowDimensions,
} from "react-native";
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

// Use the same phase colors as DiagramScreen
const phaseColors = {
  "Solid": "#4a90e2",
  "Liquid": "#7ed957",
  "Gas": "#ffa500",
  "Critical": "#ff1493", // Deep pink for critical point
  "Supercritical": "#ff7eeb",
};

export default function HelpScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePress = useButtonSound();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Responsive sizing based on screen dimensions
  const padding = Math.max(16, Math.min(32, width * 0.04));
  const sectionPad = Math.max(12, Math.min(20, width * 0.03));
  const fontTitle = Math.max(18, Math.min(24, width * 0.045));
  const fontSubtitle = Math.max(14, Math.min(18, width * 0.035));
  const fontBody = Math.max(12, Math.min(16, width * 0.03));
  const iconSize = Math.max(20, Math.min(28, width * 0.04));
  const colorBoxSize = Math.max(16, Math.min(24, width * 0.03));

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [theme, width, height]);

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.12, duration: 350, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View
      key={theme.background + width + height}
      style={[
        styles.container,
        { backgroundColor: theme.background, paddingHorizontal: padding, paddingTop: isLandscape ? padding : padding * 2 },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            backgroundColor: theme.buttonPrimary,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            elevation: 5,
            top: Platform.OS === 'ios' ? (isLandscape ? 20 : 40) : (isLandscape ? 10 : 30),
            right: padding,
          },
        ]}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={[styles.backButtonText, { color: theme.titleText }]}>Back</Text>
        <Icon name="arrow-right" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <ScrollView
        style={{ flex: 1, width: '100%' }}
        contentContainerStyle={{ paddingBottom: padding * 2, alignItems: 'center' }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.primaryAccent,
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
              marginBottom: sectionPad,
              flexDirection: isLandscape ? 'row' : 'column',
              alignItems: 'center',
              gap: isLandscape ? 18 : 8,
            },
          ]}
        >
          <Icon name="help-circle" size={iconSize} color={theme.primaryAccent} style={{ marginRight: isLandscape ? 18 : 0, marginBottom: isLandscape ? 0 : 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.titleText, fontSize: fontTitle }]}>
              Phase Diagram Guide
            </Text>
            <Text style={[styles.subtitle, { color: theme.subtitleText, fontSize: fontSubtitle, marginTop: 4 }]}>
              Learn how to use the interactive phase diagram
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
              gap: sectionPad * 0.8,
              width: '100%',
              maxWidth: 700,
            },
          ]}
        >
          {/* How to Use */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>How to Use</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.instructionItem}>
                <Icon name="gesture-tap" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Drag the temperature slider (left side) to change temperature</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="gesture-tap" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Drag the pressure slider (right side) to change pressure</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="keyboard" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Type values directly in the input fields</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="link-variant" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Use the LINK button to follow phase boundaries</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="atom" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Watch molecules change based on phase</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="thermometer" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Check the thermometer for temperature visualization</Text>
              </View>
            </View>
          </View>

          {/* Layout Overview */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Layout Overview</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.layoutItem}>
                <Icon name="view-dashboard" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Left: Phase diagram and temperature controls</Text>
              </View>
              <View style={styles.layoutItem}>
                <Icon name="molecule" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Center: Phase label and molecule simulations</Text>
              </View>
              <View style={styles.layoutItem}>
                <Icon name="slope-uphill" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Right: Pressure controls and thermometer</Text>
              </View>
            </View>
          </View>

          {/* Phase Colors */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Phase Colors</Text>
            <View style={[styles.colorLegend, { gap: 10, marginTop: 10 }]}> 
              <View style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: phaseColors["Solid"], width: colorBoxSize, height: colorBoxSize, borderColor: theme.borderColor }]} />
                <Text style={[styles.colorText, { color: theme.subtitleText, fontSize: fontBody }]}>Solid</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: phaseColors["Liquid"], width: colorBoxSize, height: colorBoxSize, borderColor: theme.borderColor }]} />
                <Text style={[styles.colorText, { color: theme.subtitleText, fontSize: fontBody }]}>Liquid</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: phaseColors["Gas"], width: colorBoxSize, height: colorBoxSize, borderColor: theme.borderColor }]} />
                <Text style={[styles.colorText, { color: theme.subtitleText, fontSize: fontBody }]}>Gas</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: phaseColors["Critical"], width: colorBoxSize, height: colorBoxSize, borderColor: theme.borderColor }]} />
                <Text style={[styles.colorText, { color: theme.subtitleText, fontSize: fontBody }]}>Critical</Text>
              </View>
              <View style={styles.colorItem}>
                <View style={[styles.colorBox, { backgroundColor: phaseColors["Supercritical"], width: colorBoxSize, height: colorBoxSize, borderColor: theme.borderColor }]} />
                <Text style={[styles.colorText, { color: theme.subtitleText, fontSize: fontBody }]}>Supercritical</Text>
              </View>
            </View>
          </View>

          {/* Key Points */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Key Points</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Colored dot shows current position on diagram</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Triple point: where solid, liquid, gas coexist (0.01°C, 0.006 atm)</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Critical point: boundary between liquid and gas (374°C, 218 atm)</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Temperature range: -73°C to 427°C (200K to 700K)</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Pressure range: 0.001 to 300 atm</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>LINK mode follows the phase boundary curve</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Temperature and thermometer now have labeled ticks at -50°C, 0°C, 50°C, and 100°C for easier reading</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Pressure input: max 4 digits (before/after decimal), optional decimal point</Text>
              </View>
            </View>
          </View>

          {/* Phase Boundaries */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Phase Boundaries</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.boundaryItem}>
                <Text style={[styles.boundaryName, { color: theme.titleText, fontSize: fontBody + 2 }]}>Sublimation Curve</Text>
                <Text style={[styles.boundaryDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Solid-gas boundary (below triple point)</Text>
              </View>
              <View style={styles.boundaryItem}>
                <Text style={[styles.boundaryName, { color: theme.titleText, fontSize: fontBody + 2 }]}>Fusion Curve</Text>
                <Text style={[styles.boundaryDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Solid-liquid boundary (nearly vertical)</Text>
              </View>
              <View style={styles.boundaryItem}>
                <Text style={[styles.boundaryName, { color: theme.titleText, fontSize: fontBody + 2 }]}>Vaporization Curve</Text>
                <Text style={[styles.boundaryDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Liquid-gas boundary (boiling curve)</Text>
              </View>
              <View style={styles.boundaryItem}>
                <Text style={[styles.boundaryName, { color: theme.titleText, fontSize: fontBody + 2 }]}>Critical Point Line</Text>
                <Text style={[styles.boundaryDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Boundary to supercritical fluid region</Text>
              </View>
            </View>
          </View>

          {/* Ice Phases */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Ice Phases</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.subtitleText, fontSize: fontBody, marginBottom: 8 }]}>
              Water can exist in different solid phases under high pressure
            </Text>
            <View style={{ gap: 8 }}>
              <View style={styles.icePhaseItem}>
                <Text style={[styles.icePhaseName, { color: theme.titleText, fontSize: fontBody + 1 }]}>Ice I</Text>
                <Text style={[styles.icePhaseDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Normal ice (hexagonal structure) - below 209.9 atm</Text>
              </View>
              <View style={styles.icePhaseItem}>
                <Text style={[styles.icePhaseName, { color: theme.titleText, fontSize: fontBody + 1 }]}>Ice III</Text>
                <Text style={[styles.icePhaseDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Tetragonal structure - 209.9 to 350.1 atm, below -22°C</Text>
              </View>
              <View style={styles.icePhaseItem}>
                <Text style={[styles.icePhaseName, { color: theme.titleText, fontSize: fontBody + 1 }]}>Ice V</Text>
                <Text style={[styles.icePhaseDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Monoclinic structure - 350.1 to 632.4 atm, below -17°C</Text>
              </View>
              <View style={styles.icePhaseItem}>
                <Text style={[styles.icePhaseName, { color: theme.titleText, fontSize: fontBody + 1 }]}>Ice VI</Text>
                <Text style={[styles.icePhaseDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Tetragonal structure - 632.4 to 2216.0 atm, below 0.16°C</Text>
              </View>
              <View style={styles.icePhaseItem}>
                <Text style={[styles.icePhaseName, { color: theme.titleText, fontSize: fontBody + 1 }]}>Ice VII</Text>
                <Text style={[styles.icePhaseDesc, { color: theme.subtitleText, fontSize: fontBody }]}>Cubic structure - above 2216.0 atm, below 81.85°C</Text>
              </View>
            </View>
          </View>

          {/* Special Features */}
          <View style={[
            styles.section,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              borderRadius: Math.max(12, Math.min(24, width * 0.025)),
              padding: sectionPad,
            },
          ]}>
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent, fontSize: fontSubtitle + 2 }]}>Special Features</Text>
            <View style={{ gap: 8 }}>
              <View style={styles.featureItem}>
                <Icon name="link-variant" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>LINK Mode: Automatically follows phase boundaries when enabled</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="thermometer" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Interactive Thermometer: Shows temperature with color-coded fluid</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="molecule" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Molecule Simulations: Watch particle behavior change with phase</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="chart-line" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Accurate Phase Boundaries: Based on IAPWS standard data</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="snowflake" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Multiple Ice Phases: Explore different solid water structures</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="atom" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Critical Point: Special phase at 374°C, 218 atm</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  header: {
    width: '100%',
    marginBottom: 16,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginTop: 30,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  subtitle: {
    opacity: 0.8,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
  },
  section: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  instructionIcon: {
    marginRight: 8,
  },
  instructionText: {
    flex: 1,
    lineHeight: 18,
  },
  colorLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  colorItem: {
    alignItems: 'center',
    minWidth: 70,
    marginBottom: 6,
  },
  colorBox: {
    marginBottom: 6,
    borderWidth: 2,
    borderRadius: 6,
  },
  colorText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keyPointItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  keyPointText: {
    flex: 1,
    lineHeight: 18,
    marginTop: 1,
  },
  boundaryItem: {
    paddingVertical: 6,
  },
  boundaryName: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  boundaryDesc: {
    lineHeight: 16,
  },
  backButton: {
    position: 'absolute',
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
  layoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  sectionSubtitle: {
    opacity: 0.8,
  },
  icePhaseItem: {
    paddingVertical: 6,
  },
  icePhaseName: {
    fontWeight: 'bold',
    marginBottom: 3,
  },
  icePhaseDesc: {
    lineHeight: 16,
  },
}); 