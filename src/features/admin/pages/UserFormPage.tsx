import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { ShieldCheck, Settings as SettingsIcon, Users as UsersIcon, Truck, MapPin, Eye, FileText, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout'
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  FormField,
  Spinner,
  useToast,
} from '@/components/ui'
import type { Role, Permission } from '@/lib/rbac'
import {
  ROLE_LABELS,
  ADMIN_GRANTABLE,
  DISPATCHER_GRANTABLE,
  DEFAULT_ADMIN_PERMISSIONS,
  DEFAULT_DISPATCHER_PERMISSIONS,
} from '@/lib/rbac'
import { userSchema, type UserValues } from '../schema'
import { usersApi } from '../hooks'

interface RoleMeta {
  role: 'admin' | 'dispatcher'
  description: string
  highlights: string[]
}

const ROLE_META: RoleMeta[] = [
  {
    role: 'admin',
    description: 'Full access — users, settings, compliance, documents, audit.',
    highlights: ['Manage users & settings', 'Compliance dashboard', 'Audit logs', 'Everything dispatchers can do'],
  },
  {
    role: 'dispatcher',
    description: 'Daily operations — fleet, routes, live tracking, reports.',
    highlights: ['Manage drivers, vehicles, clients', 'Plan and publish routes', 'Live tracking', 'Generate reports'],
  },
]

const PERMISSION_META: Record<Permission, { label: string; icon: typeof ShieldCheck }> = {
  'users.manage': { label: 'Users — add, edit, deactivate', icon: UsersIcon },
  'settings.manage': { label: 'Settings — company + branding', icon: SettingsIcon },
  'fleet.manage': { label: 'Fleet — drivers & vehicles', icon: Truck },
  'clients.manage': { label: 'Clients — passengers CRUD', icon: UsersIcon },
  'checklists.manage': { label: 'Safety checklist templates', icon: ShieldCheck },
  'routes.view': { label: 'View routes', icon: MapPin },
  'routes.manage': { label: 'Plan, publish, cancel routes', icon: MapPin },
  'monitoring.view': { label: 'Live tracking dashboard', icon: Eye },
  'alerts.view': { label: 'Compliance alerts', icon: AlertTriangle },
  'reports.view': { label: 'Reports — generate & download', icon: FileText },
  'documents.manage': { label: 'Compliance document repo', icon: FileText },
  'compliance.view': { label: 'Compliance dashboard', icon: ShieldCheck },
  'audit.view': { label: 'Audit logs', icon: ShieldCheck },
  'account.self': { label: 'Own profile + notifications', icon: UsersIcon },
}

