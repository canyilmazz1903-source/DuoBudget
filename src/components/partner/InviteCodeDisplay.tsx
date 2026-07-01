import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';

interface InviteCodeDisplayProps {
  inviteCode: string;
}

export const InviteCodeDisplay: React.FC<InviteCodeDisplayProps> = ({ inviteCode }) => {
  const handleCopy = async () => {
    await Clipboard.setStringAsync(inviteCode);
    Alert.alert('Başarılı', 'Davet kodu panoya kopyalandı.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `DuoBudget ortak bütçe davet kodum: ${inviteCode}\nUygulamayı indirip bu kodu girerek ortak bütçemizi yönetmeye başlayabilirsin!`,
      });
    } catch (error) {
      console.error('Share Error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ortak Hesap Daveti</Text>
      <Text style={styles.subtitle}>
        Partnerinizin sizinle eşleşebilmesi için bu davet kodunu onunla paylaşın.
      </Text>

      <TouchableOpacity style={styles.codeContainer} onPress={handleCopy} activeOpacity={0.7}>
        <Text style={styles.codeText}>{inviteCode.toUpperCase()}</Text>
        <Ionicons name="copy-outline" size={20} color="#2563EB" />
      </TouchableOpacity>

      <View style={styles.actions}>
        <Button
          title="Kodu Paylaş"
          onPress={handleShare}
          icon={<Ionicons name="share-social-outline" size={18} color="#FFFFFF" />}
          style={styles.shareButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  codeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: 'Inter',
    letterSpacing: 2,
    marginRight: 10,
  },
  actions: {
    width: '100%',
  },
  shareButton: {
    width: '100%',
  },
});
