import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface PurchaseOrderItem {
  id: string;
  rawMaterialId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity: number;
  rawMaterial: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  status: 'DRAFT' | 'APPROVED' | 'EXECUTED' | 'CANCELLED';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  items: PurchaseOrderItem[];
}

interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface PurchaseOrdersParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface CreatePurchaseOrderData {
  supplierId: string;
  expectedDeliveryDate?: Date;
  notes?: string;
  items: {
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

interface UpdatePurchaseOrderData {
  supplierId?: string;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  items?: {
    id?: string;
    rawMaterialId: string;
    quantity: number;
    unitPrice: number;
  }[];
}

// Query keys
const QUERY_KEYS = {
  purchaseOrders: (params: PurchaseOrdersParams) => ['purchase-orders', params],
  purchaseOrder: (id: string) => ['purchase-orders', id],
  purchaseOrderStats: () => ['purchase-order-stats'],
} as const;

// Fetch purchase orders with caching
export function usePurchaseOrders(params: PurchaseOrdersParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrders(params),
    queryFn: async (): Promise<PurchaseOrdersResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.status) searchParams.set('status', params.status);
      if (params.supplierId) searchParams.set('supplierId', params.supplierId);
      if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.set('dateTo', params.dateTo);
      
      const url = `/api/purchase-orders?${searchParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single purchase order
export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrder(id),
    queryFn: async (): Promise<PurchaseOrder> => {
      const response = await axios.get(`/api/purchase-orders/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create purchase order mutation
export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreatePurchaseOrderData): Promise<PurchaseOrder> => {
      const response = await axios.post('/api/purchase-orders', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
    },
  });
}

// Update purchase order mutation
export function useUpdatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePurchaseOrderData }): Promise<PurchaseOrder> => {
      const response = await axios.put(`/api/purchase-orders/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific purchase order in cache
      queryClient.setQueryData(QUERY_KEYS.purchaseOrder(data.id), data);
      // Invalidate purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
    },
  });
}

// Delete purchase order mutation
export function useDeletePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/purchase-orders/${id}`);
    },
    onSuccess: () => {
      // Invalidate purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
    },
  });
}

// Approve purchase order mutation
export function useApprovePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<PurchaseOrder> => {
      const response = await axios.post(`/api/purchase-orders/${id}/approve`);
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific purchase order in cache
      queryClient.setQueryData(QUERY_KEYS.purchaseOrder(data.id), data);
      // Invalidate purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
      // Invalidate supplier data as balance might change
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Execute purchase order mutation
export function useExecutePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      actualDeliveryDate, 
      receivedItems 
    }: {
      id: string;
      actualDeliveryDate?: Date;
      receivedItems: {
        itemId: string;
        receivedQuantity: number;
      }[];
    }): Promise<PurchaseOrder> => {
      const response = await axios.post(`/api/purchase-orders/${id}/execute`, {
        actualDeliveryDate,
        receivedItems,
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific purchase order in cache
      queryClient.setQueryData(QUERY_KEYS.purchaseOrder(data.id), data);
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  });
}

// Cancel purchase order mutation
export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }): Promise<PurchaseOrder> => {
      const response = await axios.post(`/api/purchase-orders/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific purchase order in cache
      queryClient.setQueryData(QUERY_KEYS.purchaseOrder(data.id), data);
      // Invalidate purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.purchaseOrderStats() });
    },
  });
}

// Get purchase order statistics
export function usePurchaseOrderStats() {
  return useQuery({
    queryKey: QUERY_KEYS.purchaseOrderStats(),
    queryFn: async () => {
      const response = await axios.get('/api/purchase-orders/stats');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Generate purchase order number
export function useGeneratePurchaseOrderNumber() {
  return useMutation({
    mutationFn: async (): Promise<{ orderNumber: string }> => {
      const response = await axios.post('/api/purchase-orders/generate-number');
      return response.data;
    },
  });
}

// Duplicate purchase order
export function useDuplicatePurchaseOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<PurchaseOrder> => {
      const response = await axios.post(`/api/purchase-orders/${id}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate purchase orders list
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  });
}

export type {
  PurchaseOrder,
  PurchaseOrderItem,
  PurchaseOrdersResponse,
  PurchaseOrdersParams,
  CreatePurchaseOrderData,
  UpdatePurchaseOrderData,
};