import React, { useRef, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Platform, 
  Alert,
  useWindowDimensions 
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
import { Button } from '@/components/Button';
import { X, RotateCcw, Check, PenTool } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SignatureCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSave: (signature: string) => void;
  title?: string;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  visible,
  onClose,
  onSave,
  title = "Capture Signature"
}) => {
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const { impact, notification } = useHaptics();
  const isTablet = width > 768;

  const handleClear = () => {
    impact.light();
    setSignatureData(null);
  };

  const handleSave = () => {
    if (signatureData) {
      notification.success();
      onSave(signatureData);
      onClose();
      setSignatureData(null);
    } else {
      notification.error();
      Alert.alert('Error', 'Please capture a signature first');
    }
  };

  const simulateSignature = () => {
    impact.medium();
    // In a real implementation, this would be replaced with actual signature capture
    // using react-native-signature-canvas or similar library
    const simulatedSignature = `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==`;
    setSignatureData(simulatedSignature);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isTablet && styles.tabletModalContent]}>
          <View style={styles.header}>
            <Text style={[styles.title, isTablet && styles.tabletTitle]}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={[styles.signatureContainer, isTablet && styles.tabletSignatureContainer]}>
            {signatureData ? (
              <View style={styles.signaturePreview}>
                <Check size={isTablet ? 64 : 48} color={colors.success} />
                <Text style={[styles.signatureText, isTablet && styles.tabletSignatureText]}>
                  Signature Captured
                </Text>
                <Text style={[styles.signatureSubtext, isTablet && styles.tabletSignatureSubtext]}>
                  Your digital signature has been captured successfully
                </Text>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <PenTool size={isTablet ? 64 : 48} color={colors.textSecondary} />
                <Text style={[styles.placeholderText, isTablet && styles.tabletPlaceholderText]}>
                  {Platform.OS === 'web' 
                    ? 'Click here to simulate signature capture' 
                    : 'Tap here to simulate signature capture'
                  }
                </Text>
                <Text style={[styles.noteText, isTablet && styles.tabletNoteText]}>
                  In production, this would use react-native-signature-canvas
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.captureArea}
              onPress={simulateSignature}
              activeOpacity={0.7}
            />
          </View>

          <View style={styles.instructions}>
            <Text style={[styles.instructionText, isTablet && styles.tabletInstructionText]}>
              • Sign within the box above using your finger or stylus
            </Text>
            <Text style={[styles.instructionText, isTablet && styles.tabletInstructionText]}>
              • Make sure your signature is clear and legible
            </Text>
            <Text style={[styles.instructionText, isTablet && styles.tabletInstructionText]}>
              • Use the Clear button to start over if needed
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Clear"
              onPress={handleClear}
              variant="outline"
              size={isTablet ? 'large' : 'medium'}
              style={styles.actionButton}
              disabled={!signatureData}
              haptic="light"
            />
            <Button
              title="Save Signature"
              onPress={handleSave}
              variant="primary"
              size={isTablet ? 'large' : 'medium'}
              style={styles.actionButton}
              disabled={!signatureData}
              haptic="medium"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.large,
  },
  tabletModalContent: {
    maxWidth: 700,
    padding: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.heading3,
    color: colors.text,
  },
  tabletTitle: {
    ...typography.heading2,
  },
  closeButton: {
    padding: spacing.sm,
  },
  signatureContainer: {
    height: 200,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    position: 'relative',
    backgroundColor: colors.card,
  },
  tabletSignatureContainer: {
    height: 300,
  },
  signaturePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  signatureText: {
    marginTop: spacing.md,
    ...typography.bodyMedium,
    color: colors.success,
    textAlign: 'center',
  },
  tabletSignatureText: {
    ...typography.heading3,
  },
  signatureSubtext: {
    marginTop: spacing.xs,
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabletSignatureSubtext: {
    ...typography.small,
  },
  signaturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  placeholderText: {
    ...typography.bodyMedium,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  tabletPlaceholderText: {
    ...typography.heading3,
  },
  noteText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabletNoteText: {
    ...typography.small,
  },
  captureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  instructions: {
    marginBottom: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  instructionText: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  tabletInstructionText: {
    ...typography.body,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});