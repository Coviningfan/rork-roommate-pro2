import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

// Live Supabase project credentials
const supabaseUrl = 'https://dkobqohpprlswsbubqjh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrb2Jxb2hwcHJsc3dzYnVicWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0NTMzNzIsImV4cCI6MjA2NTAyOTM3Mn0.0sXqZICM58wwXtjJK5RwWdDc7o0UV3fHkArCXgT_sMs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;