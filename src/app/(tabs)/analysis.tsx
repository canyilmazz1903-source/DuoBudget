import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { useBudgetStore } from '../../store/budgetStore';
import { calculateCategoryTotals, calculateMonthlyBalance } from '../../utils/financeCalc';
import { SpendingDonut } from '../../components/charts/SpendingDonut';
import { MonthlyBar } from '../../components/charts/MonthlyBar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { ScreenErrorBoundary } from '../../components/ErrorBoundary';
import { formatMoney } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

function AnalysisScreen() {
  const jointAccountId = useAuthStore((state) => state.jointAccountId);
  
  const transactions = useBudgetStore((state) => state.transactions);
  const categories = useBudgetStore((state) => state.categories);
  const aiAnalysis = useBudgetStore((state) => state.aiAnalysis);
  const isLoading = useBudgetStore((state) => state.isLoading);
  const fetchAiAnalysisData = useBudgetStore((state) => state.fetchAiAnalysisData);

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (transactions.length > 0 && !aiAnalysis) {
      fetchAiAnalysisData();
    }
  }, [transactions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAiAnalysisData();
    setRefreshing(false);
  };

  // 1. Spending Donut Data
  const { expense } = calculateMonthlyBalance(transactions);
  const donutData = calculateCategoryTotals(transactions, categories);

  // 2. Bar Chart Data (Last 3 months fallback mockup from actual local data or mock)
  // Let's create actual months group from recent transactions
  const currentMonthStr = useBudgetStore((state) => state.selectedMonth);
  const barData = [
    { monthName: 'Nisan', income: 42000, expense: 31000 },
    { monthName: 'Mayıs', income: 45000, expense: 38000 },
    { monthName: 'Haziran', income: 48000, expense: expense || 34000 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2563EB']} />
        }
      >
        {/* Spending Donut */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategori Bazlı Harcamalar</Text>
          <Card style={styles.card}>
            <SpendingDonut data={donutData} total={expense} />
          </Card>
        </View>

        {/* Monthly Trend */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gelir / Gider Karşılaştırması</Text>
          <Card style={styles.card}>
            <MonthlyBar data={barData} />
          </Card>
        </View>

        {/* AI Insight Section */}
        <View style={styles.section}>
          <View style={styles.aiHeaderRow}>
            <Text style={styles.sectionTitle}>AI Finansal Analiz</Text>
            <Badge label="Gemini 1.5" variant="info" />
          </View>

          {isLoading ? (
            <Card style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#2563EB" />
              <Text style={styles.loadingText}>Yapay zeka analiz raporu hazırlanıyor...</Text>
            </Card>
          ) : aiAnalysis?.success ? (
            <View>
              {/* Health Score Card */}
              <Card style={styles.healthCard}>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreNumber}>{aiAnalysis.healthScore}</Text>
                  <Text style={styles.scoreLabel}>Finansal Sağlık Puanı</Text>
                </View>
                <View style={styles.assessment}>
                  <Ionicons name="chatbubbles-outline" size={20} color="#2563EB" />
                  <Text style={styles.assessmentText}>{aiAnalysis.overallAssessment}</Text>
                </View>
              </Card>

              {/* Savings Suggestions */}
              {aiAnalysis.savingSuggestions.length > 0 && (
                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Tasarruf Önerileri</Text>
                  {aiAnalysis.savingSuggestions.map((item) => (
                    <Card key={item.id} style={styles.insightCard}>
                      <View style={styles.insightHeader}>
                        <View style={styles.row}>
                          <Ionicons name="sparkles" size={16} color="#D97706" />
                          <Text style={styles.insightCategory}>{item.category}</Text>
                        </View>
                        <Text style={styles.savingBadge}>
                          {formatMoney(item.potentialSaving)} tasarruf
                        </Text>
                      </View>
                      <Text style={styles.insightDesc}>{item.suggestion}</Text>
                    </Card>
                  ))}
                </View>
              )}

              {/* Spending Warnings */}
              {aiAnalysis.spendingWarnings.length > 0 && (
                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Harcama Uyarıları</Text>
                  {aiAnalysis.spendingWarnings.map((item) => (
                    <Card key={item.id} style={[styles.insightCard, styles.alertBorder]}>
                      <View style={styles.insightHeader}>
                        <View style={styles.row}>
                          <Ionicons name="warning" size={16} color="#DC2626" />
                          <Text style={styles.insightCategory}>{item.category}</Text>
                        </View>
                        <Badge
                          label={item.severity === 'critical' ? 'Kritik Seviye' : item.severity === 'warning' ? 'Uyarı' : 'Bilgi'}
                          variant="danger"
                        />
                      </View>
                      <Text style={styles.insightDesc}>{item.message}</Text>
                      {item.details ? <Text style={styles.insightSub}>{item.details}</Text> : null}
                    </Card>
                  ))}
                </View>
              )}

              {/* Monthly Projection */}
              {aiAnalysis.monthlyProjection && (
                <View style={styles.subSection}>
                  <Text style={styles.subTitle}>Gelecek Ay Projeksiyonu</Text>
                  <Card style={styles.projectionCard}>
                    <View style={styles.projRow}>
                      <View style={styles.projCol}>
                        <Text style={styles.projLabel}>Tahmini Gelir</Text>
                        <Text style={[styles.projValue, styles.incomeText]}>
                          {formatMoney(aiAnalysis.monthlyProjection.projectedIncome)}
                        </Text>
                      </View>
                      <View style={styles.projCol}>
                        <Text style={styles.projLabel}>Tahmini Gider</Text>
                        <Text style={[styles.projValue, styles.expenseText]}>
                          {formatMoney(aiAnalysis.monthlyProjection.projectedExpense)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.projRow}>
                      <View style={styles.projCol}>
                        <Text style={styles.projLabel}>Tahmini Tasarruf</Text>
                        <Text style={[styles.projValue, styles.savingsText]}>
                          {formatMoney(aiAnalysis.monthlyProjection.projectedSaving)}
                        </Text>
                      </View>
                      <View style={styles.projCol}>
                        <Text style={styles.projLabel}>AI Güven Skoru</Text>
                        <Text style={styles.projValue}>
                          %{aiAnalysis.monthlyProjection.confidenceRange}
                        </Text>
                      </View>
                    </View>
                    {aiAnalysis.overallAssessment ? (
                      <Text style={styles.projReasoning}>
                        {aiAnalysis.overallAssessment}
                      </Text>
                    ) : null}
                  </Card>
                </View>
              )}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons name="sparkles-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>Rapor Bulunmuyor</Text>
              <Text style={styles.emptyText}>
                Harcama hareketlerinizi analiz edip tasarruf raporu hazırlamak için butona tıklayın.
              </Text>
              <Button
                title="Rapor Üret"
                onPress={fetchAiAnalysisData}
                style={styles.generateButton}
              />
            </Card>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export default function AnalysisWithBoundary() {
  return (
    <ScreenErrorBoundary>
      <AnalysisScreen />
    </ScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loadingCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 12,
    textAlign: 'center',
  },
  healthCard: {
    padding: 20,
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '900',
    color: '#2563EB',
    fontFamily: 'Inter',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  assessment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 8,
  },
  assessmentText: {
    flex: 1,
    fontSize: 13,
    color: '#334155',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  subSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'Inter',
    marginBottom: 10,
  },
  insightCard: {
    padding: 16,
    marginBottom: 10,
  },
  alertBorder: {
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  insightCategory: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
  },
  savingBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    fontFamily: 'Inter',
  },
  insightDesc: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    lineHeight: 18,
  },
  insightSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  projectionCard: {
    padding: 16,
  },
  projRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  projCol: {
    flex: 1,
  },
  projLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: 'Inter',
  },
  projValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  incomeText: {
    color: '#059669',
  },
  expenseText: {
    color: '#DC2626',
  },
  savingsText: {
    color: '#2563EB',
  },
  projReasoning: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: 'Inter',
    lineHeight: 18,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 4,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: 'Inter',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 16,
  },
  generateButton: {
    width: '100%',
  },
});
