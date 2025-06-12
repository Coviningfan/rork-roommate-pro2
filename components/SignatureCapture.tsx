import React, { useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Button } from '@/components/Button';
import { X, RotateCcw } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface SignatureCaptureProps {
  visible: boolean;
  onClose: () => void;
  onSignatureComplete: (signature: string) => void;
  documentTitle?: string;
}

export function SignatureCapture({
  visible,
  onClose,
  onSignatureComplete,
  documentTitle
}: SignatureCaptureProps) {
  const [hasSignature, setHasSignature] = useState(false);
  const { triggerHaptic } = useHaptics();

  const handleClear = useCallback(() => {
    setHasSignature(false);
    triggerHaptic('selection');
  }, [triggerHaptic]);

  const handleSave = useCallback(() => {
    if (!hasSignature) {
      Alert.alert('No Signature', 'Please provide your signature before saving.');
      return;
    }
    
    // In a real app, you would get the actual signature data here
    const mockSignature = 'data:image/png;base64,signature_data_here';
    onSignatureComplete(mockSignature);
    triggerHaptic('success');
  }, [hasSignature, onSignatureComplete, triggerHaptic]);

  const handleClose = useCallback(() => {
    if (hasSignature) {
      Alert.alert(
        'Discard Signature',
        'Are you sure you want to discard your signature?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => {
              setHasSignature(false);
              onClose();
            }
          }
        ]
      );
    } else {
      onClose();
    }
  }, [hasSignature, onClose]);

  // Mock signature pad - in a real app, you'd use react-native-signature-canvas
  const handleSignaturePadPress = useCallback(() => {
    setHasSignature(true);
    triggerHaptic('light');
  }, [triggerHaptic]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Sign Document</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Document Info */}
        {documentTitle && (
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{documentTitle}</Text>
            <Text style={styles.documentSubtitle}>
              Please sign below to complete this document
            </Text>
          </View>
        )}

        {/* Signature Area */}
        <View style={styles.signatureContainer}>
          <Text style={styles.signatureLabel}>Signature</Text>
          <TouchableOpacity 
            style={styles.signaturePad}
            onPress={handleSignaturePadPress}
            activeOpacity={0.8}
          >
            {hasSignature ? (
              <View style={styles.signaturePreview}>
                <Text style={styles.signatureText}>Your Signature</Text>
                <Text style={styles.signatureSubtext}>Tap to modify</Text>
              </View>
            ) : (
              <Text style={styles.signaturePlaceholder}>
                Tap here to sign
              </Text>
            )}
          </TouchableOpacity>
          
          {hasSignature && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={handleClear}
            >
              <RotateCcw size={16} color={Colors.light.icon} />
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Cancel"
            onPress={handleClose}
            variant="outline"
            size="large"
          />
          <Button
            title="Save Signature"
            onPress={handleSave}
            variant="primary"
            size="large"
            disabled={!hasSignature}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.background,
  },
  closeButton: {
    padding: spacing.xs,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  placeholder: {
    width: 32,
  },
  documentInfo: {
    padding: spacing.md,
    backgroundColor: 'white',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.md,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  documentSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  signatureContainer: {
    flex: 1,
    padding: spacing.md,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: spacing.sm,
  },
  signaturePad: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: Colors.light.background,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  signaturePlaceholder: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  signaturePreview: {
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.tint,
    marginBottom: 4,
  },
  signatureSubtext: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  clearText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
});