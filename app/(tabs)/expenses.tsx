import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  useWindowDimensions,
  ListRenderItem
} from 'react-native';
import { colors } from '@/constants/Colors';
import { spacing, typography, borderRadius, shadows } from '@/constants/design-system';
import { CreditCard, Plus, DollarSign, Calendar, User, X } from 'lucide-react-native';
import { EmptyState } from '@/components/EmptyState';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Badge } from '@/components/Badge';
import { SectionHeader } from '@/components/SectionHeader';
import { SwipeableRow } from '@/components/SwipeableRow';
import { useExpenses } from '@/hooks/useSupabaseData';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useHaptics } from '@/hooks/useHaptics';
import { supabase } from '@/lib/supabase';
import type { Expense } from '@/types/supabase';

export default function ExpensesScreen() {
  const { data: expenses, isLoading, refetch } = useExpenses();
  const { user, apartmentId } = useAuthStore();
  const { width } = useWindowDimensions();
  const { impact, notification, selection } = useHaptics();
  
  const isTablet = width > 768;
  
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleAddExpense = useCallback(async () => {
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
      impact.medium();

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

      notification.success();
      Alert.alert('Success', 'Expense added successfully');
      setAddModalVisible(false);
      setTitle('');
      setAmount('');
      setCategory('');
      setDescription('');
      refetch();
    } catch (error: any) {
      console.error('Add expense error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  }, [title, amount, category, description, user, apartmentId, impact, notification, refetch]);

  const handleDeleteExpense = useCallback(async (expenseId: string) => {
    try {
      impact.heavy();
      notification.error();
      
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;

      Alert.alert('Success', 'Expense deleted successfully');
      refetch();
    } catch (error: any) {
      console.error('Delete expense error:', error);
      notification.error();
      Alert.alert('Error', error.message || 'Failed to delete expense');
    }
  }, [impact, notification, refetch]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const renderExpenseItem: ListRenderItem<Expense> = useCallback(({ item }) => (
    <SwipeableRow
      onDelete={() => handleDeleteExpense(item.id)}
      deleteText="Delete"
    >
      <Card style={[styles.expenseCard, isTablet && styles.tabletExpenseCard]} variant="outlined">
        <View style={styles.expenseHeader}>
          <View style={styles.expenseIconContainer}>
            <DollarSign size={20} color={colors.success} />
          </View>
          <View style={styles.expenseInfo}>
            <Text style={[styles.expenseTitle, isTablet && styles.tabletExpenseTitle]}>
              {item.title}
            </Text>
            <Text style={[styles.expenseAmount, isTablet && styles.tabletExpenseAmount]}>
              ${item.amount.toFixed(2)}
            </Text>
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
          <Text style={[styles.expenseDescription, isTablet && styles.tabletExpenseDescription]}>
            {item.description}
          </Text>
        )}
      </Card>
    </SwipeableRow>
  ), [handleDeleteExpense, isTablet, formatDate, user?.id]);

  const summaryData = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const pendingExpenses = expenses.filter(expense => !expense.settled);
    const myExpenses = expenses.filter(expense => expense.paid_by === user?.id);
    const myTotal = myExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    return {
      totalExpenses,
      pendingCount: pendingExpenses.length,
      myTotal
    };
  }, [expenses, user?.id]);

  const keyExtractor = useCallback((item: Expense) => item.id, []);

  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 140,
    offset: 140 * index,
    index,
  }), []);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Expenses"
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
            Total Expenses
          </Text>
          <Text style={[styles.summaryValue, isTablet && styles.tabletSummaryValue]}>
            ${summaryData.totalExpenses.toFixed(2)}
          </Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={[styles.summaryLabel, isTablet && styles.tabletSummaryLabel]}>
            Pending
          </Text>
          <Text style={[styles.summaryValue, { color: colors.warning }, isTablet && styles.tabletSummaryValue]}>
            {summaryData.pendingCount}
          </Text>
        </Card>
        
        <Card style={styles.summaryCard} variant="elevated">
          <Text style={[styles.summaryLabel, isTablet && styles.tabletSummaryLabel]}>
            My Expenses
          </Text>
          <Text style={[styles.summaryValue, { color: colors.primary }, isTablet && styles.tabletSummaryValue]}>
            ${summaryData.myTotal.toFixed(2)}
          </Text>
        </Card>
      </View>

      {expenses.length > 0 ? (
        <FlatList
          data={expenses}
          keyExtractor={keyExtractor}
          renderItem={renderExpenseItem}
          getItemLayout={getItemLayout}
          contentContainerStyle={[styles.expensesList, isTablet && styles.tabletExpensesList]}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
          numColumns={isTablet ? 2 : 1}
          key={isTablet ? 'tablet' : 'phone'}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={5}
        />
      ) : (
        <EmptyState
          title={isLoading ? "Loading Expenses..." : "No Expenses"}
          description={isLoading ? "Please wait while we load your expenses" : "Add your first expense to get started and track shared costs."}
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
          <View style={[styles.modalContent, isTablet && styles.tabletModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isTablet && styles.tabletModalTitle]}>
                Add Expense
              </Text>
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
              haptic="medium"
            />
          </View>
        </View>
      </Modal>
      
      <View style={styles.footer}>
        <Text style={[styles.footerText, isTablet && styles.tabletFooterText]}>
          Powered by J.A.B.V Labs
        </Text>
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
  expensesList: {
    padding: spacing.lg,
  },
  tabletExpensesList: {
    paddingHorizontal: spacing.xxl,
  },
  expenseCard: {
    marginBottom: spacing.md,
    padding: spacing.lg,
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  tabletExpenseCard: {
    padding: spacing.xl,
  },
  expenseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  expenseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.lg,
    backgroundColor: `${colors.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    ...typography.bodyMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tabletExpenseTitle: {
    ...typography.bodySemiBold,
  },
  expenseAmount: {
    ...typography.heading3,
    color: colors.success,
  },
  tabletExpenseAmount: {
    ...typography.heading2,
  },
  expenseMeta: {
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
  expenseDescription: {
    ...typography.small,
    color: colors.text,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  tabletExpenseDescription: {
    ...typography.body,
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
  addExpenseButton: {
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
  tabletFooterText: {
    ...typography.small,
  },
});