import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle
} from 'react-native';
import { colors } from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      minHeight: 44, // Ensure minimum touch target
    };
    
    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.primary,
          borderWidth: 0,
          elevation: 2,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        };
        break;
      case 'secondary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.secondary,
          borderWidth: 0,
          elevation: 2,
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        };
        break;
      case 'outline':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        };
        break;
      case 'text':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          borderWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: 8,
          paddingHorizontal: 16,
          borderRadius: 6,
          minHeight: 36,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: 12,
          paddingHorizontal: 24,
          borderRadius: 8,
          minHeight: 44,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: 16,
          paddingHorizontal: 32,
          borderRadius: 10,
          minHeight: 52,
        };
        break;
    }
    
    // Width style
    if (fullWidth) {
      buttonStyle.width = '100%';
    }
    
    // Disabled style
    if (disabled || loading) {
      buttonStyle.opacity = 0.6;
    }
    
    return buttonStyle;
  };
  
  const getTextStyle = (): TextStyle => {
    let style: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        style.fontSize = 14;
        break;
      case 'medium':
        style.fontSize = 16;
        break;
      case 'large':
        style.fontSize = 18;
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'primary':
      case 'secondary':
        style.color = '#FFFFFF';
        break;
      case 'outline':
      case 'text':
        style.color = colors.primary;
        break;
    }
    
    return style;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'secondary' ? '#FFFFFF' : colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};