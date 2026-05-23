import { apiClient } from './client';

export interface TradeCase {
  id: string;
  deceasedName: string;
  partner: string;
  serviceType: string;
  status: string;
  completed: string | null;
}

export interface TradePartner {
  id: string;
  partnerName: string;
  contact: string;
  commissionPct: number;
  portalToken: string;
}

export async function getTradeCases(): Promise<TradeCase[]> {
  const res = await apiClient.get<TradeCase[]>('/trade-portal/cases');
  return res.data;
}

export async function getTradePartners(): Promise<TradePartner[]> {
  const res = await apiClient.get<TradePartner[]>('/trade-portal/partners');
  return res.data;
}
