import {
  LayoutDashboard,
  Users,
  Truck,
  Car,
  Contact,
  ClipboardCheck,
  Route as RouteIcon,
  Radio,
  FileBarChart,
  FolderArchive,
  ScrollText,
  ShieldAlert,
  TriangleAlert,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import type { Role, Permission } from '@/lib/rbac'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Permission gating visibility; undefined = visible to any portal user. */
  permission?: Permission
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

/**
 * Navigation is role-specific per the SVS spec. Each role gets its own section
 * structure (not one filtered list) so ordering and grouping match exactly.
 * Items still carry permissions as a second line of defence — a mis-placed item
 * is hidden if the role lacks the permission (see SidebarNav filtering).
 */
const ADMIN_NAV: NavSection[] = [
  {
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'monitoring.view' }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/routes', label: 'Routes', icon: RouteIcon, permission: 'routes.view' },
      { to: '/monitoring', label: 'Live Tracking', icon: Radio, permission: 'monitoring.view' },
    ],
  },
  {
    title: 'Fleet Management',
    items: [
      { to: '/drivers', label: 'Drivers', icon: Truck, permission: 'fleet.manage' },
      { to: '/vehicles', label: 'Vehicles', icon: Car, permission: 'fleet.manage' },
      { to: '/clients', label: 'Clients', icon: Contact, permission: 'clients.manage' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { to: '/compliance', label: 'Compliance Dashboard', icon: ShieldAlert, permission: 'compliance.view' },
      { to: '/documents', label: 'Documents', icon: FolderArchive, permission: 'documents.manage' },
      { to: '/checklists', label: 'Checklist Setup', icon: ClipboardCheck, permission: 'checklists.manage' },
      { to: '/audit', label: 'Audit Logs', icon: ScrollText, permission: 'audit.view' },
    ],
  },
  {
    items: [{ to: '/reports', label: 'Reports', icon: FileBarChart, permission: 'reports.view' }],
  },
  {
    title: 'Administration',
    items: [
      { to: '/users', label: 'Users', icon: Users, permission: 'users.manage' },
      { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings.manage' },
    ],
  },
]

const DISPATCHER_NAV: NavSection[] = [
  {
    items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'monitoring.view' }],
  },
  {
    title: 'Operations',
    items: [
      { to: '/routes', label: 'Routes', icon: RouteIcon, permission: 'routes.view' },
      { to: '/monitoring', label: 'Live Tracking', icon: Radio, permission: 'monitoring.view' },
    ],
  },
  {
    title: 'Fleet Management',
    items: [
      { to: '/drivers', label: 'Drivers', icon: Truck, permission: 'fleet.manage' },
      { to: '/vehicles', label: 'Vehicles', icon: Car, permission: 'fleet.manage' },
      { to: '/clients', label: 'Clients', icon: Contact, permission: 'clients.manage' },
    ],
  },
  {
    items: [
      { to: '/reports', label: 'Reports', icon: FileBarChart, permission: 'reports.view' },
      { to: '/alerts', label: 'Alerts', icon: TriangleAlert, permission: 'alerts.view' },
    ],
  },
]

/** Returns the navigation sections for a role. Drivers never reach the portal. */
export function getNavSections(role: Role | undefined): NavSection[] {
  return role === 'admin' ? ADMIN_NAV : DISPATCHER_NAV
}
