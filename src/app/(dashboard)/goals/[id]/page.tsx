'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Goal, Task, TaskInsert } from '@/types/database'
import TaskList from '@/components/tasks/TaskList'
import TaskForm from '@/components/tasks/TaskForm'

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

    console.log('Creating task:', { ...data, user_id: user.id, goal_id: goalId })

    const { data: insertedTask, error } = await supabase
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

    console.log('Task created:', insertedTask)
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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!goal) {
    return <div className="text-center py-12 text-gray-500">Goal not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/goals"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        ← Back to Goals
      </Link>

      {/* Goal Header */}
      <div
        className="bg-white rounded-lg border border-gray-200 p-6"
        style={{ borderTopColor: goal.color, borderTopWidth: 4 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{goal.title}</h1>
            {goal.category && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {goal.category}
              </span>
            )}
            {goal.description && (
              <p className="mt-3 text-gray-600">{goal.description}</p>
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
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium text-gray-900">
                {completedTasks}/{totalTasks} tasks ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Task
        </button>
        <button
          onClick={generateRoadmap}
          disabled={generatingRoadmap}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          {generatingRoadmap ? '🔄 Generating...' : '🤖 Generate Roadmap'}
        </button>
      </div>

      {/* AI Suggested Tasks */}
      {suggestedTasks.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-purple-800">✨ AI Suggested Tasks</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setSuggestedTasks([])}
                className="text-sm px-3 py-1 text-gray-600 hover:bg-gray-200 rounded"
              >
                Dismiss All
              </button>
              <button
                onClick={addAllSuggestedTasks}
                className="text-sm px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                Add All
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {suggestedTasks.map((task, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{task.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                  <div className="flex gap-3 mt-2 text-xs text-gray-500">
                    <span>📅 {task.suggested_due_date}</span>
                    <span className={`px-2 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => addSuggestedTask(task)}
                  className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
        <TaskList
          tasks={tasks}
          onToggleComplete={toggleTaskComplete}
          onEdit={setEditingTask}
          onDelete={deleteTask}
        />
      </div>

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskForm
          task={editingTask}
          goalId={goalId}
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
