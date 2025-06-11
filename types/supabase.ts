export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Apartment {
  id: string;
  room_code: string;
  name: string;
  user_id: string;
  created_at: string;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  due_date: string;
  completed: boolean;
  recurring: 'daily' | 'weekly' | 'monthly';
  apartment_id: string;
  created_at: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paid_by: string;
  date: string;
  category: string;
  description?: string;
  split: 'equal' | 'custom';
  split_details?: Record<string, number>;
  settled: boolean;
  apartment_id: string;
  created_at: string;
}

export interface Guest {
  id: string;
  name: string;
  requested_by: string;
  arrival_date: string;
  departure_date: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  apartment_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  user_id: string;
  created_at: string;
}

export interface Document {
  id: string;
  name: string;
  url: string;
  signed: boolean;
  apartment_id: string;
  uploader_id?: string;
  created_at: string;
  size?: number;
  type?: string;
  signed_by?: string;
  signed_at?: string;
  signature_data?: string;
}

export interface DocumentReference {
  name: string;
}

export interface ModificationRequest {
  id: string;
  document_id: string;
  requested_by: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  apartment_id: string;
  created_at: string;
  documents?: DocumentReference;
}

// Additional types for better type safety
export interface DocumentWithUploader extends Document {
  uploader_id: string;
  size: number;
  type: string;
}

export interface ModificationRequestWithDocument extends ModificationRequest {
  documents: DocumentReference;
}

export interface SignaturePosition {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

export interface SigningSession {
  id: string;
  document_id: string;
  signer_email: string;
  signer_name: string;
  status: 'pending' | 'completed' | 'expired';
  signature_positions: SignaturePosition[];
  created_at: string;
  expires_at: string;
}