import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
  useWindowDimensions
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
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
import { Card } from '@/components/Card';
import { Avatar } from '@/components/Avatar';
import { Sidebar } from '@/components/Sidebar';
import { SectionHeader } from '@/components/SectionHeader';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useHaptics } from '@/hooks/useHaptics';
import { useChores, useExpenses, useGuests, useNotifications } from '@/hooks/useSupabaseData';
import type { Chore, Expense, Guest, Notification } from '@/types/supabase';

export default function DashboardScreen() {
  const { user, apartmentId, roomCode, apartmentName } = useAuthStore();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const { width } = useWindowDimensions();
  const { impact, selection } = useHaptics();
  
  const isTablet = width > 768;
  
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
    impact.light();
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
    selection();
    router.push('/notifications');
  };
  
  const navigateToDocuments = () => {
    selection();
    router.push('/(tabs)/documents');
  };
  
  const handleQuickActionPress = (route: string) => {
    impact.medium();
    router.push(route as any);
  };
  
  return (
    <>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, isTablet && styles.tabletContentContainer]}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
      >
        {/* Header with user info */}
        <View style={[styles.header, isTablet && styles.tabletHeader]}>
          <View style={styles.userInfo}>
            <Avatar 
              source={user?.photoURL} 
              name={user?.displayName || user?.email} 
              size={isTablet ? "xlarge" : "large"} 
            />
            <View style={styles.userTextContainer}>
              <Text style={[styles.welcomeText, isTablet && styles.tabletWelcomeText]}>
                Welcome back,
              </Text>
              <Text style={[styles.userName, isTablet && styles.tabletUserName]}>
                {user?.displayName || user?.email}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.notificationButton, isTablet && styles.tabletNotificationButton]}
              onPress={navigateToNotifications}
            >
              <Bell size={isTablet ? 28 : 24} color={colors.text} />
              {unreadNotifications.length > 0 && (
                <View style={[styles.notificationBadge, isTablet && styles.tabletNotificationBadge]}>
                  <Text style={[styles.notificationBadgeText, isTablet && styles.tabletNotificationBadgeText]}>
                    {unreadNotifications.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuButton, isTablet && styles.tabletMenuButton]}
              onPress={() => {
                selection();
                setSidebarVisible(true);
              }}
            >
              <Menu size={isTablet ? 28 : 24} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Apartment Info */}
        <Card style={[styles.apartmentCard, isTablet && styles.tabletApartmentCard]} variant="elevated">
          <View style={styles.apartmentHeader}>
            <View style={[styles.apartmentIconContainer, isTablet && styles.tabletApartmentIconContainer]}>
              <Home size={isTablet ? 40 : 32} color={colors.primary} />
            </View>
            <View style={styles.apartmentInfo}>
              <Text style={[styles.apartmentName, isTablet && styles.tabletApartmentName]}>
                {apartmentName || "My Apartment"}
              </Text>
              <Text style={[styles.apartmentCode, isTablet && styles.tabletApartmentCode]}>
                Code: {roomCode}
              </Text>
            </View>
          </View>
        </Card>
        
        {/* Notifications */}
        {unreadNotifications.length > 0 && (
          <Card style={[styles.section, isTablet && styles.tabletSection]} variant="elevated">
            <SectionHeader
              title="Recent Notifications"
              action={{
                title: "See All",
                onPress: navigateToNotifications,
              }}
            />
            
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
                  <Text style={[styles.notificationTitle, isTablet && styles.tabletNotificationTitle]}>
                    {notification.title}
                  </Text>
                  <Text style={[styles.notificationMessage, isTablet && styles.tabletNotificationMessage]} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </View>
              </View>
            ))}
          </Card>
        )}
        
        {/* Quick Actions */}
        <Card style={[styles.section, isTablet && styles.tabletSection]} variant="elevated">
          <SectionHeader title="Quick Actions" />
          
          <View style={[styles.quickActions, isTablet && styles.tabletQuickActions]}>
            <TouchableOpacity 
              style={[styles.quickAction, isTablet && styles.tabletQuickAction]}
              onPress={() => handleQuickActionPress('/(tabs)/tasks')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(93, 95, 239, 0.1)' }, isTablet && styles.tabletQuickActionIcon]}>
                <CheckSquare size={isTablet ? 64 : 56} color={colors.primary} />
              </View>
              <Text style={[styles.quickActionText, isTablet && styles.tabletQuickActionText]}>
                Tasks
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isTablet && styles.tabletQuickAction]}
              onPress={() => handleQuickActionPress('/(tabs)/guests')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(255, 177, 122, 0.1)' }, isTablet && styles.tabletQuickActionIcon]}>
                <Users size={isTablet ? 64 : 56} color={colors.secondary} />
              </View>
              <Text style={[styles.quickActionText, isTablet && styles.tabletQuickActionText]}>
                Guests
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isTablet && styles.tabletQuickAction]}
              onPress={() => handleQuickActionPress('/(tabs)/documents')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(33, 150, 243, 0.1)' }, isTablet && styles.tabletQuickActionIcon]}>
                <FileText size={isTablet ? 64 : 56} color={colors.info} />
              </View>
              <Text style={[styles.quickActionText, isTablet && styles.tabletQuickActionText]}>
                Documents
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.quickAction, isTablet && styles.tabletQuickAction]}
              onPress={() => handleQuickActionPress('/(tabs)/apartment-settings')}
            >
              <View style={[styles.quickActionIcon, { backgroundColor: 'rgba(76, 175, 80, 0.1)' }, isTablet && styles.tabletQuickActionIcon]}>
                <Home size={isTablet ? 64 : 56} color={colors.success} />
              </View>
              <Text style={[styles.quickActionText, isTablet && styles.tabletQuickActionText]}>
                Apartment
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
        
        {/* Data sections */}
        <Card style={[styles.section, isTablet && styles.tabletSection]} variant="elevated">
          <SectionHeader
            title="My Tasks"
            icon={<CheckSquare size={20} color={colors.primary} />}
            action={{
              title: "See All",
              onPress: () => handleQuickActionPress('/(tabs)/tasks'),
            }}
          />
          
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, isTablet && styles.tabletEmptyStateText]}>
              {choresLoading ? 'Loading tasks...' : 'No pending tasks'}
            </Text>
          </View>
        </Card>
        
        <Card style={[styles.section, isTablet && styles.tabletSection]} variant="elevated">
          <SectionHeader
            title="Guest Requests"
            icon={<Users size={20} color={colors.secondary} />}
            action={{
              title: "See All",
              onPress: () => handleQuickActionPress('/(tabs)/guests'),
            }}
          />
          
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, isTablet && styles.tabletEmptyStateText]}>
              {guestsLoading ? 'Loading guests...' : 'No pending guest requests'}
            </Text>
          </View>
        </Card>
        
        <View style={styles.footer}>
          <Text style={[styles.footerText, isTablet && styles.tabletFooterText]}>
            J.A.B.V Labs
          </Text>
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
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  tabletContentContainer: {
    padding: spacing.xxl,
    paddingBottom: spacing.xxxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  tabletHeader: {
    marginBottom: spacing.xxxl,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userTextContainer: {
    marginLeft: spacing.lg,
    flex: 1,
  },
  welcomeText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tabletWelcomeText: {
    ...typography.body,
  },
  userName: {
    ...typography.heading3,
    color: colors.text,
  },
  tabletUserName: {
    ...typography.heading2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  tabletNotificationButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  tabletMenuButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  tabletNotificationBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    top: 10,
    right: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    ...typography.caption,
    fontWeight: 'bold',
  },
  tabletNotificationBadgeText: {
    fontSize: 11,
  },
  apartmentCard: {
    marginBottom: spacing.xxl,
    padding: spacing.lg,
  },
  tabletApartmentCard: {
    padding: spacing.xl,
    marginBottom: spacing.xxxl,
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
    marginRight: spacing.lg,
  },
  tabletApartmentIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginRight: spacing.xl,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentName: {
    ...typography.heading3,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabletApartmentName: {
    ...typography.heading2,
  },
  apartmentCode: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tabletApartmentCode: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.xxl,
  },
  tabletSection: {
    marginBottom: spacing.xxxl,
  },
  emptyState: {
    padding: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    ...typography.small,
    color: colors.textSecondary,
  },
  tabletEmptyStateText: {
    ...typography.body,
  },
  notificationItem: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  notificationIcon: {
    marginRight: spacing.md,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    ...typography.smallMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabletNotificationTitle: {
    ...typography.bodyMedium,
  },
  notificationMessage: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  tabletNotificationMessage: {
    ...typography.small,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: spacing.lg,
    gap: spacing.lg,
  },
  tabletQuickActions: {
    padding: spacing.xl,
    gap: spacing.xl,
  },
  quickAction: {
    width: '48%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  tabletQuickAction: {
    width: '22%',
    padding: spacing.xxxl,
    borderRadius: borderRadius.xxl,
  },
  quickActionIcon: {
    width: 112,
    height: 112,
    borderRadius: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tabletQuickActionIcon: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: spacing.xl,
  },
  quickActionText: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  tabletQuickActionText: {
    ...typography.bodySemiBold,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
  tabletFooterText: {
    ...typography.small,
  },
});