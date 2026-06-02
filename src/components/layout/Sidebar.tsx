import { SidebarBrand } from './SidebarBrand'
import { SidebarNav } from './SidebarNav'
import { SidebarFooter } from './SidebarFooter'

const SIDEBAR_FONT = { fontFamily: "'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif" }
const SIDEBAR_BG = {
  ...SIDEBAR_FONT,
  background: 'linear-gradient(180deg, #1B1F28 0%, #171A21 40%)',
}

/** Persistent desktop sidebar — dark enterprise style (hidden below lg; see MobileNav). */
export function Sidebar() {
  return (
    <aside
      className="hidden w-60 shrink-0 flex-col border-r border-[#2C313C] lg:flex"
      style={SIDEBAR_BG}
    >
      <SidebarBrand />
      <SidebarNav />
      <SidebarFooter />
    </aside>
  )
}
