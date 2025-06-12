import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';
import type { Chore, Expense, Guest, Notification, Document, ModificationRequest, DocumentReference } from '@/types/supabase';

// Generic hook for Supabase data fetching with optimizations
export function useSupabaseQuery<T>(
  table: string,
  select: string = '*',
  filters?: Record<string, any>,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
    orderBy?: { column: string; ascending?: boolean };
  }
) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || options?.enabled === false) {
      setData([]);
      setIsLoading(false);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);
      setError(null);
      
      let query = supabase.from(table).select(select);
      
      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? false 
        });
      }
      
      const { data: result, error } = await query.abortSignal(abortControllerRef.current.signal);
      
      if (error) {
        // Check if error is due to table not existing
        if (error.code === '42P01') {
          console.warn(`Table ${table} does not exist yet`);
          setData([]);
          setError(null);
          return;
        }
        throw error;
      }
      
      setData(result as T[] || []);
      setError(null);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return; // Request was cancelled
      }
      console.error(`Error fetching ${table}:`, err);
      setError(err.message);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, table, select, JSON.stringify(filters), options?.enabled, options?.orderBy]);

  useEffect(() => {
    fetchData();

    // Set up refetch interval if specified
    if (options?.refetchInterval && options.refetchInterval > 0) {
      intervalRef.current = setInterval(fetchData, options.refetchInterval);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, options?.refetchInterval]);

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchData,
    isEmpty: data.length === 0 && !isLoading && !error
  };
}

// Optimized specific hooks for different data types
export function useChores() {
  const { apartmentId } = useAuthStore();
  return useSupabaseQuery<Chore>(
    'chores', 
    '*', 
    apartmentId ? { apartment_id: apartmentId } : undefined,
    {
      enabled: !!apartmentId,
      orderBy: { column: 'created_at', ascending: false }
    }
  );
}

export function useExpenses() {
  const { apartmentId } = useAuthStore();
  return useSupabaseQuery<Expense>(
    'expenses', 
    '*', 
    apartmentId ? { apartment_id: apartmentId } : undefined,
    {
      enabled: !!apartmentId,
      orderBy: { column: 'date', ascending: false }
    }
  );
}

export function useGuests() {
  const { apartmentId } = useAuthStore();
  return useSupabaseQuery<Guest>(
    'guests', 
    '*', 
    apartmentId ? { apartment_id: apartmentId } : undefined,
    {
      enabled: !!apartmentId,
      orderBy: { column: 'check_in_date', ascending: false }
    }
  );
}

export function useNotifications() {
  const { user } = useAuthStore();
  return useSupabaseQuery<Notification>(
    'notifications', 
    '*', 
    user?.id ? { user_id: user.id } : undefined,
    {
      enabled: !!user?.id,
      orderBy: { column: 'created_at', ascending: false },
      refetchInterval: 30000 // Refetch every 30 seconds
    }
  );
}

export function useDocuments() {
  const { apartmentId } = useAuthStore();
  return useSupabaseQuery<Document>(
    'documents', 
    '*', 
    apartmentId ? { apartment_id: apartmentId } : undefined,
    {
      enabled: !!apartmentId,
      orderBy: { column: 'created_at', ascending: false }
    }
  );
}

export function useModificationRequests() {
  const { apartmentId } = useAuthStore();
  return useSupabaseQuery<ModificationRequest>(
    'modification_requests', 
    `
      *,
      documents!inner(name)
    `, 
    apartmentId ? { apartment_id: apartmentId } : undefined,
    {
      enabled: !!apartmentId,
      orderBy: { column: 'created_at', ascending: false }
    }
  );
}

// Optimized document operations with better error handling
export async function deleteDocument(documentId: string): Promise<void> {
  try {
    // First get the document to find the file URL
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('url')
      .eq('id', documentId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (document?.url) {
      // Extract filename from URL
      const urlParts = document.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([filename]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }
    
    // Then delete the database record
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (dbError) throw dbError;
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
}

export async function createModificationRequest(
  documentId: string, 
  reason: string, 
  apartmentId: string,
  requestedBy: string
): Promise<void> {
  try {
    // Insert modification request
    const { error: requestError } = await supabase
      .from('modification_requests')
      .insert([{
        document_id: documentId,
        requested_by: requestedBy,
        reason: reason,
        apartment_id: apartmentId,
        status: 'pending'
      }]);
    
    if (requestError) {
      throw requestError;
    }
    
    // Get document and apartment info for notifications
    const [documentResult, apartmentResult] = await Promise.allSettled([
      supabase
        .from('documents')
        .select('name, uploader_id')
        .eq('id', documentId)
        .single(),
      supabase
        .from('apartments')
        .select('user_id')
        .eq('id', apartmentId)
        .single()
    ]);
    
    const document = documentResult.status === 'fulfilled' ? documentResult.value.data : null;
    const apartment = apartmentResult.status === 'fulfilled' ? apartmentResult.value.data : null;
    
    if (document && apartment) {
      // Create notifications for both apartment owner and document uploader (if different)
      const notifications = [];
      
      // Notification for apartment owner
      notifications.push({
        title: 'Document Modification Request',
        message: `${reason} - Document: ${document.name}`,
        type: 'info' as const,
        user_id: apartment.user_id,
        read: false
      });
      
      // Notification for document uploader (if different from apartment owner)
      if (document.uploader_id && document.uploader_id !== apartment.user_id) {
        notifications.push({
          title: 'Document Modification Request',
          message: `${reason} - Document: ${document.name}`,
          type: 'info' as const,
          user_id: document.uploader_id,
          read: false
        });
      }
      
      if (notifications.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notifications);
        
        if (notificationError) {
          console.error('Failed to create notifications:', notificationError);
          // Don't throw error for notification failure
        }
      }
    }
  } catch (error) {
    console.error('Create modification request error:', error);
    throw error;
  }
}

export async function updateModificationRequestStatus(
  requestId: string,
  status: 'approved' | 'rejected'
): Promise<void> {
  try {
    // Update the request status
    const { error: updateError } = await supabase
      .from('modification_requests')
      .update({ status })
      .eq('id', requestId);
    
    if (updateError) {
      throw updateError;
    }
    
    // Get request details to create notification
    const { data: request, error: requestError } = await supabase
      .from('modification_requests')
      .select(`
        requested_by,
        document_id,
        documents!inner(name)
      `)
      .eq('id', requestId)
      .single();
    
    if (requestError) {
      console.error('Error fetching request details:', requestError);
      return; // Continue even if we can't get request details
    }
    
    // Create notification for the requester
    if (request && request.requested_by) {
      // Fix: Access the document name correctly from the joined documents object
      let documentName = 'document';
      
      if (request.documents && typeof request.documents === 'object' && 'name' in request.documents) {
        documentName = (request.documents as DocumentReference).name;
      }
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert([{
          title: `Modification Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: `Your request to modify "${documentName}" has been ${status}`,
          type: status === 'approved' ? 'success' : 'info',
          user_id: request.requested_by,
          read: false
        }]);
      
      if (notificationError) {
        console.error('Failed to create notification:', notificationError);
        // Don't throw error for notification failure
      }
    }
  } catch (error) {
    console.error('Update modification request status error:', error);
    throw error;
  }
}