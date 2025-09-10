import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  active: boolean;
  balance: number;
  totalPurchases: number;
  lastPurchaseDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface SuppliersResponse {
  suppliers: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SuppliersParams {
  page?: number;
  limit?: number;
  search?: string;
  active?: string;
}

interface CreateSupplierData {
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  active?: boolean;
}

interface UpdateSupplierData {
  name?: string;
  contactPerson?: string;
  phone?: string;
  address?: string;
  active?: boolean;
}

// Query keys
const QUERY_KEYS = {
  suppliers: (params: SuppliersParams) => ['suppliers', params],
  supplier: (id: string) => ['suppliers', id],
} as const;

// Fetch suppliers with caching
export function useSuppliers(params: SuppliersParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.suppliers(params),
    queryFn: async (): Promise<SuppliersResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.active) searchParams.set('active', params.active);
      
      const url = `/api/suppliers?${searchParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single supplier
export function useSupplier(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.supplier(id),
    queryFn: async (): Promise<Supplier> => {
      const response = await axios.get(`/api/suppliers/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create supplier mutation
export function useCreateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSupplierData): Promise<Supplier> => {
      const response = await axios.post('/api/suppliers', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch suppliers list
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Update supplier mutation
export function useUpdateSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierData }): Promise<Supplier> => {
      const response = await axios.put(`/api/suppliers/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific supplier in cache
      queryClient.setQueryData(QUERY_KEYS.supplier(data.id), data);
      // Invalidate suppliers list
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Delete supplier mutation
export function useDeleteSupplier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/suppliers/${id}`);
    },
    onSuccess: () => {
      // Invalidate suppliers list
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Get supplier transactions
export function useSupplierTransactions(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-transactions', supplierId],
    queryFn: async () => {
      const response = await axios.get(`/api/suppliers/${supplierId}/transactions`);
      return response.data;
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Get supplier purchase orders
export function useSupplierPurchaseOrders(supplierId: string) {
  return useQuery({
    queryKey: ['supplier-purchase-orders', supplierId],
    queryFn: async () => {
      const response = await axios.get(`/api/suppliers/${supplierId}/purchase-orders`);
      return response.data;
    },
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export type {
  Supplier,
  SuppliersResponse,
  SuppliersParams,
  CreateSupplierData,
  UpdateSupplierData,
};