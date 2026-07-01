import { useEffect } from 'react';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../store/authStore';
import { useBudgetStore } from '../store/budgetStore';

export const useSupabaseAuth = () => {
  const setSession = useAuthStore((state) => state.setSession);
  const loadInitialData = useBudgetStore((state) => state.loadInitialData);
  const clearCache = useBudgetStore((state) => state.clearCache);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        // Fetch profile
        useAuthStore.getState().fetchProfile().then(() => {
          const jointAccountId = useAuthStore.getState().jointAccountId;
          if (jointAccountId) {
            loadInitialData(jointAccountId);
          }
        });
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        useAuthStore.getState().fetchProfile().then(() => {
          const jointAccountId = useAuthStore.getState().jointAccountId;
          if (jointAccountId) {
            loadInitialData(jointAccountId);
          }
        });
      } else {
        clearCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
