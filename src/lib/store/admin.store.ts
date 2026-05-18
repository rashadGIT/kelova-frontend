import { create } from 'zustand';

interface AdminState {
  activeTenantId: string | null;
  activeTenantName: string | null;
  enterTenantView: (id: string, name: string) => void;
  exitTenantView: () => void;
}

export const useAdminStore = create<AdminState>()((set) => ({
  activeTenantId: null,
  activeTenantName: null,
  enterTenantView: (id, name) => set({ activeTenantId: id, activeTenantName: name }),
  exitTenantView: () => set({ activeTenantId: null, activeTenantName: null }),
}));
