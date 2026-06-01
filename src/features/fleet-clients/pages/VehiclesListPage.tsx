import { useNavigate } from 'react-router-dom'
import { Plus, Pencil, Car } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import { Button, DataTable, type Column } from '@/components/ui'
import { FilterBar } from '@/components/domain'
import { ExpiryBadge } from '@/components/domain/ExpiryBadge'
import { StatusBadge } from '@/components/domain/StatusBadge'
import { useListControls } from '@/lib/useListControls'
import type { Vehicle } from '@/lib/api/types'
import { vehiclesApi } from '../hooks'

export function VehiclesListPage() {
  const navigate = useNavigate()
  const { search, filters, page, setPage, setFilter, onSearchChange, clear, params } = useListControls()
  const { data, isLoading, isError, refetch } = vehiclesApi.useList(params)

  const columns: Column<Vehicle>[] = [
    {
      key: 'registration',
      header: 'Registration',
      cell: (v) => <span className="font-mono font-medium">{v.registration}</span>,
      sortValue: (v) => v.registration,
    },
    { key: 'vehicle', header: 'Vehicle', cell: (v) => `${v.make} ${v.model} (${v.year})`, sortValue: (v) => v.make },
    { key: 'capacity', header: 'Capacity', cell: (v) => `${v.capacity} seats`, align: 'right' },
    {
      key: 'insurance',
      header: 'Insurance',
      cell: (v) => <ExpiryBadge date={v.insuranceExpiry} showDate />,
      sortValue: (v) => v.insuranceExpiry,
    },
    {
      key: 'registrationExpiry',
      header: 'Registration',
      cell: (v) => <ExpiryBadge date={v.registrationExpiry} showDate />,
      sortValue: (v) => v.registrationExpiry,
    },
    { key: 'status', header: 'Status', cell: (v) => <StatusBadge status={v.status} /> },
  ]

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Fleet vehicles with insurance & registration expiry tracking."
        actions={
          <Button onClick={() => navigate('/vehicles/new')}>
            <Plus className="h-4 w-4" />
            Add vehicle
          </Button>
        }
      />
      <div className="mb-4">
        <FilterBar
          search={search}
          onSearchChange={onSearchChange}
          searchPlaceholder="Search by registration, make, model…"
          filters={[
            {
              key: 'fuelType',
              label: 'Fuel',
              options: [
                { value: 'diesel', label: 'Diesel' },
                { value: 'petrol', label: 'Petrol' },
                { value: 'electric', label: 'Electric' },
                { value: 'hybrid', label: 'Hybrid' },
              ],
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
            },
          ]}
          values={filters}
          onFilterChange={setFilter}
          onClear={clear}
        />
      </div>
      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(v) => v.id}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(v) => navigate(`/vehicles/${v.id}`)}
        rowActions={(v) => (
          <Button size="icon" variant="ghost" aria-label={`Edit ${v.registration}`} onClick={() => navigate(`/vehicles/${v.id}/edit`)}>
            <Pencil className="h-4 w-4" />
          </Button>
        )}
        pagination={{ page, pageSize: params.pageSize!, total: data?.total ?? 0, onPageChange: setPage }}
        emptyTitle="No vehicles found"
        emptyDescription="Add a vehicle to assign it to routes."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/vehicles/new')}>
            <Car className="h-4 w-4" />
            Add vehicle
          </Button>
        }
      />
    </div>
  )
}
