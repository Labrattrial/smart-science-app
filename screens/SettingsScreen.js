import React from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, ScrollView } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAudio } from '../components/AudioContext';
import { useTheme } from '../components/ThemeContext';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(24, SCREEN_WIDTH * 0.08, 32);
const fontSubtitle = clamp(14, SCREEN_WIDTH * 0.045, 18);
const buttonPaddingVertical = clamp(6, SCREEN_WIDTH * 0.025, 12);
const buttonPaddingHorizontal = clamp(16, SCREEN_WIDTH * 0.05, 24);
const borderRadius = clamp(10, SCREEN_WIDTH * 0.03, 20);
const shadowRadius = clamp(2, SCREEN_WIDTH * 0.02, 6);
const paddingTopContent = clamp(7, SCREEN_HEIGHT * 0.10, 90);
const paddingBottomContent = clamp(10, SCREEN_HEIGHT * 0.05, 40);

const RadioButton = ({ selected, onPress, label, theme }) => (
  <TouchableOpacity
    style={styles.radioButtonContainer}
    onPress={onPress}
  >
    <View style={[
      styles.radioButton,
      { borderColor: theme.primaryAccent },
      selected && { borderColor: theme.primaryAccent }
    ]}>
      {selected && (
        <View style={[
          styles.radioButtonSelected,
          { backgroundColor: theme.primaryAccent }
        ]} />
      )}
    </View>
    <Text style={[styles.radioButtonLabel, { color: theme.subtitleText }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const { 
    musicVolume, 
    sfxVolume, 
    setMusicVolumeAsync, 
    setSFXVolumeAsync, 
    playPopSound 
  } = useAudio();
  const { isDarkTheme, toggleTheme, theme, isSystemTheme, toggleSystemTheme, setTheme } = useTheme();

  const handleMusicVolumeChange = async (value) => {
    await setMusicVolumeAsync(value);
  };

  const handleSFXVolumeChange = async (value) => {
    await setSFXVolumeAsync(value);
    // Play a test sound when adjusting SFX volume
    playPopSound();
  };

  const handleThemeToggle = () => {
    toggleTheme();
    playPopSound();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <TouchableOpacity 
        style={[styles.backButton, { 
          backgroundColor: theme.buttonPrimary,
          borderColor: theme.primaryAccent,
          shadowColor: theme.shadowColor,
          elevation: 5,
        }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.backButtonText, { color: theme.titleText }]}>Back</Text>
        <Icon name="arrow-right" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <View style={[styles.header, { 
        backgroundColor: theme.cardBackground,
        borderBottomColor: theme.borderColor,
        shadowColor: theme.shadowColor,
        elevation: 3,
        borderBottomWidth: 1,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }]}>
        <Text style={[styles.title, { color: theme.primaryAccent }]}>Settings</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Music Volume */}
        <View style={[styles.settingContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <View style={styles.settingHeader}>
            <Icon name="music-note" size={wp('6')} color={theme.primaryAccent} />
            <Text style={[styles.settingTitle, { color: theme.subtitleText }]}>Music Volume</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={musicVolume}
            onValueChange={handleMusicVolumeChange}
            minimumTrackTintColor={theme.primaryAccent}
            maximumTrackTintColor={theme.borderColor}
            thumbTintColor={theme.primaryAccent}
          />
        </View>

        {/* Sound Effects Volume */}
        <View style={[styles.settingContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <View style={styles.settingHeader}>
            <Icon name="volume-up" size={wp('6')} color={theme.primaryAccent} />
            <Text style={[styles.settingTitle, { color: theme.subtitleText }]}>Sound Effects</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            value={sfxVolume}
            onValueChange={handleSFXVolumeChange}
            minimumTrackTintColor={theme.primaryAccent}
            maximumTrackTintColor={theme.borderColor}
            thumbTintColor={theme.primaryAccent}
          />
        </View>

        {/* Theme Selection */}
        <View style={[styles.settingContainer, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <View style={styles.settingHeader}>
            <Icon name="palette" size={wp('6')} color={theme.primaryAccent} />
            <Text style={[styles.settingTitle, { color: theme.subtitleText }]}>Theme</Text>
          </View>
          <View style={styles.radioGroup}>
          <RadioButton
            selected={isSystemTheme}
            onPress={() => {
              if (!isSystemTheme) {
                toggleSystemTheme();
                playPopSound();
              }
            }}
            label="System"
            theme={theme}
          />

          <RadioButton
            selected={!isDarkTheme && !isSystemTheme}
            onPress={() => {
              if (isDarkTheme || isSystemTheme) {
                setTheme(false); // set light theme
                playPopSound();
              }
            }}
            label="Light"
            theme={theme}
          />

          <RadioButton
            selected={isDarkTheme && !isSystemTheme}
            onPress={() => {
              if (!isDarkTheme || isSystemTheme) {
                setTheme(true); // set dark theme
                playPopSound();
              }
            }}
            label="Dark"
            theme={theme}
          />
          </View>
        </View>

        {/* About Button */}
        <TouchableOpacity
          style={[styles.aboutButton, { 
            backgroundColor: theme.cardBackground,
            borderColor: theme.borderColor,
            borderWidth: 1,
            shadowColor: theme.shadowColor,
          }]}
          onPress={() => navigation.navigate('About')}
        >
          <View style={styles.settingHeader}>
            <Icon name="info" size={wp('6')} color={theme.primaryAccent} />
            <Text style={[styles.settingTitle, { color: theme.subtitleText }]}>About</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingTop: paddingTopContent,
    paddingHorizontal: wp('5'),
    paddingBottom: hp('3'),
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('7') : hp('5'),
    right: wp('4'),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('2.5'),
    paddingHorizontal: wp('3'),
    borderRadius: wp('3'),
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
  },
  backButtonText: {
    fontSize: wp('4'),
    fontWeight: "700",
    marginRight: wp('1.5'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  title: {
    fontSize: fontTitle,
    fontWeight: '800',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: wp('5'),
    paddingBottom: paddingBottomContent,
  },
  settingContainer: {
    borderRadius: borderRadius,
    padding: wp('4'),
    marginBottom: hp('2'),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2'),
  },
  settingTitle: {
    fontSize: fontSubtitle,
    fontWeight: '600',
    marginLeft: wp('3'),
  },
  slider: {
    width: '100%',
    height: 40,
  },
  toggleButton: {
    width: wp('15'),
    height: wp('8'),
    borderRadius: wp('4'),
    padding: wp('0.5'),
  },
  toggleCircle: {
    width: wp('7'),
    height: wp('7'),
    borderRadius: wp('3.5'),
  },
  toggleCircleActive: {
    transform: [{ translateX: wp('7') }],
  },
  aboutButton: {
    borderRadius: borderRadius,
    padding: wp('4'),
    marginTop: hp('2'),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  radioGroup: {
    marginTop: hp('1'),
  },
  radioButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: hp('1'),
  },
  radioButton: {
    width: wp('5'),
    height: wp('5'),
    borderRadius: wp('2.5'),
    borderWidth: 2,
    marginRight: wp('3'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: wp('3'),
    height: wp('3'),
    borderRadius: wp('1.5'),
  },
  radioButtonLabel: {
    fontSize: fontSubtitle,
    fontWeight: '500',
  },
}); 