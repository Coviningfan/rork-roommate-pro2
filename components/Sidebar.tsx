import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal,
  ScrollView,
  Animated
} from 'react-native';
import { 
  X, 
  CreditCard, 
  Bell, 
  HelpCircle, 
  Settings,
  LogOut,
  User,
  Shield,
  Plus,
  UserPlus
} from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { router } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ visible, onClose }) => {
  const { user, logout } = useAuthStore();
  
  const handleLogout = () => {
    onClose();
    logout();
    router.replace('/(auth)');
  };
  
  const menuItems = [
    {
      title: 'Expenses',
      icon: <CreditCard size={24} color={colors.success} />,
      onPress: () => {
        onClose();
        router.push('/(tabs)/expenses');
      }
    },
    {
      title: 'Notifications',
      icon: <Bell size={24} color={colors.info} />,
      onPress: () => {
        onClose();
        router.push('/notifications');
      }
    },
    {
      title: 'Create New Apartment',
      icon: <Plus size={24} color={colors.primary} />,
      onPress: () => {
        onClose();
        router.push('/apartment-config?action=create');
      }
    },
    {
      title: 'Join Another Apartment',
      icon: <UserPlus size={24} color={colors.secondary} />,
      onPress: () => {
        onClose();
        router.push('/apartment-config?action=join');
      }
    },
    {
      title: 'Profile Settings',
      icon: <User size={24} color={colors.primary} />,
      onPress: () => {
        onClose();
        // TODO: Add profile settings
      }
    },
    {
      title: 'Privacy Policy',
      icon: <Shield size={24} color={colors.primary} />,
      onPress: () => {
        onClose();
        // TODO: Add privacy policy
      }
    },
    {
      title: 'Help & Support',
      icon: <HelpCircle size={24} color={colors.primary} />,
      onPress: () => {
        onClose();
        // TODO: Add help & support
      }
    }
  ];
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          onPress={onClose}
          activeOpacity={1}
        />
        
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
                <Text style={styles.userEmail}>{user?.email}</Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.content}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIcon}>{item.icon}</View>
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
            
            <View style={styles.separator} />
            
            <TouchableOpacity
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={styles.menuIcon}>
                <LogOut size={24} color={colors.error} />
              </View>
              <Text style={[styles.menuText, styles.logoutText]}>Log Out</Text>
            </TouchableOpacity>
          </ScrollView>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>J.A.B.V Labs</Text>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sidebar: {
    width: 280,
    backgroundColor: colors.background,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    alignItems: 'center',
  },
  menuText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 8,
    marginHorizontal: 20,
  },
  logoutItem: {
    marginTop: 8,
  },
  logoutText: {
    color: colors.error,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 4,
  },
  versionText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});