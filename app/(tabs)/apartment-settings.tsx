import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { 
  Home, 
  Users, 
  Copy, 
  LogOut, 
  Settings,
  Plus,
  ChevronRight,
  UserPlus,
  Crown
} from 'lucide-react-native';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ListItem } from '@/components/ListItem';
import { Badge } from '@/components/Badge';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useApartmentMembers } from '@/hooks/useApartmentData';
import { supabase } from '@/lib/supabase';
import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

export default function ApartmentSettingsScreen() {
  const { 
    user, 
    apartmentId, 
    roomCode, 
    apartmentName, 
    leaveApartment,
    switchApartment,
    getUserApartments
  } = useAuthStore();
  
  const { data: members, isLoading: membersLoading, refetch: refetchMembers } = useApartmentMembers();
  const [userApartments, setUserApartments] = useState<any[]>([]);
  const [isLoadingApartments, setIsLoadingApartments] = useState(false);
  
  useEffect(() => {
    loadUserApartments();
  }, []);
  
  const loadUserApartments = async () => {
    if (!user) return;
    
    setIsLoadingApartments(true);
    try {
      const apartments = await getUserApartments();
      setUserApartments(apartments);
    } catch (error) {
      console.error('Error loading user apartments:', error);
    } finally {
      setIsLoadingApartments(false);
    }
  };
  
  const handleRefresh = () => {
    refetchMembers();
    loadUserApartments();
  };
  
  const copyRoomCode = async () => {
    if (!roomCode) return;
    
    try {
      if (Platform.OS === 'web') {
        await navigator.clipboard.writeText(roomCode);
      } else {
        await Clipboard.setStringAsync(roomCode);
      }
      
      Alert.alert('Copied!', 'Room code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy room code');
    }
  };
  
  const handleInviteMembers = () => {
    Alert.alert(
      'Invite Members',
      `Share this room code with others to invite them to your apartment:

${roomCode}`,
      [
        { text: 'Copy Code', onPress: copyRoomCode },
        { text: 'OK' }
      ]
    );
  };
  
  const handleLeaveApartment = () => {
    Alert.alert(
      'Leave Apartment',
      'Are you sure you want to leave this apartment? You will lose access to all shared data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveApartment();
              router.replace('/apartment-config');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to leave apartment');
            }
          }
        }
      ]
    );
  };
  
  const handleSwitchApartment = (apartment: any) => {
    Alert.alert(
      'Switch Apartment',
      `Switch to "${apartment.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch',
          onPress: async () => {
            try {
              await switchApartment(apartment.id, apartment.room_code, apartment.name);
              Alert.alert('Success', `Switched to ${apartment.name}`);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to switch apartment');
            }
          }
        }
      ]
    );
  };
  
  const handleCreateNewApartment = () => {
    router.push('/apartment-config?action=create');
  };
  
  const handleJoinAnotherApartment = () => {
    router.push('/apartment-config?action=join');
  };
  
  const isOwner = members.find(member => member.user_id === user?.id)?.role === 'owner';
  
  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={membersLoading || isLoadingApartments} onRefresh={handleRefresh} />
      }
    >
      {/* Current Apartment Info */}
      <Card style={styles.apartmentCard} variant="elevated">
        <View style={styles.apartmentHeader}>
          <View style={styles.apartmentIconContainer}>
            <Home size={32} color={colors.primary} />
          </View>
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentName}>{apartmentName || "My Apartment"}</Text>
            <View style={styles.roomCodeContainer}>
              <Text style={styles.roomCodeLabel}>Room Code: </Text>
              <Text style={styles.roomCode}>{roomCode}</Text>
              <TouchableOpacity onPress={copyRoomCode} style={styles.copyButton}>
                <Copy size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
            {isOwner && (
              <Badge label="Owner" variant="success" size="small" style={styles.ownerBadge} />
            )}
          </View>
        </View>
      </Card>
      
      {/* Apartment Members */}
      <Card style={styles.section} variant="elevated">
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({members.length})</Text>
          <TouchableOpacity onPress={handleInviteMembers}>
            <UserPlus size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        {members.map((member) => (
          <View key={member.user_id} style={styles.memberItem}>
            <View style={styles.memberInfo}>
              <View style={styles.memberIconContainer}>
                <Users size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.memberDetails}>
                <Text style={styles.memberName}>
                  {member.display_name || member.email || 'Unknown User'}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            </View>
            <View style={styles.memberRole}>
              {member.role === 'owner' && (
                <View style={styles.ownerIcon}>
                  <Crown size={16} color={colors.warning} />
                </View>
              )}
              <Badge 
                label={member.role === 'owner' ? 'Owner' : 'Member'} 
                variant={member.role === 'owner' ? 'warning' : 'default'}
                size="small"
              />
            </View>
          </View>
        ))}
        
        <Button
          title="Invite Members"
          onPress={handleInviteMembers}
          variant="outline"
          size="small"
          style={styles.inviteButton}
          fullWidth
        />
      </Card>
      
      {/* Other Apartments */}
      {userApartments.length > 1 && (
        <Card style={styles.section} variant="elevated">
          <Text style={styles.sectionTitle}>Other Apartments</Text>
          
          {userApartments
            .filter(apt => apt.id !== apartmentId)
            .map((apartment) => (
              <ListItem
                key={apartment.id}
                title={apartment.name}
                subtitle={`Code: ${apartment.room_code}`}
                leftIcon={<Home size={20} color={colors.textSecondary} />}
                onPress={() => handleSwitchApartment(apartment)}
                showChevron
              />
            ))}
        </Card>
      )}
      
      {/* Quick Actions */}
      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <ListItem
          title="Create New Apartment"
          subtitle="Start a new apartment and invite others"
          leftIcon={<Plus size={20} color={colors.success} />}
          onPress={handleCreateNewApartment}
          showChevron
        />
        
        <ListItem
          title="Join Another Apartment"
          subtitle="Join an existing apartment with a code"
          leftIcon={<UserPlus size={20} color={colors.info} />}
          onPress={handleJoinAnotherApartment}
          showChevron
        />
      </Card>
      
      {/* Apartment Settings */}
      <Card style={styles.section} variant="elevated">
        <Text style={styles.sectionTitle}>Apartment Settings</Text>
        
        {isOwner && (
          <ListItem
            title="Manage Apartment"
            subtitle="Edit apartment details and settings"
            leftIcon={<Settings size={20} color={colors.primary} />}
            onPress={() => Alert.alert('Coming Soon', 'Apartment management features coming soon')}
            showChevron
          />
        )}
        
        <ListItem
          title="Leave Apartment"
          subtitle="Remove yourself from this apartment"
          leftIcon={<LogOut size={20} color={colors.error} />}
          onPress={handleLeaveApartment}
          showChevron
        />
      </Card>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>J.A.B.V Labs</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  apartmentCard: {
    margin: 16,
    padding: 20,
  },
  apartmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apartmentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  roomCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roomCodeLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  roomCode: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginRight: 8,
  },
  copyButton: {
    padding: 4,
  },
  ownerBadge: {
    alignSelf: 'flex-start',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  memberRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ownerIcon: {
    marginRight: 8,
  },
  inviteButton: {
    marginTop: 16,
  },
  footer: {
    alignItems: 'center',
    padding: 16,
    marginBottom: 24,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});