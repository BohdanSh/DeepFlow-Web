'use client'

import { createClient } from '@/lib/supabase/client'
import { Task, Goal } from '@/types/database'
import { useState, useEffect } from 'react'
import Link from 'next/link'

type TaskWithGoal = Task & {
  goals: { title: string; color: string } | null
}

type GoalWithStats = Goal & {
  total_tasks: number
  completed_tasks: number
}

export default function DashboardPage() {
  const supabase = createClient()
  const [todayTasks, setTodayTasks] = useState<TaskWithGoal[]>([])
  const [overdueTasks, setOverdueTasks] = useState<TaskWithGoal[]>([])
  const [goals, setGoals] = useState<GoalWithStats[]>([])
  const [recentCompleted, setRecentCompleted] = useState<TaskWithGoal[]>([])
  const [loading, setLoading] = useState(true)
  
  // Quick Add state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedGoalId, setSelectedGoalId] = useState<string>('inbox')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Load all data
  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]

    // Today's tasks
    const { data: todayData } = await supabase
      .from('tasks')
      .select('*, goals(title, color)')
      .eq('user_id', user.id)
      .eq('due_date', today)
      .eq('is_completed', false)
      .order('priority', { ascending: false })

    // Overdue tasks
    const { data: overdueData } = await supabase
      .from('tasks')
      .select('*, goals(title, color)')
      .eq('user_id', user.id)
      .lt('due_date', today)
      .eq('is_completed', false)
      .order('due_date', { ascending: true })

    // Goals with task counts
    const { data: goalsData } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)

    // Get task counts for each goal
    const goalsWithStats: GoalWithStats[] = []
    if (goalsData) {
      for (const goal of goalsData as Goal[]) {
        const { count: total } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('goal_id', goal.id)

        const { count: completed } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('goal_id', goal.id)
          .eq('is_completed', true)

        goalsWithStats.push({
          ...goal,
          total_tasks: total || 0,
          completed_tasks: completed || 0,
        })
      }
    }

    // Recent completed tasks
    const { data: recentData } = await supabase
      .from('tasks')
      .select('*, goals(title, color)')
      .eq('user_id', user.id)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(5)

    setTodayTasks((todayData as TaskWithGoal[]) || [])
    setOverdueTasks((overdueData as TaskWithGoal[]) || [])
    setGoals(goalsWithStats)
    setRecentCompleted((recentData as TaskWithGoal[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  // Toggle task completion
  const toggleTask = async (taskId: string, isCompleted: boolean) => {
    const now = new Date().toISOString()
    await supabase
      .from('tasks')
      .update({ 
        is_completed: isCompleted,
        completed_at: isCompleted ? now : null
      } as never)
      .eq('id', taskId)

    loadData()
  }

  // Quick Add Task
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim() || isAdding) return

    setIsAdding(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const today = new Date().toISOString().split('T')[0]
    
    const taskData: any = {
      user_id: user.id,
      title: newTaskTitle.trim(),
      due_date: today,
      priority: 'medium',
      is_inbox: selectedGoalId === 'inbox',
      goal_id: selectedGoalId !== 'inbox' ? selectedGoalId : null,
    }

    await supabase.from('tasks').insert(taskData)
    
    setNewTaskTitle('')
    setIsAdding(false)
    loadData()
  }

  // Enhance task with AI
  const enhanceTask = async () => {
    if (!newTaskTitle.trim() || isEnhancing) return

    setIsEnhancing(true)
    try {
      const goal = goals.find(g => g.id === selectedGoalId)
      const res = await fetch('/api/ai/enhance-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTaskTitle,
          context: goal?.title || 'Personal task',
          mode: 'enhance'
        })
      })

      if (res.ok) {
        const data = await res.json()
        if (data.enhanced_title) {
          setNewTaskTitle(data.enhanced_title)
        }
      }
    } catch (error) {
      console.error('AI enhance failed:', error)
    } finally {
      setIsEnhancing(false)
    }
  }

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  // Format today's date
  const formatDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    })
  }

  const priorityColors = {
    high: 'border-l-red-500 bg-red-500/5',
    medium: 'border-l-yellow-500 bg-yellow-500/5',
    low: 'border-l-gray-500 bg-gray-500/5',
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          Loading...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            {getGreeting()}, Богдан! 👋
          </h1>
          <p className="text-gray-400 mt-1">{formatDate()}</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex gap-4">
          <div className="bg-gray-800 rounded-xl px-4 py-3 border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">{todayTasks.length}</div>
            <div className="text-xs text-gray-400">tasks today</div>
          </div>
          {overdueTasks.length > 0 && (
            <div className="bg-gray-800 rounded-xl px-4 py-3 border border-red-500/30">
              <div className="text-2xl font-bold text-red-400">{overdueTasks.length}</div>
              <div className="text-xs text-gray-400">overdue</div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Task */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <form onSubmit={handleQuickAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Add a quick task for today..."
              className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
            />
            <button
              type="button"
              onClick={enhanceTask}
              disabled={!newTaskTitle.trim() || isEnhancing}
              className="px-4 py-3 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30 hover:bg-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Enhance with AI"
            >
              {isEnhancing ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <span>✨</span>
              )}
            </button>
          </div>
          
          <div className="flex gap-2">
            <select
              value={selectedGoalId}
              onChange={(e) => setSelectedGoalId(e.target.value)}
              className="bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              <option value="inbox">📥 Inbox</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  🎯 {goal.title}
                </option>
              ))}
            </select>
            
            <button
              type="submit"
              disabled={!newTaskTitle.trim() || isAdding}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
            >
              {isAdding ? '...' : '+ Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Overdue Section */}
      {overdueTasks.length > 0 && (
        <section className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
          <h2 className="font-semibold text-red-400 mb-3 flex items-center gap-2">
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {overdueTasks.length}
            </span>
            Overdue Tasks
          </h2>
          <div className="space-y-2">
            {overdueTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                priorityColors={priorityColors}
              />
            ))}
          </div>
        </section>
      )}

      {/* Today's Tasks */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          📅 Today&apos;s Tasks
          {todayTasks.length > 0 && (
            <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">
              {todayTasks.length}
            </span>
          )}
        </h2>
        
        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={toggleTask}
                priorityColors={priorityColors}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <p className="text-gray-400">No tasks for today!</p>
            <p className="text-sm text-gray-500 mt-1">
              Use the form above to add a new task
            </p>
          </div>
        )}
      </section>

      {/* Goals Progress */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">🎯 Goals Progress</h2>
          <Link 
            href="/goals"
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all →
          </Link>
        </div>
        
        {goals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 6).map(goal => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700 text-center">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-gray-400">No goals yet</p>
            <Link
              href="/goals"
              className="inline-block mt-3 text-sm text-blue-400 hover:text-blue-300"
            >
              Create your first goal →
            </Link>
          </div>
        )}
      </section>

      {/* Recent Activity */}
      {recentCompleted.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">✅ Recent Completed</h2>
          <div className="bg-gray-800 rounded-xl border border-gray-700 divide-y divide-gray-700">
            {recentCompleted.map(task => (
              <div key={task.id} className="p-3 flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <span className="flex-1 text-gray-400 line-through">{task.title}</span>
                {task.goals && (
                  <span 
                    className="text-xs px-2 py-1 rounded-full bg-gray-700"
                    style={{ color: task.goals.color }}
                  >
                    {task.goals.title}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// Task Card Component
function TaskCard({ 
  task, 
  onToggle, 
  priorityColors 
}: { 
  task: TaskWithGoal
  onToggle: (id: string, completed: boolean) => void
  priorityColors: Record<string, string>
}) {
  return (
    <div className={`flex items-center gap-3 bg-gray-800 rounded-lg p-4 border-l-4 border border-gray-700 hover:bg-gray-750 transition-colors ${priorityColors[task.priority] || ''}`}>
      <button
        onClick={() => onToggle(task.id, !task.is_completed)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          task.is_completed
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-500 hover:border-green-500'
        }`}
      >
        {task.is_completed && (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.is_completed ? 'line-through text-gray-500' : 'text-white'}`}>
          {task.title}
        </p>
        {task.goals && (
          <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
            <span 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: task.goals.color }}
            ></span>
            {task.goals.title}
          </p>
        )}
        {task.is_inbox && !task.goals && (
          <p className="text-sm text-gray-500 mt-0.5">📥 Inbox</p>
        )}
      </div>
      
      <span className={`text-xs px-2 py-1 rounded-full ${
        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
        'bg-gray-700 text-gray-400'
      }`}>
        {task.priority}
      </span>
    </div>
  )
}

// Goal Card Component
function GoalCard({ goal }: { goal: GoalWithStats }) {
  const progress = goal.total_tasks > 0 
    ? Math.round((goal.completed_tasks / goal.total_tasks) * 100) 
    : 0

  return (
    <Link
      href={`/goals/${goal.id}`}
      className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: goal.color }}
        ></div>
        <span className="text-xs text-gray-500 capitalize">{goal.category}</span>
      </div>
      
      <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors mb-2">
        {goal.title}
      </h3>
      
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
        <span className="text-green-400">{goal.completed_tasks}</span>
        <span>/</span>
        <span>{goal.total_tasks} tasks</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-right">{progress}%</p>
    </Link>
  )
}
