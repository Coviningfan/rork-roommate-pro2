import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { spacing, borderRadius } from '@/constants/design-system';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
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

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const { triggerHaptic } = useHaptics();

  const handleToggleTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
    triggerHaptic('success');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
    triggerHaptic('error');
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return Colors.light.icon;
    }
  };

  const renderTask = (task: Task) => (
    <SwipeableRow
      key={task.id}
      onDelete={() => handleDeleteTask(task.id)}
    >
      <Card style={styles.taskCard}>
        <View style={styles.taskHeader}>
          <TouchableOpacity
            onPress={() => handleToggleTask(task.id)}
            style={styles.checkboxContainer}
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
            { backgroundColor: getPriorityColor(task.priority) }
          ]} />
        </View>
      </Card>
    </SwipeableRow>
  );

  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Tasks',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => triggerHaptic('selection')}
              style={styles.headerButton}
            >
              <Plus size={24} color={Colors.light.tint} />
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Tasks"
            description="Add your first task to get started"
            actionTitle="Add Task"
            onAction={() => triggerHaptic('selection')}
          />
        ) : (
          <>
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Pending ({pendingTasks.length})
                </Text>
                <View style={styles.tasksContainer}>
                  {pendingTasks.map(renderTask)}
                </View>
              </View>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Completed ({completedTasks.length})
                </Text>
                <View style={styles.tasksContainer}>
                  {completedTasks.map(renderTask)}
                </View>
              </View>
            )}
          </>
        )}
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
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: spacing.md,
  },
  tasksContainer: {
    gap: spacing.sm,
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