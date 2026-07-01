import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { CategoryTotal } from '../../utils/financeCalc';
import { formatMoney } from '../../utils/formatters';

interface SpendingDonutProps {
  data: CategoryTotal[];
  total: number;
}

export const SpendingDonut: React.FC<SpendingDonutProps> = ({ data, total }) => {
  if (data.length === 0 || total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Harcama verisi bulunamadı</Text>
      </View>
    );
  }

  const radius = 70;
  const strokeWidth = 20;
  const center = radius + strokeWidth;
  const size = center * 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {/* Draw base gray circle */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke="#E2E8F0"
              strokeWidth={strokeWidth}
              fill="none"
            />
            {data.map((item, index) => {
              const percentage = item.percentage / 100;
              const strokeDashoffset = circumference - percentage * circumference;
              const rotation = currentAngle;
              currentAngle += item.percentage * 3.6; // Convert % to degrees

              return (
                <Circle
                  key={item.categoryId}
                  cx={center}
                  cy={center}
                  r={radius}
                  stroke={item.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference} ${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  fill="none"
                  transform={`rotate(${rotation} ${center} ${center})`}
                />
              );
            })}
          </G>
        </Svg>
        <View style={styles.centerTextContainer}>
          <Text style={styles.centerSubText}>Toplam Gider</Text>
          <Text style={styles.centerMainText} numberOfLines={1} adjustsFontSizeToFit>
            {formatMoney(total)}
          </Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        {data.slice(0, 5).map((item) => (
          <View key={item.categoryId} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendName} numberOfLines={1}>
              {item.categoryName}
            </Text>
            <Text style={styles.legendValue}>{formatMoney(item.total)}</Text>
            <Text style={styles.legendPercent}>%{item.percentage}</Text>
          </View>
        ))}
        {data.length > 5 && (
          <Text style={styles.moreText}>ve {data.length - 5} kategori daha...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  chartWrapper: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  centerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 110,
    height: 110,
  },
  centerSubText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  centerMainText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  legendContainer: {
    width: '100%',
    paddingHorizontal: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendName: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginRight: 8,
  },
  legendPercent: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    width: 40,
    textAlign: 'right',
  },
  moreText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
  },
  emptyContainer: {
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748B',
    fontFamily: 'Inter',
  },
});
