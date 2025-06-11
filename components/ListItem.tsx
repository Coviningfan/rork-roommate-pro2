import React, { ReactNode } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ViewStyle 
} from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { spacing, typography, borderRadius } from '@/constants/design-system';
import { useHaptics } from '@/hooks/useHaptics';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  showChevron?: boolean;
  disabled?: boolean;
  haptic?: 'light' | 'medium' | 'selection' | 'none';
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  style,
  showChevron = false,
  disabled = false,
  haptic = 'selection',
}) => {
  const { impact, selection } = useHaptics();
  
  const handlePress = () => {
    if (onPress && !disabled) {
      // Trigger haptic feedback
      if (haptic !== 'none') {
        switch (haptic) {
          case 'light':
            impact.light();
            break;
          case 'medium':
            impact.medium();
            break;
          case 'selection':
            selection();
            break;
        }
      }
      
      onPress();
    }
  };

  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[
        styles.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text>}
      </View>
      
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      
      {showChevron && !rightIcon && (
        <ChevronRight size={20} color={colors.textSecondary} />
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderRadius: borderRadius.md,
  },
  leftIcon: {
    marginRight: spacing.lg,
  },
  content: {
    flex: 1,
  },
  title: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  subtitle: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
});