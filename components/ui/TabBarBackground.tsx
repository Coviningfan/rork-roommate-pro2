import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '@/constants/Colors';

export default function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={100}
        style={StyleSheet.absoluteFill}
        tint="light"
      />
    );
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.background]} />
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});