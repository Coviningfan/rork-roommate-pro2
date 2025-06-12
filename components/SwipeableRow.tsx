import React, { ReactNode, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, PanResponder } from 'react-native';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Trash2 } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete?: () => void;
  deleteText?: string;
}

export function SwipeableRow({ children, onDelete, deleteText = "Delete" }: SwipeableRowProps) {
  const { triggerHaptic } = useHaptics();
  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  // For web compatibility, render without swipe functionality
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {children}
        {onDelete && (
          <TouchableOpacity 
            style={styles.webDeleteButton}
            onPress={onDelete}
          >
            <Trash2 size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  const resetPosition = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    lastOffset.current = 0;
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow left swipe (negative values)
        const newValue = Math.min(0, gestureState.dx);
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        const currentOffset = lastOffset.current + gestureState.dx;
        
        if (currentOffset < -100 && onDelete) {
          // Trigger haptic feedback and delete
          triggerHaptic('error');
          onDelete();
          resetPosition();
        } else if (currentOffset < -50) {
          // Snap to delete position
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
          lastOffset.current = -100;
        } else {
          // Reset to original position
          resetPosition();
        }
      },
    })
  ).current;

  const handleDeletePress = useCallback(() => {
    if (onDelete) {
      triggerHaptic('error');
      onDelete();
      resetPosition();
    }
  }, [onDelete, triggerHaptic, resetPosition]);

  return (
    <View style={styles.container}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity 
          style={styles.deleteAction}
          onPress={handleDeletePress}
          activeOpacity={0.7}
        >
          <Trash2 size={20} color="white" />
          <Text style={styles.deleteText}>{deleteText}</Text>
        </TouchableOpacity>
      </View>
      
      {/* Swipeable Content */}
      <Animated.View
        style={[
          styles.swipeableContent,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
  deleteText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  swipeableContent: {
    backgroundColor: Colors.light.background,
    borderRadius: borderRadius.md,
  },
  webDeleteButton: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F44336',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});