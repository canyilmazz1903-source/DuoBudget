import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  } as any),
});

export const useNotifications = () => {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'web') return;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Lokal bildirim izni verilmedi!');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  };

  /**
   * Schedules a recurring monthly notification for salary payday.
   */
  const scheduleSalaryReminder = async (salaryDay: number, salaryAmount: number) => {
    if (Platform.OS === 'web') return;

    // Clear existing salary reminders first
    await cancelAllScheduledNotificationsByTitle('Maaş Günü Hatırlatıcısı');

    if (!salaryDay || salaryDay < 1 || salaryDay > 31) return;

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Maaş Günü Hatırlatıcısı',
          body: `Bugün maaş gününüz! Gelir hanenize ${salaryAmount.toLocaleString('tr-TR')} ₺ eklendi mi? Kontrol etmeyi unutmayın.`,
        },
        trigger: {
          type: 'calendar',
          day: salaryDay,
          hour: 9,
          minute: 0,
          repeats: true,
        } as any,
      });
      console.log(`Maaş günü hatırlatıcısı ayın ${salaryDay}. günü için kuruldu.`);
    } catch (error) {
      console.error('scheduleSalaryReminder Error:', error);
    }
  };

  /**
   * Schedules a reminder for card billing due dates.
   */
  const scheduleCardDueReminder = async (cardName: string, dueDay: number) => {
    if (Platform.OS === 'web') return;

    const title = `Kart Son Ödeme Hatırlatıcısı: ${cardName}`;
    await cancelAllScheduledNotificationsByTitle(title);

    if (!dueDay || dueDay < 1 || dueDay > 31) return;

    try {
      // Schedule reminder 2 days before the due day
      const reminderDay = dueDay - 2 <= 0 ? 28 + (dueDay - 2) : dueDay - 2;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💳 Kredi Kartı Ödeme Uyarısı',
          body: `"${cardName}" son ödeme tarihine 2 gün kaldı! Bütçe aşımını önlemek için ödemenizi planlayın.`,
        },
        trigger: {
          type: 'calendar',
          day: reminderDay,
          hour: 10,
          minute: 0,
          repeats: true,
        } as any,
      });
      console.log(`"${cardName}" son ödeme hatırlatıcısı ayın ${reminderDay}. günü için kuruldu.`);
    } catch (error) {
      console.error('scheduleCardDueReminder Error:', error);
    }
  };

  const cancelAllScheduledNotificationsByTitle = async (title: string) => {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notif of scheduled) {
        if (notif.content.title === title) {
          await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        }
      }
    } catch (error) {
      console.error('cancelNotifications Error:', error);
    }
  };

  return {
    scheduleSalaryReminder,
    scheduleCardDueReminder,
  };
};
