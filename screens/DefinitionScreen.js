import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Platform, TouchableOpacity, Image, LayoutAnimation } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import EntypoIcon from 'react-native-vector-icons/Entypo';
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { useTheme } from '../components/ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const definitionCategories = [
  {
    title: 'States of Matter',
    icon: '🔬',
    definitions: [
      { term: 'Matter', def: 'Is anything that has mass and occupies space and cannot always be seen. It occurs in three states, the solid, liquid and gas.', icon: '🔬' },
      { term: 'Solid', def: 'A state of matter with fixed shape and volume.', icon: '🧊' },
      { term: 'Liquid', def: 'A state of matter with fixed volume but not fixed shape.', icon: '🌊' },
      { term: 'Gas', def: 'A state of matter with neither fixed shape nor volume.', icon: '💨' },
    ]
  },
  {
    title: 'Phase Changes',
    icon: '🔄',
    definitions: [
      { term: 'Phase Change', def: 'A change from one state to another without changing the chemical composition of a substance.', icon: '🔄' },
      { term: 'Melting', def: 'The change from solid to liquid.', icon: '🫠' },
      { term: 'Freezing', def: 'When the liquid state changes back to a solid state.', icon: '🧊' },
      { term: 'Fusion', def: 'Is when a substance goes from a liquid to a solid state, the reverse of melting.', icon: '❄️' },
      { term: 'Evaporation', def: 'The change of matter from the liquid state to gas state.', icon: '☁️' },
      { term: 'Boiling', def: 'The change from liquid to gas.', icon: '🔥' },
      { term: 'Condensation', def: 'The process in which the physical state of matter changes from gaseous state to liquid state.', icon: '💧' },
      { term: 'Sublimation', def: 'When solid state directly changes to gas without passing the liquid state.', icon: '✨' },
      { term: 'Deposition', def: 'The change from a gaseous state directly to solid state.', icon: '❄️' },
    ]
  },
  {
    title: 'Phase Diagram Concepts',
    icon: '📊',
    definitions: [
      { term: 'Phase Boundary', def: 'A line on a phase diagram that separates two phases.', icon: '📐' },
      { term: 'Critical Point', def: 'The point in temperature and pressure on a phase diagram where the liquid and gaseous phases of a substance merge together into a single phase.', icon: '⚡' },
      { term: 'Triple Point', def: 'The temperature and pressure at which all three phases (solid, liquid, gas) coexist.', icon: '🎯' },
    ]
  },
  {
    title: 'Physical Concepts',
    icon: '🧪',
    definitions: [
      { term: 'Physical Change', def: 'A change in one or more physical properties of a matter without changing its chemical properties.', icon: '🔄' },
      { term: 'Kinetic Energy', def: 'Refers to the movement and vibration of particles in a substance, which increases or decreases as energy is added or removed, leading to changes in state.', icon: '⚡' },
      { term: 'Pressure', def: 'Pressure is the force exerted per unit area on a substance, influencing phase transitions like melting and boiling points.', icon: '💨' },
      { term: 'Temperature', def: 'Temperature measures the average kinetic energy of particles in a substance, determining phase transitions like melting, boiling, and freezing.', icon: '🌡️ ' },
      { term: 'Boiling Point', def: 'The temperature at which a liquid changes to a gas.', icon: '🌡️' },
    ]
  }
];

