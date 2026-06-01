import { useState } from 'react'
import { Plus, Trash2, Pencil } from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  RadioGroup,
  DatePicker,
  FormField,
  FileUpload,
  Card,
  CardBody,
  Modal,
  ConfirmDialog,
  Tabs,
  TabsList,
  TabTrigger,
  TabPanel,
  useToast,
  Avatar,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  AsyncBoundary,
  DataTable,
  type Column,
} from '@/components/ui'
import {
  StatusBadge,
  RouteStatusBadge,
  ExpiryBadge,
  RoleBadge,
  SearchInput,
  FilterBar,
  MapView,
} from '@/components/domain'

interface DemoRow {
  id: string
  name: string
  licenceExpiry: string
}

const DEMO_ROWS: DemoRow[] = [
  { id: '1', name: 'Dora Driver', licenceExpiry: '2026-12-01' },
  { id: '2', name: 'Eli Evans', licenceExpiry: '2026-06-15' },
  { id: '3', name: 'Mara Singh', licenceExpiry: '2026-05-01' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <Card>
        <CardBody className="flex flex-wrap items-start gap-4">{children}</CardBody>
      </Card>
    </section>
  )
}

/** Kitchen-sink: every primitive in every state. P2 verification gate. */
export function KitchenSink() {
  const toast = useToast()
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [search, setSearch] = useState('')
  const [checked, setChecked] = useState(true)
  const [radio, setRadio] = useState('a')
  const [selected, setSelected] = useState<string[]>([])

  const columns: Column<DemoRow>[] = [
    { key: 'name', header: 'Name', cell: (r) => r.name, sortValue: (r) => r.name },
    {
      key: 'expiry',
      header: 'Licence',
      cell: (r) => <ExpiryBadge date={r.licenceExpiry} showDate />,
      sortValue: (r) => r.licenceExpiry,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <header>
        <h1 className="text-2xl font-semibold text-text">Component Kitchen Sink</h1>
        <p className="text-sm text-text-muted">Every primitive in every state — the P2 verification page.</p>
      </header>

      <Section title="Buttons">
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="link">Link</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button size="icon" aria-label="Add">
          <Plus className="h-4 w-4" />
        </Button>
      </Section>

      <Section title="Badges (colour-blind-safe: colour + icon + text)">
        <StatusBadge status="active" />
        <StatusBadge status="inactive" />
        <ExpiryBadge date="2027-01-01" />
        <ExpiryBadge date="2026-06-10" />
        <ExpiryBadge date="2026-01-01" />
        <RouteStatusBadge status="draft" />
        <RouteStatusBadge status="published" />
        <RouteStatusBadge status="in_progress" />
        <RouteStatusBadge status="completed" />
        <RouteStatusBadge status="cancelled" />
        <RoleBadge role="admin" />
        <RoleBadge role="dispatcher" />
        <RoleBadge role="driver" />
      </Section>

      <Section title="Form controls">
        <div className="grid w-full grid-cols-2 gap-4">
          <FormField label="Full name" required>
            {(f) => <Input placeholder="e.g. Alice Admin" {...f} />}
          </FormField>
          <FormField label="Email" error="Enter a valid email">
            {(f) => <Input defaultValue="not-an-email" {...f} />}
          </FormField>
          <FormField label="Role" hint="Determines portal access">
            {(f) => (
              <Select
                options={[
                  { value: 'admin', label: 'Tenant Admin' },
                  { value: 'dispatcher', label: 'Dispatcher' },
                ]}
                {...f}
              />
            )}
          </FormField>
          <FormField label="Licence expiry">{(f) => <DatePicker {...f} />}</FormField>
          <FormField label="Notes" className="col-span-2">
            {(f) => <Textarea placeholder="Optional notes…" {...f} />}
          </FormField>
        </div>
        <div className="flex items-center gap-3">
          <Checkbox checked={checked} onCheckedChange={setChecked} aria-label="Demo" />
          <span className="text-sm">Checkbox</span>
        </div>
        <RadioGroup
          className="w-full"
          value={radio}
          onValueChange={setRadio}
          options={[
            { value: 'a', label: 'Option A', description: 'First choice' },
            { value: 'b', label: 'Option B', description: 'Second choice' },
          ]}
        />
        <div className="w-full">
          <FileUpload value={null} onChange={() => {}} />
        </div>
      </Section>

      <Section title="Search & filters">
        <div className="w-full space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Search drivers…" />
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                ],
              },
            ]}
            values={{}}
            onClear={() => setSearch('')}
          />
        </div>
      </Section>

      <Section title="Overlays & feedback">
        <Button onClick={() => setModal(true)}>Open modal</Button>
        <Button variant="danger" onClick={() => setConfirm(true)}>
          Open confirm
        </Button>
        <Button variant="secondary" onClick={() => toast.success('Saved', 'Driver updated.')}>
          Success toast
        </Button>
        <Button variant="secondary" onClick={() => toast.error('Failed', 'Could not save.')}>
          Error toast
        </Button>
        <Avatar name="Alice Admin" />
        <Spinner />
        <Skeleton className="h-9 w-32" />
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="one" className="w-full">
          <TabsList>
            <TabTrigger value="one">Profile</TabTrigger>
            <TabTrigger value="two">Documents</TabTrigger>
          </TabsList>
          <TabPanel value="one">Profile panel content.</TabPanel>
          <TabPanel value="two">Documents panel content.</TabPanel>
        </Tabs>
      </Section>

      <Section title="States: empty / error / loading">
        <div className="w-full space-y-4">
          <Card>
            <EmptyState
              title="No drivers yet"
              description="Add your first driver to get started."
              action={<Button size="sm">Add driver</Button>}
            />
          </Card>
          <Card>
            <ErrorState onRetry={() => toast.success('Retried')} />
          </Card>
          <AsyncBoundary isLoading isError={false} data={undefined}>
            {() => null}
          </AsyncBoundary>
        </div>
      </Section>

      <Section title="DataTable (sort · select · row actions · pagination)">
        <div className="w-full">
          <DataTable
            columns={columns}
            rows={DEMO_ROWS}
            rowKey={(r) => r.id}
            selectable
            selectedKeys={selected}
            onSelectionChange={setSelected}
            rowActions={() => (
              <div className="flex justify-end gap-1">
                <Button size="icon" variant="ghost" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            pagination={{ page: 1, pageSize: 10, total: 3, onPageChange: () => {} }}
          />
        </div>
      </Section>

      <Section title="Map">
        <div className="w-full">
          <MapView markers={[{ lat: 51.5, lng: -0.12, label: 'Depot' }]} />
        </div>
      </Section>

      <Modal
        open={modal}
        onOpenChange={setModal}
        title="Example modal"
        description="Focus-trapped, Esc to close."
        footer={<Button onClick={() => setModal(false)}>Done</Button>}
      >
        <p className="text-sm text-text-muted">Modal body content goes here.</p>
      </Modal>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete driver?"
        description="This action cannot be undone."
        variant="danger"
        confirmLabel="Delete"
        onConfirm={() => {
          setConfirm(false)
          toast.success('Deleted')
        }}
      />
    </div>
  )
}
