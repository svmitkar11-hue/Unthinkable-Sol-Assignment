import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Home, ListChecks, PlusCircle, Megaphone, Settings, LogOut,
  ChevronLeft, ChevronRight, Menu, X, Building2, Crown, User,
} from 'lucide-react'

function useNav(isAdmin) {
  return isAdmin
    ? [
        { name: 'Dashboard', href: '/admin/dashboard', icon: Home },
        { name: 'Complaints', href: '/admin/complaints', icon: ListChecks },
        { name: 'Notices', href: '/admin/notices', icon: Megaphone },
        { name: 'Settings', href: '/admin/settings', icon: Settings },
      ]
    : [
        { name: 'My Complaints', href: '/complaints', icon: ListChecks },
        { name: 'Raise Complaint', href: '/complaints/new', icon: PlusCircle },
        { name: 'Notice Board', href: '/notices', icon: Megaphone },
      ]
}

function SidebarInner({ isMobile, expanded, onToggle, onClose }) {
  const { user, isAdmin, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const items = useNav(isAdmin)
  const showText = isMobile || expanded

  const isActive = (href) =>
    location.pathname === href || (href !== '/complaints' && location.pathname.startsWith(href + '/'))

  function handleLogout() {
    logout()
    navigate('/login')
    onClose?.()
  }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className={`flex items-center gap-2 overflow-hidden transition-all ${showText ? 'opacity-100' : 'w-0 opacity-0'}`}>
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <span className="whitespace-nowrap text-base font-bold text-text-primary">Society Tracker</span>
        </div>
        {isMobile ? (
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-primary/10"><X className="h-5 w-5 text-gray-500" /></button>
        ) : (
          <button onClick={onToggle} className="rounded-full p-1.5 hover:bg-primary/10">
            {expanded ? <ChevronLeft className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-primary" />}
          </button>
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1.5 overflow-hidden">
        {items.map((item) => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} to={item.href} onClick={() => isMobile && onClose?.()}
              title={!showText ? item.name : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${active ? 'bg-primary/10 font-semibold text-primary' : 'text-text-primary hover:bg-primary/5'}`}>
              <item.icon className={`h-5 w-5 flex-shrink-0 ${active ? 'text-primary' : 'text-gray-500'}`} />
              <span className={`whitespace-nowrap text-sm font-medium transition-all ${showText ? 'opacity-100' : 'max-w-0 overflow-hidden opacity-0'}`}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 border-t border-border pt-4">
        <div className="mb-1 flex items-center gap-3 px-3 py-2">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          {showText && (
            <div className="overflow-hidden">
              <div className="truncate text-sm font-medium text-text-primary">{user?.name}</div>
              <div className="flex items-center gap-1 text-xs text-text-secondary">
                {isAdmin ? <Crown className="h-3 w-3 text-primary" /> : <User className="h-3 w-3" />}
                {isAdmin ? 'Administrator' : user?.flatNumber || 'Resident'}
              </div>
            </div>
          )}
        </div>
        <button onClick={handleLogout} title={!showText ? 'Logout' : undefined}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-gray-100">
          <LogOut className="h-5 w-5 flex-shrink-0 text-red-500" />
          {showText && <span className="text-sm font-medium text-red-500">Logout</span>}
        </button>
      </div>
    </div>
  )
}

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 1024)
      if (window.innerWidth >= 1024) setOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      {isMobile && (
        <header className="fixed inset-x-0 top-0 z-20 flex items-center justify-between border-b border-border bg-white/80 px-4 py-3 backdrop-blur-md">
          <button onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-gray-100"><Menu className="h-6 w-6" /></button>
          <span className="text-lg font-bold text-text-primary">Society Tracker</span>
          <div className="w-10" />
        </header>
      )}

      {isMobile && open && (
        <div className="fixed inset-0 z-30 bg-gray-900/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      <aside className={
        isMobile
          ? `fixed left-0 top-0 z-40 h-screen w-64 transform border-r border-border bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`
          : `fixed left-0 top-0 z-10 h-screen border-r border-border bg-white transition-all duration-300 ${expanded ? 'w-64' : 'w-20'}`
      }>
        <SidebarInner isMobile={isMobile} expanded={expanded} onToggle={() => setExpanded(!expanded)} onClose={() => setOpen(false)} />
      </aside>

      <main className={`transition-all duration-300 ${isMobile ? 'ml-0 pt-[60px]' : expanded ? 'ml-64' : 'ml-20'} p-6 lg:p-8`}>
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
    </div>
  )
}
