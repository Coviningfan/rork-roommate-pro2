import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

interface AuthState {
  user: User | null;
  apartmentId: string | null;
  roomCode: string | null;
  apartmentName: string | null;
  apartmentOwnerId: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  createApartment: () => Promise<{ apartmentId: string; roomCode: string }>;
  joinApartment: (code: string) => Promise<string>;
  leaveApartment: () => Promise<void>;
  switchApartment: (apartmentId: string, roomCode: string, apartmentName: string) => Promise<void>;
  getUserApartments: () => Promise<any[]>;
  initializeAuth: () => void;
  clearError: () => void;
  isApartmentOwner: () => boolean;
}

function generateShortCode() {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const random = () => letters[Math.floor(Math.random() * letters.length)];
  return `${random()}${random()}${random()}-${random()}${random()}${random()}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      apartmentId: null,
      roomCode: null,
      apartmentName: null,
      apartmentOwnerId: null,
      isLoading: false,
      isInitialized: false,
      error: null,
      
      clearError: () => set({ error: null }),
      
      isApartmentOwner: () => {
        const { user, apartmentOwnerId } = get();
        return user?.id === apartmentOwnerId;
      },
      
      initializeAuth: () => {
        console.log('Initializing Supabase auth...');
        
        // Get initial session first
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.error('Error getting initial session:', error);
            set({ isInitialized: true, error: error.message });
            return;
          }
          
          if (session?.user) {
            console.log('Found existing session for user:', session.user.id);
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
            };
            
            set({ user, isInitialized: true, error: null });
            
            // Check if user has an apartment and get apartment owner info
            supabase
              .from('apartments')
              .select('*')
              .eq('user_id', session.user.id)
              .limit(1)
              .then(({ data: apartments, error }) => {
                if (error) {
                  console.error('Error fetching apartments:', error);
                } else if (apartments && apartments.length > 0) {
                  const apartment = apartments[0];
                  set({
                    apartmentId: apartment.id,
                    roomCode: apartment.room_code,
                    apartmentName: apartment.name || 'My Apartment',
                    apartmentOwnerId: apartment.user_id
                  });
                }
              });
          } else {
            console.log('No existing session found');
            set({ isInitialized: true });
          }
        });
        
        // Listen for auth state changes
        supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.id);
          
          if (event === 'SIGNED_IN' && session?.user) {
            const user: User = {
              id: session.user.id,
              email: session.user.email || '',
              displayName: session.user.user_metadata?.display_name || session.user.email?.split('@')[0],
            };
            
            set({ user, isInitialized: true, error: null });
            
            // Check if user has an apartment and get apartment owner info
            try {
              const { data: apartments, error } = await supabase
                .from('apartments')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1);
              
              if (error) {
                console.error('Error fetching apartments:', error);
              } else if (apartments && apartments.length > 0) {
                const apartment = apartments[0];
                set({
                  apartmentId: apartment.id,
                  roomCode: apartment.room_code,
                  apartmentName: apartment.name || 'My Apartment',
                  apartmentOwnerId: apartment.user_id
                });
              }
            } catch (error) {
              console.error('Error checking apartments:', error);
            }
          } else if (event === 'SIGNED_OUT') {
            set({ 
              user: null, 
              apartmentId: null, 
              roomCode: null, 
              apartmentName: null,
              apartmentOwnerId: null,
              isInitialized: true,
              error: null 
            });
          }
        });
      },
      
      login: async (email: string, password: string) => {
        console.log('Attempting Supabase login with email:', email);
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
          
          if (error) {
            console.error('Supabase login error:', error);
            throw error;
          }
          
          if (!data.user) {
            throw new Error('Login failed - no user returned');
          }
          
          console.log('Supabase login successful for user:', data.user.id);
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Login failed:', error);
          set({ isLoading: false, error: error.message || 'Login failed' });
          throw error;
        }
      },
      
      logout: async () => {
        console.log('Supabase logout');
        
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          
          set({
            user: null,
            apartmentId: null,
            roomCode: null,
            apartmentName: null,
            apartmentOwnerId: null,
            error: null
          });
        } catch (error: any) {
          console.error('Logout error:', error);
          set({ error: error.message });
          throw error;
        }
      },
      
      register: async (email: string, password: string) => {
        console.log('Attempting Supabase registration with email:', email);
        
        set({ isLoading: true, error: null });
        
        try {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
          });
          
          if (error) {
            console.error('Supabase registration error:', error);
            throw error;
          }
          
          if (!data.user) {
            throw new Error('Registration failed - no user returned');
          }
          
          console.log('Supabase registration successful for user:', data.user.id);
          
          // Check if email confirmation is required
          if (!data.session) {
            console.log('Email confirmation required');
            set({ isLoading: false });
            // This is expected behavior for email confirmation - don't throw error
            return;
          }
          
          set({ isLoading: false });
        } catch (error: any) {
          console.error('Registration failed:', error);
          set({ isLoading: false, error: error.message || 'Registration failed' });
          throw error;
        }
      },
      
      createApartment: async () => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        const roomCode = generateShortCode();
        const apartmentName = 'My Apartment';
        
        try {
          set({ isLoading: true, error: null });
          
          console.log('=== CREATE APARTMENT DEBUG ===');
          console.log('Creating apartment with user_id:', user.id, 'Type:', typeof user.id);
          console.log('Room code:', roomCode);
          console.log('Apartment name:', apartmentName);
          
          // Insert the new apartment with all required columns
          const { data, error } = await supabase
            .from('apartments')
            .insert([
              {
                room_code: roomCode,
                user_id: user.id,
                name: apartmentName,
              }
            ])
            .select()
            .single();
          
          if (error) {
            console.error('Create apartment error:', error);
            throw new Error(`Database error: ${error.message}`);
          }
          
          if (!data) {
            throw new Error('Failed to create apartment - no data returned');
          }
          
          console.log('Apartment created successfully:', data);
          
          // Try to create apartment_members entry (this ensures user can upload documents)
          try {
            console.log('Adding user to apartment_members table...');
            const { data: memberData, error: memberError } = await supabase
              .from('apartment_members')
              .insert([
                {
                  apartment_id: data.id,
                  user_id: user.id,
                  role: 'owner'
                }
              ])
              .select()
              .single();
            
            if (memberError) {
              console.error('Failed to add to apartment_members:', memberError);
              // Don't throw error, apartment creation was successful
            } else {
              console.log('Successfully added to apartment_members:', memberData);
            }
          } catch (memberError) {
            console.log('apartment_members table not available or error:', memberError);
          }
          
          set({
            apartmentId: data.id,
            roomCode: data.room_code,
            apartmentName: data.name,
            apartmentOwnerId: data.user_id,
            isLoading: false
          });
          
          return { apartmentId: data.id, roomCode: data.room_code };
        } catch (error: any) {
          console.error('Create apartment error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      joinApartment: async (code: string) => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        try {
          set({ isLoading: true, error: null });
          
          console.log('=== JOIN APARTMENT DEBUG ===');
          console.log('Joining with user_id:', user.id, 'Type:', typeof user.id);
          console.log('Room code:', code);
          
          // Find apartment by room code using RPC function to bypass RLS
          const { data: apartments, error: fetchError } = await supabase.rpc('find_apartment_by_code', {
            search_code: code
          });
          
          if (fetchError) {
            console.error('RPC error:', fetchError);
            // Fallback to direct query
            const { data: fallbackApartments, error: fallbackError } = await supabase
              .from('apartments')
              .select('*')
              .eq('room_code', code)
              .limit(1);
            
            if (fallbackError) throw fallbackError;
            
            if (!fallbackApartments || fallbackApartments.length === 0) {
              throw new Error('Invalid room code. Please check and try again.');
            }
            
            const apartment = fallbackApartments[0];
            console.log('Found apartment (fallback):', apartment);
            
            // Try to add user to apartment_members table (this ensures user can upload documents)
            try {
              console.log('Adding user to apartment_members table...');
              const { data: memberData, error: memberError } = await supabase
                .from('apartment_members')
                .insert([
                  {
                    apartment_id: apartment.id,
                    user_id: user.id,
                    role: 'member'
                  }
                ])
                .select()
                .single();
              
              if (memberError) {
                console.error('Failed to add to apartment_members:', memberError);
                // Don't throw error, joining was successful
              } else {
                console.log('Successfully added to apartment_members:', memberData);
              }
            } catch (memberError) {
              console.log('apartment_members table not available or error:', memberError);
            }
            
            set({
              apartmentId: apartment.id,
              roomCode: apartment.room_code,
              apartmentName: apartment.name || 'My Apartment',
              apartmentOwnerId: apartment.user_id,
              isLoading: false
            });
            
            return apartment.id;
          }
          
          if (!apartments || apartments.length === 0) {
            throw new Error('Invalid room code. Please check and try again.');
          }
          
          const apartment = apartments[0];
          console.log('Found apartment (RPC):', apartment);
          
          // Try to add user to apartment_members table (this ensures user can upload documents)
          try {
            console.log('Adding user to apartment_members table...');
            const { data: memberData, error: memberError } = await supabase
              .from('apartment_members')
              .insert([
                {
                  apartment_id: apartment.id,
                  user_id: user.id,
                  role: 'member'
                }
              ])
              .select()
              .single();
            
            if (memberError) {
              console.error('Failed to add to apartment_members:', memberError);
              // Don't throw error, joining was successful
            } else {
              console.log('Successfully added to apartment_members:', memberData);
            }
          } catch (memberError) {
            console.log('apartment_members table not available or error:', memberError);
          }
          
          set({
            apartmentId: apartment.id,
            roomCode: apartment.room_code,
            apartmentName: apartment.name || 'My Apartment',
            apartmentOwnerId: apartment.user_id,
            isLoading: false
          });
          
          return apartment.id;
        } catch (error: any) {
          console.error('Join apartment error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      leaveApartment: async () => {
        const { user, apartmentId } = get();
        if (!user || !apartmentId) throw new Error('User not authenticated or no apartment');
        
        try {
          set({ isLoading: true, error: null });
          
          // Remove user from apartment_members table (if exists)
          try {
            await supabase
              .from('apartment_members')
              .delete()
              .eq('apartment_id', apartmentId)
              .eq('user_id', user.id);
          } catch (memberError) {
            console.log('apartment_members table not available, skipping member removal');
          }
          
          // Clear apartment data from state
          set({
            apartmentId: null,
            roomCode: null,
            apartmentName: null,
            apartmentOwnerId: null,
            isLoading: false
          });
          
        } catch (error: any) {
          console.error('Leave apartment error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      switchApartment: async (apartmentId: string, roomCode: string, apartmentName: string) => {
        try {
          set({ isLoading: true, error: null });
          
          // Get apartment owner info
          const { data: apartment } = await supabase
            .from('apartments')
            .select('user_id')
            .eq('id', apartmentId)
            .single();
          
          set({
            apartmentId,
            roomCode,
            apartmentName,
            apartmentOwnerId: apartment?.user_id || null,
            isLoading: false
          });
          
        } catch (error: any) {
          console.error('Switch apartment error:', error);
          set({ isLoading: false, error: error.message });
          throw error;
        }
      },
      
      getUserApartments: async () => {
        const { user } = get();
        if (!user) throw new Error('User not authenticated');
        
        try {
          console.log('=== GET USER APARTMENTS DEBUG ===');
          console.log('Fetching with user_id:', user.id, 'Type:', typeof user.id);
          
          // Try to get apartments from apartment_members table first
          let apartments: any[] = [];
          
          try {
            const { data: memberData, error: memberError } = await supabase
              .from('apartment_members')
              .select(`
                apartment_id,
                role,
                apartments:apartment_id (
                  id,
                  name,
                  room_code,
                  user_id,
                  created_at
                )
              `)
              .eq('user_id', user.id);
            
            if (!memberError && memberData) {
              apartments = memberData
                .map(item => ({
                  ...item.apartments,
                  user_role: item.role
                }))
                .filter(Boolean);
              
              console.log('Found apartments from apartment_members:', apartments);
            }
          } catch (memberError) {
            console.log('apartment_members table not available, using apartments table');
          }
          
          // Also get apartments where user is owner
          const { data: ownerData, error: ownerError } = await supabase
            .from('apartments')
            .select('*')
            .eq('user_id', user.id);
          
          if (ownerError) throw ownerError;
          
          console.log('Found apartments where user is owner:', ownerData);
          
          // Merge owner apartments with member apartments, avoiding duplicates
          if (ownerData) {
            ownerData.forEach(ownerApt => {
              const existingIndex = apartments.findIndex(apt => apt.id === ownerApt.id);
              if (existingIndex >= 0) {
                // Update role to owner if user is the owner
                apartments[existingIndex].user_role = 'owner';
              } else {
                // Add as new apartment with owner role
                apartments.push({
                  ...ownerApt,
                  user_role: 'owner'
                });
              }
            });
          }
          
          console.log('Final apartments list:', apartments);
          return apartments;
        } catch (error: any) {
          console.error('Get user apartments error:', error);
          throw error;
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        apartmentId: state.apartmentId,
        roomCode: state.roomCode,
        apartmentName: state.apartmentName,
        apartmentOwnerId: state.apartmentOwnerId
      })
    }
  )
);