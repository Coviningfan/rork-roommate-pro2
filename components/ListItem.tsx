import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { ChevronRight } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  disabled?: boolean;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  showChevron = true,
  disabled = false
}: ListItemProps) {
  const { triggerHaptic } = useHaptics();

  const handlePress = () => {
    if (onPress && !disabled) {
      triggerHaptic('selection');
      onPress();
    }
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.container,
        disabled && styles.disabled
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={styles.leftIcon}>
          {leftIcon}
        </View>
      )}
      
      <View style={styles.content}>
        <Text style={[
          styles.title,
          disabled && styles.disabledText
        ]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[
            styles.subtitle,
            disabled && styles.disabledText
          ]}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightIcon && (
        <View style={styles.rightIcon}>
          {rightIcon}
        </View>
      )}
      
      {onPress && showChevron && !rightIcon && (
        <View style={styles.chevron}>
          <ChevronRight 
            size={20} 
            color={disabled ? Colors.light.background : Colors.light.icon} 
          />
        </View>
      )}
    </Component>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.background,
  },
  disabled: {
    opacity: 0.5,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  chevron: {
    marginLeft: spacing.sm,
  },
  disabledText: {
    color: Colors.light.background,
  },
});