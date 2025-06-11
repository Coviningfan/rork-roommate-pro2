import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors } from '@/constants/colors';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'medium',
  style,
  textStyle,
}) => {
  const getBadgeStyle = () => {
    let badgeStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'default':
        badgeStyle = {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
        };
        break;
      case 'primary':
        badgeStyle = {
          backgroundColor: colors.primary,
        };
        break;
      case 'secondary':
        badgeStyle = {
          backgroundColor: colors.secondary,
        };
        break;
      case 'success':
        badgeStyle = {
          backgroundColor: colors.success,
        };
        break;
      case 'warning':
        badgeStyle = {
          backgroundColor: colors.warning,
        };
        break;
      case 'error':
        badgeStyle = {
          backgroundColor: colors.error,
        };
        break;
      case 'info':
        badgeStyle = {
          backgroundColor: colors.info,
        };
        break;
    }
    
    // Size styles
    switch (size) {
      case 'small':
        badgeStyle = {
          ...badgeStyle,
          paddingVertical: 2,
          paddingHorizontal: 6,
          borderRadius: 4,
        };
        break;
      case 'medium':
        badgeStyle = {
          ...badgeStyle,
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 6,
        };
        break;
      case 'large':
        badgeStyle = {
          ...badgeStyle,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 8,
        };
        break;
    }
    
    return badgeStyle;
  };
  
  const getTextStyle = () => {
    let style: TextStyle = {
      fontWeight: '600',
      textAlign: 'center',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        style.fontSize = 10;
        break;
      case 'medium':
        style.fontSize = 12;
        break;
      case 'large':
        style.fontSize = 14;
        break;
    }
    
    // Variant styles
    switch (variant) {
      case 'default':
        style.color = colors.text;
        break;
      case 'primary':
      case 'secondary':
      case 'success':
      case 'warning':
      case 'error':
      case 'info':
        style.color = '#FFFFFF';
        break;
    }
    
    return style;
  };
  
  return (
    <View style={[styles.badge, getBadgeStyle(), style]}>
      <Text style={[getTextStyle(), textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
});