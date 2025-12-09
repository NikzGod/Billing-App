import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { TrendingUp, DollarSign, FileText, Download } from 'lucide-react-native';
import { useSalesReport, useBilling } from '@/contexts/BillingContext';
import Colors from '@/constants/colors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export default function ReportsScreen() {
  const { invoices } = useBilling();
  const [period, setPeriod] = useState<'all' | 'today' | 'week' | 'month'>('month');

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date(0);
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(0);
    }

    return { startDate, endDate };
  };

  const { startDate, endDate } = getDateRange();
  const report = useSalesReport(period === 'all' ? undefined : startDate, period === 'all' ? undefined : endDate);

  const paidInvoices = invoices.filter((inv) => inv.status === 'paid').length;
  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending').length;
  const draftInvoices = invoices.filter((inv) => inv.status === 'draft').length;

  const generateReportPDF = async () => {
    const periodText = period === 'all' ? 'All Time' : period === 'today' ? 'Today' : period === 'week' ? 'Last 7 Days' : 'This Month';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0F172A; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #0891B2; margin: 0; font-size: 32px; }
            .header p { color: #64748B; margin-top: 8px; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0; }
            .stat-card { background: #F8FAFC; padding: 20px; border-radius: 12px; }
            .stat-label { color: #64748B; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
            .stat-value { color: #0891B2; font-size: 28px; font-weight: bold; }
            .section { margin: 40px 0; }
            .section-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #0F172A; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #F1F5F9; padding: 12px; text-align: left; font-size: 12px; color: #64748B; }
            td { padding: 12px; border-bottom: 1px solid #E2E8F0; }
            .footer { margin-top: 60px; text-align: center; color: #64748B; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sales Report</h1>
            <p>${periodText} - Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Sales</div>
              <div class="stat-value">₹${report.totalSales.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Invoices</div>
              <div class="stat-value">${report.totalInvoices}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Tax</div>
              <div class="stat-value">₹${report.totalTax.toFixed(2)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Invoice</div>
              <div class="stat-value">₹${report.averageInvoice.toFixed(2)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Invoice Status Breakdown</div>
            <table>
              <thead>
                <tr>
                  <th>Status</th>
                  <th style="text-align: right;">Count</th>
                  <th style="text-align: right;">Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Paid</td>
                  <td style="text-align: right;">${paidInvoices}</td>
                  <td style="text-align: right;">${invoices.length > 0 ? ((paidInvoices / invoices.length) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Pending</td>
                  <td style="text-align: right;">${pendingInvoices}</td>
                  <td style="text-align: right;">${invoices.length > 0 ? ((pendingInvoices / invoices.length) * 100).toFixed(1) : 0}%</td>
                </tr>
                <tr>
                  <td>Draft</td>
                  <td style="text-align: right;">${draftInvoices}</td>
                  <td style="text-align: right;">${invoices.length > 0 ? ((draftInvoices / invoices.length) * 100).toFixed(1) : 0}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="footer">
            <p>This report was automatically generated by your Billing Application</p>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      console.log('Report PDF generated:', uri);

      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Sales Report',
        });
      } else {
        Alert.alert('Success', 'Report PDF generated successfully');
      }
    } catch (error) {
      console.error('Report PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate report PDF');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>Sales analytics & insights</Text>
        </View>

        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[styles.periodButton, period === 'today' && styles.periodButtonActive]}
            onPress={() => setPeriod('today')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'today' && styles.periodButtonTextActive,
              ]}
            >
              Today
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'week' && styles.periodButtonActive]}
            onPress={() => setPeriod('week')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'week' && styles.periodButtonTextActive,
              ]}
            >
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'month' && styles.periodButtonActive]}
            onPress={() => setPeriod('month')}
          >
            <Text
              style={[
                styles.periodButtonText,
                period === 'month' && styles.periodButtonTextActive,
              ]}
            >
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.periodButton, period === 'all' && styles.periodButtonActive]}
            onPress={() => setPeriod('all')}
          >
            <Text
              style={[styles.periodButtonText, period === 'all' && styles.periodButtonTextActive]}
            >
              All Time
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: Colors.primary }]}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>₹{report.totalSales.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#10B981' }]}>
            <View style={styles.statIcon}>
              <FileText size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>{report.totalInvoices}</Text>
            <Text style={styles.statLabel}>Invoices</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#F59E0B' }]}>
            <View style={styles.statIcon}>
              <TrendingUp size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>₹{report.averageInvoice.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Avg Invoice</Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: '#8B5CF6' }]}>
            <View style={styles.statIcon}>
              <DollarSign size={24} color="#FFF" />
            </View>
            <Text style={styles.statValue}>₹{report.totalTax.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Tax</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invoice Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                <Text style={styles.statusText}>Paid</Text>
              </View>
              <Text style={styles.statusCount}>{paidInvoices}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: Colors.warning }]} />
                <Text style={styles.statusText}>Pending</Text>
              </View>
              <Text style={styles.statusCount}>{pendingInvoices}</Text>
            </View>

            <View style={styles.statusRow}>
              <View style={styles.statusInfo}>
                <View style={[styles.statusDot, { backgroundColor: Colors.textSecondary }]} />
                <Text style={styles.statusText}>Draft</Text>
              </View>
              <Text style={styles.statusCount}>{draftInvoices}</Text>
            </View>
          </View>
        </View>

        {report.totalDiscount > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discounts</Text>
            <View style={styles.discountCard}>
              <Text style={styles.discountValue}>₹{report.totalDiscount.toFixed(2)}</Text>
              <Text style={styles.discountLabel}>Total Discounts Given</Text>
            </View>
          </View>
        )}

        <TouchableOpacity style={styles.downloadButton} onPress={generateReportPDF}>
          <Download size={20} color="#FFF" />
          <Text style={styles.downloadButtonText}>Download PDF Report</Text>
        </TouchableOpacity>
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
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  periodButtonTextActive: {
    color: '#FFF',
  },
  statsGrid: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 16,
    color: Colors.text,
  },
  statusCount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  discountCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discountValue: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.danger,
    marginBottom: 4,
  },
  discountLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
