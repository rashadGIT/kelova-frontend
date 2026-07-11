import { EventType } from '@/types';

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EventType.visitation]:  'bg-blue-500',
  [EventType.service]:     'bg-purple-500',
  [EventType.committal]:   'bg-slate-500',
  [EventType.pickup]:      'bg-orange-500',
  [EventType.preparation]: 'bg-yellow-500',
  [EventType.meeting]:     'bg-green-500',
  [EventType.other]:       'bg-gray-400',
};
