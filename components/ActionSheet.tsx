import React, { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { colors } from '@/constants/Colors';
import { spacing, typography, borderRadius } from '@/constants/design-system';
import { X } from 'lucide-react-native';

export interface ActionSheetOption {
  title: string;
  onPress: () => void;
  icon?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

interface ActionSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  options: ActionSheetOption[];
}

export const ActionSheet: React.FC<ActionSheetProps> = ({
  visible,
  onClose,
  title,
  options,
}) => {
  // Use native ActionSheet on iOS
  if (Platform.OS === 'ios') {
    React.useEffect(() => {
      if (visible) {
        const optionTitles = options.map(option => option.title);
        const destructiveIndex = options.findIndex(option => option.destructive);
        
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title,
            options: [...optionTitles, 'Cancel'],
            destructiveButtonIndex: destructiveIndex >= 0 ? destructiveIndex : undefined,
            cancelButtonIndex: optionTitles.length,
          },
          (buttonIndex) => {
            if (buttonIndex < optionTitles.length) {
              options[buttonIndex].onPress();
            }
            onClose();
          }
        );
      }
    }, [visible]);

    return null;
  }

  // Custom ActionSheet for Android and Web
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        <View style={styles.container}>
          <View style={styles.header}>
            {title && <Text style={styles.title}>{title}</Text>}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.optionsContainer}>
            {options.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.option,
                  option.disabled && styles.disabledOption,
                ]}
                onPress={() => {
                  if (!option.disabled) {
                    option.onPress();
                    onClose();
                  }
                }}
                disabled={option.disabled}
              >
                {option.icon && (
                  <View style={styles.optionIcon}>{option.icon}</View>
                )}
                <Text
                  style={[
                    styles.optionText,
                    option.destructive && styles.destructiveText,
                    option.disabled && styles.disabledText,
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: colors.background,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
    flex: 1,
  },
  closeButton: {
    padding: spacing.sm,
  },
  optionsContainer: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionIcon: {
    marginRight: spacing.md,
  },
  optionText: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  destructiveText: {
    color: colors.error,
  },
  disabledText: {
    color: colors.textSecondary,
  },
});