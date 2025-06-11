import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert
} from 'react-native';
import { colors } from '@/constants/Colors';
import { CreditCard, Plus, DollarSign, Calendar, User, X } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { useExpenses } from '@/hooks/useSupabaseData';
import { useAuthStore } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase';
import type { Expense } from '@/types/supabase';

export default function ExpensesScreen() {
  const { data: expenses, isLoading, refetch } = useExpenses();
  const { user, apartmentId } = useAuthStore();
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleAddExpense = async () => {
    if (!title.trim() || !amount.trim() || !user || !apartmentId) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('expenses')
        .insert([
          {
            title: title.trim(),
            amount: parsedAmount,
            category: category.trim() || 'General',
            description: description.trim(),
            apartment_id: apartmentId,
            paid_by: user.id,
            date: new Date().toISOString(),
            settled: false,
          }
        ]);

      if (error) throw error;

      Alert.alert('Success', 'Expense added successfully');
      setAddModalVisible(false);
      setTitle('');
      setAmount('');
      setCategory('');
      setDescription('');
      refetch();
    } catch (error: any) {
      console.error('Add expense error:', error);
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <Card style={styles.expenseCard} variant="outlined">
      <View style={styles.expenseHeader}>
        <View style={styles.expenseIconContainer}>
          <DollarSign size={20} color={colors.success} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
        </View>
        <Badge 
          label={item.settled ? "Settled" : "Pending"} 
          variant={item.settled ? "success" : "warning"} 
          size="small" 
        />
      </View>
      
      <View style={styles.expenseMeta}>
        <View style={styles.metaItem}>
          <Calendar size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.metaItem}>
          <Text style={styles.metaText}>Category: {item.category}</Text>
        </View>
        <View style={styles.metaItem}>
          <User size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            {item.paid_by === user?.id ? 'You' : 'Other user'}
          </Text>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.expenseDescription}>{item.description}</Text>
      )}
    </Card>
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const pendingExpenses = expenses.filter(expense => !expense.settled);
  const myExpenses = expenses.filter(expense => expense.paid_by === user?.id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Expenses</Text>
        <Button
          title="Add"
          onPress={() => setAddModalVisible(true)}
          variant="primary"
          size="small"
          style={styles.addButton}
        />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={styles.summaryLabel}>Total Expenses</Text>
          <Text style={styles.summaryValue}>${totalExpenses.toFixed(2)}</Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {pendingExpenses.length}
          </Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={styles.summaryLabel}>My Expenses</Text>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>
            ${myExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2)}
          </Text>
        </Card>
      </View>

      {expenses.length > 0 ? (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpenseItem}
          contentContainerStyle={styles.expensesList}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <EmptyState
          title={isLoading ? "Loading Expenses..." : "No Expenses"}
          description={isLoading ? "Please wait while we load your expenses" : "Add your first expense to get started."}
          icon={<CreditCard size={48} color={colors.textSecondary} />}
          buttonTitle="Add Expense"
          onButtonPress={() => setAddModalVisible(true)}
        />
      )}

      {/* Add Expense Modal */}
      <Modal
        visible={addModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity 
                onPress={() => setAddModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Input
              label="Title"
              value={title}
              onChangeText={setTitle}
              placeholder="Enter expense title"
            />

            <Input
              label="Amount"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="numeric"
            />

            <Input
              label="Category"
              value={category}
              onChangeText={setCategory}
              placeholder="e.g., Groceries, Utilities, etc."
            />

            <Input
              label="Description (Optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Additional details..."
              multiline
              numberOfLines={3}
            />

            <Button
              title="Add Expense"
              onPress={handleAddExpense}
              loading={loading}
              fullWidth
              style={styles.addExpenseButton}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    minWidth: 60,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  expensesList: {
    padding: 16,
  },
  expenseCard: {
    marginBottom: 12,
    padding: 16,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  expenseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  expenseMeta: {
    gap: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  expenseDescription: {
    fontSize: 14,
    color: colors.text,
    marginTop: 8,
    fontStyle: 'italic',
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
    borderRadius: 16,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  addExpenseButton: {
    marginTop: 16,
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