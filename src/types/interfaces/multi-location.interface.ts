export interface ILocationSummary {
  locationId: string;
  tenantId: string;
  displayName: string;
  activeCases: number;
  casesThisMonth: number;
  revenueTotal: number;
}

export interface IMultiLocationSummary {
  ownerGroupId: string;
  locations: ILocationSummary[];
  totals: {
    activeCases: number;
    casesThisMonth: number;
    revenueTotal: number;
  };
}
