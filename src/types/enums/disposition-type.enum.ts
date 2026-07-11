export const DispositionType = {
  burial: 'burial',
  cremation: 'cremation',
  entombment: 'entombment',
  donation: 'donation',
  shipping: 'shipping',
  scattering: 'scattering',
} as const;
export type DispositionType = typeof DispositionType[keyof typeof DispositionType];
