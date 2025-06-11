import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform, Alert } from 'react-native';
import { colors } from '@/constants/colors';
import { Button } from '@/components/Button';
import { X, RotateCcw, Check, PenTool } from 'lucide-react-native';

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

  const handleClear = () => {
    setSignatureData(null);
  };

  const handleSave = () => {
    if (signatureData) {
      onSave(signatureData);
      onClose();
      setSignatureData(null);
    } else {
      Alert.alert('Error', 'Please capture a signature first');
    }
  };

  const simulateSignature = () => {
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
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.signatureContainer}>
            {signatureData ? (
              <View style={styles.signaturePreview}>
                <Check size={48} color={colors.success} />
                <Text style={styles.signatureText}>Signature Captured</Text>
                <Text style={styles.signatureSubtext}>
                  Your digital signature has been captured successfully
                </Text>
              </View>
            ) : (
              <View style={styles.signaturePlaceholder}>
                <PenTool size={48} color={colors.textSecondary} />
                <Text style={styles.placeholderText}>
                  {Platform.OS === 'web' 
                    ? 'Click here to simulate signature capture' 
                    : 'Tap here to simulate signature capture'
                  }
                </Text>
                <Text style={styles.noteText}>
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
            <Text style={styles.instructionText}>
              • Sign within the box above using your finger or stylus
            </Text>
            <Text style={styles.instructionText}>
              • Make sure your signature is clear and legible
            </Text>
            <Text style={styles.instructionText}>
              • Use the Clear button to start over if needed
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Clear"
              onPress={handleClear}
              variant="outline"
              size="medium"
              style={styles.actionButton}
              disabled={!signatureData}
            />
            <Button
              title="Save Signature"
              onPress={handleSave}
              variant="primary"
              size="medium"
              style={styles.actionButton}
              disabled={!signatureData}
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
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  signatureContainer: {
    height: 200,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 16,
    position: 'relative',
    backgroundColor: colors.card,
  },
  signaturePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  signatureText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
  signatureSubtext: {
    marginTop: 4,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  signaturePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  captureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  instructions: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});