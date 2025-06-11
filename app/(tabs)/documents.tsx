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
  useWindowDimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { colors } from '@/constants/Colors';
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
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
import { ActionSheet, ActionSheetOption } from '@/components/ActionSheet';
import { SwipeableRow } from '@/components/SwipeableRow';
import { SectionHeader } from '@/components/SectionHeader';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useDocuments, useModificationRequests, deleteDocument, createModificationRequest, updateModificationRequestStatus } from '@/hooks/useSupabaseData';
import { usePDFSigning } from '@/hooks/usePDFSigning';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useHaptics } from '@/hooks/useHaptics';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import type { Document as DocumentType, ModificationRequest } from '@/types/supabase';

const isWeb = Platform.OS === 'web';

type FilterType = 'all' | 'pending' | 'signed';
type SortType = 'date' | 'name' | 'status';

export default function DocumentsScreen() {
  const { user, apartmentId, isApartmentOwner } = useAuthStore();
  const { data: documents, isLoading, refetch } = useDocuments();
  const { data: modificationRequests, refetch: refetchRequests } = useModificationRequests();
  const { signDocument, isProcessing } = usePDFSigning();
  const { width } = useWindowDimensions();
  const { impact, notification, selection } = useHaptics();
  
  const isTablet = width > 768;
  
  // State management
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Modal states
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
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
      impact.light();
      setSelectedDocument(document);
      setPdfViewerVisible(true);
      setPdfLoading(true);
      setPdfError(false);
    } catch (error) {
      console.error('Error opening PDF:', error);
      notification.error();
      Alert.alert('Error', 'Failed to open PDF document');
    }
  };
  
  const handleDownloadPDF = async (document: DocumentType) => {
    if (isWeb) {
      const link = window.document.createElement('a');
      link.href = document.url;
      link.download = document.name;
      link.click();
      notification.success();
      return;
    }
    
    try {
      setLoading(true);
      impact.medium();
      
      const downloadResumable = FileSystem.createDownloadResumable(
        document.url,
        FileSystem.documentDirectory + document.name
      );
      
      const result = await downloadResumable.downloadAsync();
      
      if (result) {
        notification.success();
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
      notification.error();
      Alert.alert('Error', 'Failed to download document');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSharePDF = async (document: DocumentType) => {
    try {
      impact.light();
      if (isWeb) {
        await Clipboard.setStringAsync(document.url);
        notification.success();
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
      notification.error();
      Alert.alert('Error', 'Failed to share document');
    }
  };
  
  const handleDeleteDocument = async (document: DocumentType) => {
    impact.heavy();
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
              notification.error();
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
    selection();
    setSelectedDocument(document);
    
    const options: ActionSheetOption[] = [
      {
        title: 'View Document',
        icon: <Eye size={20} color={colors.primary} />,
        onPress: () => handleViewPDF(document),
      },
      {
        title: 'Download',
        icon: <Download size={20} color={colors.info} />,
        onPress: () => handleDownloadPDF(document),
      },
      {
        title: 'Share',
        icon: <ShareIcon size={20} color={colors.secondary} />,
        onPress: () => handleSharePDF(document),
      },
    ];
    
    if (!document.signed) {
      options.push(
        {
          title: 'Send for Signature',
          icon: <Send size={20} color={colors.primary} />,
          onPress: () => openSignatureModal(document),
        },
        {
          title: 'Sign Document',
          icon: <PenTool size={20} color={colors.success} />,
          onPress: () => openSignDocumentModal(document),
        },
        {
          title: 'Request Modification',
          icon: <Edit3 size={20} color={colors.warning} />,
          onPress: () => openModificationModal(document),
        }
      );
      
      if (isApartmentOwner()) {
        options.push({
          title: 'Mark as Signed',
          icon: <CheckCircle size={20} color={colors.success} />,
          onPress: () => handleMarkAsSigned(document.id),
        });
      }
    }
    
    if (canDeleteDocument(document)) {
      options.push({
        title: 'Delete',
        icon: <Trash2 size={20} color={colors.error} />,
        onPress: () => handleDeleteDocument(document),
        destructive: true,
      });
    }
    
    setActionSheetVisible(true);
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
      
      impact.medium();
      
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
      
      notification.success();
      Alert.alert('Success', 'Document uploaded successfully');
      refetch();
      
    } catch (error: any) {
      console.error('Upload error:', error);
      notification.error();
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
      impact.medium();
      
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
      
      notification.success();
      Alert.alert('Success', `Document sent to ${recipientEmail} for signature`);
      setSignatureModalVisible(false);
      setRecipientEmail('');
    } catch (error: any) {
      console.error('Send signature error:', error);
      notification.error();
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
      impact.heavy();
      
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
        
        notification.success();
        Alert.alert('Success', 'Document signed successfully');
        setSignDocumentModalVisible(false);
        setSignerName('');
        setSignerEmail('');
        setSignatureData(null);
        refetch();
      }
    } catch (error: any) {
      console.error('Sign document error:', error);
      notification.error();
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
      impact.medium();
      
      await createModificationRequest(
        selectedDocument.id,
        modificationReason.trim(),
        apartmentId,
        user.id
      );
      
      notification.success();
      Alert.alert('Success', 'Modification request sent successfully');
      setModificationModalVisible(false);
      setModificationReason('');
      refetchRequests();
    } catch (error: any) {
      console.error('Modification request error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to send modification request');
    } finally {
      setLoading(false);
    }
  };
  
  const handleMarkAsSigned = async (documentId: string) => {
    try {
      impact.medium();
      const { error } = await supabase
        .from('documents')
        .update({ signed: true })
        .eq('id', documentId);
      
      if (error) throw error;
      
      notification.success();
      Alert.alert('Success', 'Document marked as signed');
      refetch();
    } catch (error: any) {
      console.error('Mark signed error:', error);
      notification.error();
      Alert.alert('Error', 'Failed to mark document as signed');
    }
  };
  
  const handleModificationRequestAction = async (requestId: string, action: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      impact.medium();
      await updateModificationRequestStatus(requestId, action);
      notification.success();
      Alert.alert('Success', `Request ${action} successfully`);
      refetchRequests();
    } catch (error: any) {
      console.error('Modification request action error:', error);
      notification.error();
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
    <SwipeableRow
      onDelete={canDeleteDocument(item) ? () => handleDeleteDocument(item) : undefined}
      deleteText="Delete"
    >
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
              <Text style={[styles.documentName, isTablet && styles.tabletDocumentName]} numberOfLines={2}>
                {item.name}
              </Text>
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
    </SwipeableRow>
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
            haptic="medium"
          />
          <Button
            title="Reject"
            onPress={() => handleModificationRequestAction(item.id, 'rejected')}
            variant="destructive"
            size="small"
            style={styles.requestButton}
            haptic="heavy"
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
      <SectionHeader
        title="Documents"
        action={{
          title: "Upload",
          onPress: handleUploadPDF,
        }}
      />
      
      {pendingRequestsCount > 0 && (
        <TouchableOpacity
          style={styles.requestsBanner}
          onPress={() => setRequestsModalVisible(true)}
        >
          <AlertCircle size={20} color={colors.warning} />
          <Text style={styles.requestsBannerText}>
            {pendingRequestsCount} pending modification request{pendingRequestsCount > 1 ? 's' : ''}
          </Text>
        </TouchableOpacity>
      )}
      
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
          onPress={() => {
            selection();
            setFilterModalVisible(true);
          }}
        >
          <Filter size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      {/* Quick Filter Tabs */}
      <View style={styles.quickFilters}>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'all' && styles.activeQuickFilter]}
          onPress={() => {
            selection();
            setFilterType('all');
          }}
        >
          <Text style={[styles.quickFilterText, filterType === 'all' && styles.activeQuickFilterText]}>
            All ({documents?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'pending' && styles.activeQuickFilter]}
          onPress={() => {
            selection();
            setFilterType('pending');
          }}
        >
          <Clock size={14} color={filterType === 'pending' ? colors.warning : colors.textSecondary} />
          <Text style={[styles.quickFilterText, filterType === 'pending' && styles.activeQuickFilterText]}>
            Pending ({pendingDocumentsCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickFilterTab, filterType === 'signed' && styles.activeQuickFilter]}
          onPress={() => {
            selection();
            setFilterType('signed');
          }}
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
          contentContainerStyle={[styles.documentsList, isTablet && styles.tabletDocumentsList]}
          showsVerticalScrollIndicator={false}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
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

      {/* Action Sheet */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={selectedDocument?.name}
        options={[]}
      />

      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfViewerVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setPdfViewerVisible(false)}
      >
        <View style={styles.pdfViewerContainer}>
          <View style={styles.pdfViewerHeader}>
            <Text style={[styles.pdfViewerTitle, isTablet && styles.tabletPdfViewerTitle]} numberOfLines={1}>
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
                        haptic="medium"
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
                      haptic="light"
                    />
                    <Button
                      title="Open in Browser"
                      onPress={() => {
                        Linking.openURL(selectedDocument.url);
                        setPdfViewerVisible(false);
                      }}
                      variant="primary"
                      style={styles.errorButton}
                      haptic="medium"
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
          <View style={[styles.modalContent, isTablet && styles.tabletModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isTablet && styles.tabletModalTitle]}>Sign Document</Text>
              <TouchableOpacity 
                onPress={() => setSignDocumentModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedDocument && (
              <Text style={[styles.selectedDocument, isTablet && styles.tabletSelectedDocument]}>
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
              <Text style={[styles.signatureLabel, isTablet && styles.tabletSignatureLabel]}>Digital Signature</Text>
              <TouchableOpacity 
                style={[styles.signaturePlaceholder, isTablet && styles.tabletSignaturePlaceholder]}
                onPress={() => {
                  impact.light();
                  setSignatureCaptureVisible(true);
                }}
              >
                {signatureData ? (
                  <View style={styles.signaturePreview}>
                    <Check size={24} color={colors.success} />
                    <Text style={styles.signaturePreviewText}>Signature captured</Text>
                  </View>
                ) : (
                  <>
                    <PenTool size={32} color={colors.textSecondary} />
                    <Text style={[styles.signaturePlaceholderText, isTablet && styles.tabletSignaturePlaceholderText]}>
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
              haptic="heavy"
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
      
      {/* Other modals remain the same but with updated styling... */}
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  requestsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.warning}15`,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  requestsBannerText: {
    ...typography.smallMedium,
    color: colors.warning,
    flex: 1,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: spacing.md,
  },
  filterButton: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.card,
  },
  quickFilters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  quickFilterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.card,
    gap: spacing.xs,
  },
  activeQuickFilter: {
    backgroundColor: colors.primary,
  },
  quickFilterText: {
    ...typography.captionMedium,
    color: colors.textSecondary,
  },
  activeQuickFilterText: {
    color: '#FFFFFF',
  },
  documentsList: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  tabletDocumentsList: {
    paddingHorizontal: spacing.xxl,
  },
  documentCard: {
    marginBottom: spacing.sm,
    padding: 0,
    overflow: 'hidden',
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  documentContent: {
    padding: spacing.md,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  documentIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  tabletDocumentName: {
    ...typography.bodySemiBold,
  },
  documentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  documentActions: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  moreButton: {
    padding: spacing.xs,
  },
  requestCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  requestTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    flex: 1,
  },
  requestReason: {
    ...typography.small,
    color: colors.text,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  requestDate: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  requestButton: {
    flex: 1,
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pdfViewerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  pdfViewerTitle: {
    ...typography.heading3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.lg,
  },
  tabletPdfViewerTitle: {
    ...typography.heading2,
  },
  pdfViewerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pdfActionButton: {
    padding: spacing.sm,
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
    marginTop: spacing.md,
    ...typography.body,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxxl,
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
    padding: spacing.xxxl,
  },
  errorTitle: {
    ...typography.heading3,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorText: {
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xxl,
  },
  errorActions: {
    flexDirection: 'row',
    gap: spacing.md,
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
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.large,
  },
  tabletModalContent: {
    maxWidth: 600,
    padding: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.heading3,
    color: colors.text,
  },
  tabletModalTitle: {
    ...typography.heading2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  selectedDocument: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
  },
  tabletSelectedDocument: {
    ...typography.body,
    padding: spacing.lg,
  },
  sendButton: {
    marginTop: spacing.lg,
  },
  signatureSection: {
    marginVertical: spacing.lg,
  },
  signatureLabel: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tabletSignatureLabel: {
    ...typography.bodySemiBold,
  },
  signaturePlaceholder: {
    height: 120,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  tabletSignaturePlaceholder: {
    height: 160,
  },
  signaturePlaceholderText: {
    marginTop: spacing.sm,
    ...typography.small,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  tabletSignaturePlaceholderText: {
    ...typography.body,
  },
  signaturePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  signaturePreviewText: {
    ...typography.smallMedium,
    color: colors.success,
  },
});