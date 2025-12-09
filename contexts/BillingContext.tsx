import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import type { Product, Customer, Invoice } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'billing_products',
  CUSTOMERS: 'billing_customers',
  INVOICES: 'billing_invoices',
  INVOICE_COUNTER: 'billing_invoice_counter',
};

export const [BillingProvider, useBilling] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceCounter, setInvoiceCounter] = useState<number>(1);

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const invoicesQuery = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVOICES);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const counterQuery = useQuery({
    queryKey: ['invoiceCounter'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.INVOICE_COUNTER);
      return stored ? parseInt(stored, 10) : 1;
    },
  });

  useEffect(() => {
    if (productsQuery.data) setProducts(productsQuery.data);
  }, [productsQuery.data]);

  useEffect(() => {
    if (customersQuery.data) setCustomers(customersQuery.data);
  }, [customersQuery.data]);

  useEffect(() => {
    if (invoicesQuery.data) setInvoices(invoicesQuery.data);
  }, [invoicesQuery.data]);

  useEffect(() => {
    if (counterQuery.data) setInvoiceCounter(counterQuery.data);
  }, [counterQuery.data]);

  const saveProductsMutation = useMutation({
    mutationFn: async (newProducts: Product[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(newProducts));
      return newProducts;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['products'], data);
    },
  });

  const saveCustomersMutation = useMutation({
    mutationFn: async (newCustomers: Customer[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(newCustomers));
      return newCustomers;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['customers'], data);
    },
  });

  const saveInvoicesMutation = useMutation({
    mutationFn: async (newInvoices: Invoice[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(newInvoices));
      return newInvoices;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['invoices'], data);
    },
  });

  const saveCounterMutation = useMutation({
    mutationFn: async (counter: number) => {
      await AsyncStorage.setItem(STORAGE_KEYS.INVOICE_COUNTER, counter.toString());
      return counter;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['invoiceCounter'], data);
    },
  });

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    saveProductsMutation.mutate(updated);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updated = products.map((p) => (p.id === id ? { ...p, ...updates } : p));
    setProducts(updated);
    saveProductsMutation.mutate(updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveProductsMutation.mutate(updated);
  };

  const addCustomer = (customer: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const updated = [...customers, newCustomer];
    setCustomers(updated);
    saveCustomersMutation.mutate(updated);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(updated);
    saveCustomersMutation.mutate(updated);
  };

  const deleteCustomer = (id: string) => {
    const updated = customers.filter((c) => c.id !== id);
    setCustomers(updated);
    saveCustomersMutation.mutate(updated);
  };

  const addInvoice = (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>) => {
    const invoiceNumber = `INV-${String(invoiceCounter).padStart(5, '0')}`;
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };
    const updated = [...invoices, newInvoice];
    setInvoices(updated);
    saveInvoicesMutation.mutate(updated);
    setInvoiceCounter(invoiceCounter + 1);
    saveCounterMutation.mutate(invoiceCounter + 1);
    return newInvoice;
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    const updated = invoices.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv));
    setInvoices(updated);
    saveInvoicesMutation.mutate(updated);
  };

  const deleteInvoice = (id: string) => {
    const updated = invoices.filter((inv) => inv.id !== id);
    setInvoices(updated);
    saveInvoicesMutation.mutate(updated);
  };

  const getCustomerInvoices = (customerId: string) => {
    return invoices.filter((inv) => inv.customerId === customerId);
  };

  return {
    products,
    customers,
    invoices,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    getCustomerInvoices,
    isLoading:
      productsQuery.isLoading ||
      customersQuery.isLoading ||
      invoicesQuery.isLoading ||
      counterQuery.isLoading,
  };
});

export function useFilteredInvoices(searchQuery: string) {
  const { invoices } = useBilling();
  return useMemo(() => {
    if (!searchQuery.trim()) return invoices;
    const query = searchQuery.toLowerCase();
    return invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query)
    );
  }, [invoices, searchQuery]);
}

export function useSalesReport(startDate?: Date, endDate?: Date) {
  const { invoices } = useBilling();
  return useMemo(() => {
    let filteredInvoices = invoices.filter((inv) => inv.status === 'paid');

    if (startDate && endDate) {
      filteredInvoices = filteredInvoices.filter((inv) => {
        const date = new Date(inv.createdAt);
        return date >= startDate && date <= endDate;
      });
    }

    const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
    const totalTax = filteredInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discountAmount, 0);

    return {
      totalSales,
      totalInvoices: filteredInvoices.length,
      totalTax,
      totalDiscount,
      averageInvoice: filteredInvoices.length > 0 ? totalSales / filteredInvoices.length : 0,
    };
  }, [invoices, startDate, endDate]);
}
