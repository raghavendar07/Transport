import type { RoutePlan } from '@/lib/api/types'

/** Seeded routes for tenant t1. Dates are fixed strings (today = 2026-06-01 in demo). */
export const ROUTES: RoutePlan[] = [
  {
    id: 'r1',
    tenantId: 't1',
    name: 'AM City Centre Loop',
    date: '2026-06-01',
    startTime: '08:00',
    session: 'AM',
    driverId: 'd1',
    vehicleId: 'v1',
    status: 'published',
    stops: [
      { id: 's1', clientId: 'c1', clientUci: 'UCI-000012', clientName: 'John Smith', addressId: 'a1', type: 'pickup', plannedTime: '08:15', order: 0, status: 'completed' },
      { id: 's2', clientId: 'c2', clientUci: 'UCI-000034', clientName: 'Sarah Jones', addressId: 'a2', type: 'pickup', plannedTime: '08:25', order: 1, status: 'pending' },
      { id: 's2b', clientId: 'c3', clientUci: 'UCI-000041', clientName: 'Robert Patel', addressId: 'a3', type: 'pickup', plannedTime: '08:35', order: 2, status: 'pending' },
      { id: 's2c', clientId: 'c1', clientUci: 'UCI-000012', clientName: 'John Smith', addressId: 'a1b', type: 'drop', plannedTime: '08:55', order: 3, status: 'pending' },
    ],
    createdAt: '2026-05-30T09:00:00Z',
  },
  {
    id: 'r2',
    tenantId: 't1',
    name: 'PM Bridgewater Run',
    date: '2026-06-01',
    startTime: '15:00',
    session: 'PM',
    driverId: 'd2',
    vehicleId: 'v2',
    status: 'in_progress',
    stops: [
      { id: 's3', clientId: 'c4', clientUci: 'UCI-000055', clientName: 'Emily Carter', addressId: 'a4', type: 'pickup', plannedTime: '15:30', order: 0, status: 'pending' },
    ],
    createdAt: '2026-05-30T09:05:00Z',
  },
  {
    id: 'r3',
    tenantId: 't1',
    name: 'AM Northside Draft',
    date: '2026-06-02',
    startTime: '08:30',
    session: 'AM',
    driverId: 'd1',
    vehicleId: 'v1',
    status: 'draft',
    stops: [],
    createdAt: '2026-05-31T09:00:00Z',
  },
]
