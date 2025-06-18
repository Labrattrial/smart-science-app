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
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Drag the temperature slider to change temperature</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="gesture-tap" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Drag the pressure slider to change pressure</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="keyboard" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Type values directly in the input fields</Text>
              </View>
              <View style={styles.instructionItem}>
                <Icon name="atom" size={fontSubtitle + 6} color={theme.primaryAccent} style={styles.instructionIcon} />
                <Text style={[styles.instructionText, { color: theme.subtitleText, fontSize: fontBody }]}>Watch molecules change based on phase</Text>
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
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Red dot shows current position on diagram</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Triple point: where solid, liquid, gas coexist</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Critical point: boundary between liquid and gas</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Temperature range: -73°C to 427°C</Text>
              </View>
              <View style={styles.keyPointItem}>
                <Icon name="circle-small" size={fontSubtitle + 8} color={theme.primaryAccent} />
                <Text style={[styles.keyPointText, { color: theme.subtitleText, fontSize: fontBody }]}>Pressure range: 0.001 to 300 atm</Text>
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
}); 