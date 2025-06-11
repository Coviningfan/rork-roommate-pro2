import React, { useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  RefreshControl,
  TouchableOpacity,
  Text
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { NotificationItem } from '@/components/NotificationItem';
import { EmptyState } from '@/components/EmptyState';
import { useNotifications } from '@/hooks/useSupabaseData';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function NotificationsScreen() {
  const { data: notifications, isLoading, refetch } = useNotifications();
  const { user } = useAuthStore();
  
  const handleRefresh = () => {
    refetch();
  };
  
  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;
      refetch();
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
    }
  };
  
  const handleNotificationPress = (id: string) => {
    markAsRead(id);
  };
  
  const handleMarkAllAsRead = () => {
    if (notifications.some(n => !n.read)) {
      markAllAsRead();
    }
  };
  
  // Sort notifications by date (newest first)
  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  return (
    <View style={styles.container}>
      {notifications.length > 0 && (
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={handleMarkAllAsRead}
            disabled={!notifications.some(n => !n.read)}
          >
            <Text 
              style={[
                styles.markAllText,
                !notifications.some(n => !n.read) && styles.disabledText
              ]}
            >
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      <FlatList
        data={sortedNotifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={() => handleNotificationPress(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              title="No Notifications"
              description="You don't have any notifications yet."
              icon={<Bell size={48} color={colors.textSecondary} />}
            />
          ) : null
        }
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContainer : styles.listContent
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: {
    color: colors.primary,
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});