export default function DefinitionScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const blockAnims = useRef(definitionCategories.flatMap(category => category.definitions).map(() => new Animated.Value(0))).current;
  const handlePress = useButtonSound();

  // Verify reactivity with useEffect
  useEffect(() => {
    console.log('DefinitionScreen theme changed:', theme.background);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [theme]);

  useEffect(() => {
    // Header animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.12, duration: 350, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();

    // Fade and slide animation
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

    // Staggered animation for definition blocks
    Animated.stagger(
      50,
      blockAnims.map(anim =>
        Animated.timing(anim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        })
      )
    ).start();
  }, []);

  return (
    <View 
      key={theme.background}
      style={[styles.bgWrap, { backgroundColor: theme.background }]}
    >
      <View style={[styles.bgAccent, { backgroundColor: theme.shadowColor }]} />
      
      <Image 
        source={require('../assets/logo.png')}
        style={[styles.logo, { 
          shadowColor: theme.primaryAccent,
          tintColor: theme.titleText
        }]}
        resizeMode="contain"
      />

      <TouchableOpacity 
        style={[styles.backButton, { 
          backgroundColor: theme.buttonPrimary,
          borderColor: theme.primaryAccent,
          shadowColor: theme.primaryAccent,
          elevation: 5,
        }]}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={[styles.backButtonText, { color: theme.titleText }]}>Back</Text>
        <EntypoIcon name="back" size={20} color={theme.titleText} />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              backgroundColor: theme.cardBackground,
              borderColor: theme.borderColor,
              shadowColor: theme.shadowColor,
              elevation: 8,
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={[styles.header, { color: theme.titleText }]}>Definition of Terms</Text>
          <Text style={[styles.subheader, { color: theme.subtitleText }]}>Let's learn about the amazing world of matter! 🧪✨</Text>
        </Animated.View>

        <View style={[styles.separator, { 
          backgroundColor: theme.borderColor,
          shadowColor: theme.shadowColor,
          elevation: 2,
        }]} />


        {definitionCategories.map((category, categoryIndex) => (
          <View key={categoryIndex}>
            {/* Category Header */}
            <Animated.View 
              style={[
                styles.categoryHeader,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderColor: theme.primaryAccent,
                  shadowColor: theme.shadowColor,
                  elevation: 6,
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text style={[styles.categoryTitle, { color: theme.titleText }]}>{category.title}</Text>
            </Animated.View>

            {/* Category Definitions */}
            {category.definitions.map(({ term, def, icon }, index) => {
              const globalIndex = definitionCategories
                .slice(0, categoryIndex)
                .reduce((acc, cat) => acc + cat.definitions.length, 0) + index;
              
              return (
                <Animated.View 
                  key={`${categoryIndex}-${index}`} 
                  style={[
                    styles.definitionBlock,
                    {
                      backgroundColor: theme.cardBackground,
                      borderColor: theme.primaryAccent,
                      shadowColor: theme.shadowColor,
                      elevation: 5,
                      opacity: blockAnims[globalIndex],
                      transform: [
                        { 
                          translateY: blockAnims[globalIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                          })
                        },
                        {
                          scale: blockAnims[globalIndex].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                          })
                        }
                      ]
                    }
                  ]}
                >
                  <View style={[styles.termRow, { 
                    backgroundColor: theme.buttonSecondary,
                    borderColor: theme.borderColor,
                  }]}>
                    <Text style={styles.termIcon}>{icon}</Text>
                    <Text style={[styles.term, { color: theme.titleText }]}>{term}</Text>
                  </View>
                  <Text style={[styles.definition, { color: theme.subtitleText }]}>{def}</Text>
                </Animated.View>
              );
            })}
            
            {/* Category separator */}
            {categoryIndex < definitionCategories.length - 1 && (
              <View style={[styles.categorySeparator, { 
                backgroundColor: theme.borderColor,
                shadowColor: theme.shadowColor,
              }]} />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrap: {
    flex: 1,
  },
  bgAccent: {
    position: 'absolute',
    top: -hp('10'),
    left: -wp('10'),
    width: wp('55'),
    height: wp('55'),
    borderRadius: wp('27.5'),
    zIndex: 0,
  },
  scrollContent: {
    padding: wp('5'),
    paddingTop: Platform.OS === 'ios' ? hp('17') : hp('15'),
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: hp('3.5'),
    padding: wp('5'),
    borderRadius: wp('5'),
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: wp('5'),
  },
  header: {
    fontSize: wp('9'),
    fontWeight: '700',
    textAlign: 'center',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: wp('2.5'),
  },
  subheader: {
    fontSize: wp('4.5'),
    marginTop: hp('1'),
    textAlign: 'center',
  },
  definitionBlock: {
    marginBottom: hp('2'),
    padding: wp('5'),
    borderRadius: wp('5'),
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    borderBottomWidth: 4,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1'),
    padding: wp('3'),
    borderRadius: wp('3'),
    borderWidth: 1,
  },
  termIcon: {
    fontSize: wp('6'),
    marginRight: wp('3'),
  },
  term: {
    fontSize: wp('5'),
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    flex: 1,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  definition: {
    fontSize: wp('4'),
    lineHeight: hp('3'),
    opacity: 0.95,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    paddingLeft: wp('9'),
    paddingTop: hp('1'),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('8.5') : hp('6'),
    right: wp('5'),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: wp('2'),
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
  logo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('8.5') : hp('6'),
    left: wp('5'),
    width: wp('15'),
    height: wp('15'),
    zIndex: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  separator: {
    height: 2,
    marginVertical: hp('3'),
    borderRadius: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: wp('1'),
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('2'),
    marginTop: hp('3'),
    padding: wp('3'),
    borderRadius: wp('4'),
    borderWidth: 2,
    borderBottomWidth: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
  },
  categoryIcon: {
    fontSize: wp('6'),
    marginRight: wp('2'),
  },
  categoryTitle: {
    fontSize: wp('5'),
    fontWeight: '700',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    flex: 1,
    flexWrap: 'wrap',
  },
  categoryCounter: {
    paddingHorizontal: wp('2'),
    paddingVertical: wp('1'),
    borderRadius: wp('2'),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    minWidth: wp('8'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: wp('3.5'),
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  categoriesIntro: {
    fontSize: wp('4'),
    textAlign: 'center',
    marginBottom: hp('2'),
    fontStyle: 'italic',
    opacity: 0.8,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  categorySeparator: {
    height: 1,
    marginVertical: hp('2'),
    borderRadius: 0.5,
    opacity: 0.6,
  },
});
