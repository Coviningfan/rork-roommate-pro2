import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// Live Supabase project credentials
const supabaseUrl = 'https://dkobqohpprlswsbubqjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb2Jxb2hwcHJsc3dzYnVicWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTMzNzIsImV4cCI6MjA2NTAyOTM3Mn0.0sXqZICM58wwXtjJK5RwWdDc7o0UV3fHkArCXgT_sMs';

// Optimized Supabase client configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-my-custom-header': 'roommate-app',
    },
  },
  db: {
    schema: 'public',
  },
});

// Connection health check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('apartments')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase connection check failed:', error);
    return false;
  }
};

// Optimized query builder with common patterns
export const createOptimizedQuery = (table: string) => {
  return {
    selectAll: () => supabase.from(table).select('*'),
    selectById: (id: string) => supabase.from(table).select('*').eq('id', id).single(),
    selectByUserId: (userId: string) => supabase.from(table).select('*').eq('user_id', userId),
    selectByApartmentId: (apartmentId: string) => supabase.from(table).select('*').eq('apartment_id', apartmentId),
    insert: (data: any) => supabase.from(table).insert(data),
    update: (id: string, data: any) => supabase.from(table).update(data).eq('id', id),
    delete: (id: string) => supabase.from(table).delete().eq('id', id),
  };
};

export default supabase;