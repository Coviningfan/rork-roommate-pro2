import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Alert
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
import { CheckSquare, Plus, Calendar, User, Clock, Check, X } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useChores } from '@/hooks/useSupabaseData';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import type { Chore } from '@/types/supabase';

export default function TasksScreen() {
  const { data: chores, isLoading, refetch } = useChores();
  const { user, apartmentId } = useAuthStore();
  const { width } = useWindowDimensions();
  const { impact, notification, selection } = useHaptics();
  
  const isTablet = width > 768;
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleAddTask = async () => {
    if (!title.trim() || !user || !apartmentId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      impact.medium();

      const { error } = await supabase
        .from('chores')
        .insert([
          {
            title: title.trim(),
            description: description.trim(),
            apartment_id: apartmentId,
            assigned_to: user.id,
            due_date: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
            completed: false,
          }
        ]);

      if (error) throw error;

      notification.success();
      Alert.alert('Success', 'Task added successfully');
      setAddModalVisible(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      refetch();
    } catch (error: any) {
      console.error('Add task error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to add task');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      impact.heavy();
      notification.success();
      
      const { error } = await supabase
        .from('chores')
        .update({ completed: true })
        .eq('id', taskId);

      if (error) throw error;

      Alert.alert('Great job!', 'Task completed successfully');
      refetch();
    } catch (error: any) {
      console.error('Complete task error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to complete task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      impact.heavy();
      notification.error();
      
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      Alert.alert('Success', 'Task deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Delete task error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to delete task');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && !chores.find(c => c.due_date === dueDate)?.completed;
  };

  const renderTaskItem = ({ item }: { item: Chore }) => (
    <SwipeableRow
      onDelete={() => handleDeleteTask(item.id)}
      deleteText="Delete"
    >
      <Card style={[styles.taskCard, isTablet && styles.tabletTaskCard]} variant="outlined">
        <View style={styles.taskHeader}>
          <TouchableOpacity
            style={[
              styles.checkboxContainer,
              item.completed && styles.completedCheckbox
            ]}
            onPress={() => !item.completed && handleCompleteTask(item.id)}
          >
            {item.completed ? (
              <Check size={16} color="#FFFFFF" />
            ) : (
              <View style={styles.checkbox} />
            )}
          </TouchableOpacity>
          
          <View style={styles.taskInfo}>
            <Text style={[
              styles.taskTitle,
              isTablet && styles.tabletTaskTitle,
              item.completed && styles.completedTaskTitle
            ]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[
                styles.taskDescription,
                isTablet && styles.tabletTaskDescription,
                item.completed && styles.completedTaskDescription
              ]}>
                {item.description}
              </Text>
            )}
            <View style={styles.taskMeta}>
              <View style={styles.metaItem}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={[
                  styles.metaText,
                  isOverdue(item.due_date) && styles.overdueText
                ]}>
                  Due: {formatDate(item.due_date)}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <User size={12} color={colors.textSecondary} />
                <Text style={styles.metaText}>
                  {item.assigned_to === user?.id ? 'You' : 'Other user'}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.taskActions}>
            <Badge 
              label={
                item.completed 
                  ? "Completed" 
                  : isOverdue(item.due_date) 
                    ? "Overdue" 
                    : "Pending"
              } 
              variant={
                item.completed 
                  ? "success" 
                  : isOverdue(item.due_date) 
                    ? "error" 
                    : "warning"
              } 
              size="small" 
            />
          </View>
        </View>
      </Card>
    </SwipeableRow>
  );

  const pendingTasks = chores.filter(task => !task.completed);
  const completedTasks = chores.filter(task => task.completed);
  const overdueTasks = chores.filter(task => !task.completed && isOverdue(task.due_date));

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Tasks"
        action={{
          title: "Add",
          onPress: () => {
            selection();
            setAddModalVisible(true);
          },
        }}
      />

      {/* Summary Cards */}
      <View style={[styles.summaryContainer, isTablet && styles.tabletSummaryContainer]}>
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={[styles.summaryLabel, isTablet && styles.tabletSummaryLabel]}>
            Pending
          </Text>
          <Text style={[styles.summaryValue, { color: colors.warning }, isTablet && styles.tabletSummaryValue]}>
            {pendingTasks.length}
          </Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={[styles.summaryLabel, isTablet && styles.tabletSummaryLabel]}>
            Overdue
          </Text>
          <Text style={[styles.summaryValue, { color: colors.error }, isTablet && styles.tabletSummaryValue]}>
            {overdueTasks.length}
          </Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={[styles.summaryLabel, isTablet && styles.tabletSummaryLabel]}>
            Completed
          </Text>
          <Text style={[styles.summaryValue, { color: colors.success }, isTablet && styles.tabletSummaryValue]}>
            {completedTasks.length}
          </Text>
        </Card>
      </View>

      {chores.length > 0 ? (
        <FlatList
          data={chores}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={[styles.tasksList, isTablet && styles.tabletTasksList]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
        />
      ) : (
        <EmptyState
          title={isLoading ? "Loading Tasks..." : "No Tasks"}
          description={isLoading ? "Please wait while we load your tasks" : "Create your first task to get started and stay organized."}
          icon={<CheckSquare size={48} color={colors.textSecondary} />}
          buttonTitle="Add Task"
          onButtonPress={() => setAddModalVisible(true)}
        />
      )}

      {/* Add Task Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, isTablet && styles.tabletModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isTablet && styles.tabletModalTitle]}>
                Add Task
              </Text>
              <TouchableOpacity 
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Task Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter task title"
            />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              multiline
              numberOfLines={3}
            />

            <Input
              label="Due Date (Optional)"
              value={dueDate}
              onChangeText={setDueDate}
              placeholder="YYYY-MM-DD"
            />

            <Button
              title="Add Task"
              onPress={handleAddTask}
              loading={loading}
              fullWidth
              style={styles.addTaskButton}
              haptic="medium"
            />
          </View>
        </View>
      </Modal>
      
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
  summaryContainer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
  },
  tabletSummaryContainer: {
    paddingHorizontal: spacing.xxl,
    gap: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  tabletSummaryLabel: {
    ...typography.small,
  },
  summaryValue: {
    ...typography.heading3,
    color: colors.text,
    textAlign: 'center',
  },
  tabletSummaryValue: {
    ...typography.heading2,
  },
  tasksList: {
    padding: spacing.lg,
  },
  tabletTasksList: {
    paddingHorizontal: spacing.xxl,
  },
  taskCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tabletTaskCard: {
    padding: spacing.xl,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: borderRadius.sm,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
    marginTop: spacing.xs,
  },
  completedCheckbox: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderRadius: borderRadius.xs,
    backgroundColor: 'transparent',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabletTaskTitle: {
    ...typography.bodySemiBold,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: colors.textSecondary,
  },
  taskDescription: {
    ...typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  tabletTaskDescription: {
    ...typography.body,
    lineHeight: 24,
  },
  completedTaskDescription: {
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    gap: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  overdueText: {
    color: colors.error,
    fontWeight: '600',
  },
  taskActions: {
    alignItems: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: colors.background,
    borderRadius: borderRadius.xl,
    padding: spacing.xxl,
    ...shadows.large,
  },
  tabletModalContent: {
    maxWidth: 600,
    padding: spacing.xxxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.heading3,
    color: colors.text,
  },
  tabletModalTitle: {
    ...typography.heading2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  addTaskButton: {
    marginTop: spacing.lg,
  },
  footer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  footerText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: 1,
  },
});