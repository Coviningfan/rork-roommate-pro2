import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { 
  Bell, 
  AlertCircle, 
  CheckCircle, 
  Info 
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import type { Notification } from '@/types/supabase';

interface NotificationItemProps {
  notification: Notification;
  onPress?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'warning':
        return <AlertCircle size={24} color={colors.warning} />;
      case 'success':
        return <CheckCircle size={24} color={colors.success} />;
      case 'error':
        return <AlertCircle size={24} color={colors.error} />;
      case 'info':
      default:
        return <Info size={24} color={colors.info} />;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  return (
    <TouchableOpacity
      style={[
        styles.container,
        !notification.read && styles.unread,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>{getIcon()}</View>
      
      <View style={styles.content}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{formatDate(notification.created_at)}</Text>
      </View>
      
      {!notification.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: 'rgba(93, 95, 239, 0.05)',
  },
  iconContainer: {
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    alignSelf: 'center',
  },
});