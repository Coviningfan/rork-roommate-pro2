import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, borderRadius, shadows } from '@/constants/design-system';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
}) => {
  const getCardStyle = (): ViewStyle => {
    let cardStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
    };
    
    // Variant styles
    switch (variant) {
      case 'default':
        break;
      case 'elevated':
        cardStyle = {
          ...cardStyle,
          ...shadows.medium,
        };
        break;
      case 'outlined':
        cardStyle = {
          ...cardStyle,
          borderWidth: 1,
          borderColor: colors.border,
        };
        break;
    }
    
    // Padding styles
    switch (padding) {
      case 'none':
        cardStyle.padding = 0;
        break;
      case 'small':
        cardStyle.padding = spacing.md;
        break;
      case 'medium':
        cardStyle.padding = spacing.lg;
        break;
      case 'large':
        cardStyle.padding = spacing.xxl;
        break;
    }
    
    return cardStyle;
  };
  
  return (
    <View style={[getCardStyle(), style]}>
      {children}
    </View>
  );
};

export default Card;