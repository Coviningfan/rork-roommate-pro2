export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Agreement {
  id: string;
  title: string;
  description: string;
  fileUrl: string;
  createdAt: string;
  signed: boolean;
}

export interface Chore {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  completed: boolean;
  recurring: 'daily' | 'weekly' | 'monthly';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  date: string;
  category: 'rent' | 'utilities' | 'groceries' | 'other';
  split: 'equal' | 'custom';
  splitDetails?: {
    [userId: string]: number;
  };
  settled: boolean;
}

export interface Guest {
  id: string;
  name: string;
  requestedBy: string;
  arrivalDate: string;
  departureDate: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}