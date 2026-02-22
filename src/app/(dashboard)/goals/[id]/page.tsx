'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Goal, Task, TaskInsert } from '@/types/database'

interface SuggestedTask {
  title: string
  description: string
  suggested_due_date: string
  priority: 'low' | 'medium' | 'high'
}

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: goalId } = use(params)
  const router = useRouter()
  const [goal, setGoal] = useState<Goal | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [generatingRoadmap, setGeneratingRoadmap] = useState(false)
  const [suggestedTasks, setSuggestedTasks] = useState<SuggestedTask[]>([])
  const supabase = createClient()

  useEffect(() => {
    fetchGoalAndTasks()
  }, [goalId])

  async function fetchGoalAndTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }

    // Fetch goal
    const { data: goalData, error: goalError } = await supabase
      .from('goals')
      .select('*')
      .eq('id', goalId)
      .eq('user_id', user.id)
      .single()

    if (goalError || !goalData) {
      router.push('/goals')
      return
    }

    setGoal(goalData as Goal)

    // Fetch tasks
    const { data: tasksData } = await supabase
      .from('tasks')
      .select('*')
      .eq('goal_id', goalId)
      .order('is_completed', { ascending: true })
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    setTasks((tasksData as Task[]) || [])
    setLoading(false)
  }

  async function createTask(data: Omit<TaskInsert, 'user_id' | 'goal_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error('No user found')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .insert({
        ...data,
        user_id: user.id,
        goal_id: goalId,
        is_inbox: false,
      } as never)
      .select()

    if (error) {
      console.error('Error creating task:', error)
      alert(`Error creating task: ${error.message}`)
      return
    }

    fetchGoalAndTasks()
    setShowTaskForm(false)
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const { error } = await supabase
      .from('tasks')
      .update(updates as never)
      .eq('id', id)

    if (error) {
      console.error('Error updating task:', error)
      alert(`Error: ${error.message}`)
      return
    }

    fetchGoalAndTasks()
    setEditingTask(null)
  }

  async function toggleTaskComplete(taskId: string, isCompleted: boolean) {
    const updates: Partial<Task> = {
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
    }

    await updateTask(taskId, updates)
  }

  async function deleteTask(taskId: string) {
    if (!confirm('Delete this task?')) return

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (!error) {
      fetchGoalAndTasks()
    }
  }

  async function generateRoadmap() {
    if (!goal) return
    setGeneratingRoadmap(true)
    setSuggestedTasks([])

    try {
      const res = await fetch('/api/ai/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: goal.title,
          description: goal.description,
          target_date: goal.target_date,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setSuggestedTasks(data.tasks || [])
      } else {
        alert('Failed to generate roadmap')
      }
    } catch (error) {
      console.error('Roadmap generation failed:', error)
      alert('Failed to generate roadmap')
    } finally {
      setGeneratingRoadmap(false)
    }
  }

  async function addSuggestedTask(suggested: SuggestedTask) {
    await createTask({
      title: suggested.title,
      description: suggested.description,
      due_date: suggested.suggested_due_date,
      priority: suggested.priority,
    })
    setSuggestedTasks(prev => prev.filter(t => t.title !== suggested.title))
  }

  async function addAllSuggestedTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const tasksToInsert = suggestedTasks.map(t => ({
      user_id: user.id,
      goal_id: goalId,
      title: t.title,
      description: t.description,
      due_date: t.suggested_due_date,
      priority: t.priority,
      is_inbox: false,
    }))

    const { error } = await supabase
      .from('tasks')
      .insert(tasksToInsert as never)

    if (error) {
      console.error('Error adding suggested tasks:', error)
      alert(`Error: ${error.message}`)
      return
    }

    setSuggestedTasks([])
    fetchGoalAndTasks()
  }

  // Calculate progress
  const completedTasks = tasks.filter(t => t.is_completed).length
  const totalTasks = tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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

  if (!goal) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Goal not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white space-y-6">
      {/* Back button */}
      <Link
        href="/goals"
        className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors"
      >
        ← Back to Goals
      </Link>

      {/* Goal Header */}
      <div
        className="bg-gray-800 rounded-xl border border-gray-700 p-6"
        style={{ borderTopColor: goal.color, borderTopWidth: 4 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{goal.title}</h1>
            {goal.category && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full capitalize">
                {goal.category}
              </span>
            )}
            {goal.description && (
              <p className="mt-3 text-gray-400">{goal.description}</p>
            )}
            {goal.target_date && (
              <p className="mt-2 text-sm text-gray-500">
                🎯 Target: {new Date(goal.target_date).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Progress</span>
              <span className="font-medium text-white">
                <span className="text-green-400">{completedTasks}</span>/{totalTasks} tasks ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => setShowTaskForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + Add Task
        </button>
        <button
          onClick={generateRoadmap}
          disabled={generatingRoadmap}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-medium"
        >
          {generatingRoadmap ? '⏳ Generating...' : '✨ Generate Roadmap'}
        </button>
      </div>

      {/* AI Suggested Tasks */}
      {suggestedTasks.length > 0 && (
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-300">✨ AI Suggested Tasks</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSuggestedTasks([])}
                className="text-sm px-3 py-1.5 text-gray-400 hover:bg-gray-700 rounded"
              >
                Dismiss All
              </button>
              <button
                onClick={addAllSuggestedTasks}
                className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Add All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {suggestedTasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-white">{task.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>📅 {task.suggested_due_date}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-gray-700 text-gray-400'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addSuggestedTask(task)}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">
          Tasks
          {tasks.length > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-400">({tasks.length})</span>
          )}
        </h2>
        
        {tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-start gap-3 bg-gray-800 rounded-lg p-4 border-l-4 border border-gray-700 hover:border-gray-600 transition-colors group ${priorityColors[task.priority] || ''}`}
              >
                <button
                  onClick={() => toggleTaskComplete(task.id, !task.is_completed)}
                  className={`flex-shrink-0 w-6 h-6 mt-0.5 rounded-full border-2 flex items-center justify-center transition-all ${
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
                  <div className="flex items-center gap-2">
                    <h4
                      className={`font-medium ${
                        task.is_completed ? 'line-through text-gray-500' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{task.description}</p>
                  )}
                  {task.due_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      📅 Due: {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-xl border border-gray-700">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-400">No tasks yet. Add your first task!</p>
          </div>
        )}
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskFormModal
          task={editingTask}
          goalTitle={goal?.title}
          onSubmit={(data) => {
            if (editingTask) {
              updateTask(editingTask.id, data)
            } else {
              createTask(data)
            }
          }}
          onCancel={() => {
            setShowTaskForm(false)
            setEditingTask(null)
          }}
        />
      )}
    </div>
  )
}

function TaskFormModal({
  task,
  goalTitle,
  onSubmit,
  onCancel,
}: {
  task: Task | null
  goalTitle?: string
  onSubmit: (data: Omit<TaskInsert, 'user_id' | 'goal_id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium')
  const [enhancing, setEnhancing] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description: description || null,
      due_date: dueDate || null,
      priority,
    })
  }

  const enhanceTitle = async () => {
    if (!title.trim()) return
    setEnhancing(true)
    
    try {
      const res = await fetch('/api/ai/enhance-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title, 
          context: goalTitle,
          mode: 'enhance'
        }),
      })
      
      if (res.ok) {
        const data = await res.json()
        if (data.enhanced_title) setTitle(data.enhanced_title)
        if (data.description && !description) setDescription(data.description)
        if (data.suggested_priority) setPriority(data.suggested_priority)
      }
    } catch (error) {
      console.error('AI enhance failed:', error)
    } finally {
      setEnhancing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="What needs to be done?"
              />
              <button
                type="button"
                onClick={enhanceTitle}
                disabled={enhancing || !title.trim()}
                className="px-3 py-2 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Enhance with AI"
              >
                {enhancing ? '⏳' : '✨'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white cursor-pointer"
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
