'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types/database'
import { useTheme } from '@/components/ThemeProvider'

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Kyiv',
  'Europe/Moscow',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Australia/Sydney',
]

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { theme, setTheme } = useTheme()
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [email, setEmail] = useState('')
  const [stats, setStats] = useState({ goals: 0, tasks: 0, completedTasks: 0 })
  
  // Profile
  const [fullName, setFullName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'trial' | 'pro'>('free')
  
  // Preferences
  const [language, setLanguage] = useState<'en' | 'uk'>('en')
  const [timezone, setTimezone] = useState('')
  const [dateFormat, setDateFormat] = useState<'DD/MM/YYYY' | 'MM/DD/YYYY'>('DD/MM/YYYY')
  const [weekStartsOn, setWeekStartsOn] = useState<'monday' | 'sunday'>('monday')
  
  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [dailyDigest, setDailyDigest] = useState(false)
  const [taskReminders, setTaskReminders] = useState(true)
  
  // Modals
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')

  useEffect(() => {
    fetchProfile()
    // Auto-detect timezone
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (!timezone) {
      setTimezone(detectedTimezone)
    }
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    setEmail(user.email || '')

    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      const p = profile as Profile
      setFullName(p.full_name || '')
      setAvatarUrl(p.avatar_url || '')
      setSubscriptionStatus(p.subscription_status || 'free')
      setLanguage(p.language || 'en')
      setTimezone(p.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
      setDateFormat(p.date_format || 'DD/MM/YYYY')
      setWeekStartsOn(p.week_starts_on || 'monday')
      setEmailNotifications(p.email_notifications ?? true)
      setDailyDigest(p.daily_digest ?? false)
      setTaskReminders(p.task_reminders ?? true)
    }

    // Fetch stats
    const [goalsRes, tasksRes, completedRes] = await Promise.all([
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('tasks').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_completed', true),
    ])

    setStats({
      goals: goalsRes.count || 0,
      tasks: tasksRes.count || 0,
      completedTasks: completedRes.count || 0,
    })

    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        avatar_url: avatarUrl || null,
        language,
        timezone,
        date_format: dateFormat,
        week_starts_on: weekStartsOn,
        email_notifications: emailNotifications,
        daily_digest: dailyDigest,
        task_reminders: taskReminders,
      } as never)
      .eq('id', user.id)

    if (error) {
      alert('Error saving settings: ' + error.message)
    } else {
      alert('Settings saved successfully!')
    }
    setSaving(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function deleteAllData() {
    if (deleteConfirmText !== 'DELETE') return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete tasks first, then goals
    await supabase.from('tasks').delete().eq('user_id', user.id)
    await supabase.from('goals').delete().eq('user_id', user.id)
    
    setShowDeleteDataModal(false)
    setDeleteConfirmText('')
    alert('All data has been deleted.')
    fetchProfile()
  }

  async function deleteAccount() {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') return
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Delete all user data
    await supabase.from('tasks').delete().eq('user_id', user.id)
    await supabase.from('goals').delete().eq('user_id', user.id)
    await supabase.from('profiles').delete().eq('id', user.id)
    
    // Sign out (account deletion requires admin API in real implementation)
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors">
        <div className="text-gray-500 dark:text-gray-400 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white max-w-2xl mx-auto space-y-8 transition-colors">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">Manage your account and preferences</p>
      </div>

      {/* Appearance Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎨 Appearance</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Choose light or dark mode</p>
            </div>
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setTheme('light')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  theme === 'light'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Profile Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">👤 Profile</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-400 dark:text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Email cannot be changed here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Avatar URL
            </label>
            <div className="flex gap-3 items-center">
              {avatarUrl && (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              )}
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🎛️ Preferences</h2>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'uk')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="en">English</option>
                <option value="uk">Українська</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Format
              </label>
              <select
                value={dateFormat}
                onChange={(e) => setDateFormat(e.target.value as 'DD/MM/YYYY' | 'MM/DD/YYYY')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Week Starts On
              </label>
              <select
                value={weekStartsOn}
                onChange={(e) => setWeekStartsOn(e.target.value as 'monday' | 'sunday')}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white cursor-pointer"
              >
                <option value="monday">Monday</option>
                <option value="sunday">Sunday</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">🔔 Notifications</h2>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Email Notifications</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Receive important updates via email</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Daily Digest</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Get a summary of your tasks every morning</p>
            </div>
            <input
              type="checkbox"
              checked={dailyDigest}
              onChange={(e) => setDailyDigest(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Task Reminders</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Remind me about upcoming due dates</p>
            </div>
            <input
              type="checkbox"
              checked={taskReminders}
              onChange={(e) => setTaskReminders(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-blue-500"
            />
          </label>
        </div>
      </section>

      {/* Subscription Section */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">💎 Subscription</h2>
        
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              Current Plan: {' '}
              <span className={subscriptionStatus === 'pro' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}>
                {subscriptionStatus === 'pro' ? '⭐ Pro' : subscriptionStatus === 'trial' ? '🎁 Trial' : 'Free'}
              </span>
            </p>
          </div>
          {subscriptionStatus !== 'pro' && (
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Upgrade to Pro
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.goals}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Goals</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.tasks}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tasks</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedTasks}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          </div>
        </div>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Danger Zone */}
      <section className="bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-200 dark:border-red-500/30 p-6">
        <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">⚠️ Danger Zone</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-transparent">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete All Data</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Delete all your goals and tasks. This cannot be undone.</p>
            </div>
            <button
              onClick={() => setShowDeleteDataModal(true)}
              className="px-4 py-2 border border-red-300 dark:border-red-500/50 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              Delete Data
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-transparent">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Delete Account</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Permanently delete your account and all data.</p>
            </div>
            <button
              onClick={() => setShowDeleteAccountModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Account
            </button>
          </div>

          <hr className="border-gray-200 dark:border-gray-700" />

          <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-transparent">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Sign Out</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sign out from your account</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </section>

      {/* Delete Data Modal */}
      {showDeleteDataModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Delete All Data?</h3>
            <p className="text-gray-400 mb-4">
              This will permanently delete all your goals and tasks. This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Type <strong className="text-red-400">DELETE</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg mb-4 text-white placeholder-gray-500"
              placeholder="DELETE"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDataModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteAllData}
                disabled={deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border border-gray-700">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Account?</h3>
            <p className="text-gray-400 mb-4">
              This will permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <p className="text-sm text-gray-500 mb-2">
              Type <strong className="text-red-400">DELETE MY ACCOUNT</strong> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg mb-4 text-white placeholder-gray-500"
              placeholder="DELETE MY ACCOUNT"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteAccountModal(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={deleteAccount}
                disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
