import type { Driver, Vehicle, Client, SafetyChecklist } from '@/lib/api/types'

/** All seeded under tenant t1 (Northwind). t2 has none → proves isolation on empty lists. */
export const DRIVERS: Driver[] = [
  {
    id: 'd1',
    tenantId: 't1',
    name: 'Dora Driver',
    email: 'dora@nwt.test',
    phone: '+44 7700 900111',
    licenceNumber: 'DORAD901234AB',
    licenceExpiry: '2027-03-14',
    photoUrl: null,
    address: '12 Oak Street, Manchester',
    dob: '1988-05-20',
    status: 'active',
    createdAt: '2025-02-10T10:00:00Z',
  },
  {
    id: 'd2',
    tenantId: 't1',
    name: 'Eli Evans',
    email: 'eli@nwt.test',
    phone: '+44 7700 900222',
    licenceNumber: 'EVANS802233CD',
    licenceExpiry: '2026-06-22', // expiring soon
    photoUrl: null,
    address: '4 Birch Road, Leeds',
    dob: '1991-11-02',
    status: 'active',
    createdAt: '2025-03-01T10:00:00Z',
  },
  {
    id: 'd3',
    tenantId: 't1',
    name: 'Mara Singh',
    email: 'mara@nwt.test',
    phone: '+44 7700 900333',
    licenceNumber: 'SINGH774455EF',
    licenceExpiry: '2026-04-30', // expired
    photoUrl: null,
    address: '88 Elm Avenue, Liverpool',
    dob: '1985-01-17',
    status: 'active',
    createdAt: '2025-01-20T10:00:00Z',
  },
]

export const VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    tenantId: 't1',
    registration: 'MA21 KLP',
    make: 'Ford',
    model: 'Transit',
    year: 2021,
    capacity: 8,
    fuelType: 'diesel',
    insuranceExpiry: '2026-09-01',
    registrationExpiry: '2027-01-15',
    odometer: 84250,
    status: 'active',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'v2',
    tenantId: 't1',
    registration: 'LE70 XYZ',
    make: 'Mercedes',
    model: 'Sprinter',
    year: 2020,
    capacity: 12,
    fuelType: 'diesel',
    insuranceExpiry: '2026-06-18', // expiring soon
    registrationExpiry: '2026-04-10', // expired
    odometer: 142800,
    status: 'active',
    createdAt: '2025-02-05T10:00:00Z',
  },
]

export const CLIENTS: Client[] = [
  {
    id: 'c1',
    tenantId: 't1',
    uci: 'UCI-00012',
    name: 'Sunrise Care Home',
    contactName: 'Janet Pryce',
    contactPhone: '+44 161 222 0001',
    addresses: [
      {
        id: 'a1',
        label: 'Main entrance',
        line1: '1 Sunrise Lane',
        city: 'Manchester',
        postcode: 'M14 5TR',
        lat: 53.4451,
        lng: -2.2299,
      },
    ],
    emergencyContact: 'Janet Pryce · +44 161 222 0009',
    notes: 'Wheelchair access at rear.',
    createdAt: '2025-02-12T10:00:00Z',
  },
  {
    id: 'c2',
    tenantId: 't1',
    uci: 'UCI-00034',
    name: 'Bridgewater Day Centre',
    contactName: 'Tom Reilly',
    contactPhone: '+44 161 222 0034',
    addresses: [
      { id: 'a2', label: 'Pickup', line1: '22 Canal St', city: 'Manchester', postcode: 'M1 3HE', lat: null, lng: null },
    ],
    emergencyContact: 'Tom Reilly · +44 161 222 0035',
    notes: '',
    createdAt: '2025-03-08T10:00:00Z',
  },
]

export const CHECKLISTS: SafetyChecklist[] = [
  {
    id: 'cl1',
    tenantId: 't1',
    name: 'Daily Pre-Trip Safety Check',
    items: [
      { id: 'i1', label: 'Tyres & pressure', critical: true, order: 0 },
      { id: 'i2', label: 'Brakes responsive', critical: true, order: 1 },
      { id: 'i3', label: 'Lights & indicators', critical: false, order: 2 },
      { id: 'i4', label: 'First-aid kit present', critical: false, order: 3 },
      { id: 'i5', label: 'Seatbelts functional', critical: true, order: 4 },
    ],
  },
]
