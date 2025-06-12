import React, { useState, useCallback, useMemo, memo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItem } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { SwipeableRow } from '@/components/SwipeableRow';
import { CheckCircle, Circle, Plus, Calendar } from 'lucide-react-native';
import { useHaptics } from '@/hooks/useHaptics';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  assignedTo?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Clean the kitchen',
    description: 'Deep clean counters, sink, and appliances',
    completed: false,
    assignedTo: 'John',
    dueDate: '2024-01-20',
    priority: 'high'
  },
  {
    id: '2',
    title: 'Take out trash',
    completed: true,
    assignedTo: 'Jane',
    dueDate: '2024-01-18',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Vacuum living room',
    completed: false,
    assignedTo: 'Mike',
    dueDate: '2024-01-22',
    priority: 'low'
  }
];

// Memoized Task Item Component
const TaskItem = memo(({ 
  task, 
  onToggle, 
  onDelete 
}: { 
  task: Task; 
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const handleToggle = useCallback(() => {
    onToggle(task.id);
  }, [task.id, onToggle]);

  const handleDelete = useCallback(() => {
    onDelete(task.id);
  }, [task.id, onDelete]);

  const priorityColor = useMemo(() => {
    switch (task.priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return Colors.light.icon;
    }
  }, [task.priority]);

  return (
    <SwipeableRow onDelete={handleDelete}>
      <Card style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <TouchableOpacity
            onPress={handleToggle}
            style={styles.checkboxContainer}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {task.completed ? (
              <CheckCircle size={24} color={Colors.light.tint} />
            ) : (
              <Circle size={24} color={Colors.light.icon} />
            )}
          </TouchableOpacity>
          
          <View style={styles.taskContent}>
            <Text style={[
              styles.taskTitle,
              task.completed && styles.completedTask
            ]}>
              {task.title}
            </Text>
            {task.description && (
              <Text style={styles.taskDescription}>
                {task.description}
              </Text>
            )}
            
            <View style={styles.taskMeta}>
              {task.assignedTo && (
                <Text style={styles.assignedTo}>
                  Assigned to {task.assignedTo}
                </Text>
              )}
              {task.dueDate && (
                <View style={styles.dueDateContainer}>
                  <Calendar size={12} color={Colors.light.icon} />
                  <Text style={styles.dueDate}>{task.dueDate}</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={[
            styles.priorityIndicator,
            { backgroundColor: priorityColor }
          ]} />
        </View>
      </Card>
    </SwipeableRow>
  );
});

TaskItem.displayName = 'TaskItem';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { triggerHaptic } = useHaptics();

  const handleToggleTask = useCallback((taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
    triggerHaptic('success');
  }, [triggerHaptic]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    triggerHaptic('error');
  }, [triggerHaptic]);

  const handleAddTask = useCallback(() => {
    triggerHaptic('selection');
    // Handle add task logic
  }, [triggerHaptic]);

  const { pendingTasks, completedTasks } = useMemo(() => {
    const pending = tasks.filter(task => !task.completed);
    const completed = tasks.filter(task => task.completed);
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  const renderTask: ListRenderItem<Task> = useCallback(({ item }) => (
    <TaskItem
      task={item}
      onToggle={handleToggleTask}
      onDelete={handleDeleteTask}
    />
  ), [handleToggleTask, handleDeleteTask]);

  const keyExtractor = useCallback((item: Task) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 120, // Approximate item height
    offset: 120 * index,
    index,
  }), []);

  const ListEmptyComponent = useMemo(() => (
    <EmptyState
      icon={Calendar}
      title="No Tasks"
      description="Add your first task to get started"
      actionTitle="Add Task"
      onAction={handleAddTask}
    />
  ), [handleAddTask]);

  const HeaderRight = useMemo(() => (
    <TouchableOpacity 
      onPress={handleAddTask}
      style={styles.headerButton}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Plus size={24} color={Colors.light.tint} />
    </TouchableOpacity>
  ), [handleAddTask]);

  const renderSection = useCallback((title: string, data: Task[], count: number) => {
    if (data.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {title} ({count})
        </Text>
        <FlatList
          data={data}
          renderItem={renderTask}
          keyExtractor={keyExtractor}
          getItemLayout={getItemLayout}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          windowSize={5}
          initialNumToRender={3}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </View>
    );
  }, [renderTask, keyExtractor, getItemLayout]);

  if (tasks.length === 0) {
    return (
      <View style={styles.container}>
        <Stack.Screen 
          options={{ 
            title: 'Tasks',
            headerRight: () => HeaderRight
          }} 
        />
        <View style={styles.emptyContainer}>
          {ListEmptyComponent}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Tasks',
          headerRight: () => HeaderRight
        }} 
      />
      
      <FlatList
        data={[
          { type: 'section', title: 'Pending', data: pendingTasks, count: pendingTasks.length },
          { type: 'section', title: 'Completed', data: completedTasks, count: completedTasks.length }
        ]}
        renderItem={({ item }) => renderSection(item.title, item.data, item.count)}
        keyExtractor={(item) => item.title}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  scrollContent: {
    padding: spacing.md,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  separator: {
    height: spacing.sm,
  },
  taskCard: {
    padding: spacing.md,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxContainer: {
    marginRight: spacing.sm,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: Colors.light.icon,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: spacing.sm,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  assignedTo: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  priorityIndicator: {
    width: 4,
    height: 24,
    borderRadius: 2,
    marginLeft: spacing.sm,
  },
  headerButton: {
    padding: spacing.xs,
  },
});