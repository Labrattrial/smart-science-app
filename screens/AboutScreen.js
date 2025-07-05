import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, ScrollView, Appearance, LayoutAnimation, Animated } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialIcons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { useTheme } from '../components/ThemeContext';
import { useButtonSound } from '../hooks/useButtonSound';

// Screen dimensions
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

// Responsive values
const fontTitle = clamp(24, SCREEN_WIDTH * 0.08, 32);
const fontSubtitle = clamp(14, SCREEN_WIDTH * 0.045, 18);
const borderRadius = clamp(10, SCREEN_WIDTH * 0.03, 20);
const shadowRadius = clamp(2, SCREEN_WIDTH * 0.02, 6);
const paddingTopContent = clamp(5, SCREEN_HEIGHT * 0.10, 90);
const paddingBottomContent = clamp(10, SCREEN_HEIGHT * 0.05, 40);

export default function AboutScreen({ navigation }) {
  const { theme } = useTheme();
  const handlePress = useButtonSound();
  const [showReferences, setShowReferences] = useState(false);
  const rotateAnim = useState(new Animated.Value(0))[0];

  // Verify reactivity with useEffect
  useEffect(() => {
    console.log('AboutScreen theme changed:', theme.background);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [theme]);

  const toggleReferences = () => {
    setShowReferences(!showReferences);
    Animated.timing(rotateAnim, {
      toValue: showReferences ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View 
      key={theme.background}
      style={[styles.container, { backgroundColor: theme.background }]}
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
        <EntypoIcon name="back" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <View style={[styles.header, { 
        backgroundColor: theme.cardBackground,
        borderBottomColor: theme.borderColor,
        shadowColor: theme.shadowColor,
        elevation: 3,
      }]}>
        <Text style={[styles.title, { color: theme.primaryAccent }]}>About</Text>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: theme.background }]} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
          elevation: 3,
        }]}>
          <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>Smart Science</Text>
          <Text style={[styles.sectionText, { color: theme.subtitleText }]}>
            Smart Science is an interactive learning application designed to help students understand complex scientific concepts through engaging visualizations and interactive experiences.
          </Text>
        </View>

        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
          elevation: 3,
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
          shadowColor: theme.shadowColor,
          elevation: 3,
        }]}>
          <TouchableOpacity 
            style={styles.referenceHeader}
            onPress={toggleReferences}
          >
            <Text style={[styles.sectionTitle, { color: theme.primaryAccent }]}>References</Text>
            <Animated.View style={{
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg']
                })
              }]
            }}>
              <Icon name="keyboard-arrow-down" size={24} color={theme.primaryAccent} />
            </Animated.View>
          </TouchableOpacity>

          {showReferences && (
            <View style={styles.referenceContent}>
              <Text style={[styles.referenceText, { color: theme.subtitleText }]}>
                • Campo, Pia et al. 2013. Science 8 Learner's Module. Pasig City: Department of Education.{'\n\n'}
                • Education, Department of. n.d. "Project EASE (Effective Alternative Secondary Education) CHEMISTRY." In Module 15: Changes That Matter Undergoes, 4-6. Pasig City: Bureau of Secondary Education.{'\n\n'}
                • https://conceptgroupllc.com/glossary/what-is-phase-change/{'\n\n'}
                • Kotz, John C., and Paul Jr. Treichel. Chemistry & Chemical Reactivity. N.p.: Saunders College Publishing, 1999.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { 
          backgroundColor: theme.cardBackground,
          borderColor: theme.borderColor,
          shadowColor: theme.shadowColor,
          elevation: 3,
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
    padding: wp('5'),
  },
  section: {
    borderRadius: borderRadius,
    padding: wp('4'),
    marginBottom: hp('2'),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  referenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp('1'),
  },
  referenceContent: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: hp('2'),
  },
  referenceText: {
    fontSize: fontSubtitle,
    lineHeight: fontSubtitle * 1.5,
  },
  scrollContent: {
    paddingBottom: paddingBottomContent,
  },
}); 