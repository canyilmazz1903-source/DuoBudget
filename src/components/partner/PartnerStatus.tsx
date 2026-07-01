import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '../ui/Avatar';

interface PartnerStatusProps {
  partnerName: string | null;
  status: 'pending' | 'active' | 'none';
}

export const PartnerStatus: React.FC<PartnerStatusProps> = ({ partnerName, status }) => {
  if (status === 'active' && partnerName) {
    return (
      <View style={[styles.container, styles.activeBg]}>
        <Avatar name={partnerName} size={40} showPartnerDot={true} />
        <View style={styles.info}>
          <Text style={styles.title}>Partner Bağlantısı Aktif</Text>
          <Text style={styles.subtitle}>{partnerName} ile ortak bütçe yönetiyorsunuz</Text>
        </View>
        <Ionicons name="checkmark-circle" size={24} color="#059669" />
      </View>
    );
  }

  if (status === 'pending') {
    return (
      <View style={[styles.container, styles.pendingBg]}>
        <View style={styles.pendingAvatar}>
          <Ionicons name="people" size={20} color="#D97706" />
        </View>
        <View style={styles.info}>
          <Text style={styles.title}>Davet Kodu Oluşturuldu</Text>
          <Text style={styles.subtitle}>Partnerinizin katılması bekleniyor...</Text>
        </View>
        <Ionicons name="time" size={24} color="#D97706" />
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.noneBg]}>
      <View style={styles.noneAvatar}>
        <Ionicons name="heart-dislike" size={20} color="#64748B" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>Tek Tabanca Modu</Text>
        <Text style={styles.subtitle}>Herhangi bir ortak hesaba bağlı değilsiniz</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginVertical: 8,
  },
  activeBg: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  pendingBg: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  noneBg: {
    backgroundColor: '#F8F9FB',
    borderColor: '#E2E8F0',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  pendingAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
