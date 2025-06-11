import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { 
  Bell, 
  CheckSquare, 
  Users,
  AlertCircle,
  Home,
  Menu,
  FileText
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Sidebar } from '@/components/Sidebar';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useChores, useExpenses, useGuests, useNotifications } from '@/hooks/useSupabaseData';
import type { Chore, Expense, Guest, Notification } from '@/types/supabase';

export default function DashboardScreen() {
  const { user, apartmentId, roomCode, apartmentName } = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  
  const { data: chores, isLoading: choresLoading, refetch: refetchChores } = useChores();
  const { data: expenses, isLoading: expensesLoading, refetch: refetchExpenses } = useExpenses();
  const { data: guests, isLoading: guestsLoading, refetch: refetchGuests } = useGuests();
  const { data: notifications, isLoading: notificationsLoading, refetch: refetchNotifications } = useNotifications();
  
  const isLoading = choresLoading || expensesLoading || guestsLoading || notificationsLoading;
  
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)');
      return;
    }
    
    if (!apartmentId) {
      router.replace('/apartment-config');
      return;
    }
  }, [user, apartmentId]);
  
  const handleRefresh = () => {
    refetchChores();
    refetchExpenses();
    refetchGuests();
    refetchNotifications();
  };
  
  // Filter data for dashboard with proper typing
  const myChores = chores.filter((chore: Chore) => 
    chore.assigned_to === user?.id && !chore.completed
  ).slice(0, 2);
  
  const pendingExpenses = expenses.filter((expense: Expense) => 
    !expense.settled && expense.paid_by !== user?.id
  ).slice(0, 2);
  
  const pendingGuests = guests.filter((guest: Guest) => 
    guest.status === 'pending' && guest.requested_by !== user?.id
  ).slice(0, 2);
  
  const unreadNotifications = notifications.filter((notification: Notification) => 
    !notification.read
  ).slice(0, 3);
  
  const navigateToNotifications = () => {
    router.push('/notifications');
  };
  
  const navigateToDocuments = () => {
    router.push('/(tabs)/documents');
  };
  
  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header with user info */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Avatar 
              source={user?.photoURL} 
              name={user?.displayName || user?.email} 
              size="large" 
            />
            <View style={styles.userTextContainer}>
              <Text style={styles.welcomeText}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.displayName || user?.email}</Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={navigateToNotifications}
            >
              <Bell size={24} color={colors.text} />
              {unreadNotifications.length > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {unreadNotifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setSidebarVisible(true)}
            >
              <Menu size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Apartment Info */}
        <Card style={styles.apartmentCard} variant="elevated">
          <View style={styles.apartmentHeader}>
            <View style={styles.apartmentIconContainer}>
              <Home size={32} color={colors.primary} />
            </View>
            <View style={styles.apartmentInfo}>
              <Text style={styles.apartmentName}>{apartmentName || "My Apartment"}</Text>
              <Text style={styles.apartmentCode}>Code: {roomCode}</Text>
            </View>
          </View>
        </Card>
        
        {/* Notifications */}
        {unreadNotifications.length > 0 && (
          <Card style={styles.section} variant="elevated">
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Notifications</Text>
              <TouchableOpacity 
                style={styles.seeAllButton}
                onPress={navigateToNotifications}
              >
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            {unreadNotifications.map((notification: Notification) => (
              <View key={notification.id} style={styles.notificationItem}>
                <View style={styles.notificationIcon}>
                  <AlertCircle size={20} color={
                    notification.type === 'warning' ? colors.warning :
                    notification.type === 'success' ? colors.success :
                    notification.type === 'error' ? colors.error :
                    colors.info
                  } />
                </View>
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
        
        {/* Quick Actions - Only 4 main actions */}
        <Card style={styles.section} variant="elevated">
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(93, 95, 239, 0.1)' }]}>
                <CheckSquare size={56} color={colors.primary} />
              </View>
              <Text style={styles.quickActionText}>Tasks</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/guests')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 177, 122, 0.1)' }]}>
                <Users size={56} color={colors.secondary} />
              </View>
              <Text style={styles.quickActionText}>Guests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={navigateToDocuments}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }]}>
                <FileText size={56} color={colors.info} />
              </View>
              <Text style={styles.quickActionText}>Documents</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickAction}
              onPress={() => router.push('/(tabs)/apartment-settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }]}>
                <Home size={56} color={colors.success} />
              </View>
              <Text style={styles.quickActionText}>Apartment</Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Data sections - show empty state if no data */}
        <Card style={styles.section} variant="elevated">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <CheckSquare size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>My Tasks</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/tasks')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {choresLoading ? 'Loading tasks...' : 'No pending tasks'}
            </Text>
          </View>
        </Card>
        
        <Card style={styles.section} variant="elevated">
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Users size={20} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Guest Requests</Text>
            </View>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/guests')}
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {guestsLoading ? 'Loading guests...' : 'No pending guest requests'}
            </Text>
          </View>
        </Card>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>J.A.B.V Labs</Text>
        </View>
      </ScrollView>
      
      <Sidebar 
        visible={sidebarVisible} 
        onClose={() => setSidebarVisible(false)} 
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  apartmentCard: {
    marginBottom: 24,
    padding: 16,
  },
  apartmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  apartmentIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  apartmentCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  seeAllButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyState: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  notificationIcon: {
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  quickAction: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  quickActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});