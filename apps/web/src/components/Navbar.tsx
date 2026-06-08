'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GraduationCap, Plus, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export const Navbar = () => {
  const pathname = usePathname()
  const router   = useRouter()

  if (pathname === '/login') return null

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      <nav className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8" aria-label="Global">
        <div className="flex h-14 items-center justify-between">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-600">
              <GraduationCap className="text-white" size={16} aria-hidden="true" />
            </div>
            <span className="text-sm font-bold tracking-tight text-gray-900">FuncionarIA</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-x-2">
            <Link
              href="/dashboard"
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                pathname === '/dashboard'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              Planos
            </Link>

            <Link href="/plan/new" className="btn-primary ml-2 py-1.5">
              <Plus size={14} aria-hidden="true" /> Novo plano
            </Link>

            <button
              onClick={handleLogout}
              title="Sair"
              className="btn-ghost ml-1 p-2"
            >
              <LogOut size={15} aria-hidden="true" />
            </button>
          </div>

        </div>
      </nav>
    </header>
  )
}
