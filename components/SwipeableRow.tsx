import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native';
import { colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Trash2 } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SwipeableRowProps {
  children: ReactNode;
  onDelete?: () => void;
  deleteText?: string;
  disabled?: boolean;
}

export const SwipeableRow: React.FC<SwipeableRowProps> = ({
  children,
  onDelete,
  deleteText = 'Delete',
  disabled = false,
}) => {
  const translateX = new Animated.Value(0);
  const { impact, notification } = useHaptics();

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX } = event.nativeEvent;
      
      if (translationX < -100 && onDelete && !disabled) {
        // Trigger delete
        impact.medium();
        notification.warning();
        onDelete();
        
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      } else {
        // Reset position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      }
    }
  };

  if (disabled || !onDelete) {
    return <View>{children}</View>;
  }

  return (
    <View style={styles.container}>
      {/* Delete Action Background */}
      <View style={styles.deleteBackground}>
        <View style={styles.deleteAction}>
          <Trash2 size={20} color="#FFFFFF" />
          <Text style={styles.deleteText}>{deleteText}</Text>
        </View>
      </View>

      {/* Swipeable Content */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          {children}
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 100,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  deleteAction: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
});