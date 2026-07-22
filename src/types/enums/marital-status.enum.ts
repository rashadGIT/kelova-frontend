export const MaritalStatus = {
  single: 'single',
  married: 'married',
  widowed: 'widowed',
  divorced: 'divorced',
  separated: 'separated',
  unknown: 'unknown',
} as const;
export type MaritalStatus = typeof MaritalStatus[keyof typeof MaritalStatus];
