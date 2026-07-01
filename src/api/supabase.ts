import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '../types/database';

// SecureStore adapter for Supabase session persistence
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// --- Auth Helpers ---

export const signInWithEmail = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  const result = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  return result;
};

export const signOut = async () => {
  return await supabase.auth.signOut();
};

// --- Profile & Partner Matching Helpers ---

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  return { data, error };
};

export const getPartnerProfile = async (jointAccountId: string, currentUserId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('joint_account_id', jointAccountId)
    .neq('id', currentUserId)
    .maybeSingle();

  return { data, error };
};

export const updateProfile = async (userId: string, updates: any) => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();

  return { data, error };
};

export const createJointAccount = async (userId: string) => {
  // Create joint account
  const { data: jointAccount, error: jaError } = await supabase
    .from('joint_accounts')
    .insert({
      user1_id: userId,
      name: 'Ortak Bütçe',
      status: 'pending',
    })
    .select()
    .single();

  if (jaError) return { data: null, error: jaError };

  // Update user's profile with joint_account_id
  const { error: profError } = await supabase
    .from('profiles')
    .update({ joint_account_id: jointAccount.id })
    .eq('id', userId);

  if (profError) return { data: null, error: profError };

  return { data: jointAccount, error: null };
};

export const joinPartnerWithCode = async (userId: string, inviteCode: string) => {
  // Find the joint account with this invite code
  const { data: jointAccount, error: findError } = await supabase
    .from('joint_accounts')
    .select('*')
    .eq('invite_code', inviteCode.toLowerCase())
    .eq('status', 'pending')
    .maybeSingle();

  if (findError || !jointAccount) {
    return { data: null, error: findError || new Error('Geçersiz veya kullanılmış davet kodu.') };
  }

  if (jointAccount.user1_id === userId) {
    return { data: null, error: new Error('Kendi oluşturduğunuz davet kodunu kullanamazsınız.') };
  }

  // Update joint account user2_id and status
  const { data: updatedAccount, error: updateError } = await supabase
    .from('joint_accounts')
    .update({
      user2_id: userId,
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jointAccount.id)
    .select()
    .single();

  if (updateError) return { data: null, error: updateError };

  // Update user's profile with joint_account_id
  const { error: profError } = await supabase
    .from('profiles')
    .update({ joint_account_id: jointAccount.id })
    .eq('id', userId);

  if (profError) return { data: null, error: profError };

  return { data: updatedAccount, error: null };
};

export const getJointAccount = async (id: string) => {
  return await supabase
    .from('joint_accounts')
    .select('*')
    .eq('id', id)
    .single();
};

// --- Transactions & Cards Helpers ---

export const getTransactions = async (jointAccountId: string, monthStr: string) => {
  // monthStr: YYYY-MM
  const startDate = `${monthStr}-01`;
  // calculate last day of month
  const date = new Date(startDate);
  const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];

  return await supabase
    .from('transactions')
    .select('*, categories(*), cards(*)')
    .eq('joint_account_id', jointAccountId)
    .gte('transaction_date', startDate)
    .lte('transaction_date', endDate)
    .order('transaction_date', { ascending: false });
};

export const insertTransaction = async (tx: any) => {
  return await supabase
    .from('transactions')
    .insert(tx)
    .select('*, categories(*), cards(*)')
    .single();
};

export const deleteTransactionFromDb = async (id: string) => {
  return await supabase
    .from('transactions')
    .delete()
    .eq('id', id);
};

export const getCards = async (jointAccountId: string) => {
  return await supabase
    .from('cards')
    .select('*')
    .eq('joint_account_id', jointAccountId)
    .eq('is_active', true);
};

export const insertCard = async (card: any) => {
  return await supabase
    .from('cards')
    .insert(card)
    .select()
    .single();
};

export const deleteCardFromDb = async (id: string) => {
  return await supabase
    .from('cards')
    .update({ is_active: false })
    .eq('id', id);
};

export const getBudgets = async (jointAccountId: string, monthStr: string) => {
  const periodStart = `${monthStr}-01`;
  return await supabase
    .from('budgets')
    .select('*, categories(*)')
    .eq('joint_account_id', jointAccountId)
    .eq('period_start', periodStart);
};

export const upsertBudget = async (budget: any) => {
  const { data, error } = await supabase
    .from('budgets')
    .upsert(budget, { onConflict: 'joint_account_id,category_id,period_start' })
    .select()
    .single();

  return { data, error };
};

export const getCategories = async (jointAccountId: string) => {
  return await supabase
    .from('categories')
    .select('*')
    .or(`joint_account_id.eq.${jointAccountId},is_default.eq.true`)
    .order('sort_order', { ascending: true });
};
