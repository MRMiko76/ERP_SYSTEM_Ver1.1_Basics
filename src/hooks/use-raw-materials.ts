import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface RawMaterial {
  id: string;
  name: string;
  description?: string;
  sku: string;
  type: 'PRODUCTION' | 'PACKAGING';
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  totalValue: number;
  warehouseId?: string;
  locationInWarehouse?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  warehouse?: {
    id: string;
    name: string;
  };
}

interface RawMaterialsResponse {
  rawMaterials: RawMaterial[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface RawMaterialsParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  active?: string;
  warehouseId?: string;
}

interface CreateRawMaterialData {
  name: string;
  description?: string;
  sku: string;
  type: 'PRODUCTION' | 'PACKAGING';
  unit: string;
  currentStock: number;
  minimumStock: number;
  unitCost: number;
  warehouseId?: string;
  locationInWarehouse?: string;
  active?: boolean;
}

interface UpdateRawMaterialData {
  name?: string;
  description?: string;
  sku?: string;
  type?: 'PRODUCTION' | 'PACKAGING';
  unit?: string;
  currentStock?: number;
  minimumStock?: number;
  unitCost?: number;
  warehouseId?: string;
  locationInWarehouse?: string;
  active?: boolean;
}

interface StockMovement {
  id: string;
  rawMaterialId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  reference?: string;
  notes?: string;
  createdAt: Date;
  rawMaterial: {
    name: string;
    sku: string;
  };
}

// Query keys
const QUERY_KEYS = {
  rawMaterials: (params: RawMaterialsParams) => ['raw-materials', params],
  rawMaterial: (id: string) => ['raw-materials', id],
  stockMovements: (materialId: string) => ['stock-movements', materialId],
} as const;

// Fetch raw materials with caching
export function useRawMaterials(params: RawMaterialsParams = {}) {
  return useQuery({
    queryKey: QUERY_KEYS.rawMaterials(params),
    queryFn: async (): Promise<RawMaterialsResponse> => {
      const searchParams = new URLSearchParams();
      
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
      if (params.search) searchParams.set('search', params.search);
      if (params.type) searchParams.set('type', params.type);
      if (params.active) searchParams.set('active', params.active);
      if (params.warehouseId) searchParams.set('warehouseId', params.warehouseId);
      
      const url = `/api/raw-materials?${searchParams.toString()}`;
      const response = await axios.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch single raw material
export function useRawMaterial(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.rawMaterial(id),
    queryFn: async (): Promise<RawMaterial> => {
      const response = await axios.get(`/api/raw-materials/${id}`);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Create raw material mutation
export function useCreateRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateRawMaterialData): Promise<RawMaterial> => {
      const response = await axios.post('/api/raw-materials', data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch raw materials list
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}

// Update raw material mutation
export function useUpdateRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateRawMaterialData }): Promise<RawMaterial> => {
      const response = await axios.put(`/api/raw-materials/${id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update specific raw material in cache
      queryClient.setQueryData(QUERY_KEYS.rawMaterial(data.id), data);
      // Invalidate raw materials list
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}

// Delete raw material mutation
export function useDeleteRawMaterial() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await axios.delete(`/api/raw-materials/${id}`);
    },
    onSuccess: () => {
      // Invalidate raw materials list
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
    },
  });
}

// Get stock movements for a raw material
export function useStockMovements(materialId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.stockMovements(materialId),
    queryFn: async (): Promise<StockMovement[]> => {
      const response = await axios.get(`/api/raw-materials/${materialId}/stock-movements`);
      return response.data;
    },
    enabled: !!materialId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Adjust stock mutation
export function useAdjustStock() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      materialId, 
      quantity, 
      type, 
      unitCost, 
      reference, 
      notes 
    }: {
      materialId: string;
      quantity: number;
      type: 'IN' | 'OUT' | 'ADJUSTMENT';
      unitCost?: number;
      reference?: string;
      notes?: string;
    }) => {
      const response = await axios.post(`/api/raw-materials/${materialId}/adjust-stock`, {
        quantity,
        type,
        unitCost,
        reference,
        notes,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['raw-materials'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.rawMaterial(variables.materialId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.stockMovements(variables.materialId) });
    },
  });
}

// Get low stock materials
export function useLowStockMaterials() {
  return useQuery({
    queryKey: ['low-stock-materials'],
    queryFn: async (): Promise<RawMaterial[]> => {
      const response = await axios.get('/api/raw-materials/low-stock');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export type {
  RawMaterial,
  RawMaterialsResponse,
  RawMaterialsParams,
  CreateRawMaterialData,
  UpdateRawMaterialData,
  StockMovement,
};