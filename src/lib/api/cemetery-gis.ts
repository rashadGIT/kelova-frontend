import { apiClient } from './client';

export interface CemeterySection {
  id: string;
  name: string;
  available: number;
  occupied: number;
  reserved: number;
}

export interface CemeteryAppointment {
  id: string;
  prospect: string;
  email: string;
  phone: string;
  scheduled: string;
  status: string;
  notes: string;
}

export interface CemeteryLead {
  id: string;
  name: string;
  email: string;
  phone: string;
  budget: string;
  source: string;
  status: string;
}

export interface WorkOrder {
  id: string;
  type: string;
  plotSection: string;
  assignedTo: string;
  scheduled: string;
  status: 'pending' | 'completed';
}

export async function getCemeterySections(): Promise<CemeterySection[]> {
  const res = await apiClient.get<CemeterySection[]>('/cemetery/sections');
  return res.data;
}

export async function getCemeteryAppointments(): Promise<CemeteryAppointment[]> {
  const res = await apiClient.get<CemeteryAppointment[]>('/cemetery-gis/appointments');
  return res.data;
}

export async function getCemeteryLeads(): Promise<CemeteryLead[]> {
  const res = await apiClient.get<CemeteryLead[]>('/cemetery-gis/leads');
  return res.data;
}

export async function getWorkOrders(): Promise<WorkOrder[]> {
  const res = await apiClient.get<WorkOrder[]>('/cemetery-gis/work-orders');
  return res.data;
}
