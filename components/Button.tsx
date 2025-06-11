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
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
import { useHaptics } from '@/hooks/useHaptics';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?: 'light' | 'medium' | 'heavy' | 'selection' | 'none';
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
  haptic = 'light',
}) => {
  const { impact, selection } = useHaptics();

  const handlePress = () => {
    // Trigger haptic feedback
    if (haptic !== 'none') {
      switch (haptic) {
        case 'light':
          impact.light();
          break;
        case 'medium':
          impact.medium();
          break;
        case 'heavy':
          impact.heavy();
          break;
        case 'selection':
          selection();
          break;
      }
    }
    
    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    let buttonStyle: ViewStyle = {
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: borderRadius.md,
      minHeight: 44, // Ensure minimum touch target
    };
    
    // Variant styles
    switch (variant) {
      case 'primary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.primary,
          ...shadows.small,
        };
        break;
      case 'secondary':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.secondary,
          ...shadows.small,
        };
        break;
      case 'destructive':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: colors.error,
          ...shadows.small,
        };
        break;
      case 'outline':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
        break;
      case 'text':
        buttonStyle = {
          ...buttonStyle,
          backgroundColor: 'transparent',
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: borderRadius.sm,
          minHeight: 36,
        };
        break;
      case 'medium':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.xxl,
          minHeight: 44,
        };
        break;
      case 'large':
        buttonStyle = {
          ...buttonStyle,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.xxxl,
          borderRadius: borderRadius.lg,
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
    let textStyleObj: TextStyle = {
      textAlign: 'center',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        textStyleObj = { ...textStyleObj, ...typography.smallMedium };
        break;
      case 'medium':
        textStyleObj = { ...textStyleObj, ...typography.bodyMedium };
        break;
      case 'large':
        textStyleObj = { ...textStyleObj, ...typography.bodySemiBold };
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'destructive':
        textStyleObj.color = '#FFFFFF';
        break;
      case 'outline':
      case 'text':
        textStyleObj.color = colors.primary;
        break;
    }
    
    return textStyleObj;
  };
  
  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' || variant === 'secondary' || variant === 'destructive' ? '#FFFFFF' : colors.primary} 
          size="small" 
        />
      ) : (
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};