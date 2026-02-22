import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Profile } from '@/types/database'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ThemeToggle } from '@/components/ThemeToggle'

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
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        {/* Desktop Sidebar - hidden on mobile */}
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:flex md:w-64 md:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center h-16 px-6 border-b border-gray-200 dark:border-gray-700">
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
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

            {/* Theme Toggle & User & Settings */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
              {/* Theme Toggle */}
              <ThemeToggle />
              
              <Link href="/settings" className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                {profile?.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt="Avatar" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                    {profile?.full_name?.[0] || user.email?.[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {profile?.subscription_status === 'pro' ? '⭐ Pro' : 'Free plan'}
                  </p>
                </div>
                <span className="text-gray-500 dark:text-gray-400">⚙️</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center z-10 transition-colors">
          <Link href="/dashboard" className="text-lg font-bold text-gray-900 dark:text-white">
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 transition-colors">
          <div className="flex justify-around items-center h-16">
            <MobileNavLink href="/dashboard" icon="📅" label="Today" />
            <MobileNavLink href="/inbox" icon="📥" label="Inbox" />
            <MobileNavLink href="/goals" icon="🎯" label="Goals" />
            <MobileNavLink href="/settings" icon="⚙️" label="More" />
          </div>
        </nav>
      </div>
    </ThemeProvider>
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
      className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
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
      className="flex flex-col items-center justify-center py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
