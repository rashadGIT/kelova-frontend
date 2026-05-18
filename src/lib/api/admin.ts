import { apiClient } from './client';
import { UserRole } from '@/types';

// ── Tenants ───────────────────────────────────────────────────────────────

export interface AdminTenant {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  planTier: string;
  active: boolean;
  createdAt: string;
  _count: { users: number; cases: number };
}

export interface CreateTenantDto {
  name: string;
  slug: string;
  planTier?: 'pilot' | 'starter' | 'growth' | 'enterprise';
}

export interface UpdateTenantDto {
  planTier?: 'pilot' | 'starter' | 'growth' | 'enterprise';
  active?: boolean;
}

export async function getAdminTenants(): Promise<AdminTenant[]> {
  const res = await apiClient.get<AdminTenant[]>('/super-admin/tenants');
  return res.data;
}

export async function createAdminTenant(dto: CreateTenantDto): Promise<AdminTenant> {
  const res = await apiClient.post<AdminTenant>('/super-admin/tenants', dto);
  return res.data;
}

export async function updateAdminTenant(id: string, dto: UpdateTenantDto): Promise<AdminTenant> {
  const res = await apiClient.patch<AdminTenant>(`/super-admin/tenants/${id}`, dto);
  return res.data;
}

export async function getAdminTenantCases(tenantId: string) {
  const res = await apiClient.get(`/super-admin/tenants/${tenantId}/cases`);
  return res.data;
}

export async function impersonateTenant(
  tenantId: string,
): Promise<{ token: string; expiresAt: string }> {
  const res = await apiClient.post<{ token: string; expiresAt: string }>(
    `/super-admin/impersonate/${tenantId}`,
  );
  return res.data;
}

// ── Users ─────────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  tenant: { id: string; name: string; slug: string };
}

export interface CreateAdminUserDto {
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  temporaryPassword: string;
}

export interface UpdateAdminUserDto {
  role?: UserRole;
  active?: boolean;
}

export async function getAdminUsers(tenantId?: string): Promise<AdminUser[]> {
  const res = await apiClient.get<AdminUser[]>('/super-admin/users', {
    params: tenantId ? { tenantId } : undefined,
  });
  return res.data;
}

export async function createAdminUser(dto: CreateAdminUserDto): Promise<AdminUser> {
  const res = await apiClient.post<AdminUser>('/super-admin/users', dto);
  return res.data;
}

export async function updateAdminUser(id: string, dto: UpdateAdminUserDto): Promise<AdminUser> {
  const res = await apiClient.patch<AdminUser>(`/super-admin/users/${id}`, dto);
  return res.data;
}

export async function resetAdminUserPassword(id: string): Promise<{ ok: true }> {
  const res = await apiClient.post<{ ok: true }>(`/super-admin/users/${id}/reset-password`);
  return res.data;
}
