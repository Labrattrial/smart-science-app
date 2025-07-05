import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import MoleculeSimulator from '../components/MoleculeSimulator';
import Svg, { Path } from 'react-native-svg';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome6';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = (width - 60) / 2;

export default function CondensationScreen() {
  const navigation = useNavigation();
  const handlePress = useButtonSound();
  const { theme, isDarkTheme } = useTheme();

  const gradientColors = isDarkTheme 
    ? ['#0B0F12', '#14181C', '#1F2428']
    : ['#E3F2FD', '#BBDEFB', '#90CAF9'];

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.container}
    >
      <Image 
        source={require('../assets/logo.png')}
        style={[styles.logo, { tintColor: theme.titleText }]}
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
        <Text style={[styles.backButtonText, { color: theme.titleText }]}>Back</Text>
        <EntypoIcon name="back" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.headerContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.title, { color: theme.titleText }]}>Condensation</Text>
          <Text style={[styles.subtitle, { color: theme.subtitleText }]}>(Gas → Liquid)</Text>
        </View>

        <View style={[styles.descriptionContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.descriptionTitle, { color: theme.primaryAccent }]}>What is Condensation?</Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.primaryAccent }]}>•</Text>
            <Text style={[styles.description, { color: theme.subtitleText }]}>
              Condensation is the change in state of matter from the gas phase to the liquid phase. When gas molecules collide with a cooler surface, they lose energy and transform into liquid droplets.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: theme.primaryAccent }]}>•</Text>
            <Text style={[styles.description, { color: theme.subtitleText }]}>
              This process occurs when heat is removed from the gas, causing the molecules to move closer together and form liquid droplets. It's the opposite of evaporation, where liquid turns into gas.
            </Text>
          </View>
        </View>

        {/* Molecules Section */}
        <View style={styles.moleculesSection}>
          {/* Gas Molecules Container */}
          <View style={[styles.animationBox, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
          }]}>
            <Text style={[styles.animationTitle, { color: theme.primaryAccent }]}>Gas Molecules</Text>
            <View style={[styles.moleculeAnimationArea, { 
              backgroundColor: theme.background,
              borderColor: theme.borderColor,
            }]}>
              <MoleculeSimulator phase="Gas" width={CONTAINER_WIDTH - 30} height={200} />
            </View>
          </View>

          {/* Arrow Container */}
          <View style={styles.arrowContainer}>
            <Svg width={40} height={40} viewBox="0 0 40 40">
              <Path
                d="M5 20 L35 20 M25 10 L35 20 L25 30"
                stroke={theme.primaryAccent}
                strokeWidth="3"
                fill="none"
              />
            </Svg>
          </View>

          {/* Liquid Molecules Container */}
          <View style={[styles.animationBox, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
          }]}>
            <Text style={[styles.animationTitle, { color: theme.primaryAccent }]}>Liquid Molecules</Text>
            <View style={[styles.moleculeAnimationArea, { 
              backgroundColor: theme.background,
              borderColor: theme.borderColor,
            }]}>
              <MoleculeSimulator phase="Liquid" width={CONTAINER_WIDTH - 30} height={200} />
            </View>
          </View>
        </View>

        {/* Example Section */}
        <View style={styles.exampleSection}>
          <View style={[styles.animationBox, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
            shadowColor: theme.shadowColor,
          }]}>
            <Text style={[styles.animationTitle, { color: theme.primaryAccent }]}>Example</Text>
            <Text style={[styles.exampleText, { color: theme.subtitleText }]}>Water droplets form on a cold soda can</Text>
            <View style={[styles.exampleContainer, { 
              backgroundColor: theme.background,
              borderColor: theme.borderColor,
            }]}>
              <Video
                source={require('../assets/phases/condensation.mp4')}
                style={styles.exampleVideo}
                resizeMode="contain"
                shouldPlay
                isLooping
                isMuted={true}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 140 : 120,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: '#00B0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: 30,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  descriptionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'left',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingRight: 8,
  },
  bullet: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 28,
    flex: 1,
    letterSpacing: 0.3,
  },
  moleculesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  animationBox: {
    flex: 1,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  animationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  moleculeAnimationArea: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  arrowContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exampleSection: {
    marginBottom: 20,
  },
  exampleText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 10,
  },
  exampleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    minHeight: 200,
  },
  exampleVideo: {
    width: '100%',
    height: '100%',
  },
  logo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    left: 20,
    width: 60,
    height: 60,
    zIndex: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
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
    elevation: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "700",
    marginRight: 6,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
});

