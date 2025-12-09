import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Download } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { useBilling } from '@/contexts/BillingContext';
import Colors from '@/constants/colors';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { invoices } = useBilling();

  const invoice = invoices.find((inv) => inv.id === id);

  if (!invoice) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Invoice not found</Text>
      </View>
    );
  }

  const generatePDF = async () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0F172A; background: #fff; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #0891B2; margin: 0; font-size: 36px; font-weight: bold; }
            .invoice-info { margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
            .invoice-number { font-size: 28px; font-weight: bold; color: #0891B2; }
            .invoice-date { font-size: 14px; color: #64748B; margin-top: 4px; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600; }
            .status-paid { background: #DCFCE7; color: #16A34A; }
            .status-pending { background: #FEF3C7; color: #D97706; }
            .status-draft { background: #F3F4F6; color: #6B7280; }
            .customer-info { margin-bottom: 30px; background: #F8FAFC; padding: 20px; border-radius: 12px; }
            .label { font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; margin-bottom: 8px; }
            .customer-name { font-size: 20px; font-weight: bold; color: #0F172A; margin-bottom: 4px; }
            .customer-detail { font-size: 14px; color: #64748B; margin-bottom: 2px; }
            table { width: 100%; border-collapse: collapse; margin: 30px 0; }
            th { background: #F1F5F9; padding: 14px; text-align: left; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; }
            td { padding: 14px; border-bottom: 1px solid #E2E8F0; font-size: 14px; }
            .text-right { text-align: right; }
            .item-name { font-weight: 600; color: #0F172A; }
            .summary-table { margin-top: 30px; width: 300px; margin-left: auto; }
            .summary-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E2E8F0; }
            .summary-label { color: #64748B; font-size: 14px; }
            .summary-value { font-weight: 600; color: #0F172A; font-size: 14px; }
            .total-row { border-top: 2px solid #0891B2; padding: 14px 0; margin-top: 8px; }
            .total-label { font-size: 18px; font-weight: bold; color: #0F172A; }
            .total-value { font-size: 28px; font-weight: bold; color: #0891B2; }
            .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #E2E8F0; text-align: center; color: #64748B; font-size: 14px; }
            .footer-thank { font-size: 16px; font-weight: 600; color: #0F172A; margin-bottom: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>BILL RECEIPT</h1>
          </div>
          
          <div class="invoice-info">
            <div>
              <div class="invoice-number">${invoice.invoiceNumber}</div>
              <div class="invoice-date">${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            <div>
              <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
            </div>
          </div>

          <div class="customer-info">
            <div class="label">Bill To:</div>
            <div class="customer-name">${invoice.customerName}</div>
            ${invoice.customerEmail ? `<div class="customer-detail">${invoice.customerEmail}</div>` : ''}
            ${invoice.customerPhone ? `<div class="customer-detail">${invoice.customerPhone}</div>` : ''}
            ${invoice.customerAddress ? `<div class="customer-detail">${invoice.customerAddress}</div>` : ''}
          </div>

          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th class="text-right">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Tax %</th>
                <th class="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map(item => `
                <tr>
                  <td class="item-name">${item.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${item.price.toFixed(2)}</td>
                  <td class="text-right">${item.taxRate}%</td>
                  <td class="text-right">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="summary-table">
            <div class="summary-row">
              <div class="summary-label">Subtotal</div>
              <div class="summary-value">₹${invoice.subtotal.toFixed(2)}</div>
            </div>
            ${invoice.discount > 0 ? `
            <div class="summary-row">
              <div class="summary-label">Discount (${invoice.discount}%)</div>
              <div class="summary-value" style="color: #EF4444;">-₹${invoice.discountAmount.toFixed(2)}</div>
            </div>
            ` : ''}
            <div class="summary-row">
              <div class="summary-label">Tax</div>
              <div class="summary-value">₹${invoice.taxAmount.toFixed(2)}</div>
            </div>
            <div class="total-row" style="display: flex; justify-content: space-between;">
              <div class="total-label">TOTAL</div>
              <div class="total-value">₹${invoice.total.toFixed(2)}</div>
            </div>
          </div>

          <div class="footer">
            <div class="footer-thank">Thank you for your business!</div>
            <div>Generated on ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>
        </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      console.log('PDF generated:', uri);

      if (Platform.OS !== 'web' && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Receipt ${invoice.invoiceNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Receipt_${invoice.invoiceNumber}.pdf`;
        link.click();
      } else {
        Alert.alert('Success', 'Bill receipt PDF generated successfully');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };



  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <Text style={styles.invoiceDate}>
                {new Date(invoice.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BILL TO</Text>
          <Text style={styles.customerName}>{invoice.customerName}</Text>
          {invoice.customerEmail ? (
            <Text style={styles.customerDetail}>{invoice.customerEmail}</Text>
          ) : null}
          {invoice.customerPhone ? (
            <Text style={styles.customerDetail}>{invoice.customerPhone}</Text>
          ) : null}
          {invoice.customerAddress ? (
            <Text style={styles.customerDetail}>{invoice.customerAddress}</Text>
          ) : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemTotal}>₹{item.total.toFixed(2)}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemDetail}>Qty: {item.quantity}</Text>
                <Text style={styles.itemDetail}>× ₹{item.price.toFixed(2)}</Text>
                <Text style={styles.itemDetail}>Tax: {item.taxRate}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>₹{invoice.subtotal.toFixed(2)}</Text>
          </View>
          {invoice.discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount ({invoice.discount}%)</Text>
              <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                -₹{invoice.discountAmount.toFixed(2)}
              </Text>
            </View>
          )}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tax</Text>
            <Text style={styles.summaryValue}>₹{invoice.taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{invoice.total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.pdfButton} onPress={generatePDF}>
          <Download size={20} color="#FFF" />
          <Text style={styles.pdfButtonText}>Download Bill Receipt PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  invoiceNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  invoiceDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  itemCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  itemDetails: {
    flexDirection: 'row',
    gap: 12,
  },
  itemDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  summary: {
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pdfButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pdfButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
