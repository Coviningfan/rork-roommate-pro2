import React from 'react';
import { TouchableOpacity, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

export function HapticTab({ children, onPress, ...props }: BottomTabBarButtonProps) {
  const handlePress = (event: any) => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    if (onPress) {
      onPress(event);
    }
  };

  // Omit delayLongPress if it's causing type issues, or handle it explicitly
  const { delayLongPress, ...restProps } = props as any;

  return (
    <TouchableOpacity onPress={handlePress} {...restProps}>
      {children}
    </TouchableOpacity>
  );
}