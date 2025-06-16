import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform, Image } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useNavigation } from '@react-navigation/native';
import { useButtonSound } from '../hooks/useButtonSound';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const quiz = [
  { question: "Which transformation changes gas to solid?", choices: ["Deposition", "Freezing", "Melting", "Sublimation"], answer: "Deposition" },
  { question: "Which process occurs in drying clothes?", choices: ["Evaporation", "Freezing", "Melting", "Sublimation"], answer: "Evaporation" },
  { question: "Which process changes liquid to solid?", choices: ["Condensation", "Evaporation", "Freezing", "Melting"], answer: "Freezing" },
  { question: "What process changes solid to gas without becoming liquid?", choices: ["Evaporation", "Freezing", "Melting", "Sublimation"], answer: "Sublimation" },
  { question: "What phase change occurs in cloud formation?", choices: ["Condensation", "Deposition", "Evaporation", "Sublimation"], answer: "Condensation" },
  { question: "What happens to particles as temperature increases?", choices: ["Closer together", "Farther apart", "No change", "Disordered then ordered"], answer: "Farther apart" },
  { question: "Which condition favors condensation?", choices: ["Increase temp & KE", "Decrease temp & KE", "No change", "Increase temp, decrease KE"], answer: "Decrease temp & KE" },
  { question: "Which of these is a phase change?", choices: ["Cutting nails", "Drying fish", "Growing plants", "Chopping wood"], answer: "Drying fish" },
  { question: "What transformation happens with dry ice?", choices: ["Condensation", "Evaporation", "Melting", "Sublimation"], answer: "Sublimation" },
  { question: "Which increases particle movement?", choices: ["Melting → Freezing", "Melting → Evaporation", "Condensation → Freezing", "Evaporation → Deposition"], answer: "Melting → Evaporation" },
  { question: "Which changes solid to another state?", choices: ["Cutting hair", "Dropping plastic", "Tearing paper", "Ice melting in juice"], answer: "Ice melting in juice" },
  { question: "What phase change causes water droplets on cold glass?", choices: ["Condensation", "Evaporation", "Melting", "Sublimation"], answer: "Condensation" },
  { question: "Which needs increase in temp & kinetic energy?", choices: ["Gas to solid", "Gas to liquid", "Solid to liquid", "Liquid to solid"], answer: "Solid to liquid" },
  { question: "What happens to ice cream particles as it warms?", choices: ["Freezing", "Coming closer", "Getting farther", "Getting heavier"], answer: "Getting farther" },
  { question: "What's true when liquid becomes solid?", choices: ["Particles get smaller", "Particles get heavier", "Particles move closer", "Soft turns hard"], answer: "Particles move closer" },
  { question: "What changes solid directly to gas?", choices: ["Evaporation", "Freezing", "Melting", "Sublimation"], answer: "Sublimation" },
  { question: "Which changes gas directly to solid?", choices: ["Deposition", "Evaporation", "Melting", "Sublimation"], answer: "Deposition" },
  { question: "What changes solid to liquid?", choices: ["Condensation", "Evaporation", "Freezing", "Melting"], answer: "Melting" },
  { question: "What transformation occurs when clouds precipitate as rain?", choices: ["Condensation", "Evaporation", "Melting", "Freezing"], answer: "Condensation" },
  { question: "What happens to kinetic energy when temp increases?", choices: ["Decrease", "Increase", "Stays same", "Neither"], answer: "Increase" },
  { question: "What happens to particles as temp decreases?", choices: ["Come closer", "Move apart", "Stay same", "Disorder then order"], answer: "Come closer" },
  { question: "What favors evaporation?", choices: ["High temp & high KE", "Low temp & low KE", "Low temp & high KE", "High temp & low KE"], answer: "High temp & high KE" },
  { question: "Which shows a phase change?", choices: ["Cleaning room", "Opening tin can", "Melting ice drop", "Chewing gum"], answer: "Melting ice drop" },
  { question: "What phase change occurs in ice candy freezing?", choices: ["Condensation", "Evaporation", "Freezing", "Sublimation"], answer: "Freezing" },
  { question: "Which decreases particle movement?", choices: ["Melting → Evaporation", "Freezing → Sublimation", "Condensation → Freezing", "Deposition → Sublimation"], answer: "Condensation → Freezing" },
  { question: "Which changes liquid to another state?", choices: ["Boiling water", "Stirring juice", "Pouring water", "Discarding water"], answer: "Boiling water" },
  { question: "What phase change occurs in drying clothes?", choices: ["Condensation", "Evaporation", "Melting", "Sublimation"], answer: "Evaporation" },
  { question: "Which needs decrease in temp & KE?", choices: ["Solid to gas", "Liquid to gas", "Solid to liquid", "Liquid to solid"], answer: "Liquid to solid" },
  { question: "What happens to mothballs left in a cabinet?", choices: ["Freezing", "Coming closer", "Getting heavier", "Getting farther apart"], answer: "Getting farther apart" },
  { question: "What happens to KE when liquid becomes solid?", choices: ["Both increase", "Both decrease", "Both stay same", "One increases or decreases"], answer: "Both decrease" },
];


