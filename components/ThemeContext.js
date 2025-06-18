import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

const lightTheme = {
  background: '#F4F9FF',
  cardBackground: '#FFFFFF',
  primaryAccent: '#4CC9F0',
  secondaryAccent: '#4895EF',
  titleText: '#2B2D42',
  subtitleText: '#2B2D42',
  borderColor: '#E0F7FF',
  shadowColor: 'rgba(76, 201, 240, 0.2)',
  buttonPrimary: '#FFFFFF',
  buttonSecondary: '#E0F7FF',
};

const darkTheme = {
  background: '#0D1117',
  cardBackground: 'rgba(76, 201, 240, 0.1)',
  primaryAccent: '#4CC9F0',
  secondaryAccent: '#4895EF',
  titleText: '#FFFFFF',
  subtitleText: '#FFFFFF',
  borderColor: '#4CC9F0',
  shadowColor: 'rgba(76, 201, 240, 0.3)',
  buttonPrimary: 'rgba(76, 201, 240, 0.25)',
  buttonSecondary: 'rgba(255, 255, 255, 0.1)',
};

export const ThemeProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false); // Default to light theme
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Inside ThemeProvider

const setTheme = async (useDark) => {
  try {
    setIsDarkTheme(useDark);
    setIsSystemTheme(false);
    await AsyncStorage.setItem('theme', JSON.stringify(useDark));
    await AsyncStorage.setItem('useSystemTheme', JSON.stringify(false));
  } catch (error) {
    console.log('Error setting theme:', error);
  }
};


  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        const savedSystemTheme = await AsyncStorage.getItem('useSystemTheme');
        
        if (savedSystemTheme !== null) {
          const useSystem = JSON.parse(savedSystemTheme);
          setIsSystemTheme(useSystem);
          
          if (useSystem) {
            setIsDarkTheme(Appearance.getColorScheme() === 'dark');
          } else if (savedTheme !== null) {
            setIsDarkTheme(JSON.parse(savedTheme));
          }
        } else {
          // First time app launch, use system theme
          setIsDarkTheme(Appearance.getColorScheme() === 'dark');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
        // Fallback to system theme on error
        setIsDarkTheme(Appearance.getColorScheme() === 'dark');
      }
    };
    loadTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (isSystemTheme) {
        setIsDarkTheme(colorScheme === 'dark');
      }
    });

    return () => subscription.remove();
  }, [isSystemTheme]);

  // Save theme preference when it changes
  const toggleTheme = async () => {
    try {
      const newTheme = !isDarkTheme;
      setIsDarkTheme(newTheme);
      setIsSystemTheme(false);
      await AsyncStorage.setItem('theme', JSON.stringify(newTheme));
      await AsyncStorage.setItem('useSystemTheme', JSON.stringify(false));
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  // Toggle system theme usage
  const toggleSystemTheme = async () => {
    try {
      const newSystemTheme = !isSystemTheme;
      setIsSystemTheme(newSystemTheme);
      if (newSystemTheme) {
        setIsDarkTheme(Appearance.getColorScheme() === 'dark');
      }
      await AsyncStorage.setItem('useSystemTheme', JSON.stringify(newSystemTheme));
    } catch (error) {
      console.log('Error saving system theme preference:', error);
    }
  };

  const theme = isDarkTheme ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      isDarkTheme, 
      isSystemTheme,
      toggleTheme, 
      toggleSystemTheme,
      setTheme, 
      theme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};