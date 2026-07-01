import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types/database';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  getProfile,
  getPartnerProfile,
  createJointAccount,
  joinPartnerWithCode,
} from '../api/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  partner: Profile | null;
  jointAccountId: string | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  logOut: () => Promise<void>;
  setSession: (session: Session | null) => Promise<void>;
  fetchProfile: () => Promise<void>;
  fetchPartner: () => Promise<void>;
  initJointAccount: () => Promise<void>;
  linkPartner: (inviteCode: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      partner: null,
      jointAccountId: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      signIn: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await signInWithEmail(email, password);
          if (error) throw error;
          if (data.session) {
            set({
              session: data.session,
              user: data.session.user,
              isAuthenticated: true,
            });
            await get().fetchProfile();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      signUp: async (email, password, fullName) => {
        set({ isLoading: true });
        try {
          const { data, error } = await signUpWithEmail(email, password, fullName);
          if (error) throw error;
          if (data.session) {
            set({
              session: data.session,
              user: data.session.user,
              isAuthenticated: true,
            });
            await get().fetchProfile();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logOut: async () => {
        set({ isLoading: true });
        try {
          await signOut();
          set({
            user: null,
            profile: null,
            partner: null,
            jointAccountId: null,
            session: null,
            isAuthenticated: false,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      setSession: async (session) => {
        if (!session) {
          set({
            session: null,
            user: null,
            profile: null,
            partner: null,
            jointAccountId: null,
            isAuthenticated: false,
          });
          return;
        }

        const userChanged = get().user?.id !== session.user.id;

        set({
          session,
          user: session.user,
          isAuthenticated: true,
        });

        if (userChanged || !get().profile) {
          await get().fetchProfile();
        }
      },

      fetchProfile: async () => {
        const user = get().user;
        if (!user) return;

        const { data, error } = await getProfile(user.id);
        if (error) {
          console.error('fetchProfile Error:', error);
          return;
        }

        if (data) {
          set({
            profile: data,
            jointAccountId: data.joint_account_id,
          });
          if (data.joint_account_id) {
            await get().fetchPartner();
          }
        }
      },

      fetchPartner: async () => {
        const { jointAccountId, user } = get();
        if (!jointAccountId || !user) return;

        const { data, error } = await getPartnerProfile(jointAccountId, user.id);
        if (error) {
          console.error('fetchPartner Error:', error);
          return;
        }

        set({ partner: data || null });
      },

      initJointAccount: async () => {
        const user = get().user;
        if (!user) return;

        set({ isLoading: true });
        try {
          const { data, error } = await createJointAccount(user.id);
          if (error) throw error;
          if (data) {
            set({ jointAccountId: data.id });
            await get().fetchProfile();
          }
        } finally {
          set({ isLoading: false });
        }
      },

      linkPartner: async (inviteCode) => {
        const user = get().user;
        if (!user) return;

        set({ isLoading: true });
        try {
          const { data, error } = await joinPartnerWithCode(user.id, inviteCode);
          if (error) throw error;
          if (data) {
            set({ jointAccountId: data.id });
            await get().fetchProfile();
          }
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'duobudget-auth-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        jointAccountId: state.jointAccountId,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
