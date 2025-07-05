import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  useWindowDimensions,
} from 'react-native';
import { useTheme } from './ThemeContext';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_HEIGHT = Dimensions.get('window').height;

// Helper function for responsive sizing
const clamp = (min, val, max) => Math.min(Math.max(val, min), max);

  // Responsive values
  const fontTitle = clamp(16, SCREEN_WIDTH * 0.045, 20);
  const fontMessage = clamp(14, SCREEN_WIDTH * 0.035, 16);
  const fontButton = clamp(14, SCREEN_WIDTH * 0.035, 16);
  const borderRadius = clamp(12, SCREEN_WIDTH * 0.03, 20);
  const padding = clamp(16, SCREEN_WIDTH * 0.04, 24);
  
const ConfirmationDialog = ({ 
  visible, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Yes", 
  cancelText = "Cancel" 
}) => {
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  // Landscape-specific adjustments
  const dialogMaxWidth = isLandscape ? Math.min(400, width * 0.4) : 320;
  const dialogPadding = isLandscape ? clamp(20, width * 0.03, 32) : padding;
  const iconSize = isLandscape ? 40 : 32;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.dialog,
          {
            backgroundColor: theme.cardBackground,
            borderColor: theme.primaryAccent,
            shadowColor: theme.shadowColor,
            borderRadius: borderRadius,
            padding: dialogPadding,
            maxWidth: dialogMaxWidth,
            margin: wp('5'),
          }
        ]}>
          {/* Icon */}
          <View style={[
            styles.iconContainer, 
            { 
              backgroundColor: theme.buttonSecondary,
              width: iconSize + 28,
              height: iconSize + 28,
              borderRadius: (iconSize + 28) / 2,
            }
          ]}>
            <Icon name="alert-circle" size={iconSize} color={theme.primaryAccent} />
          </View>

          {/* Title */}
          <Text style={[
            styles.title,
            {
              color: theme.titleText,
              fontSize: fontTitle,
            }
          ]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[
            styles.message,
            {
              color: theme.subtitleText,
              fontSize: fontMessage,
            }
          ]}>
            {message}
          </Text>

          {/* Buttons */}
          <View style={[
            styles.buttonContainer,
            {
              gap: isLandscape ? wp('4') : wp('3'),
            }
          ]}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                {
                  backgroundColor: theme.buttonSecondary,
                  borderColor: theme.borderColor,
                  shadowColor: theme.shadowColor,
                }
              ]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                {
                  color: theme.subtitleText,
                  fontSize: fontButton,
                }
              ]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                {
                  backgroundColor: theme.buttonPrimary,
                  borderColor: theme.primaryAccent,
                  shadowColor: theme.shadowColor,
                }
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.buttonText,
                {
                  color: theme.titleText,
                  fontSize: fontButton,
                }
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    elevation: 9999,
  },
  dialog: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp('2'),
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: hp('1'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
  message: {
    textAlign: 'center',
    marginBottom: hp('3'),
    lineHeight: hp('2.5'),
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp('3'),
  },
  button: {
    flex: 1,
    paddingVertical: hp('1.5'),
    paddingHorizontal: wp('3'),
    borderRadius: borderRadius,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButton: {
    // Additional styling for cancel button if needed
  },
  confirmButton: {
    // Additional styling for confirm button if needed
  },
  buttonText: {
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : 'sans-serif-medium',
  },
});

export default ConfirmationDialog; 