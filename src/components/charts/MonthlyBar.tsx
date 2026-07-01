import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Rect, G, Line, Text as SvgText } from 'react-native-svg';
import { formatMoney } from '../../utils/formatters';

interface MonthlyData {
  monthName: string;
  income: number;
  expense: number;
}

interface MonthlyBarProps {
  data: MonthlyData[];
}

export const MonthlyBar: React.FC<MonthlyBarProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Karşılaştırma verisi bulunamadı</Text>
      </View>
    );
  }

  // Chart measurements
  const height = 180;
  const width = 300;
  const paddingBottom = 25;
  const paddingTop = 15;
  const paddingLeft = 10;
  const paddingRight = 10;

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;

  // Find max value to scale the bars
  const maxVal = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1000);

  const barWidth = 14;
  const groupGap = 20;
  const numGroups = data.length;
  const groupWidth = barWidth * 2 + 4; // width of income + expense + gap between them
  const totalGroupWidth = numGroups * groupWidth + (numGroups - 1) * groupGap;
  const startX = (chartWidth - totalGroupWidth) / 2 + paddingLeft;

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          {/* Base line */}
          <Line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            stroke="#E2E8F0"
            strokeWidth="1"
          />

          {data.map((item, index) => {
            const xPos = startX + index * (groupWidth + groupGap);

            // Heights
            const incomeHeight = (item.income / maxVal) * chartHeight;
            const expenseHeight = (item.expense / maxVal) * chartHeight;

            // Y coords
            const incomeY = height - paddingBottom - incomeHeight;
            const expenseY = height - paddingBottom - expenseHeight;

            return (
              <G key={item.monthName}>
                {/* Income Bar (Green) */}
                <Rect
                  x={xPos}
                  y={incomeY}
                  width={barWidth}
                  height={Math.max(incomeHeight, 2)} // Min 2px height
                  rx={3}
                  fill="#059669"
                />

                {/* Expense Bar (Red) */}
                <Rect
                  x={xPos + barWidth + 4}
                  y={expenseY}
                  width={barWidth}
                  height={Math.max(expenseHeight, 2)}
                  rx={3}
                  fill="#DC2626"
                />

                {/* Month Label */}
                <SvgText
                  x={xPos + barWidth}
                  y={height - 8}
                  fontSize="10"
                  fill="#64748B"
                  textAnchor="middle"
                  fontFamily="Inter"
                >
                  {item.monthName}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
          <Text style={styles.legendText}>Gelir</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Gider</Text>
        </View>
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
    width: '100%',
    alignItems: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
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
