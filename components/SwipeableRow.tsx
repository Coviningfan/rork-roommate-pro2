import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, PanGestureHandlerGestureEvent, State } from 'react-native-gesture-handler';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Trash2 } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete?: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = new Animated.Value(0);
  const { triggerHaptic } = useHaptics();

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

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -100 && onDelete) {
        // Trigger haptic feedback before deletion
        triggerHaptic('error');
        onDelete();
      }
      
      // Reset position
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.deleteBackground}>
        <View style={styles.deleteAction}>
          <Trash2 size={20} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </View>
      </View>
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.swipeableContent,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
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
  },
});