export default function QuizScreen() {
  const navigation = useNavigation();
  const handlePress = useButtonSound();
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
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
      ]),
      Animated.spring(bounceAnim, {
        toValue: 1,
        friction: 4,
        tension: 30,
        useNativeDriver: true,
      }),
    ]).start();
  }, [qIndex]);

  const handleAnswer = (choice) => {
    setSelected(choice);
    if (choice === quiz[qIndex].answer) setScore(score + 1);
    setTimeout(() => {
      setSelected(null);
      setQIndex(qIndex + 1);
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
      bounceAnim.setValue(0);
    }, 500);
  };

  const restartQuiz = () => {
    setQIndex(0);
    setSelected(null);
    setScore(0);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    bounceAnim.setValue(0);
  };

  if (qIndex >= quiz.length) {
    return (
      <View style={styles.container}>
        <Image 
          source={require('../assets/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Animated.View 
          style={[
            styles.scoreContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: bounceAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.9, 1.1, 1]
                })}
              ]
            }
          ]}
        >
          <Icon name="trophy-award" size={80} color="#4CC9F0" style={styles.trophyIcon} />
          <Text style={styles.scoreTitle}>Amazing Job! 🎉</Text>
          <Text style={styles.scoreText}>You got {score} out of {quiz.length} correct!</Text>
          <View style={styles.moleculeRow}>
            <Icon name="molecule-co2" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
            <Icon name="beaker" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
            <Icon name="flask" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.restartButton]} 
              onPress={restartQuiz}
            >
              <Icon name="restart" size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Restart Quiz</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.homeButton]} 
              onPress={() => navigation.navigate('Home')}
            >
              <Icon name="home" size={24} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Go Home</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    );
  }

  const q = quiz[qIndex];

  return (
    <View style={styles.container}>
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
        <Icon name="arrow-right" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Icon name="atom-variant" size={40} color="#4CC9F0" style={styles.headerIcon} />
        <Text style={styles.questionNum}>
          Question {qIndex + 1} <Text style={styles.questionTotal}>/ {quiz.length}</Text>
        </Text>
      </Animated.View>

      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: bounceAnim.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [0.98, 1.01, 1]
              })}
            ]
          }
        ]}
      >
        <Text style={styles.question}>{q.question}</Text>
        {q.choices.map((choice, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.choice,
              selected && choice === q.answer && styles.correctChoice,
              selected && choice === selected && choice !== q.answer && styles.incorrectChoice,
            ]}
            onPress={() => handleAnswer(choice)}
            disabled={selected !== null}
            activeOpacity={0.8}
          >
            <Text style={[
              styles.choiceText,
              selected && (choice === q.answer || choice === selected) && styles.selectedChoiceText
            ]}>
              {choice}
            </Text>
            {selected && choice === q.answer && (
              <Icon name="check-circle" size={24} color="#FFFFFF" style={styles.choiceIcon} />
            )}
            {selected && choice === selected && choice !== q.answer && (
              <Icon name="close-circle" size={24} color="#FFFFFF" style={styles.choiceIcon} />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>

      <Animated.View 
        style={[
          styles.moleculeRow,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <Icon name="molecule-co2" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
        <Icon name="beaker" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
        <Icon name="flask" size={32} color="#4CC9F0" style={styles.moleculeIcon} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: wp('4'),
    backgroundColor: "#0D1117",
    paddingTop: Platform.OS === 'ios' ? hp('6') : hp('4'),
  },
  logo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('7') : hp('5'),
    left: wp('4'),
    width: wp('15'),
    height: wp('15'),
    zIndex: 10,
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp('2.5'),
    alignSelf: "flex-start",
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    padding: wp('2.5'),
    borderRadius: wp('3'),
    borderWidth: 2,
    borderColor: "#4CC9F0",
  },
  headerIcon: {
    marginRight: wp('2'),
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: wp('2'),
  },
  questionNum: {
    fontSize: wp('5'),
    color: "#FFFFFF",
    fontWeight: "700",
    letterSpacing: 0.5,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  questionTotal: {
    color: "#4CC9F0",
    opacity: 0.8,
  },
  contentContainer: {
    width: "100%",
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    padding: wp('4'),
    borderRadius: wp('4'),
    borderWidth: 2,
    borderColor: "#4CC9F0",
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  question: {
    fontSize: wp('4.5'),
    marginBottom: hp('2'),
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "left",
    lineHeight: hp('3'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  choice: {
    backgroundColor: "rgba(76, 201, 240, 0.25)",
    borderColor: "#4CC9F0",
    borderWidth: 2,
    padding: wp('3'),
    marginBottom: hp('1.5'),
    borderRadius: wp('3'),
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: wp('1.5'),
    elevation: 3,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(76, 201, 240, 0.4)",
  },
  correctChoice: {
    backgroundColor: "rgba(76, 240, 117, 0.4)",
    borderColor: "#4CC9F0",
    borderBottomColor: "rgba(76, 240, 103, 0.6)",
  },
  incorrectChoice: {
    backgroundColor: "rgba(255, 107, 107, 0.4)",
    borderColor: "#FF6B6B",
    borderBottomColor: "rgba(255, 107, 107, 0.6)",
  },
  choiceText: {
    fontSize: wp('4'),
    color: "#FFFFFF",
    fontWeight: "700",
    flex: 1,
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  selectedChoiceText: {
    color: "#FFFFFF",
  },
  choiceIcon: {
    marginLeft: wp('2'),
  },
  moleculeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: hp('2.5'),
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    padding: wp('2.5'),
    borderRadius: wp('3'),
    borderWidth: 2,
    borderColor: "#4CC9F0",
  },
  moleculeIcon: {
    margin: wp('1.5'),
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: wp('2'),
  },
  scoreContainer: {
    alignItems: "center",
    backgroundColor: "rgba(76, 201, 240, 0.1)",
    padding: wp('6'),
    borderRadius: wp('4'),
    borderWidth: 2,
    borderColor: "#4CC9F0",
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  trophyIcon: {
    marginBottom: hp('2'),
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: wp('2'),
  },
  scoreTitle: {
    fontSize: wp('6'),
    color: "#4CC9F0",
    fontWeight: "800",
    marginBottom: hp('1'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    textShadowColor: "rgba(76, 201, 240, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: wp('2'),
  },
  scoreText: {
    fontSize: wp('4.5'),
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: hp('2'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: hp('2'),
    gap: wp('3'),
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: wp('3'),
    borderRadius: wp('3'),
    borderWidth: 2,
    shadowColor: "#4CC9F0",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: wp('2'),
    elevation: 5,
  },
  restartButton: {
    backgroundColor: "rgba(76, 201, 240, 0.25)",
    borderColor: "#4CC9F0",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(76, 201, 240, 0.4)",
  },
  homeButton: {
    backgroundColor: "rgba(76, 240, 117, 0.25)",
    borderColor: "#4CF075",
    borderBottomWidth: 4,
    borderBottomColor: "rgba(76, 240, 117, 0.4)",
  },
  buttonText: {
    fontSize: wp('4'),
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: wp('1.5'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  buttonIcon: {
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? hp('7') : hp('5'),
    right: wp('4'),
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    padding: wp('2.5'),
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
});
