import { DispositionType, ServiceType } from '@/types';

export const serviceTypeLabel: Record<ServiceType, string> = {
  [ServiceType.burial]: 'Burial',
  [ServiceType.cremation]: 'Cremation',
  [ServiceType.graveside]: 'Graveside',
  [ServiceType.memorial]: 'Memorial',
};

export const dispositionTypeLabel: Record<DispositionType, string> = {
  [DispositionType.burial]: 'Burial',
  [DispositionType.cremation]: 'Cremation',
  [DispositionType.entombment]: 'Entombment',
  [DispositionType.donation]: 'Donation',
  [DispositionType.shipping]: 'Shipping',
  [DispositionType.scattering]: 'Scattering',
};
