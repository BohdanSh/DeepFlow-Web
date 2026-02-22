'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Profile } from '@/types/database'
import { ThemeToggle } from '@/components/ThemeToggle'

interface SidebarLayoutProps {
  children: React.ReactNode
  profile: Profile | null
  userEmail: string
}

export function SidebarLayout({ children, profile, userEmail }: SidebarLayoutProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) {
      setIsCollapsed(JSON.parse(saved))
    }
  }, [])

  // Save collapsed state
  const toggleSidebar = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:fixed md:inset-y-0 md:left-0 md:flex md:flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          isCollapsed ? 'md:w-16' : 'md:w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo + Toggle */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            {!isCollapsed && (
              <Link href="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
                🎯 DeepFlow
              </Link>
            )}
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors ${
                isCollapsed ? 'mx-auto' : ''
              }`}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? '→' : '←'}
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <NavLink href="/dashboard" icon="📅" isCollapsed={isCollapsed} isActive={pathname === '/dashboard'}>
              Today
            </NavLink>
            <NavLink href="/inbox" icon="📥" isCollapsed={isCollapsed} isActive={pathname === '/inbox'}>
              Inbox
            </NavLink>
            <NavLink href="/goals" icon="🎯" isCollapsed={isCollapsed} isActive={pathname === '/goals' || pathname.startsWith('/goals/')}>
              Goals
            </NavLink>
          </nav>

          {/* Theme Toggle & User & Settings */}
          <div className={`p-3 border-t border-gray-200 dark:border-gray-700 space-y-2 ${isCollapsed ? 'px-2' : ''}`}>
            {/* Theme Toggle */}
            <ThemeToggle compact={isCollapsed} />
            
            <Link 
              href="/settings" 
              className={`flex items-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                pathname === '/settings' ? 'bg-gray-100 dark:bg-gray-700' : ''
              } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                  {profile?.full_name?.[0] || userEmail?.[0]?.toUpperCase()}
                </div>
              )}
              {!isCollapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {profile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {profile?.subscription_status === 'pro' ? '⭐ Pro' : 'Free plan'}
                    </p>
                  </div>
                  <span className="text-gray-500 dark:text-gray-400">⚙️</span>
                </>
              )}
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
      <main className={`transition-all duration-300 ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
        <div className="p-4 md:p-8 pt-18 md:pt-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10 transition-colors">
        <div className="flex justify-around items-center h-16">
          <MobileNavLink href="/dashboard" icon="📅" label="Today" isActive={pathname === '/dashboard'} />
          <MobileNavLink href="/inbox" icon="📥" label="Inbox" isActive={pathname === '/inbox'} />
          <MobileNavLink href="/goals" icon="🎯" label="Goals" isActive={pathname === '/goals' || pathname.startsWith('/goals/')} />
          <MobileNavLink href="/settings" icon="⚙️" label="More" isActive={pathname === '/settings'} />
        </div>
      </nav>
    </div>
  )
}

function NavLink({ 
  href, 
  icon, 
  children,
  isCollapsed,
  isActive
}: { 
  href: string
  icon: string
  children: React.ReactNode
  isCollapsed: boolean
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
        isActive 
          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? String(children) : undefined}
    >
      <span className={isCollapsed ? '' : 'mr-3'}>{icon}</span>
      {!isCollapsed && children}
    </Link>
  )
}

function MobileNavLink({ 
  href, 
  icon,
  label,
  isActive
}: { 
  href: string
  icon: string
  label: string
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center py-2 px-4 transition-colors ${
        isActive 
          ? 'text-blue-600 dark:text-blue-400' 
          : 'text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs mt-1">{label}</span>
    </Link>
  )
}
