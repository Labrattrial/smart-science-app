// C:\Users\Christian\Desktop\phET\molecule_simulator\PhaseChangeScreens\MeltingScreen.js

import React from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Platform, Image } from 'react-native';
import MoleculeSimulator from '../components/MoleculeSimulator';
import Svg, { Path } from 'react-native-svg';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';

const { width } = Dimensions.get('window');
const CONTAINER_WIDTH = (width - 60) / 2;

export default function MeltingScreen() {
  const navigation = useNavigation();
  const handlePress = useButtonSound();
  const { isDarkTheme, colors } = useTheme();

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
        style={[styles.logo, { tintColor: isDarkTheme ? '#FFFFFF' : '#000000' }]}
        resizeMode="contain"
      />

      <TouchableOpacity 
        style={[styles.backButton, { backgroundColor: isDarkTheme ? 'rgba(0, 176, 255, 0.25)' : 'rgba(0, 176, 255, 0.15)' }]}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={[styles.backButtonText, { color: isDarkTheme ? '#FFFFFF' : '#000000' }]}>Back</Text>
        <Icon name="arrow-right" size={20} color={isDarkTheme ? '#FFFFFF' : '#000000'} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.headerContainer, { backgroundColor: isDarkTheme ? '#1F2428' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDarkTheme ? '#E0F7FA' : '#000000' }]}>Melting</Text>
          <Text style={[styles.subtitle, { color: isDarkTheme ? '#90A4AE' : '#666666' }]}>(Solid → Liquid)</Text>
        </View>

        <View style={[styles.descriptionContainer, { backgroundColor: isDarkTheme ? '#1F2428' : '#FFFFFF' }]}>
          <Text style={[styles.descriptionTitle, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>What is Melting?</Text>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>•</Text>
            <Text style={[styles.description, { color: isDarkTheme ? '#E0F7FA' : '#000000' }]}>
              It is the process by which substance changes from the solid phase to the liquid phase.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>•</Text>
            <Text style={[styles.description, { color: isDarkTheme ? '#E0F7FA' : '#000000' }]}>
              In the melting process, molecules became loosely packed<Text style={[styles.boldText, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>(liquid phase)</Text>  from being closely packed<Text style={[styles.boldText, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>(solid phase)</Text>. This happens when the energy <Text style={[styles.boldText, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>(heat)</Text> is added to solid phase to change its stage to liquid.
            </Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text style={[styles.bullet, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>•</Text>
            <Text style={[styles.description, { color: isDarkTheme ? '#E0F7FA' : '#000000' }]}>
              An increase in temperature will also increase molecular motion of the particles between the states of matter.
            </Text>
          </View>
        </View>

        {/* Molecules Section */}
        <View style={styles.moleculesSection}>
          {/* Solid Molecules Container */}
          <View style={[styles.animationBox, { backgroundColor: isDarkTheme ? '#1F2428' : '#FFFFFF' }]}>
            <Text style={[styles.animationTitle, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>Solid Molecules</Text>
            <View style={[styles.moleculeAnimationArea, { backgroundColor: isDarkTheme ? '#14181C' : '#F5F5F5' }]}>
              <MoleculeSimulator phase="Solid" width={CONTAINER_WIDTH - 30} height={200} />
            </View>
          </View>

          {/* Arrow Container */}
          <View style={styles.arrowContainer}>
            <Svg width={40} height={40} viewBox="0 0 40 40">
              <Path
                d="M5 20 L35 20 M25 10 L35 20 L25 30"
                stroke={isDarkTheme ? '#00B0FF' : '#007AFF'}
                strokeWidth={3}
                fill="none"
              />
            </Svg>
          </View>

          {/* Liquid Molecules Container */}
          <View style={[styles.animationBox, { backgroundColor: isDarkTheme ? '#1F2428' : '#FFFFFF' }]}>
            <Text style={[styles.animationTitle, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>Liquid Molecules</Text>
            <View style={[styles.moleculeAnimationArea, { backgroundColor: isDarkTheme ? '#14181C' : '#F5F5F5' }]}>
              <MoleculeSimulator phase="Liquid" width={CONTAINER_WIDTH - 30} height={200} />
            </View>
          </View>
        </View>

        {/* Example Section */}
        <View style={styles.exampleSection}>
          <View style={[styles.animationBox, { backgroundColor: isDarkTheme ? '#1F2428' : '#FFFFFF' }]}>
            <Text style={[styles.animationTitle, { color: isDarkTheme ? '#00B0FF' : '#007AFF' }]}>Example</Text>
            <Text style={[styles.exampleText, { color: isDarkTheme ? '#90A4AE' : '#666666' }]}>Ice melts into water when left outside</Text>
            <View style={[styles.exampleContainer, { backgroundColor: isDarkTheme ? '#14181C' : '#F5F5F5' }]}>
              <Video
                source={require('../assets/phases/melting.mp4')}
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
    borderColor: '#00B0FF40',
    shadowColor: '#00B0FF',
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
    borderColor: '#2C2F3340',
    shadowColor: '#00B0FF',
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
  boldText: {
    fontWeight: '700',
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
    borderColor: '#2C2F3340',
    shadowColor: '#00B0FF',
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
    borderColor: '#2C2F3340',
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
    borderColor: '#2C2F3340',
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
    shadowColor: '#00B0FF',
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
    borderColor: '#00B0FF',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0, 176, 255, 0.4)',
    shadowColor: "#00B0FF",
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

