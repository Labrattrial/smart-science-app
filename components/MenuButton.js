import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useButtonSound } from '../hooks/useButtonSound';
import { Dimensions } from 'react-native';
import { useTheme } from '../components/ThemeContext';

const { height } = Dimensions.get('window');
const isSmallScreen = height < 650;

export default function MenuButton({ title, onPress, style }) {
  const handlePress = useButtonSound();
  const { theme } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      onPress={() => handlePress(onPress)}
      activeOpacity={0.85}
    >
      <Text style={[styles.text, { color: theme.subtitleText }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(76, 201, 240, 0.25)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#4CC9F0',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(76, 201, 240, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: isSmallScreen ? 6 : 10,
    shadowColor: '#4CC9F0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  text: {
    fontSize: isSmallScreen ? 14 : 16,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
    includeFontPadding: false,
    textAlignVertical: 'center',
    paddingVertical: isSmallScreen ? 4 : 6,
  },
});