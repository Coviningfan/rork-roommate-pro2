import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Alert,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '@/constants/colors';
import { 
  LogOut, 
  User, 
  Home, 
  Bell, 
  Shield, 
  HelpCircle,
  ChevronRight
} from 'lucide-react-native';
import { ListItem } from '@/components/ListItem';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/hooks/useAuthStore';

export default function SettingsScreen() {
  const { user, apartmentName, roomCode, logout } = useAuthStore();
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: () => {
            logout();
            router.replace('/(auth)');
          },
        },
      ]
    );
  };
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>
      
      <Card style={styles.userCard} variant="elevated">
        <View style={styles.userInfo}>
          <View style={styles.userIconContainer}>
            <User size={32} color={colors.primary} />
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.displayName || 'User'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        
        <View style={styles.departmentInfo}>
          <Text style={styles.departmentLabel}>Department</Text>
          <Text style={styles.departmentName}>{apartmentName || 'My Department'}</Text>
          <Text style={styles.departmentCode}>Code: {roomCode}</Text>
        </View>
      </Card>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <ListItem
          title="Profile Settings"
          leftIcon={<User size={20} color={colors.primary} />}
          showChevron
          onPress={() => Alert.alert('Profile', 'Profile settings coming soon')}
        />
        
        <ListItem
          title="Department Settings"
          leftIcon={<Home size={20} color={colors.primary} />}
          showChevron
          onPress={() => Alert.alert('Department', 'Department settings coming soon')}
        />
        
        <ListItem
          title="Notifications"
          leftIcon={<Bell size={20} color={colors.primary} />}
          showChevron
          onPress={() => Alert.alert('Notifications', 'Notification settings coming soon')}
        />
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        
        <ListItem
          title="Privacy Policy"
          leftIcon={<Shield size={20} color={colors.primary} />}
          showChevron
          onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
        />
        
        <ListItem
          title="Help & Support"
          leftIcon={<HelpCircle size={20} color={colors.primary} />}
          showChevron
          onPress={() => Alert.alert('Help', 'Help & support coming soon')}
        />
      </View>
      
      <View style={styles.logoutContainer}>
        <Button
          title="Log Out"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          fullWidth
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by J.A.B.V Labs</Text>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </ScrollView>
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
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  userCard: {
    margin: 16,
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  userIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(93, 95, 239, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  departmentInfo: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  departmentLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  departmentName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  departmentCode: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  logoutContainer: {
    padding: 16,
    marginBottom: 24,
  },
  logoutButton: {
    borderColor: colors.error,
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
    marginBottom: 4,
  },
  versionText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});