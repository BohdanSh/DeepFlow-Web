import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Profile } from '@/types/database'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - hidden on mobile */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              🎯 DeepFlow
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            <NavLink href="/dashboard" icon="📅">
              Today
            </NavLink>
            <NavLink href="/inbox" icon="📥">
              Inbox
            </NavLink>
            <NavLink href="/goals" icon="🎯">
              Goals
            </NavLink>
          </nav>

          {/* User & Settings */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <Link href="/settings" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile?.subscription_status === 'pro' ? '⭐ Pro' : 'Free plan'}
                </p>
              </div>
              <span className="text-gray-400">⚙️</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-center z-10">
        <Link href="/dashboard" className="text-lg font-bold text-gray-900">
          🎯 DeepFlow
        </Link>
      </header>

      {/* Main content */}
      <main className="md:pl-64">
        {/* Add padding for mobile header and bottom nav */}
        <div className="p-4 md:p-8 pt-18 md:pt-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-10">
        <div className="flex justify-around items-center h-16">
          <MobileNavLink href="/dashboard" icon="📅" label="Today" />
          <MobileNavLink href="/inbox" icon="📥" label="Inbox" />
          <MobileNavLink href="/goals" icon="🎯" label="Goals" />
          <MobileNavLink href="/settings" icon="⚙️" label="More" />
        </div>
      </nav>
    </div>
  )
}

function NavLink({ 
  href, 
  icon, 
  children 
}: { 
  href: string
  icon: string
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <span className="mr-3">{icon}</span>
      {children}
    </Link>
  )
}

function MobileNavLink({ 
  href, 
  icon,
  label 
}: { 
  href: string
  icon: string
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center py-2 px-4 text-gray-600 hover:text-blue-600 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
