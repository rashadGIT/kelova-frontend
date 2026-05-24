import { apiClient } from './client';

export interface StoreProduct {
  id: string;
  name: string;
  type: string;
  price: number;
  commission: number;
  active: boolean;
}

export interface StoreOrder {
  id: string;
  customer: string;
  product: string;
  total: number;
  status: string;
  date: string;
}

export async function getStoreProducts(): Promise<StoreProduct[]> {
  const res = await apiClient.get<StoreProduct[]>('/store/products');
  return res.data;
}

export async function getStoreOrders(): Promise<StoreOrder[]> {
  const res = await apiClient.get<StoreOrder[]>('/store/orders');
  return res.data;
}
