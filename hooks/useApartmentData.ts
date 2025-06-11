import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from './useAuthStore';

interface ApartmentMember {
  user_id: string;
  email: string;
  display_name?: string;
  role: 'owner' | 'member';
  joined_at: string;
}

export function useApartmentMembers() {
  const [data, setData] = useState<ApartmentMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, apartmentId } = useAuthStore();

  const fetchMembers = async () => {
    if (!user || !apartmentId) {
      setData([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Try to get apartment members from apartment_members table first
      const { data: membersData, error: membersError } = await supabase
        .from('apartment_members')
        .select(`
          user_id,
          role,
          joined_at
        `)
        .eq('apartment_id', apartmentId);

      if (membersError || !membersData || membersData.length === 0) {
        // If apartment_members table doesn't exist or no members found, fall back to apartment owner
        console.log('apartment_members table not found or empty, using apartment owner');
        
        const { data: apartmentData, error: apartmentError } = await supabase
          .from('apartments')
          .select('user_id')
          .eq('id', apartmentId)
          .single();

        if (apartmentError) throw apartmentError;

        // Get user details from auth.users
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(apartmentData.user_id);
        
        if (userError) {
          // Fallback: create member with minimal info
          const ownerMember: ApartmentMember = {
            user_id: apartmentData.user_id,
            email: apartmentData.user_id === user.id ? user.email : 'Unknown',
            display_name: apartmentData.user_id === user.id ? user.displayName : undefined,
            role: 'owner',
            joined_at: new Date().toISOString()
          };
          setData([ownerMember]);
          return;
        }

        const ownerMember: ApartmentMember = {
          user_id: apartmentData.user_id,
          email: userData.user?.email || 'Unknown',
          display_name: userData.user?.user_metadata?.display_name || userData.user?.email?.split('@')[0],
          role: 'owner',
          joined_at: new Date().toISOString()
        };

        setData([ownerMember]);
      } else {
        // Get user details for each member
        const membersWithDetails: ApartmentMember[] = [];
        
        for (const member of membersData) {
          try {
            const { data: userData, error: userError } = await supabase.auth.admin.getUserById(member.user_id);
            
            if (userError) {
              // Fallback for this member
              membersWithDetails.push({
                user_id: member.user_id,
                email: member.user_id === user.id ? user.email : 'Unknown',
                display_name: member.user_id === user.id ? user.displayName : undefined,
                role: member.role,
                joined_at: member.joined_at
              });
            } else {
              membersWithDetails.push({
                user_id: member.user_id,
                email: userData.user?.email || 'Unknown',
                display_name: userData.user?.user_metadata?.display_name || userData.user?.email?.split('@')[0],
                role: member.role,
                joined_at: member.joined_at
              });
            }
          } catch (err) {
            // Fallback for this member
            membersWithDetails.push({
              user_id: member.user_id,
              email: member.user_id === user.id ? user.email : 'Unknown',
              display_name: member.user_id === user.id ? user.displayName : undefined,
              role: member.role,
              joined_at: member.joined_at
            });
          }
        }

        setData(membersWithDetails);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching apartment members:', err);
      setError(err.message);
      
      // Fallback: show current user as owner
      if (user) {
        setData([{
          user_id: user.id,
          email: user.email,
          display_name: user.displayName,
          role: 'owner',
          joined_at: new Date().toISOString()
        }]);
      } else {
        setData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [user, apartmentId]);

  return { data, isLoading, error, refetch: fetchMembers };
}