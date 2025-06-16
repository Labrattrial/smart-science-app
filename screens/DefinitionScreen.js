import React, { useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated, Platform, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const definitions = [
  { term: 'Boiling', def: 'The change from liquid to gas.', icon: '🔥' },
  { term: 'Boiling Point', def: 'The temperature at which a liquid changes to a gas.', icon: '🌡️' },
  { term: 'Condensation', def: 'The process in which the physical state of matter changes from gaseous state to liquid state.', icon: '💧' },
  { term: 'Critical Point', def: 'The point in temperature and pressure on a phase diagram where the liquid and gaseous phases of a substance merge together into a single phase.', icon: '⚡' },
  { term: 'Deposition', def: 'The change from a gaseous state directly to solid state.', icon: '❄️' },
  { term: 'Evaporation', def: 'The change of matter from the liquid state to gas state.', icon: '☁️' },
  { term: 'Freezing', def: 'When the liquid state changes back to a solid state.', icon: '🧊' },
  { term: 'Fusion', def: 'Is when a substance goes from a liquid to a solid state, the reverse of melting.', icon: '❄️' },
  { term: 'Gas', def: 'A state of matter with neither fixed shape nor volume.', icon: '💨' },
  { term: 'Kinetic Energy', def: 'Refers to the movement and vibration of particles in a substance, which increases or decreases as energy is added or removed, leading to changes in state.', icon: '⚡' },
  { term: 'Liquid', def: 'A state of matter with fixed volume but not fixed shape.', icon: '🌊' },
  { term: 'Matter', def: 'Is anything that has mass and occupies space and cannot always be seen. It occurs in three states, the solid, liquid and gas.', icon: '🔬' },
  { term: 'Melting', def: 'The change from solid to liquid.', icon: '🫠' },
  { term: 'Phase Boundary', def: 'A line on a phase diagram that separates two phases.', icon: '📐' },
  { term: 'Phase Change', def: 'A change from one state to another without changing the chemical composition of a substance.', icon: '🔄' },
  { term: 'Physical Change', def: 'A change in one or more physical properties of a matter without changing its chemical properties.', icon: '🔄' },
  { term: 'Solid', def: 'A state of matter with fixed shape and volume.', icon: '🧊' },
  { term: 'Sublimation', def: 'When solid state directly changes to gas without passing the liquid state.', icon: '✨' },
  { term: 'Triple Point', def: 'The temperature and pressure at which all three phases (solid, liquid, gas) coexist.', icon: '🎯' },
];

export default function DefinitionScreen() {
  const navigation = useNavigation();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const blockAnims = useRef(definitions.map(() => new Animated.Value(0))).current;
  const handlePress = useButtonSound();

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
    <View style={styles.bgWrap}>
      <View style={styles.bgAccent} />
      
      <Image 
        source={require('../assets/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => handlePress(() => navigation.goBack())}
      >
        <Text style={styles.backButtonText}>Back</Text>
        <Icon name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View 
          style={[
            styles.headerContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <Text style={styles.header}>Definition of Terms</Text>
          <Text style={styles.subheader}>Let's learn about the amazing world of matter! 🧪✨</Text>
        </Animated.View>

        <View style={styles.separator} />

        {definitions.map(({ term, def, icon }, index) => (
          <Animated.View 
            key={index} 
            style={[
              styles.definitionBlock,
              {
                opacity: blockAnims[index],
                transform: [
                  { 
                    translateY: blockAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  },
                  {
                    scale: blockAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    })
                  }
                ]
              }
            ]}
          >
            <View style={styles.termRow}>
              <Text style={styles.termIcon}>{icon}</Text>
              <Text style={styles.term}>{term}</Text>
            </View>
            <Text style={styles.definition}>{def}</Text>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bgWrap: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  bgAccent: {
    position: 'absolute',
    top: -hp('10'),
    left: -wp('10'),
    width: wp('55'),
    height: wp('55'),
    borderRadius: wp('27.5'),
    backgroundColor: 'rgba(76, 201, 240, 0.1)',
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
    backgroundColor: '#1F2428',
    borderRadius: wp('5'),
    borderWidth: 1,
    borderColor: '#4CC9F040',
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: wp('5'),
    elevation: 8,
  },
  header: {
    fontSize: wp('9'),
    fontWeight: '700',
    color: '#E0F7FA',
    textAlign: 'center',
    textShadowColor: '#4CC9F0',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: wp('2.5'),
  },
  subheader: {
    fontSize: wp('4.5'),
    color: '#90A4AE',
    marginTop: hp('1'),
    textAlign: 'center',
  },
  definitionBlock: {
    marginBottom: hp('2'),
    backgroundColor: 'rgba(76, 201, 240, 0.15)',
    padding: wp('5'),
    borderRadius: wp('5'),
    borderWidth: 2,
    borderColor: '#4CC9F0',
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(76, 201, 240, 0.3)',
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp('1'),
    backgroundColor: 'rgba(76, 201, 240, 0.2)',
    padding: wp('3'),
    borderRadius: wp('3'),
    borderWidth: 1,
    borderColor: 'rgba(76, 201, 240, 0.4)',
  },
  termIcon: {
    fontSize: wp('6'),
    marginRight: wp('3'),
  },
  term: {
    fontSize: wp('5'),
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    flex: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  definition: {
    fontSize: wp('4'),
    color: '#FFFFFF',
    lineHeight: hp('3'),
    opacity: 0.95,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
    paddingLeft: wp('9'),
    paddingTop: hp('1'),
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
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
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    padding: wp('2'),
    paddingHorizontal: wp('3'),
    borderRadius: wp('3'),
    borderWidth: 2,
    borderColor: '#4CC9F0',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(76, 201, 240, 0.4)',
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  backButtonText: {
    fontSize: wp('4'),
    color: "#FFFFFF",
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
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  separator: {
    height: 2,
    backgroundColor: 'rgba(76, 201, 240, 0.3)',
    marginVertical: hp('3'),
    borderRadius: 1,
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: wp('1'),
    elevation: 2,
  },
});
