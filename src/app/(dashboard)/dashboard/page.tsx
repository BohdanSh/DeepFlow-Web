import { createClient } from '@/lib/supabase/server'
import { Task, Goal } from '@/types/database'

type TaskWithProject = Task & {
  projects: {
    title: string
    goals: { title: string; color: string } | null
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get today's tasks
  const today = new Date().toISOString().split('T')[0]
  const { data: todayTasks } = await supabase
    .from('tasks')
    .select('*, projects(title, goals(title, color))')
    .eq('user_id', user!.id)
    .eq('due_date', today)
    .eq('is_completed', false)
    .order('priority', { ascending: false }) as { data: TaskWithProject[] | null }

  // Get overdue tasks
  const { data: overdueTasks } = await supabase
    .from('tasks')
    .select('*, projects(title, goals(title, color))')
    .eq('user_id', user!.id)
    .lt('due_date', today)
    .eq('is_completed', false)
    .order('due_date', { ascending: true }) as { data: TaskWithProject[] | null }

  // Get goals for progress
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user!.id)
    .eq('is_archived', false)
    .limit(5) as { data: Goal[] | null }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Today</h1>
        <p className="text-gray-500">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Overdue Warning */}
      {overdueTasks && overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 flex items-center">
            <span className="mr-2">⚠️</span>
            {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
          </h3>
          <ul className="mt-2 space-y-1">
            {overdueTasks.map((task) => (
              <li key={task.id} className="text-sm text-red-700">
                • {task.title}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Today's Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks for today</h2>
        {todayTasks && todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No tasks for today</p>
            <p className="text-sm text-gray-400 mt-1">
              Add tasks from Goals or Inbox
            </p>
          </div>
        )}
      </section>

      {/* Goals Progress */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Goals</h2>
        {goals && goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="bg-white rounded-lg border border-gray-200 p-4"
                style={{ borderLeftColor: goal.color, borderLeftWidth: 4 }}
              >
                <h3 className="font-medium text-gray-900">{goal.title}</h3>
                {goal.category && (
                  <span className="text-xs text-gray-500 capitalize">{goal.category}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No goals yet</p>
            <a href="/goals" className="text-sm text-blue-600 hover:text-blue-500 mt-1 inline-block">
              Create your first goal →
            </a>
          </div>
        )}
      </section>
    </div>
  )
}

function TaskCard({ task }: { task: TaskWithProject }) {
  const priorityColors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700',
  }

  return (
    <div className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4">
      <input
        type="checkbox"
        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">{task.title}</p>
        {task.projects && (
          <p className="text-sm text-gray-500">
            {task.projects.goals?.title} → {task.projects.title}
          </p>
        )}
      </div>
      <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
        {task.priority}
      </span>
    </div>
  )
}
