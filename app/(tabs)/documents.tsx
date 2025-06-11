import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  Alert,
  Modal,
  Linking,
  Platform,
  Share,
  Dimensions,
  ScrollView,
  ActionSheetIOS,
  ActivityIndicator
} from 'react-native';
import { colors } from '@/constants/Colors';
import { 
  FileText, 
  Upload, 
  Send, 
  Eye, 
  Check, 
  X, 
  Download, 
  Share as ShareIcon, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  MoreVertical, 
  Calendar, 
  User, 
  PenTool, 
  Clock, 
  CheckCircle, 
  Filter, 
  Plus,
  Search,
  SortAsc,
  SortDesc
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import { SignatureCapture } from '@/components/SignatureCapture';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useDocuments, useModificationRequests, deleteDocument, createModificationRequest, updateModificationRequestStatus } from '@/hooks/useSupabaseData';
import { usePDFSigning } from '@/hooks/usePDFSigning';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import type { Document as DocumentType, ModificationRequest } from '@/types/supabase';

const isWeb = Platform.OS === 'web';
const { width: screenWidth } = Dimensions.get('window');

type FilterType = 'all' | 'pending' | 'signed';
type SortType = 'date' | 'name' | 'status';

export default function DocumentsScreen() {
  const { user, apartmentId, isApartmentOwner } = useAuthStore();
  const { data: documents, isLoading, refetch } = useDocuments();
  const { data: modificationRequests, refetch: refetchRequests } = useModificationRequests();
  const { signDocument, isProcessing } = usePDFSigning();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [signatureModalVisible, setSignatureModalVisible] = useState(false);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [modificationModalVisible, setModificationModalVisible] = useState(false);
  const [requestsModalVisible, setRequestsModalVisible] = useState(false);
  const [signDocumentModalVisible, setSignDocumentModalVisible] = useState(false);
  const [signatureCaptureVisible, setSignatureCaptureVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Form states
  const [selectedDocument, setSelectedDocument] = useState<DocumentType | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [modificationReason, setModificationReason] = useState('');
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  
  // PDF viewer states
  const [pdfLoading, setPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  
  const canDeleteDocument = (document: DocumentType) => {
    return !document.signed && (isApartmentOwner() || document.uploader_id === user?.id);
  };
  
  const getFilteredAndSortedDocuments = () => {
    let filtered = documents || [];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    switch (filterType) {
      case 'pending':
        filtered = filtered.filter(doc => !doc.signed);
        break;
      case 'signed':
        filtered = filtered.filter(doc => doc.signed);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }
    
    // Apply sorting
    return filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          comparison = (a.signed ? 1 : 0) - (b.signed ? 1 : 0);
          break;
        case 'date':
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };
  
  const handleViewPDF = async (document: DocumentType) => {
    try {
      setSelectedDocument(document);
      setPdfViewerVisible(true);
      setPdfLoading(true);
      setPdfError(false);
    } catch (error) {
      console.error('Error opening PDF:', error);
      Alert.alert('Error', 'Failed to open PDF document');
    }
  };
  
  const handleDownloadPDF = async (document: DocumentType) => {
    if (isWeb) {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
      return;
    }
    
    try {
      setLoading(true);
      
      const downloadResumable = FileSystem.createDownloadResumable(
        document.url,
        FileSystem.documentDirectory + document.name
      );
      
      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        Alert.alert('Success', `Document downloaded to ${result.uri}`);
        
        try {
          await Share.share({
            url: result.uri,
            title: document.name,
            message: `Check out this document: ${document.name}`,
          });
        } catch (shareError) {
          console.log('Sharing not available:', shareError);
        }
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', 'Failed to download document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSharePDF = async (document: DocumentType) => {
    try {
      if (isWeb) {
        await Clipboard.setStringAsync(document.url);
        Alert.alert('Copied!', 'Document URL copied to clipboard');
      } else {
        await Share.share({
          url: document.url,
          title: document.name,
          message: `Check out this document: ${document.name}`,
        });
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      Alert.alert('Error', 'Failed to share document');
    }
  };
  
  const handleDeleteDocument = async (document: DocumentType) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${document.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteDocument(document.id);
              Alert.alert('Success', 'Document deleted successfully');
              refetch();
            } catch (error: any) {
              console.error('Delete error:', error);
              Alert.alert('Error', error.message || 'Failed to delete document');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };
  
  const showDocumentActions = (document: DocumentType) => {
    const actions = [
      'View Document',
      'Download',
      'Share',
      ...(canDeleteDocument(document) ? ['Delete'] : []),
      ...(!document.signed ? ['Send for Signature', 'Sign Document', 'Request Modification'] : []),
      ...(isApartmentOwner() && !document.signed ? ['Mark as Signed'] : []),
      'Cancel'
    ];
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: actions,
          destructiveButtonIndex: actions.indexOf('Delete'),
          cancelButtonIndex: actions.length - 1,
          title: document.name,
        },
        (buttonIndex) => {
          const action = actions[buttonIndex];
          switch (action) {
            case 'View Document':
              handleViewPDF(document);
              break;
            case 'Download':
              handleDownloadPDF(document);
              break;
            case 'Share':
              handleSharePDF(document);
              break;
            case 'Delete':
              handleDeleteDocument(document);
              break;
            case 'Send for Signature':
              openSignatureModal(document);
              break;
            case 'Sign Document':
              openSignDocumentModal(document);
              break;
            case 'Request Modification':
              openModificationModal(document);
              break;
            case 'Mark as Signed':
              handleMarkAsSigned(document.id);
              break;
          }
        }
      );
    } else {
      Alert.alert(
        document.name,
        'Choose an action:',
        [
          { text: 'View', onPress: () => handleViewPDF(document) },
          { text: 'Download', onPress: () => handleDownloadPDF(document) },
          { text: 'Share', onPress: () => handleSharePDF(document) },
          { text: 'Sign', onPress: () => openSignDocumentModal(document) },
          ...(canDeleteDocument(document) ? [{ text: 'Delete', onPress: () => handleDeleteDocument(document), style: 'destructive' as const }] : []),
          { text: 'Cancel', style: 'cancel' as const }
        ]
      );
    }
  };
  
  const handleUploadPDF = async () => {
    try {
      if (!user) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }
      
      if (!apartmentId) {
        Alert.alert('Error', 'No apartment selected');
        return;
      }
      
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      const file = result.assets[0];
      
      if (!file.uri || !file.name) {
        Alert.alert('Error', 'Invalid file selected');
        return;
      }
      
      setLoading(true);
      
      const fileBase64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const byteCharacters = atob(fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, byteArray, {
          contentType: 'application/pdf',
        });
      
      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw uploadError;
      }
      
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);
      
      const documentRecord: any = {
        name: file.name,
        url: urlData.publicUrl,
        apartment_id: apartmentId,
        signed: false,
        uploader_id: user.id,
        size: file.size || 0,
        type: file.mimeType || 'application/pdf',
      };
      
      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([documentRecord])
        .select()
        .single();
      
      if (dbError) {
        console.error('Database insert error:', dbError);
        throw dbError;
      }
      
      Alert.alert('Success', 'Document uploaded successfully');
      refetch();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };
  
  const openSignatureModal = (document: DocumentType) => {
    setSelectedDocument(document);
    setSignatureModalVisible(true);
  };
  
  const openSignDocumentModal = (document: DocumentType) => {
    setSelectedDocument(document);
    setSignDocumentModalVisible(true);
    setSignerName(user?.displayName || '');
    setSignerEmail(user?.email || '');
  };
  
  const openModificationModal = (document: DocumentType) => {
    setSelectedDocument(document);
    setModificationModalVisible(true);
  };
  
  const handleSendForSignature = async () => {
    if (!selectedDocument || !recipientEmail) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    
    try {
      setLoading(true);
      
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id')
        .eq('email', recipientEmail)
        .single();
      
      if (!usersError && users) {
        await supabase
          .from('notifications')
          .insert([
            {
              title: 'Document Signature Request',
              message: `You have been requested to sign: ${selectedDocument.name}`,
              type: 'info',
              user_id: users.id,
            }
          ]);
      }
      
      Alert.alert('Success', `Document sent to ${recipientEmail} for signature`);
      setSignatureModalVisible(false);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Send signature error:', error);
      Alert.alert('Error', 'Failed to send document for signature');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignDocument = async () => {
    if (!selectedDocument || !signerName.trim() || !signerEmail.trim() || !signatureData) {
      Alert.alert('Error', 'Please fill in all required fields and capture your signature');
      return;
    }
    
    try {
      setLoading(true);
      
      const success = await signDocument({
        documentId: selectedDocument.id,
        signerName: signerName.trim(),
        signerEmail: signerEmail.trim(),
        signature: signatureData,
      });
      
      if (success) {
        if (selectedDocument.uploader_id && selectedDocument.uploader_id !== user?.id) {
          await supabase
            .from('notifications')
            .insert([
              {
                title: 'Document Signed',
                message: `${signerName} has signed: ${selectedDocument.name}`,
                type: 'success',
                user_id: selectedDocument.uploader_id,
              }
            ]);
        }
        
        Alert.alert('Success', 'Document signed successfully');
        setSignDocumentModalVisible(false);
        setSignerName('');
        setSignerEmail('');
        setSignatureData(null);
        refetch();
      }
    } catch (error: any) {
      console.error('Sign document error:', error);
      Alert.alert('Error', 'Failed to sign document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestModification = async () => {
    if (!selectedDocument || !modificationReason.trim()) {
      Alert.alert('Error', 'Please enter a reason for the modification request');
      return;
    }
    
    if (!apartmentId || !user) {
      Alert.alert('Error', 'Missing apartment or user information');
      return;
    }
    
    try {
      setLoading(true);
      
      await createModificationRequest(
        selectedDocument.id,
        modificationReason.trim(),
        apartmentId,
        user.id
      );
      
      Alert.alert('Success', 'Modification request sent successfully');
      setModificationModalVisible(false);
      setModificationReason('');
      refetchRequests();
    } catch (error: any) {
      console.error('Modification request error:', error);
      Alert.alert('Error', error.message || 'Failed to send modification request');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsSigned = async (documentId: string) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ signed: true })
        .eq('id', documentId);
      
      if (error) throw error;
      
      Alert.alert('Success', 'Document marked as signed');
      refetch();
    } catch (error: any) {
      console.error('Mark signed error:', error);
      Alert.alert('Error', 'Failed to mark document as signed');
    }
  };
  
  const handleModificationRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      await updateModificationRequestStatus(requestId, action);
      Alert.alert('Success', `Request ${action} successfully`);
      refetchRequests();
    } catch (error: any) {
      console.error('Modification request action error:', error);
      Alert.alert('Error', `Failed to ${action.toLowerCase()} request`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSignatureCapture = (signature: string) => {
    setSignatureData(signature);
  };
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPDFViewerUrl = (url: string) => {
    if (isWeb) {
      return url;
    }
    
    if (Platform.OS === 'ios') {
      return url;
    } else {
      return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;
    }
  };
  
  const renderDocumentItem = ({ item }: { item: DocumentType }) => (
    <Card style={styles.documentCard} variant="outlined">
      <TouchableOpacity 
        style={styles.documentContent}
        onPress={() => handleViewPDF(item)}
        activeOpacity={0.7}
      >
        <View style={styles.documentHeader}>
          <View style={styles.documentIconContainer}>
            <FileText size={20} color={colors.primary} />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.documentMeta}>
              <View style={styles.metaItem}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>{formatDate(item.created_at)}</Text>
              </View>
              {item.size && (
                <View style={styles.metaItem}>
                  <Text style={styles.metaText}>{formatFileSize(item.size)}</Text>
                </View>
              )}
            </View>
            <View style={styles.metaItem}>
              <User size={12} color={colors.textSecondary} />
              <Text style={styles.metaText}>
                {item.uploader_id === user?.id ? 'You' : 'Other user'}
              </Text>
            </View>
          </View>
          <View style={styles.documentActions}>
            <Badge 
              label={item.signed ? "Signed" : "Pending"} 
              variant={item.signed ? "success" : "warning"} 
              size="small" 
            />
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => showDocumentActions(item)}
            >
              <MoreVertical size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );
  
  const renderModificationRequest = ({ item }: { item: ModificationRequest }) => (
    <Card style={styles.requestCard} variant="outlined">
      <View style={styles.requestHeader}>
        <AlertCircle size={16} color={colors.warning} />
        <Text style={styles.requestTitle}>Modification Request</Text>
        <Badge 
          label={item.status} 
          variant={item.status === 'pending' ? 'warning' : item.status === 'approved' ? 'success' : 'error'} 
          size="small" 
        />
      </View>
      <Text style={styles.requestReason}>{item.reason}</Text>
      <Text style={styles.requestDate}>
        {formatDate(item.created_at)}
      </Text>
      
      {isApartmentOwner() && item.status === 'pending' && (
        <View style={styles.requestActions}>
          <Button
            title="Approve"
            onPress={() => handleModificationRequestAction(item.id, 'approved')}
            variant="primary"
            size="small"
            style={styles.requestButton}
          />
          <Button
            title="Reject"
            onPress={() => handleModificationRequestAction(item.id, 'rejected')}
            variant="outline"
            size="small"
            style={styles.requestButton}
          />
        </View>
      )}
    </Card>
  );
  
  const filteredDocuments = getFilteredAndSortedDocuments();
  const pendingRequestsCount = modificationRequests?.filter(r => r.status === 'pending').length || 0;
  const pendingDocumentsCount = documents?.filter(d => !d.signed).length || 0;
  const signedDocumentsCount = documents?.filter(d => d.signed).length || 0;
  
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documents</Text>
        <View style={styles.headerActions}>
          {pendingRequestsCount > 0 && (
            <Button
              title={`Requests (${pendingRequestsCount})`}
              onPress={() => setRequestsModalVisible(true)}
              variant="outline"
              size="small"
              style={styles.requestsButton}
            />
          )}
          <Button
            title="Upload"
            onPress={handleUploadPDF}
            variant="primary"
            size="small"
            loading={loading}
            style={styles.uploadButton}
          />
        </View>
      </View>
      
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={16} color={colors.textSecondary} style={styles.searchIcon} />
          <Input
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents..."
            style={styles.searchInput}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Quick Filter Tabs */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'all' && styles.activeQuickFilter]}
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.quickFilterText, filterType === 'all' && styles.activeQuickFilterText]}>
            All ({documents?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'pending' && styles.activeQuickFilter]}
          onPress={() => setFilterType('pending')}
        >
          <Clock size={14} color={filterType === 'pending' ? colors.warning : colors.textSecondary} />
          <Text style={[styles.quickFilterText, filterType === 'pending' && styles.activeQuickFilterText]}>
            Pending ({pendingDocumentsCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'signed' && styles.activeQuickFilter]}
          onPress={() => setFilterType('signed')}
        >
          <CheckCircle size={14} color={filterType === 'signed' ? colors.success : colors.textSecondary} />
          <Text style={[styles.quickFilterText, filterType === 'signed' && styles.activeQuickFilterText]}>
            Signed ({signedDocumentsCount})
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Documents List */}
      {filteredDocuments && filteredDocuments.length > 0 ? (
        <FlatList
          data={filteredDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.documentsList}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title={isLoading ? "Loading Documents..." : filterType === 'all' ? "No Documents" : `No ${filterType} Documents`}
          description={
            isLoading 
              ? "Please wait while we load your documents" 
              : filterType === 'all' 
                ? "Upload your first document to get started. Supported formats: PDF"
                : `No ${filterType} documents found. Try adjusting your filters.`
          }
          icon={<FileText size={48} color={colors.textSecondary} />}
          buttonTitle="Upload Document"
          onButtonPress={handleUploadPDF}
        />
      )}

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter & Sort</Text>
              <TouchableOpacity 
                onPress={() => setFilterModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.filterOptions}>
                {[
                  { key: 'date', label: 'Date' },
                  { key: 'name', label: 'Name' },
                  { key: 'status', label: 'Status' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.filterOption, sortBy === option.key && styles.activeFilterOption]}
                    onPress={() => setSortBy(option.key as SortType)}
                  >
                    <Text style={[styles.filterOptionText, sortBy === option.key && styles.activeFilterOptionText]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Order</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, sortOrder === 'desc' && styles.activeFilterOption]}
                  onPress={() => setSortOrder('desc')}
                >
                  <SortDesc size={16} color={sortOrder === 'desc' ? '#FFFFFF' : colors.text} />
                  <Text style={[styles.filterOptionText, sortOrder === 'desc' && styles.activeFilterOptionText]}>
                    Newest First
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, sortOrder === 'asc' && styles.activeFilterOption]}
                  onPress={() => setSortOrder('asc')}
                >
                  <SortAsc size={16} color={sortOrder === 'asc' ? '#FFFFFF' : colors.text} />
                  <Text style={[styles.filterOptionText, sortOrder === 'asc' && styles.activeFilterOptionText]}>
                    Oldest First
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Button
              title="Apply Filters"
              onPress={() => setFilterModalVisible(false)}
              variant="primary"
              fullWidth
              style={styles.applyButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfViewerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPdfViewerVisible(false)}
      >
        <View style={styles.pdfViewerContainer}>
          <View style={styles.pdfViewerHeader}>
            <Text style={styles.pdfViewerTitle} numberOfLines={1}>
              {selectedDocument?.name}
            </Text>
            <View style={styles.pdfViewerActions}>
              <TouchableOpacity 
                onPress={() => selectedDocument && handleDownloadPDF(selectedDocument)}
                style={styles.pdfActionButton}
              >
                <Download size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => selectedDocument && handleSharePDF(selectedDocument)}
                style={styles.pdfActionButton}
              >
                <ShareIcon size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => setPdfViewerVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedDocument && (
            <View style={styles.pdfContainer}>
              {isWeb ? (
                <iframe
                  src={selectedDocument.url}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                  title={selectedDocument.name}
                  onLoad={() => setPdfLoading(false)}
                  onError={() => {
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                />
              ) : (
                <WebView
                  source={{ uri: getPDFViewerUrl(selectedDocument.url) }}
                  style={styles.webView}
                  onLoadStart={() => {
                    setPdfLoading(true);
                    setPdfError(false);
                  }}
                  onLoadEnd={() => setPdfLoading(false)}
                  onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView error:', nativeEvent);
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                  onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error('WebView HTTP error:', nativeEvent);
                    setPdfLoading(false);
                    setPdfError(true);
                  }}
                  startInLoadingState={true}
                  renderLoading={() => (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color={colors.primary} />
                      <Text style={styles.loadingText}>Loading PDF...</Text>
                    </View>
                  )}
                  renderError={() => (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={48} color={colors.error} />
                      <Text style={styles.errorTitle}>Unable to load PDF</Text>
                      <Text style={styles.errorText}>
                        The PDF viewer is having trouble loading this document.
                      </Text>
                      <Button
                        title="Open in Browser"
                        onPress={() => {
                          Linking.openURL(selectedDocument.url);
                          setPdfViewerVisible(false);
                        }}
                        variant="primary"
                        style={styles.errorButton}
                      />
                    </View>
                  )}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowFileAccess={true}
                  allowUniversalAccessFromFileURLs={true}
                  mixedContentMode="compatibility"
                  originWhitelist={['*']}
                />
              )}
              
              {pdfLoading && !isWeb && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
              )}
              
              {pdfError && (
                <View style={styles.errorOverlay}>
                  <AlertCircle size={48} color={colors.error} />
                  <Text style={styles.errorTitle}>Unable to load PDF</Text>
                  <Text style={styles.errorText}>
                    The PDF viewer is having trouble loading this document.
                  </Text>
                  <View style={styles.errorActions}>
                    <Button
                      title="Retry"
                      onPress={() => {
                        setPdfError(false);
                        setPdfLoading(true);
                      }}
                      variant="outline"
                      style={styles.errorButton}
                    />
                    <Button
                      title="Open in Browser"
                      onPress={() => {
                        Linking.openURL(selectedDocument.url);
                        setPdfViewerVisible(false);
                      }}
                      variant="primary"
                      style={styles.errorButton}
                    />
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
      
      {/* Sign Document Modal */}
      <Modal
        visible={signDocumentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSignDocumentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Sign Document</Text>
              <TouchableOpacity 
                onPress={() => setSignDocumentModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedDocument && (
              <Text style={styles.selectedDocument}>
                Document: {selectedDocument.name}
              </Text>
            )}
            
            <Input
              label="Full Name"
              value={signerName}
              onChangeText={setSignerName}
              placeholder="Enter your full name"
            />
            
            <Input
              label="Email Address"
              value={signerEmail}
              onChangeText={setSignerEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.signatureSection}>
              <Text style={styles.signatureLabel}>Digital Signature</Text>
              <TouchableOpacity 
                style={styles.signaturePlaceholder}
                onPress={() => setSignatureCaptureVisible(true)}
              >
                {signatureData ? (
                  <View style={styles.signaturePreview}>
                    <Check size={24} color={colors.success} />
                    <Text style={styles.signaturePreviewText}>Signature captured</Text>
                  </View>
                ) : (
                  <>
                    <PenTool size={32} color={colors.textSecondary} />
                    <Text style={styles.signaturePlaceholderText}>
                      Tap to capture signature
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <Button
              title="Sign Document"
              onPress={handleSignDocument}
              loading={loading || isProcessing}
              disabled={!signatureData}
              fullWidth
              style={styles.sendButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Signature Capture Modal */}
      <SignatureCapture
        visible={signatureCaptureVisible}
        onClose={() => setSignatureCaptureVisible(false)}
        onSave={handleSignatureCapture}
        title="Capture Your Signature"
      />
      
      {/* Modification Requests Modal */}
      <Modal
        visible={requestsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setRequestsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modification Requests</Text>
              <TouchableOpacity 
                onPress={() => setRequestsModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.requestsList}>
              {modificationRequests && modificationRequests.length > 0 ? (
                modificationRequests.map((request) => (
                  <View key={request.id}>
                    {renderModificationRequest({ item: request })}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyRequestsText}>No modification requests found</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Signature Request Modal */}
      <Modal
        visible={signatureModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSignatureModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send for Signature</Text>
              <TouchableOpacity 
                onPress={() => setSignatureModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedDocument && (
              <Text style={styles.selectedDocument}>
                Document: {selectedDocument.name}
              </Text>
            )}
            
            <Input
              label="Recipient Email"
              value={recipientEmail}
              onChangeText={setRecipientEmail}
              placeholder="Enter recipient's email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <Button
              title="Send for Signature"
              onPress={handleSendForSignature}
              loading={loading}
              fullWidth
              style={styles.sendButton}
            />
          </View>
        </View>
      </Modal>
      
      {/* Modification Request Modal */}
      <Modal
        visible={modificationModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModificationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Request Modification</Text>
              <TouchableOpacity 
                onPress={() => setModificationModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedDocument && (
              <Text style={styles.selectedDocument}>
                Document: {selectedDocument.name}
              </Text>
            )}
            
            <Input
              label="Reason for Modification"
              value={modificationReason}
              onChangeText={setModificationReason}
              placeholder="Explain what needs to be changed..."
              multiline
              numberOfLines={4}
            />
            
            <Button
              title="Send Request"
              onPress={handleRequestModification}
              loading={loading}
              fullWidth
              style={styles.sendButton}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requestsButton: {
    minWidth: 80,
  },
  uploadButton: {
    minWidth: 80,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 12,
  },
  filterButton: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  quickFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    gap: 4,
  },
  activeQuickFilter: {
    backgroundColor: colors.primary,
  },
  quickFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  activeQuickFilterText: {
    color: '#FFFFFF',
  },
  documentsList: {
    padding: 16,
    paddingTop: 0,
  },
  documentCard: {
    marginBottom: 8,
    padding: 0,
    overflow: 'hidden',
  },
  documentContent: {
    padding: 12,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  documentActions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  moreButton: {
    padding: 4,
  },
  requestCard: {
    marginBottom: 12,
    padding: 16,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  requestReason: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 8,
    lineHeight: 20,
  },
  requestDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    flex: 1,
  },
  requestsList: {
    maxHeight: 400,
  },
  emptyRequestsText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: 20,
    marginBottom: 20,
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pdfViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  pdfViewerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 16,
  },
  pdfViewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pdfActionButton: {
    padding: 8,
  },
  pdfContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 32,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorButton: {
    minWidth: 120,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  filterModalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  selectedDocument: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.card,
    borderRadius: 8,
  },
  sendButton: {
    marginTop: 16,
  },
  signatureSection: {
    marginVertical: 16,
  },
  signatureLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  signaturePlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  signaturePlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  signaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  signaturePreviewText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: 6,
  },
  activeFilterOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  activeFilterOptionText: {
    color: '#FFFFFF',
  },
  applyButton: {
    marginTop: 8,
  },
});