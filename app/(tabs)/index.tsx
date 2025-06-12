import React, { memo, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { Avatar } from '@/components/Avatar';
import { Card } from '@/components/Card';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { useAuthStore } from '@/hooks/useAuthStore';
import { Bell, Calendar, FileText, DollarSign } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface QuickAction {
  id: string;
  title: string;
  icon: any;
  color: string;
  count?: number;
}

const quickActions: QuickAction[] = [
  {
    id: 'documents',
    title: 'Documents',
    icon: FileText,
    color: '#5D5FEF',
    count: 3
  },
  {
    id: 'expenses',
    title: 'Expenses',
    icon: DollarSign,
    color: '#FFB17A',
    count: 5
  },
  {
    id: 'tasks',
    title: 'Tasks',
    icon: Calendar,
    color: '#4CAF50',
    count: 2
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    color: '#F44336',
    count: 1
  }
];

// Memoized Quick Action Component
const QuickActionCard = memo(({ action, onPress }: { action: QuickAction; onPress: (id: string) => void }) => {
  const handlePress = useCallback(() => {
    onPress(action.id);
  }, [action.id, onPress]);

  return (
    <Pressable onPress={handlePress}>
      <Card style={styles.quickActionCard}>
        <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
          <action.icon size={24} color={action.color} />
        </View>
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        {action.count && action.count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: action.color }]}>
            <Text style={styles.countText}>{action.count}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
});

QuickActionCard.displayName = 'QuickActionCard';

// Memoized Activity Item Component
const ActivityItem = memo(({ icon: Icon, title, time, color }: {
  icon: any;
  title: string;
  time: string;
  color: string;
}) => (
  <View style={styles.activityItem}>
    <View style={styles.activityIcon}>
      <Icon size={20} color={color} />
    </View>
    <View style={styles.activityContent}>
      <Text style={styles.activityTitle}>{title}</Text>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
  </View>
));

ActivityItem.displayName = 'ActivityItem';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuthStore();
  const { triggerHaptic } = useHaptics();

  const isTablet = useMemo(() => width >= 768, [width]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const userName = useMemo(() => {
    return user?.displayName || user?.email || 'Welcome back';
  }, [user?.displayName, user?.email]);

  const handleQuickActionPress = useCallback((actionId: string) => {
    triggerHaptic('selection');
    // Handle navigation based on actionId
    console.log('Quick action pressed:', actionId);
  }, [triggerHaptic]);

  const avatarSize = useMemo(() => isTablet ? "large" : "medium", [isTablet]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Home',
          headerShown: false
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.userName}>{userName}</Text>
          </View>
          <Avatar 
            source={user?.photoURL} 
            name={userName} 
            size={avatarSize} 
          />
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={[
            styles.quickActionsGrid,
            isTablet && styles.quickActionsGridTablet
          ]}>
            {quickActions.map((action) => (
              <QuickActionCard 
                key={action.id} 
                action={action} 
                onPress={handleQuickActionPress}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <Card style={styles.activityCard}>
            <ActivityItem
              icon={FileText}
              title="Lease Agreement signed"
              time="2 hours ago"
              color={Colors.light.tint}
            />
            <ActivityItem
              icon={DollarSign}
              title="Utility bill added"
              time="1 day ago"
              color="#FFB17A"
            />
            <ActivityItem
              icon={Calendar}
              title="Cleaning task completed"
              time="2 days ago"
              color="#4CAF50"
            />
          </Card>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    paddingTop: spacing.md,
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionsGridTablet: {
    gap: spacing.md,
  },
  quickActionCard: {
    width: '48%',
    padding: spacing.md,
    alignItems: 'center',
    position: 'relative',
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    textAlign: 'center',
  },
  countBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  activityCard: {
    padding: spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.background,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: Colors.light.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: Colors.light.icon,
  },
});