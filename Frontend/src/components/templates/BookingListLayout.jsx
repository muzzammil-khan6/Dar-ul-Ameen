// Job: Standard bookings and trials list page layout template with tabs and filter chips


export default function BookingListLayout({
  title = "My 1v1 Classes",
  subtitle = "Manage your 1v1 sessions, scheduled classes, and meet links",
  tabs,
  filters,
  children,
  headerAction,
  className = "",
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        {headerAction && <div className="shrink-0">{headerAction}</div>}
      </div>

      {/* Main Tabs */}
      {tabs && <div className="border-b border-slate-200">{tabs}</div>}


      
      {/* Filter Chips */}
      {/* {filters && <div className="flex items-center gap-2 overflow-x-auto pb-1">{filters}</div>} */}

      {/* Content List */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
