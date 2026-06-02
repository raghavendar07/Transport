/** SVS branding block at the top of the sidebar (dark enterprise style). */
export function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-[#2C313C] px-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#3A5BD9] text-[11px] font-bold tracking-tight text-white shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
        SVS
      </div>
      <div className="min-w-0 leading-tight">
        <p className="truncate text-sm font-semibold text-white">Smart Vendor Solutions</p>
        <p className="truncate text-[11px] text-[#7E8492]">Transport Operations</p>
      </div>
    </div>
  )
}
