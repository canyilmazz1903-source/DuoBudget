import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  useColorScheme,
  type ListRenderItem,
} from 'react-native';
import { TransactionItem } from './TransactionItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Transaction } from '@/types';

/* ─── Types ────────────────────────────────────────────────────── */

interface DateGroup {
  title: string;
  data: Transaction[];
}

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function groupByDate(transactions: Transaction[]): DateGroup[] {
  const groups: Record<string, Transaction[]> = {};

  for (const tx of transactions) {
    const date = new Date(tx.transaction_date);
    const key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    if (!groups[key]) groups[key] = [];
    groups[key].push(tx);
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, data]) => {
      let title: string;
      if (dateKey === today) {
        title = 'Bugün';
      } else if (dateKey === yesterday) {
        title = 'Dün';
      } else {
        title = new Date(dateKey).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          weekday: 'long',
        });
      }
      return { title, data };
    });
}

/* ─── List Item types ──────────────────────────────────────────── */

type ListItem =
  | { type: 'header'; title: string; id: string }
  | { type: 'transaction'; transaction: Transaction; id: string };

/* ─── Component ────────────────────────────────────────────────── */

export function TransactionList({
  transactions,
  onTransactionPress,
  onDeleteTransaction,
  onRefresh,
  onEndReached,
  refreshing = false,
  loading = false,
  emptyTitle = 'İşlem bulunamadı',
  emptyDescription = 'Henüz kaydedilmiş işlem yok.',
}: TransactionListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const headerColor = isDark ? '#94A3B8' : '#64748B';

  const listItems = useMemo<ListItem[]>(() => {
    const groups = groupByDate(transactions);
    const items: ListItem[] = [];
    for (const group of groups) {
      items.push({ type: 'header', title: group.title, id: `header-${group.title}` });
      for (const tx of group.data) {
        items.push({ type: 'transaction', transaction: tx, id: tx.id });
      }
    }
    return items;
  }, [transactions]);

  const renderItem: ListRenderItem<ListItem> = useCallback(
    ({ item }) => {
      if (item.type === 'header') {
        return (
          <Text style={[styles.sectionHeader, { color: headerColor }]}>
            {item.title}
          </Text>
        );
      }
      return (
        <TransactionItem
          transaction={item.transaction}
          onPress={onTransactionPress}
          onDelete={onDeleteTransaction}
          style={styles.itemSpacing}
        />
      );
    },
    [headerColor, onTransactionPress, onDeleteTransaction],
  );

  const keyExtractor = useCallback((item: ListItem) => item.id, []);

  if (loading && transactions.length === 0) {
    return <LoadingSpinner label="İşlemler yükleniyor..." />;
  }

  return (
    <FlatList
      data={listItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={
        transactions.length === 0 ? styles.emptyContainer : styles.listContainer
      }
      ListEmptyComponent={
        <EmptyState
          icon="receipt"
          title={emptyTitle}
          description={emptyDescription}
        />
      }
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? '#3B82F6' : '#2563EB'}
          />
        ) : undefined
      }
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      showsVerticalScrollIndicator={false}
    />
  );
}

/* ─── Styles ───────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  itemSpacing: {
    marginBottom: 8,
  },
});

export default TransactionList;
