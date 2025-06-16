import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, ScrollView, Appearance } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../components/ThemeContext';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(24, SCREEN_WIDTH * 0.08, 32);
const fontSubtitle = clamp(14, SCREEN_WIDTH * 0.045, 18);
const borderRadius = clamp(10, SCREEN_WIDTH * 0.03, 20);
const shadowRadius = clamp(2, SCREEN_WIDTH * 0.02, 6);

export default function AboutScreen({ navigation }) {
  const { theme, isDarkTheme, isSystemTheme } = useTheme();
  const [colorScheme, setColorScheme] = useState(Appearance.getColorScheme());

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setColorScheme(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const currentTheme = isSystemTheme ? colorScheme === 'dark' : isDarkTheme;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.cardBackground }]}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: theme.buttonPrimary }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={wp('6')} color={theme.primaryAccent} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.primaryAccent }]}>About</Text>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: theme.background }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Smart Science</Text>
          <Text style={[styles.sectionText, { color: theme.subtitleText }]}>
            Smart Science is an interactive learning application designed to help students understand complex scientific concepts through engaging visualizations and interactive experiences.
          </Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Features</Text>
          <Text style={[styles.sectionText, { color: theme.subtitleText }]}>
            • Interactive molecule simulations{'\n'}
            • Phase change visualizations{'\n'}
            • Comprehensive definitions{'\n'}
            • Interactive quizzes{'\n'}
            • Visual flowcharts{'\n'}
            • Phase diagrams
          </Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          borderWidth: 1,
          shadowColor: theme.shadowColor,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Version</Text>
          <Text style={[styles.sectionText, { color: theme.subtitleText }]}>1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? hp('6') : hp('4'),
    paddingHorizontal: wp('5'),
    paddingBottom: hp('2'),
    borderBottomWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: wp('2'),
    borderRadius: borderRadius,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: fontTitle,
    fontWeight: '800',
    marginLeft: wp('3'),
  },
  content: {
    flex: 1,
    padding: wp('5'),
  },
  section: {
    borderRadius: borderRadius,
    padding: wp('4'),
    marginBottom: hp('2'),
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: fontSubtitle,
    fontWeight: '700',
    marginBottom: hp('1'),
  },
  sectionText: {
    fontSize: fontSubtitle,
    lineHeight: fontSubtitle * 1.5,
  },
}); 