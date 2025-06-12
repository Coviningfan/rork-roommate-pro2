import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ListRenderItem } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableRow } from '@/components/SwipeableRow';
import { SignatureCapture } from '@/components/SignatureCapture';
import { FileText, Plus } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface Document {
  id: string;
  title: string;
  type: 'lease' | 'agreement' | 'receipt' | 'other';
  status: 'draft' | 'pending' | 'signed' | 'archived';
  createdAt: string;
  signedBy?: string[];
  signedAt?: string;
}

const mockDocuments: Document[] = [
  {
    id: '1',
    title: 'Lease Agreement 2024',
    type: 'lease',
    status: 'pending',
    createdAt: '2024-01-15',
    signedBy: ['John Doe']
  },
  {
    id: '2',
    title: 'Utility Bill - January',
    type: 'receipt',
    status: 'signed',
    createdAt: '2024-01-10',
    signedBy: ['John Doe', 'Jane Smith'],
    signedAt: '2024-01-12'
  }
];

// Memoized Document Item Component
const DocumentItem = memo(({ 
  document, 
  onDelete, 
  onSign 
}: { 
  document: Document; 
  onDelete: (id: string) => void;
  onSign: (doc: Document) => void;
}) => {
  const handleDelete = useCallback(() => {
    onDelete(document.id);
  }, [document.id, onDelete]);

  const handleSign = useCallback(() => {
    onSign(document);
  }, [document, onSign]);

  const statusColor = useMemo(() => {
    switch (document.status) {
      case 'draft': return Colors.light.icon;
      case 'pending': return '#FF9800';
      case 'signed': return '#4CAF50';
      case 'archived': return Colors.light.icon;
      default: return Colors.light.icon;
    }
  }, [document.status]);

  return (
    <SwipeableRow onDelete={handleDelete}>
      <Card style={styles.documentCard}>
        <View style={styles.documentHeader}>
          <View style={styles.documentIcon}>
            <FileText size={24} color={Colors.light.tint} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentTitle}>{document.title}</Text>
            <Text style={styles.documentMeta}>
              {document.type} • {document.createdAt}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{document.status}</Text>
          </View>
        </View>
        
        {document.status === 'pending' && (
          <View style={styles.documentActions}>
            <Button
              title="Sign Document"
              onPress={handleSign}
              variant="primary"
              size="small"
            />
          </View>
        )}
        
        {document.signedBy && document.signedBy.length > 0 && (
          <View style={styles.signaturesSection}>
            <Text style={styles.signaturesLabel}>Signed by:</Text>
            <Text style={styles.signaturesText}>
              {document.signedBy.join(', ')}
            </Text>
          </View>
        )}
      </Card>
    </SwipeableRow>
  );
});

DocumentItem.displayName = 'DocumentItem';

export default function DocumentsScreen() {
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);
  const [signDocumentModalVisible, setSignDocumentModalVisible] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const { triggerHaptic } = useHaptics();

  const handleDeleteDocument = useCallback((documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            triggerHaptic('error');
          }
        }
      ]
    );
  }, [triggerHaptic]);

  const handleSignDocument = useCallback((document: Document) => {
    setSelectedDocument(document);
    setSignDocumentModalVisible(true);
    triggerHaptic('selection');
  }, [triggerHaptic]);

  const handleSignatureComplete = useCallback((signature: string) => {
    if (selectedDocument) {
      setDocuments(prev => prev.map(doc => 
        doc.id === selectedDocument.id 
          ? { 
              ...doc, 
              status: 'signed' as const,
              signedAt: new Date().toISOString(),
              signedBy: [...(doc.signedBy || []), 'Current User']
            }
          : doc
      ));
      triggerHaptic('success');
    }
    setSignDocumentModalVisible(false);
    setSelectedDocument(null);
  }, [selectedDocument, triggerHaptic]);

  const handleAddDocument = useCallback(() => {
    triggerHaptic('selection');
    // Handle add document logic
  }, [triggerHaptic]);

  const renderDocument: ListRenderItem<Document> = useCallback(({ item }) => (
    <DocumentItem
      document={item}
      onDelete={handleDeleteDocument}
      onSign={handleSignDocument}
    />
  ), [handleDeleteDocument, handleSignDocument]);

  const keyExtractor = useCallback((item: Document) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120, // Approximate item height
    offset: 120 * index,
    index,
  }), []);

  const ListEmptyComponent = useMemo(() => (
    <EmptyState
      icon={FileText}
      title="No Documents"
      description="Add your first document to get started"
      actionTitle="Add Document"
      onAction={handleAddDocument}
    />
  ), [handleAddDocument]);

  const HeaderRight = useMemo(() => (
    <TouchableOpacity 
      onPress={handleAddDocument}
      style={styles.headerButton}
    >
      <Plus size={24} color={Colors.light.tint} />
    </TouchableOpacity>
  ), [handleAddDocument]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Documents',
          headerRight: () => HeaderRight
        }} 
      />
      
      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={5}
        ListEmptyComponent={ListEmptyComponent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <SignatureCapture
        visible={signDocumentModalVisible}
        onClose={() => setSignDocumentModalVisible(false)}
        onSignatureComplete={handleSignatureComplete}
        documentTitle={selectedDocument?.title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  separator: {
    height: spacing.sm,
  },
  documentCard: {
    padding: spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: `${Colors.light.tint}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  statusBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  documentActions: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.background,
  },
  signaturesSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.background,
  },
  signaturesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  signaturesText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  headerButton: {
    padding: spacing.xs,
  },
});