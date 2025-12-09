import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useBilling } from '@/contexts/BillingContext';
import Colors from '@/constants/colors';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type { InvoiceItem, Invoice } from '@/types';

export default function NewInvoiceScreen() {
  const router = useRouter();
  const { products, customers, addInvoice } = useBilling();
  
  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState<string>('0');
  const [status, setStatus] = useState<'draft' | 'paid' | 'pending'>('pending');

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0,
      taxRate: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: string | number) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          const quantity = parseFloat(String(updated.quantity)) || 0;
          const price = parseFloat(String(updated.price)) || 0;
          const taxRate = parseFloat(String(updated.taxRate)) || 0;
          const subtotal = quantity * price;
          const tax = subtotal * (taxRate / 100);
          updated.total = subtotal + tax;
          return updated;
        }
        return item;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const discountPercent = parseFloat(discount) || 0;
  const discountAmount = subtotal * (discountPercent / 100);
  const taxAmount = items.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.price;
    return sum + (itemSubtotal * (item.taxRate / 100));
  }, 0);
  const total = subtotal - discountAmount + taxAmount;

  const selectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setItems(
        items.map((item) => {
          if (item.id === itemId) {
            const quantity = item.quantity;
            const subtotal = quantity * product.price;
            const tax = subtotal * (product.taxRate / 100);
            return {
              ...item,
              name: product.name,
              price: product.price,
              taxRate: product.taxRate,
              total: subtotal + tax,
            };
          }
          return item;
        })
      );
    }
  };

  const selectCustomer = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerName(customer.name);
      setCustomerEmail(customer.email);
      setCustomerPhone(customer.phone);
      setCustomerAddress(customer.address);
    }
  };

  const generatePDF = async (invoice: Invoice) => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #0F172A; }
            .header { text-align: center; margin-bottom: 40px; }
            .header h1 { color: #0891B2; margin: 0; font-size: 32px; }
            .invoice-info { margin-bottom: 30px; }
            .invoice-number { font-size: 24px; font-weight: bold; color: #0891B2; }
            .customer-info { margin-bottom: 30px; }
            .label { font-weight: bold; color: #64748B; font-size: 12px; text-transform: uppercase; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #F1F5F9; padding: 12px; text-align: left; font-size: 12px; color: #64748B; }
            td { padding: 12px; border-bottom: 1px solid #E2E8F0; }
            .total-row { background: #F8FAFC; font-weight: bold; }
            .grand-total { background: #0891B2; color: white; font-size: 18px; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>INVOICE</h1>
          </div>
          
          <div class="invoice-info">
            <div class="invoice-number">${invoice.invoiceNumber}</div>
            <div>${new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
          </div>

          <div class="customer-info">
            <div class="label">Bill To:</div>
            <div style="font-size: 16px; font-weight: bold; margin-top: 8px;">${invoice.customerName}</div>
            ${invoice.customerEmail ? `<div>${invoice.customerEmail}</div>` : ''}
            ${invoice.customerPhone ? `<div>${invoice.customerPhone}</div>` : ''}
            ${invoice.customerAddress ? `<div>${invoice.customerAddress}</div>` : ''}
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
                  <td>${item.name}</td>
                  <td class="text-right">${item.quantity}</td>
                  <td class="text-right">₹${item.price.toFixed(2)}</td>
                  <td class="text-right">${item.taxRate}%</td>
                  <td class="text-right">₹${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="total-row">
                <td colspan="4" class="text-right">Subtotal</td>
                <td class="text-right">₹${invoice.subtotal.toFixed(2)}</td>
              </tr>
              ${invoice.discount > 0 ? `
              <tr class="total-row">
                <td colspan="4" class="text-right">Discount (${invoice.discount}%)</td>
                <td class="text-right">-₹${invoice.discountAmount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="total-row">
                <td colspan="4" class="text-right">Tax</td>
                <td class="text-right">₹${invoice.taxAmount.toFixed(2)}</td>
              </tr>
              <tr class="grand-total">
                <td colspan="4" class="text-right">TOTAL</td>
                <td class="text-right">₹${invoice.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #E2E8F0; text-align: center; color: #64748B; font-size: 12px;">
            <div>Thank you for your business!</div>
            <div style="margin-top: 8px;">Status: <strong style="color: ${invoice.status === 'paid' ? '#10B981' : '#F59E0B'};">${invoice.status.toUpperCase()}</strong></div>
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
          dialogTitle: `Invoice ${invoice.invoiceNumber}`,
        });
      } else {
        Alert.alert('Success', 'Invoice PDF generated successfully');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF');
    }
  };

  const handleSave = async () => {
    if (!customerName.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Error', 'Please add at least one item');
      return;
    }

    const hasEmptyItems = items.some((item) => !item.name.trim());
    if (hasEmptyItems) {
      Alert.alert('Error', 'Please fill in all item names');
      return;
    }

    const invoice = addInvoice({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      customerAddress: customerAddress.trim(),
      items,
      subtotal,
      discount: discountPercent,
      discountAmount,
      taxAmount,
      total,
      status,
    });

    await generatePDF(invoice);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          
          {customers.length > 0 && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Customer</Text>
              <View style={styles.customerSelect}>
                {customers.map((customer) => (
                  <TouchableOpacity
                    key={customer.id}
                    style={styles.customerOption}
                    onPress={() => selectCustomer(customer.id)}
                  >
                    <Text style={styles.customerOptionText}>{customer.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              value={customerName}
              onChangeText={setCustomerName}
              placeholder="Customer name"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={customerEmail}
              onChangeText={setCustomerEmail}
              placeholder="customer@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={customerPhone}
              onChangeText={setCustomerPhone}
              placeholder="+91 XXXXX XXXXX"
              keyboardType="phone-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Address</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={customerAddress}
              onChangeText={setCustomerAddress}
              placeholder="Customer address"
              multiline
              numberOfLines={2}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Items</Text>
            <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addItemButtonText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemNumber}>Item {index + 1}</Text>
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <X size={20} color={Colors.danger} />
                </TouchableOpacity>
              </View>

              {products.length > 0 && (
                <View style={styles.productSelect}>
                  <Text style={styles.inputLabel}>Quick Select</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {products.map((product) => (
                      <TouchableOpacity
                        key={product.id}
                        style={styles.productChip}
                        onPress={() => selectProduct(item.id, product.id)}
                      >
                        <Text style={styles.productChipText}>{product.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={item.name}
                  onChangeText={(value) => updateItem(item.id, 'name', value)}
                  placeholder="Item name"
                  placeholderTextColor={Colors.textSecondary}
                />
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.input}
                    value={item.quantity.toString()}
                    onChangeText={(value) =>
                      updateItem(item.id, 'quantity', parseFloat(value) || 0)
                    }
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Price</Text>
                  <TextInput
                    style={styles.input}
                    value={item.price.toString()}
                    onChangeText={(value) => updateItem(item.id, 'price', parseFloat(value) || 0)}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Tax %</Text>
                  <TextInput
                    style={styles.input}
                    value={item.taxRate.toString()}
                    onChangeText={(value) =>
                      updateItem(item.id, 'taxRate', parseFloat(value) || 0)
                    }
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor={Colors.textSecondary}
                  />
                </View>
              </View>

              <View style={styles.itemTotal}>
                <Text style={styles.itemTotalLabel}>Total:</Text>
                <Text style={styles.itemTotalValue}>₹{item.total.toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {items.length === 0 && (
            <View style={styles.emptyItems}>
              <Text style={styles.emptyItemsText}>No items added yet</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Details</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Discount (%)</Text>
            <TextInput
              style={styles.input}
              value={discount}
              onChangeText={setDiscount}
              placeholder="0"
              keyboardType="decimal-pad"
              placeholderTextColor={Colors.textSecondary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusOptions}>
              <TouchableOpacity
                style={[styles.statusOption, status === 'draft' && styles.statusOptionActive]}
                onPress={() => setStatus('draft')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === 'draft' && styles.statusOptionTextActive,
                  ]}
                >
                  Draft
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOption, status === 'pending' && styles.statusOptionActive]}
                onPress={() => setStatus('pending')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === 'pending' && styles.statusOptionTextActive,
                  ]}
                >
                  Pending
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusOption, status === 'paid' && styles.statusOptionActive]}
                onPress={() => setStatus('paid')}
              >
                <Text
                  style={[
                    styles.statusOptionText,
                    status === 'paid' && styles.statusOptionTextActive,
                  ]}
                >
                  Paid
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>₹{subtotal.toFixed(2)}</Text>
            </View>
            {discountPercent > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount ({discountPercent}%)</Text>
                <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                  -₹{discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>₹{taxAmount.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>₹{total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save & Generate PDF</Text>
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
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  customerSelect: {
    marginBottom: 16,
  },
  customerOption: {
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customerOptionText: {
    fontSize: 14,
    color: Colors.text,
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  itemCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemNumber: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  productSelect: {
    marginBottom: 12,
  },
  productChip: {
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productChipText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  itemTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  itemTotalLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  itemTotalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  emptyItems: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyItemsText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statusOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusOptionTextActive: {
    color: '#FFF',
  },
  summary: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
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
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFF',
  },
});
