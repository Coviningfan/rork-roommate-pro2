import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, typography } from '@/constants/design-system';
import { Button } from '@/components/Button';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: ReactNode;
  buttonTitle?: string;
  onButtonPress?: () => void;
  illustration?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  buttonTitle,
  onButtonPress,
  illustration,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 768;

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      <View style={styles.content}>
        {illustration || (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        
        <Text style={[styles.title, isTablet && styles.tabletTitle]}>
          {title}
        </Text>
        
        <Text style={[styles.description, isTablet && styles.tabletDescription]}>
          {description}
        </Text>
        
        {buttonTitle && onButtonPress && (
          <Button
            title={buttonTitle}
            onPress={onButtonPress}
            variant="primary"
            size={isTablet ? 'large' : 'medium'}
            style={styles.button}
            haptic="medium"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxl,
  },
  tabletContainer: {
    padding: spacing.xxxxl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: spacing.xxl,
    opacity: 0.6,
  },
  title: {
    ...typography.heading2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  tabletTitle: {
    ...typography.heading1,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xxl,
  },
  tabletDescription: {
    fontSize: 18,
    lineHeight: 28,
  },
  button: {
    minWidth: 160,
  },
});