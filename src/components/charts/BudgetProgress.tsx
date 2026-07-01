import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { formatMoney } from '../../utils/formatters';

interface BudgetProgressProps {
  categoryName: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
}

export const BudgetProgress: React.FC<BudgetProgressProps> = ({
  categoryName,
  limitAmount,
  spentAmount,
  remainingAmount,
  percentage,
}) => {
  const isOverBudget = spentAmount > limitAmount;

  // Decide progress bar color
  let progressColor = '#059669'; // Green (Safe)
  if (percentage >= 100) {
    progressColor = '#DC2626'; // Red (Over limit)
  } else if (percentage >= 80) {
    progressColor = '#D97706'; // Orange/Yellow (Warning)
  }

  const cappedPercentage = Math.min(percentage, 100);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={styles.percentageText}>%{percentage.toFixed(0)}</Text>
      </View>

      {/* Progress Track */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressBar,
            {
              width: `${cappedPercentage}%`,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.spentText}>
          {formatMoney(spentAmount)} / <Text style={styles.limitText}>{formatMoney(limitAmount)}</Text>
        </Text>
        <Text style={[styles.statusText, isOverBudget ? styles.dangerText : styles.safeText]}>
          {isOverBudget
            ? `${formatMoney(spentAmount - limitAmount)} aşıldı`
            : `${formatMoney(remainingAmount)} kaldı`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spentText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  limitText: {
    color: '#64748B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  safeText: {
    color: '#059669',
  },
  dangerText: {
    color: '#DC2626',
  },
});
