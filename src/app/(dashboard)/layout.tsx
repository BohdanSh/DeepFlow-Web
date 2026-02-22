import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Profile } from '@/types/database'
import { ThemeProvider } from '@/components/ThemeProvider'
import { SidebarLayout } from '@/components/SidebarLayout'

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
      <SidebarLayout profile={profile} userEmail={user.email || ''}>
        {children}
      </SidebarLayout>
    </ThemeProvider>
  )
}
