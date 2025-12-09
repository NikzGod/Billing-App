export interface Product {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  stock: number;
  category: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  taxRate: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: 'draft' | 'paid' | 'pending';
  createdAt: string;
  paidAt?: string;
}

export interface SalesReport {
  totalSales: number;
  totalInvoices: number;
  totalTax: number;
  totalDiscount: number;
  averageInvoice: number;
}
