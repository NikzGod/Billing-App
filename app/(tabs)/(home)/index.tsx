import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, TrendingUp, FileText, DollarSign } from 'lucide-react-native';
import { useBilling, useSalesReport } from '@/contexts/BillingContext';
import Colors from '@/constants/colors';

export default function HomeScreen() {
  const router = useRouter();
  const { invoices, customers, products } = useBilling();
  const report = useSalesReport();

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back!</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <View style={styles.statIconContainer}>
              <DollarSign size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>₹{report.totalSales.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>

          <View style={styles.statRow}>
            <View style={[styles.statCardSmall, { backgroundColor: '#F0F9FF' }]}>
              <FileText size={20} color={Colors.primary} />
              <Text style={[styles.statValueSmall, { color: Colors.text }]}>
                {report.totalInvoices}
              </Text>
              <Text style={styles.statLabelSmall}>Invoices</Text>
            </View>

            <View style={[styles.statCardSmall, { backgroundColor: '#FEF3C7' }]}>
              <TrendingUp size={20} color={Colors.warning} />
              <Text style={[styles.statValueSmall, { color: Colors.text }]}>
                {pendingInvoices}
              </Text>
              <Text style={styles.statLabelSmall}>Pending</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push('/new-invoice')}
        >
          <Plus size={24} color="#FFF" />
          <Text style={styles.createButtonText}>Create New Invoice</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Invoices</Text>
          {recentInvoices.length === 0 ? (
            <View style={styles.emptyState}>
              <FileText size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>No invoices yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Create your first invoice to get started
              </Text>
            </View>
          ) : (
            recentInvoices.map((invoice) => (
              <TouchableOpacity
                key={invoice.id}
                style={styles.invoiceCard}
                onPress={() => router.push(`/invoice-detail?id=${invoice.id}`)}
              >
                <View style={styles.invoiceCardHeader}>
                  <View>
                    <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                    <Text style={styles.invoiceCustomer}>{invoice.customerName}</Text>
                  </View>
                  <View style={styles.invoiceRight}>
                    <Text style={styles.invoiceAmount}>₹{invoice.total.toFixed(2)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            invoice.status === 'paid'
                              ? '#DCFCE7'
                              : invoice.status === 'pending'
                              ? '#FEF3C7'
                              : '#F3F4F6',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color:
                              invoice.status === 'paid'
                                ? Colors.success
                                : invoice.status === 'pending'
                                ? Colors.warning
                                : Colors.textSecondary,
                          },
                        ]}
                      >
                        {invoice.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.invoiceDate}>
                  {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={styles.quickStats}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{products.length}</Text>
            <Text style={styles.quickStatLabel}>Products</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>{customers.length}</Text>
            <Text style={styles.quickStatLabel}>Customers</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatValue}>₹{report.averageInvoice.toFixed(0)}</Text>
            <Text style={styles.quickStatLabel}>Avg Invoice</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  primaryCard: {
    backgroundColor: Colors.primary,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCardSmall: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValueSmall: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 8,
    marginBottom: 2,
  },
  statLabelSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: Colors.card,
    borderRadius: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  invoiceCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  invoiceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  invoiceNumber: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  invoiceCustomer: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  invoiceRight: {
    alignItems: 'flex-end',
  },
  invoiceAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  invoiceDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quickStats: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    marginBottom: 24,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  quickStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 12,
  },
});
