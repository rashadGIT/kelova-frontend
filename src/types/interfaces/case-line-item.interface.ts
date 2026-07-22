import type { IPriceListItem } from './price-list-item.interface';

export interface ICaseLineItem {
  id: string;
  tenantId: string;
  caseId: string;
  priceListItemId: string;
  quantity: number;
  unitPrice: number;
  total: number;
  taxAmount: number;
  taxScheduleId: string | null;
  priceListItem: IPriceListItem;
  createdAt: string;
  updatedAt: string;
}
