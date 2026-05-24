import { apiClient } from './client';

export interface PetCase {
  id: string;
  petName: string;
  species: string;
  owner: string;
  serviceType: string;
  status: string;
  pickupDate: string;
}

export interface VetClinic {
  id: string;
  clinicName: string;
  contact: string;
  email: string;
  phone: string;
}

export async function getPetCases(): Promise<PetCase[]> {
  const res = await apiClient.get<PetCase[]>('/pet-cremation/cases');
  return res.data;
}

export async function getVetClinics(): Promise<VetClinic[]> {
  const res = await apiClient.get<VetClinic[]>('/pet-cremation/clinics');
  return res.data;
}
