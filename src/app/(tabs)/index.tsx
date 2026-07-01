import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useBudgetStore } from '../../store/budgetStore';
import { formatMoney } from '../../utils/formatters';
import { calculateMonthlyBalance, calculateBudgetStatus } from '../../utils/financeCalc';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { BudgetProgress } from '../..//components/charts/BudgetProgress';
import { TransactionItem } from '../../components/transactions/TransactionItem';
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal';
import { Ionicons } from '@expo/vector-icons';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { TransactionType, TransactionSource } from '../../types';

function DashboardScreen() {
  const router = useRouter();
  
  // Custom hook to trigger offline sync when online
  useOfflineSync();

  const profile = useAuthStore((state) => state.profile);
  const partner = useAuthStore((state) => state.partner);
  const jointAccountId = useAuthStore((state) => state.jointAccountId);

  const transactions = useBudgetStore((state) => state.transactions);
  const budgets = useBudgetStore((state) => state.budgets);
  const categories = useBudgetStore((state) => state.categories);
  const isLoading = useBudgetStore((state) => state.isLoading);
  const loadInitialData = useBudgetStore((state) => state.loadInitialData);

  const [refreshing, setRefreshing] = useState(false);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);

  const onRefresh = async () => {
    if (jointAccountId) {
      setRefreshing(true);
      await loadInitialData(jointAccountId);
      setRefreshing(false);
    }
  };

  // Calculate numbers
  const { income, expense, balance } = calculateMonthlyBalance(transactions);
  const budgetStatuses = calculateBudgetStatus(transactions, budgets, categories);
  const topBudgets = budgetStatuses.slice(0, 3);
  const recentTransactions = transactions.slice(0, 5);

  // Calculate days to payday
  const paydayDay = profile?.salary_day || 15;
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDate = today.getDate();
  let targetPayday = new Date(currentYear, currentMonth, paydayDay);
  if (currentDate > paydayDay) {
    targetPayday = new Date(currentYear, currentMonth + 1, paydayDay);
  }
  const diffTime = Math.abs(targetPayday.getTime() - today.getTime());
  const daysToPayday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const handleAddSubmit = async (data: any) => {
    if (!jointAccountId || !profile) return;
    
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === data.category.toLowerCase()
    );
    const categoryId = matchedCategory ? matchedCategory.id : (categories.find(c => c.name === 'Diğer')?.id || categories[0]?.id);

    await useBudgetStore.getState().addTransactionItem(jointAccountId, profile.id, {
      category_id: categoryId,
      card_id: data.cardId || null,
      type: data.type,
      amount: data.amount,
      description: data.description || 'İşlem',
      merchant: data.merchant || '',
      transaction_date: new Date().toISOString().split('T')[0],
      source: TransactionSource.MANUAL,
      is_recurring: false,
      is_synced: true,
    });
    
    setIsAddModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563EB']} />
        }
      >
        {/* Greetings */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Merhaba,</Text>
            <Text style={styles.name}>{profile?.full_name || 'Kullanıcı'}</Text>
          </View>
          {partner ? (
            <Badge label={`Eş: ${partner.full_name}`} variant="success" />
          ) : (
            <TouchableOpacity onPress={() => router.push('/(auth)/partner-invite')}>
              <Badge label="Eş Davet Et" variant="warning" />
            </TouchableOpacity>
          )}
        </View>

        {/* Total Balance Card */}
        <Card style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Aylık Net Bakiye</Text>
          <Text style={[styles.balanceAmount, balance >= 0 ? styles.positiveText : styles.negativeText]}>
            {formatMoney(balance)}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <View style={styles.statIconContainer}>
                <Ionicons name="arrow-down-circle" size={20} color="#059669" />
              </View>
              <View>
                <Text style={styles.statLabel}>Gelir</Text>
                <Text style={styles.statValue}>{formatMoney(income)}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.statCol}>
              <View style={styles.statIconContainer}>
                <Ionicons name="arrow-up-circle" size={20} color="#DC2626" />
              </View>
              <View>
                <Text style={styles.statLabel}>Gider</Text>
                <Text style={styles.statValue}>{formatMoney(expense)}</Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Salary Day Info */}
        <View style={styles.paydayRow}>
          <Ionicons name="gift-outline" size={18} color="#D97706" />
          <Text style={styles.paydayText}>
            Maaş gününüze <Text style={styles.boldText}>{daysToPayday}</Text> gün kaldı (Ayın {paydayDay}. günü)
          </Text>
        </View>

        {/* Top Budgets */}
        {topBudgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Bütçe Limitleri</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.sectionLink}>Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            <Card style={styles.sectionCard}>
              {topBudgets.map((b, idx) => (
                <View key={b.categoryId} style={idx > 0 && styles.budgetGap}>
                  <BudgetProgress
                    categoryName={b.categoryName}
                    limitAmount={b.limitAmount}
                    spentAmount={b.spentAmount}
                    remainingAmount={b.remainingAmount}
                    percentage={b.percentage}
                  />
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Son Hesap Hareketleri</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.sectionLink}>Tümünü Gör</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length > 0 ? (
            <Card style={styles.transactionsCard}>
              {recentTransactions.map((tx, idx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onDelete={async () => {
                    await useBudgetStore.getState().deleteTransactionItem(tx.id);
                  }}
                  style={idx > 0 ? styles.borderTop : undefined}
                />
              ))}
            </Card>
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>Henüz bir hesap hareketi bulunmuyor.</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => setIsAddModalVisible(true)}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <AddTransactionModal
        visible={isAddModalVisible}
        onClose={() => setIsAddModalVisible(false)}
        onSubmit={handleAddSubmit}
      />
    </View>
  );
}

export default function DashboardWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <DashboardScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 10,
    fontFamily: 'Inter',
  },
  positiveText: {
    color: '#059669',
  },
  negativeText: {
    color: '#DC2626',
  },
  statsRow: {
    flexDirection: 'row',
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 6,
  },
  statCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F9FB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  paydayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  paydayText: {
    fontSize: 12,
    color: '#D97706',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  boldText: {
    fontWeight: '700',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
  sectionCard: {
    padding: 16,
  },
  budgetGap: {
    marginTop: 14,
  },
  transactionsCard: {
    paddingVertical: 4,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
});