export function UserFormPage() {
  const { id } = useParams()
  const isEdit = !!id
  const navigate = useNavigate()
  const toast = useToast()

  const { data: existing, isLoading } = usersApi.useGet(id)
  const create = usersApi.useCreate()
  const update = usersApi.useUpdate()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    values: existing
      ? {
          name: existing.name,
          email: existing.email,
          roles: (existing.roles && existing.roles.length > 0
            ? existing.roles
            : [existing.role]) as UserValues['roles'],
          adminPermissions:
            existing.adminPermissions ?? (DEFAULT_ADMIN_PERMISSIONS as string[]),
          dispatcherPermissions:
            existing.dispatcherPermissions ?? (DEFAULT_DISPATCHER_PERMISSIONS as string[]),
          status: existing.status,
        }
      : {
          name: '',
          email: '',
          roles: ['dispatcher'],
          adminPermissions: DEFAULT_ADMIN_PERMISSIONS as string[],
          dispatcherPermissions: DEFAULT_DISPATCHER_PERMISSIONS as string[],
          status: 'active',
        },
  })

  const selectedRoles = (watch('roles') ?? []) as Role[]
  const adminPerms = (watch('adminPermissions') ?? []) as Permission[]
  const dispatcherPerms = (watch('dispatcherPermissions') ?? []) as Permission[]
  const hasAdmin = selectedRoles.includes('admin')
  const hasDispatcher = selectedRoles.includes('dispatcher')

  function toggleRole(role: 'admin' | 'dispatcher') {
    const next = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role]
    setValue('roles', next as UserValues['roles'], { shouldValidate: true })
  }

  function togglePermission(role: 'admin' | 'dispatcher', perm: Permission) {
    const field = role === 'admin' ? 'adminPermissions' : 'dispatcherPermissions'
    const current = role === 'admin' ? adminPerms : dispatcherPerms
    const next = current.includes(perm)
      ? current.filter((p) => p !== perm)
      : [...current, perm]
    setValue(field, next as string[], { shouldValidate: true })
  }

  function resetPermissions(role: 'admin' | 'dispatcher') {
    if (role === 'admin') {
      setValue('adminPermissions', DEFAULT_ADMIN_PERMISSIONS as string[], { shouldValidate: true })
    } else {
      setValue('dispatcherPermissions', DEFAULT_DISPATCHER_PERMISSIONS as string[], {
        shouldValidate: true,
      })
    }
  }

  async function onSubmit(values: UserValues) {
    // Primary role = first selected — admin wins when both are picked.
    // `values.roles` is narrowed to 'admin' | 'dispatcher' by the schema; cast up to Role
    // so the API contract (which permits 'driver' too) is satisfied.
    const primary: Role = values.roles.includes('admin') ? 'admin' : values.roles[0]
    const payload = { ...values, role: primary }
    if (isEdit) {
      await update.mutateAsync({ id: id!, data: payload })
      toast.success('User updated')
    } else {
      await create.mutateAsync({ ...payload, lastLoginAt: null })
      toast.success('User invited', 'They will receive an email to set their password.')
    }
    navigate('/users')
  }

  if (isEdit && isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? 'Edit user' : 'Add user'}
        breadcrumbs={[{ label: 'Users', to: '/users' }, { label: isEdit ? 'Edit' : 'Add' }]}
      />
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <Card>
          <CardBody className="space-y-4">
            <FormField label="Full name" required error={errors.name?.message}>
              {(f) => <Input {...f} {...register('name')} />}
            </FormField>
            <FormField label="Email" required error={errors.email?.message} hint="They sign in with this email">
              {(f) => <Input type="email" {...f} {...register('email')} />}
            </FormField>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
              Roles
            </CardTitle>
            <p className="mt-1 text-xs text-text-muted">
              Pick one or more roles. Some users wear multiple hats — for example an Admin who
              also dispatches routes. Permissions are the union across every selected role.
            </p>
          </CardHeader>
          <CardBody className="space-y-3">
            {ROLE_META.map((meta) => {
              const checked = selectedRoles.includes(meta.role)
              return (
                <label
                  key={meta.role}
                  htmlFor={`role-${meta.role}`}
                  className={
                    'flex cursor-pointer items-start gap-3 rounded-[8px] border p-3 transition-colors hover:bg-surface-hover ' +
                    (checked ? 'border-brand bg-brand-50/40 ring-1 ring-brand/30' : 'border-border')
                  }
                >
                  <Checkbox
                    id={`role-${meta.role}`}
                    checked={checked}
                    onCheckedChange={() => toggleRole(meta.role)}
                    aria-label={ROLE_LABELS[meta.role]}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-text">{ROLE_LABELS[meta.role]}</span>
                      {checked && (
                        <span className="rounded-[2px] bg-brand px-[6px] py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-fg">
                          Assigned
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-text-muted">{meta.description}</p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {meta.highlights.map((h) => (
                        <li
                          key={h}
                          className="rounded-[2px] bg-surface-hover px-[8px] py-0.5 text-[10px] font-medium text-text-muted"
                        >
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </label>
              )
            })}
            {errors.roles && (
              <p className="text-xs text-status-expired">{errors.roles.message as string}</p>
            )}
          </CardBody>
        </Card>

        {hasAdmin && (
          <PermissionsCard
            roleLabel="Admin"
            grantable={ADMIN_GRANTABLE}
            current={adminPerms}
            onToggle={(p) => togglePermission('admin', p)}
            onReset={() => resetPermissions('admin')}
          />
        )}

        {hasDispatcher && (
          <PermissionsCard
            roleLabel="Dispatcher"
            grantable={DISPATCHER_GRANTABLE}
            current={dispatcherPerms}
            onToggle={(p) => togglePermission('dispatcher', p)}
            onReset={() => resetPermissions('dispatcher')}
          />
        )}

        <Card>
          <CardFooter>
            <Button type="button" variant="secondary" onClick={() => navigate('/users')}>
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isEdit ? 'Save changes' : 'Send invite'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

interface PermissionsCardProps {
  roleLabel: string
  grantable: Permission[]
  current: Permission[]
  onToggle: (p: Permission) => void
  onReset: () => void
}

function PermissionsCard({ roleLabel, grantable, current, onToggle, onReset }: PermissionsCardProps) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-brand" aria-hidden />
            {roleLabel} permissions
            <span className="rounded-[2px] bg-brand-100 px-[6px] py-0.5 text-[10px] font-semibold text-brand-700">
              {current.length}/{grantable.length}
            </span>
          </CardTitle>
          <p className="mt-1 text-xs text-text-muted">
            Tick to grant, untick to revoke. Customize what this {roleLabel.toLowerCase()} can do.
          </p>
        </div>
        <Button type="button" size="sm" variant="ghost" onClick={onReset}>
          Reset to defaults
        </Button>
      </CardHeader>
      <CardBody>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {grantable.map((p) => {
            const meta = PERMISSION_META[p]
            const Icon = meta.icon
            const checked = current.includes(p)
            const fieldId = `perm-${roleLabel.toLowerCase()}-${p}`
            return (
              <li key={p}>
                <label
                  htmlFor={fieldId}
                  className={
                    'flex cursor-pointer items-start gap-2 rounded-[8px] border p-3 transition-colors hover:bg-surface-hover ' +
                    (checked ? 'border-brand bg-brand-50/40' : 'border-border')
                  }
                >
                  <Checkbox
                    id={fieldId}
                    checked={checked}
                    onCheckedChange={() => onToggle(p)}
                    aria-label={meta.label}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
                      <span className="text-sm font-medium text-text">{meta.label}</span>
                    </div>
                    <p className="mt-0.5 font-mono text-[10px] text-text-subtle">{p}</p>
                  </div>
                </label>
              </li>
            )
          })}
        </ul>
        {current.length === 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-status-warn">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            No permissions granted. This {roleLabel.toLowerCase()} won't be able to do anything.
          </p>
        )}
      </CardBody>
    </Card>
  )
}
