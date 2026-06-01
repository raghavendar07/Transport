import type { RoutePlan } from '@/lib/api/types'

/** Seeded routes for tenant t1. Dates are fixed strings (today = 2026-06-01 in demo). */
export const ROUTES: RoutePlan[] = [
  {
    id: 'r1',
    tenantId: 't1',
    date: '2026-06-01',
    session: 'AM',
    driverId: 'd1',
    vehicleId: 'v1',
    status: 'published',
    stops: [
      { id: 's1', clientId: 'c1', clientUci: 'UCI-00012', clientName: 'Sunrise Care Home', addressId: 'a1', type: 'pickup', plannedTime: '08:15', order: 0, status: 'completed' },
      { id: 's2', clientId: 'c2', clientUci: 'UCI-00034', clientName: 'Bridgewater Day Centre', addressId: 'a2', type: 'drop', plannedTime: '08:45', order: 1, status: 'pending' },
    ],
    createdAt: '2026-05-30T09:00:00Z',
  },
  {
    id: 'r2',
    tenantId: 't1',
    date: '2026-06-01',
    session: 'PM',
    driverId: 'd2',
    vehicleId: 'v2',
    status: 'in_progress',
    stops: [
      { id: 's3', clientId: 'c2', clientUci: 'UCI-00034', clientName: 'Bridgewater Day Centre', addressId: 'a2', type: 'pickup', plannedTime: '15:30', order: 0, status: 'pending' },
    ],
    createdAt: '2026-05-30T09:05:00Z',
  },
  {
    id: 'r3',
    tenantId: 't1',
    date: '2026-06-02',
    session: 'AM',
    driverId: 'd1',
    vehicleId: 'v1',
    status: 'draft',
    stops: [],
    createdAt: '2026-05-31T09:00:00Z',
  },
]
