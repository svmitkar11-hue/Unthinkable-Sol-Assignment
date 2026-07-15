import { Link } from 'react-router-dom'
import { Building2, ArrowRight } from 'lucide-react'
import authBg from '../assets/auth-bg.png'

/**
 * Split-panel auth layout: a form panel and a teal branded panel.
 * `reverse` mirrors the sides (used by Register).
 */
export default function AuthShell({ title, children, brand, reverse = false }) {
  const Panel = (
    <div className={`relative flex w-full flex-col items-center justify-center overflow-hidden bg-auth-teal p-12 text-center text-white md:w-1/2 ${reverse ? 'md:order-1' : ''}`}>
      <div className="absolute inset-0">
        <img src={authBg} alt="" className="h-full w-full object-cover opacity-60 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-br from-auth-teal via-auth-teal/90 to-auth-teal-dark/80 mix-blend-multiply" />
      </div>
      <div className="absolute right-10 top-10 h-32 w-32 animate-pulse rounded-full bg-teal-400 opacity-20 blur-3xl mix-blend-screen" />
      <div className="absolute bottom-10 left-10 h-32 w-32 animate-pulse rounded-full bg-emerald-400 opacity-20 blur-3xl mix-blend-screen delay-700" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md">
          <Building2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-4 text-3xl font-bold tracking-tight">{brand.heading}</h2>
        <p className="mb-8 max-w-xs text-sm font-medium leading-relaxed text-gray-200">{brand.subtitle}</p>
        <Link to={brand.linkTo}
          className="group inline-flex items-center gap-2 rounded-full border border-white px-8 py-3 text-xs font-bold uppercase tracking-wider text-white transition-all hover:bg-white hover:text-auth-teal active:scale-95">
          {brand.linkLabel}
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )

  const Form = (
    <div className={`flex w-full flex-col items-center justify-center bg-white p-10 text-center md:w-1/2 md:p-14 ${reverse ? 'md:order-2' : ''}`}>
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
      {children}
    </div>
  )

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="flex w-full max-w-4xl flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl md:min-h-[600px] md:flex-row">
        {reverse ? <>{Panel}{Form}</> : <>{Form}{Panel}</>}
      </div>
    </div>
  )
}
