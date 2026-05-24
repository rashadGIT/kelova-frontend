import { apiClient } from './client';

export interface HotelLink {
  name: string;
  url: string;
  address?: string;
  phone?: string;
  rate?: string;
  bereavement?: string;
}

export interface AccommodationPage {
  id: string;
  tenantId: string;
  caseId: string;
  serviceAddress: string | null;
  hotelLinks: HotelLink[];
  notes: string | null;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  case?: { deceasedName: string; serviceType: string };
}

export interface UpsertAccommodationDto {
  serviceAddress?: string;
  hotelLinks?: HotelLink[];
  notes?: string;
  enabled?: boolean;
}

export async function getCaseAccommodations(caseId: string): Promise<AccommodationPage | null> {
  const res = await apiClient
    .get<AccommodationPage>(`/cases/${caseId}/accommodations`)
    .catch((err) => {
      if (err?.response?.status === 404) return { data: null };
      throw err;
    });
  return res.data;
}

export async function upsertAccommodations(
  caseId: string,
  dto: UpsertAccommodationDto,
): Promise<AccommodationPage> {
  const res = await apiClient.post<AccommodationPage>(`/cases/${caseId}/accommodations`, dto);
  return res.data;
}

export async function getPublicAccommodations(caseId: string): Promise<AccommodationPage> {
  const { default: axios } = await import('axios');
  const res = await axios.get<AccommodationPage>(
    `${process.env.NEXT_PUBLIC_API_URL}/accommodations/${caseId}`,
  );
  return res.data;
}
