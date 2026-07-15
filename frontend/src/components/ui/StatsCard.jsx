export default function StatsCard({ icon: Icon, label, value, iconBg = 'bg-primary/10', iconColor = 'text-primary' }) {
  return (
    <div className="card !p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-xs text-text-secondary uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-text-primary">{value}</p>
        </div>
      </div>
    </div>
  )
}
