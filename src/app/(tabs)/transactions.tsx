import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBudgetStore } from '../../store/budgetStore';
import { TransactionList } from '../../components/transactions/TransactionList';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { AddTransactionModal } from '../../components/transactions/AddTransactionModal';
import { Ionicons } from '@expo/vector-icons';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { pickPdfFile, readPdfAsBase64, extractTextFromPdf } from '../../utils/pdfParser';
import { analyzeStatement } from '../../api/gemini';
import { formatMoney } from '../../utils/formatters';
import { TransactionType, TransactionSource } from '../../types';

function TransactionsScreen() {
  const profile = useAuthStore((state) => state.profile);
  const jointAccountId = useAuthStore((state) => state.jointAccountId);

  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const selectedMonth = useBudgetStore((state) => state.selectedMonth);
  const setSelectedMonth = useBudgetStore((state) => state.setSelectedMonth);
  const fetchTransactionsList = useBudgetStore((state) => state.fetchTransactionsList);
  const addTransactionItem = useBudgetStore((state) => state.addTransactionItem);
  const deleteTransactionItem = useBudgetStore((state) => state.deleteTransactionItem);
  const isLoading = useBudgetStore((state) => state.isLoading);

  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (jointAccountId) {
      fetchTransactionsList(jointAccountId);
    }
  }, [selectedMonth, jointAccountId]);

  // Handle Month changes (Previous / Next)
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    const prevMonthStr = date.toISOString().substring(0, 7);
    setSelectedMonth(prevMonthStr);
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    const nextMonthStr = date.toISOString().substring(0, 7);
    setSelectedMonth(nextMonthStr);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  // Pick and process PDF
  const handlePdfImport = async () => {
    if (!jointAccountId || !profile) return;
    
    try {
      const file = await pickPdfFile();
      if (!file) return; // User cancelled

      setIsImporting(true);
      
      const base64 = await readPdfAsBase64(file.uri);
      if (!base64) {
        Alert.alert('Hata', 'Dosya okunamadı.');
        setIsImporting(false);
        return;
      }

      // 1. Deno Edge Function üzerinden metin çıkar
      const extractResult = await extractTextFromPdf(base64);
      if (!extractResult.success || !extractResult.text) {
        Alert.alert('Hata', extractResult.error || 'Metin çıkarma başarısız.');
        setIsImporting(false);
        return;
      }

      // 2. Gemini API ile işlemleri çıkar
      const analysis = await analyzeStatement(extractResult.text);
      if (!analysis.success || analysis.transactions.length === 0) {
        Alert.alert('Hata', analysis.errorMessage || 'AI ekstrede işlem tespit edemedi.');
        setIsImporting(false);
        return;
      }

      // Show summary and confirm before adding
      const count = analysis.transactions.length;
      const totalExpense = analysis.summary.totalExpense;
      
      Alert.alert(
        'Ekstre Analizi Tamamlandı',
        `AI ekstrede ${count} işlem tespit etti.\nToplam harcama: ${formatMoney(totalExpense)}\n\nBu işlemleri ortak hesabınıza eklemek istiyor musunuz?`,
        [
          { text: 'İptal', style: 'cancel', onPress: () => setIsImporting(false) },
          {
            text: 'Ekle',
            onPress: async () => {
              // Add transactions one by one
              for (const parsedTx of analysis.transactions) {
                // Find matching category or use Diğer
                const matchedCategory = categories.find(
                  (c) => c.name.toLowerCase() === parsedTx.suggestedCategory.toLowerCase()
                );
                const categoryId = matchedCategory ? matchedCategory.id : (categories.find(c => c.name === 'Diğer')?.id || categories[0]?.id);

                await addTransactionItem(jointAccountId, profile.id, {
                  category_id: categoryId,
                  card_id: null,
                  type: parsedTx.type as TransactionType,
                  amount: parsedTx.amount,
                  description: parsedTx.description,
                  merchant: parsedTx.description,
                  transaction_date: parsedTx.date,
                  source: TransactionSource.PDF_IMPORT,
                  is_recurring: false,
                  is_synced: true,
                });
              }

              Alert.alert('Başarılı', `${count} adet işlem başarıyla eklendi.`);
              setIsImporting(false);
              fetchTransactionsList(jointAccountId);
            },
          },
        ]
      );

    } catch (error: any) {
      console.error(error);
      Alert.alert('Hata', 'PDF ekstresi işlenirken beklenmeyen bir hata oluştu.');
      setIsImporting(false);
    }
  };

  const handleAddSubmit = async (data: any) => {
    if (!jointAccountId || !profile) return;
    
    const matchedCategory = categories.find(
      (c) => c.name.toLowerCase() === data.category.toLowerCase()
    );
    const categoryId = matchedCategory ? matchedCategory.id : (categories.find(c => c.name === 'Diğer')?.id || categories[0]?.id);

    await addTransactionItem(jointAccountId, profile.id, {
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

  // Convert selectedMonth (YYYY-MM) to Turkish readable text
  const getMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Month Selector Header */}
      <View style={styles.monthSelector}>
        <TouchableOpacity style={styles.arrowButton} onPress={handlePrevMonth}>
          <Ionicons name="chevron-back" size={20} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{getMonthName(selectedMonth)}</Text>
        <TouchableOpacity style={styles.arrowButton} onPress={handleNextMonth}>
          <Ionicons name="chevron-forward" size={20} color="#1E293B" />
        </TouchableOpacity>
      </View>

      {/* Filter and Import Row */}
      <View style={styles.actionRow}>
        <SegmentedControl
          segments={[
            { label: 'Tümü', value: 'all' },
            { label: 'Gelir', value: 'income' },
            { label: 'Gider', value: 'expense' },
          ]}
          selectedValue={filterType}
          onValueChange={(val) => setFilterType(val as 'all' | 'income' | 'expense')}
          style={styles.segmented}
        />
        <TouchableOpacity
          style={[styles.importButton, isImporting && styles.disabledButton]}
          onPress={handlePdfImport}
          disabled={isImporting}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#2563EB" />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color="#2563EB" />
              <Text style={styles.importText}>PDF Oku</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Transaction List */}
      <View style={styles.listContainer}>
        <TransactionList
          transactions={filteredTransactions}
          onDeleteTransaction={async (id) => {
            await deleteTransactionItem(id);
          }}
          refreshing={isLoading}
          onRefresh={() => {
            if (jointAccountId) fetchTransactionsList(jointAccountId);
          }}
        />
      </View>

      {/* FAB */}
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

export default function TransactionsWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <TransactionsScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  arrowButton: {
    padding: 6,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  segmented: {
    flex: 1,
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    height: 40,
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  importText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
  listContainer: {
    flex: 1,
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
