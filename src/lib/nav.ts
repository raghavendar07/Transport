import {
  LayoutDashboard,
  Building2,
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
  Settings,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { Permission } from '@/lib/rbac'

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
 * Sidebar navigation. Items are filtered by the current role's permissions
 * (see Sidebar). Order mirrors the build/feature grouping.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'monitoring.view' },
      { to: '/monitoring', label: 'Live Routes', icon: Radio, permission: 'monitoring.view' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { to: '/routes', label: 'Route Planning', icon: RouteIcon, permission: 'routes.view' },
      { to: '/drivers', label: 'Drivers', icon: Truck, permission: 'fleet.manage' },
      { to: '/vehicles', label: 'Vehicles', icon: Car, permission: 'fleet.manage' },
      { to: '/clients', label: 'Clients', icon: Contact, permission: 'clients.manage' },
      { to: '/checklists', label: 'Safety Checklists', icon: ClipboardCheck, permission: 'clients.manage' },
    ],
  },
  {
    title: 'Compliance',
    items: [
      { to: '/reports', label: 'Reports', icon: FileBarChart, permission: 'reports.view' },
      { to: '/documents', label: 'Documents', icon: FolderArchive, permission: 'documents.manage' },
      { to: '/audit', label: 'Audit Log', icon: ScrollText, permission: 'audit.view' },
    ],
  },
  {
    title: 'Administration',
    items: [
      { to: '/tenants', label: 'Tenants', icon: Building2, permission: 'tenants.manage' },
      { to: '/users', label: 'Users', icon: Users, permission: 'users.manage' },
      { to: '/settings', label: 'Settings', icon: Settings, permission: 'settings.manage' },
      { to: '/notifications', label: 'Notifications', icon: Bell, permission: 'account.self' },
    ],
  },
]
