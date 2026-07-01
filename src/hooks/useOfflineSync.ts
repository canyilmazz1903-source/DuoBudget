import { useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useBudgetStore } from '../store/budgetStore';
import { useAuthStore } from '../store/authStore';

export const useOfflineSync = () => {
  const { isConnected } = useNetworkStatus();
  const jointAccountId = useAuthStore((state) => state.jointAccountId);
  const syncOfflineQueueData = useBudgetStore((state) => state.syncOfflineQueueData);
  const offlineQueue = useBudgetStore((state) => state.offlineQueue);

  useEffect(() => {
    if (isConnected && jointAccountId && offlineQueue.length > 0) {
      console.log('Cihaz tekrar çevrimiçi. Çevrimdışı yapılan işlemler senkronize ediliyor...');
      syncOfflineQueueData(jointAccountId);
    }
  }, [isConnected, jointAccountId, offlineQueue.length]);
};
