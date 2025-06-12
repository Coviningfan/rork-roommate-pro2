import React, { ReactNode, useCallback, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Animated, PanResponder, Dimensions } from 'react-native';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Trash2 } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete?: () => void;
  deleteText?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const DELETE_THRESHOLD = -80;
const DELETE_WIDTH = 100;

export function SwipeableRow({ children, onDelete, deleteText = "Delete" }: SwipeableRowProps) {
  const { triggerHaptic } = useHaptics();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isDeleting, setIsDeleting] = useState(false);

  // For web compatibility, render without swipe functionality
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        {children}
        {onDelete && (
          <TouchableOpacity 
            style={styles.webDeleteButton}
            onPress={onDelete}
            activeOpacity={0.7}
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
      tension: 120,
      friction: 8,
    }).start();
  }, [translateX]);

  const animateToDelete = useCallback(() => {
    Animated.spring(translateX, {
      toValue: DELETE_THRESHOLD,
      useNativeDriver: true,
      tension: 120,
      friction: 8,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes with sufficient movement
        const { dx, dy } = gestureState;
        return Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10;
      },
      onPanResponderGrant: () => {
        // Add haptic feedback when starting swipe
        triggerHaptic('light');
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow left swipe (negative values) and limit the range
        const newValue = Math.min(0, Math.max(gestureState.dx, -DELETE_WIDTH * 1.2));
        translateX.setValue(newValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { dx, vx } = gestureState;
        
        // Consider velocity for better UX
        const shouldDelete = dx < DELETE_THRESHOLD || (dx < -40 && vx < -0.5);
        
        if (shouldDelete && onDelete && !isDeleting) {
          setIsDeleting(true);
          triggerHaptic('error');
          animateToDelete();
          // Delay deletion to show animation
          setTimeout(() => {
            onDelete();
            setIsDeleting(false);
          }, 150);
        } else if (dx < -30) {
          // Snap to delete position for easy access
          animateToDelete();
        } else {
          // Reset to original position
          resetPosition();
        }
      },
    })
  ).current;

  const handleDeletePress = useCallback(() => {
    if (onDelete && !isDeleting) {
      setIsDeleting(true);
      triggerHaptic('error');
      onDelete();
      setIsDeleting(false);
      resetPosition();
    }
  }, [onDelete, triggerHaptic, resetPosition, isDeleting]);

  return (
    <View style={styles.container}>
      {/* Delete Background */}
      <View style={styles.deleteBackground}>
        <TouchableOpacity 
          style={styles.deleteAction}
          onPress={handleDeletePress}
          activeOpacity={0.7}
          disabled={isDeleting}
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
    borderRadius: borderRadius.md,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_WIDTH,
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
    paddingHorizontal: spacing.sm,
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