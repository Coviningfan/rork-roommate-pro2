import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  showBranding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'medium',
  showBranding = false,
}) => {
  const getCardStyle = () => {
    let cardStyle: ViewStyle = {};
    
    // Variant styles
    switch (variant) {
      case 'default':
        cardStyle = {
          backgroundColor: colors.card,
          borderRadius: 12,
        };
        break;
      case 'elevated':
        cardStyle = {
          backgroundColor: colors.card,
          borderRadius: 12,
          elevation: 4,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        };
        break;
      case 'outlined':
        cardStyle = {
          backgroundColor: colors.card,
          borderRadius: 12,
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
        cardStyle.padding = 12;
        break;
      case 'medium':
        cardStyle.padding = 16;
        break;
      case 'large':
        cardStyle.padding = 24;
        break;
    }
    
    return cardStyle;
  };
  
  return (
    <View style={[getCardStyle(), style]}>
      {children}
      
      {showBranding && (
        <View style={styles.brandingContainer}>
          <Text style={styles.brandingText}>J.A.B.V Labs</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  brandingContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  brandingText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 0.5,
    opacity: 0.7,
  },
});

export default Card;