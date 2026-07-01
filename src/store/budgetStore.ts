import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Transaction,
  Card,
  Budget,
  Category,
  NewTransaction,
  NewCard,
  OfflineQueueItem,
} from '../types/database';
import { FinancialProjection } from '../types/gemini';
import {
  getTransactions,
  insertTransaction,
  deleteTransactionFromDb,
  getCards,
  insertCard,
  deleteCardFromDb,
  getBudgets,
  upsertBudget,
  getCategories,
} from '../api/supabase';
import { getFinancialProjection } from '../api/gemini';
import NetInfo from '@react-native-community/netinfo';

interface BudgetState {
  transactions: Transaction[];
  cards: Card[];
  categories: Category[];
  budgets: Budget[];
  aiAnalysis: FinancialProjection | null;
  offlineQueue: OfflineQueueItem[];
  isLoading: boolean;
  selectedMonth: string; // Format: YYYY-MM

  // Actions
  setSelectedMonth: (month: string) => void;
  loadInitialData: (jointAccountId: string) => Promise<void>;
  fetchTransactionsList: (jointAccountId: string) => Promise<void>;
  addTransactionItem: (jointAccountId: string, userId: string, tx: Omit<NewTransaction, 'joint_account_id' | 'entered_by'>) => Promise<void>;
  deleteTransactionItem: (id: string) => Promise<void>;
  fetchCardsList: (jointAccountId: string) => Promise<void>;
  addCardItem: (jointAccountId: string, userId: string, card: Omit<NewCard, 'joint_account_id' | 'owner_id'>) => Promise<void>;
  removeCardItem: (id: string) => Promise<void>;
  updateBudgetLimit: (jointAccountId: string, categoryId: string, limitAmount: number) => Promise<void>;
  fetchAiAnalysisData: () => Promise<void>;
  queueOfflineAction: (action: OfflineQueueItem['action'], tableName: string, payload: any) => void;
  syncOfflineQueueData: (jointAccountId: string) => Promise<void>;
  clearCache: () => void;
}

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set, get) => ({
      transactions: [],
      cards: [],
      categories: [],
      budgets: [],
      aiAnalysis: null,
      offlineQueue: [],
      isLoading: false,
      selectedMonth: new Date().toISOString().substring(0, 7),

      setSelectedMonth: (month) => {
        set({ selectedMonth: month });
      },

      loadInitialData: async (jointAccountId) => {
        set({ isLoading: true });
        try {
          const [catRes, cardsRes] = await Promise.all([
            getCategories(jointAccountId),
            getCards(jointAccountId),
          ]);

          if (catRes.data) set({ categories: catRes.data });
          if (cardsRes.data) set({ cards: cardsRes.data });

          await get().fetchTransactionsList(jointAccountId);
        } catch (error) {
          console.error('loadInitialData Error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      fetchTransactionsList: async (jointAccountId) => {
        const { selectedMonth } = get();
        try {
          const [txRes, budgetRes] = await Promise.all([
            getTransactions(jointAccountId, selectedMonth),
            getBudgets(jointAccountId, selectedMonth),
          ]);

          if (txRes.data) set({ transactions: txRes.data as any[] });
          if (budgetRes.data) set({ budgets: budgetRes.data as any[] });
        } catch (error) {
          console.error('fetchTransactionsList Error:', error);
        }
      },

      addTransactionItem: async (jointAccountId, userId, tx) => {
        const network = await NetInfo.fetch();
        const newTxPayload: NewTransaction = {
          ...tx,
          joint_account_id: jointAccountId,
          entered_by: userId,
          source: tx.source || 'manual',
          is_synced: !!network.isConnected,
        };

        if (!network.isConnected) {
          // Add to local state first
          const tempId = `temp-${Date.now()}`;
          const localTx: Transaction = {
            id: tempId,
            ...newTxPayload,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as any;

          set((state) => ({
            transactions: [localTx, ...state.transactions],
          }));

          get().queueOfflineAction('INSERT', 'transactions', newTxPayload);
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await insertTransaction(newTxPayload);
          if (error) throw error;
          if (data) {
            set((state) => ({
              transactions: [data as any, ...state.transactions],
            }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      deleteTransactionItem: async (id) => {
        const network = await NetInfo.fetch();
        if (id.startsWith('temp-')) {
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }));
          return;
        }

        if (!network.isConnected) {
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }));
          get().queueOfflineAction('DELETE', 'transactions', { id });
          return;
        }

        set({ isLoading: true });
        try {
          const { error } = await deleteTransactionFromDb(id);
          if (error) throw error;
          set((state) => ({
            transactions: state.transactions.filter((t) => t.id !== id),
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCardsList: async (jointAccountId) => {
        const { data, error } = await getCards(jointAccountId);
        if (data) {
          set({ cards: data });
        }
      },

      addCardItem: async (jointAccountId, userId, card) => {
        const newCardPayload: NewCard = {
          ...card,
          joint_account_id: jointAccountId,
          owner_id: userId,
          is_active: true,
        };

        const network = await NetInfo.fetch();
        if (!network.isConnected) {
          const tempId = `temp-${Date.now()}`;
          const localCard: Card = {
            id: tempId,
            ...newCardPayload,
            created_at: new Date().toISOString(),
          } as any;

          set((state) => ({
            cards: [...state.cards, localCard],
          }));

          get().queueOfflineAction('INSERT', 'cards', newCardPayload);
          return;
        }

        set({ isLoading: true });
        try {
          const { data, error } = await insertCard(newCardPayload);
          if (error) throw error;
          if (data) {
            set((state) => ({
              cards: [...state.cards, data],
            }));
          }
        } finally {
          set({ isLoading: false });
        }
      },

      removeCardItem: async (id) => {
        const network = await NetInfo.fetch();
        if (id.startsWith('temp-')) {
          set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
          }));
          return;
        }

        if (!network.isConnected) {
          set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
          }));
          get().queueOfflineAction('DELETE', 'cards', { id });
          return;
        }

        set({ isLoading: true });
        try {
          const { error } = await deleteCardFromDb(id);
          if (error) throw error;
          set((state) => ({
            cards: state.cards.filter((c) => c.id !== id),
          }));
        } finally {
          set({ isLoading: false });
        }
      },

      updateBudgetLimit: async (jointAccountId, categoryId, limitAmount) => {
        const { selectedMonth } = get();
        const periodStart = `${selectedMonth}-01`;
        
        // Month parsing to get end date
        const date = new Date(periodStart);
        const periodEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

        const budgetPayload = {
          joint_account_id: jointAccountId,
          category_id: categoryId,
          amount: limitAmount,
          period_start: periodStart,
          period_end: periodEnd,
        };

        const network = await NetInfo.fetch();
        if (!network.isConnected) {
          // Update locally
          const updatedBudgets = [...get().budgets];
          const existIdx = updatedBudgets.findIndex(
            (b) => b.category_id === categoryId && b.period_start === periodStart
          );

          if (existIdx > -1) {
            updatedBudgets[existIdx] = { ...updatedBudgets[existIdx], amount: limitAmount };
          } else {
            updatedBudgets.push({
              id: `temp-${Date.now()}`,
              ...budgetPayload,
              created_at: new Date().toISOString(),
            } as any);
          }

          set({ budgets: updatedBudgets });
          get().queueOfflineAction('UPSERT', 'budgets', budgetPayload);
          return;
        }

        try {
          const { data, error } = await upsertBudget(budgetPayload);
          if (error) throw error;
          if (data) {
            const updatedBudgets = [...get().budgets];
            const existIdx = updatedBudgets.findIndex((b) => b.id === data.id);
            if (existIdx > -1) {
              updatedBudgets[existIdx] = data as any;
            } else {
              updatedBudgets.push(data as any);
            }
            set({ budgets: updatedBudgets });
          }
        } catch (error) {
          console.error('updateBudgetLimit Error:', error);
        }
      },

      fetchAiAnalysisData: async () => {
        const { transactions, budgets } = get();
        if (transactions.length === 0) return;

        set({ isLoading: true });
        try {
          const analysis = await getFinancialProjection(transactions, budgets);
          set({ aiAnalysis: analysis });
        } catch (error) {
          console.error('fetchAiAnalysisData Error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      queueOfflineAction: (action, tableName, payload) => {
        const newItem: OfflineQueueItem = {
          id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          action,
          table_name: tableName,
          payload,
          created_at: new Date().toISOString(),
        };

        set((state) => ({
          offlineQueue: [...state.offlineQueue, newItem],
        }));
      },

      syncOfflineQueueData: async (jointAccountId) => {
        const { offlineQueue } = get();
        if (offlineQueue.length === 0) return;

        console.log(`Syncing ${offlineQueue.length} offline actions...`);
        set({ isLoading: true });

        try {
          for (const item of offlineQueue) {
            try {
              if (item.action === 'INSERT') {
                if (item.table_name === 'transactions') {
                  const { error } = await insertTransaction(item.payload);
                  if (error) console.error('Offline Insert Tx Error:', error);
                } else if (item.table_name === 'cards') {
                  const { error } = await insertCard(item.payload);
                  if (error) console.error('Offline Insert Card Error:', error);
                }
              } else if (item.action === 'DELETE') {
                if (item.table_name === 'transactions') {
                  await deleteTransactionFromDb(item.payload.id);
                } else if (item.table_name === 'cards') {
                  await deleteCardFromDb(item.payload.id);
                }
              } else if (item.action === 'UPSERT') {
                if (item.table_name === 'budgets') {
                  await upsertBudget(item.payload);
                }
              }
            } catch (err) {
              console.error(`Error syncing action ${item.id}:`, err);
            }
          }

          // Clear queue and reload data
          set({ offlineQueue: [] });
          await get().loadInitialData(jointAccountId);
        } finally {
          set({ isLoading: false });
        }
      },

      clearCache: () => {
        set({
          transactions: [],
          cards: [],
          budgets: [],
          aiAnalysis: null,
          offlineQueue: [],
        });
      },
    }),
    {
      name: 'duobudget-budget-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        transactions: state.transactions,
        cards: state.cards,
        budgets: state.budgets,
        categories: state.categories,
        aiAnalysis: state.aiAnalysis,
        offlineQueue: state.offlineQueue,
      }),
    }
  )
);
