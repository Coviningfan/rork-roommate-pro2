import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl
} from 'react-native';
import { colors } from '@/constants/colors';
import { CheckSquare } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { useChores } from '@/hooks/useSupabaseData';
import type { Chore } from '@/types/supabase';

export default function TasksScreen() {
  const { data: chores, isLoading, refetch } = useChores();

  const renderTaskItem = ({ item }: { item: Chore }) => (
    <View style={styles.taskItem}>
      <Text style={styles.taskTitle}>{item.title}</Text>
      <Text style={styles.taskDescription}>{item.description}</Text>
      <Text style={styles.taskDueDate}>Due: {new Date(item.due_date).toLocaleDateString()}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {chores.length > 0 ? (
        <FlatList
          data={chores}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
        />
      ) : (
        <EmptyState
          title={isLoading ? "Loading Tasks..." : "No Tasks"}
          description={isLoading ? "Please wait while we load your tasks" : "No tasks found. Create your first task to get started."}
          icon={<CheckSquare size={48} color={colors.textSecondary} />}
        />
      )}
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by J.A.B.V Labs</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  taskDueDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footer: {
    alignItems: 'center',
    padding: 16,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});