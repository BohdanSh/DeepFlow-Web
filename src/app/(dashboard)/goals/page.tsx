'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Goal, GoalInsert, Task } from '@/types/database'

interface GoalWithTasks extends Goal {
  tasks: { is_completed: boolean }[]
}

const CATEGORIES = ['career', 'health', 'finance', 'personal', 'relationships'] as const
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalWithTasks[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchGoals()
  }, [])

  async function fetchGoals() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching goals:', error)
    }
    
    // Fetch tasks separately for each goal
    if (data) {
      const goalsWithTasks = await Promise.all(
        data.map(async (goal) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('is_completed')
            .eq('goal_id', goal.id)
          return { ...goal, tasks: tasks || [] }
        })
      )
      setGoals(goalsWithTasks)
      setLoading(false)
      return
    }

    setGoals([])
    setLoading(false)
  }

  async function createGoal(goal: Omit<GoalInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('goals')
      .insert({ ...goal, user_id: user.id } as never)

    if (!error) {
      fetchGoals()
      setShowForm(false)
    }
  }

  async function updateGoal(id: string, updates: Partial<Goal>) {
    const { error } = await supabase
      .from('goals')
      .update(updates as never)
      .eq('id', id)

    if (!error) {
      fetchGoals()
      setEditingGoal(null)
    }
  }

  async function deleteGoal(id: string) {
    if (!confirm('Delete this goal? All projects and tasks will be deleted too.')) return

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchGoals()
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
          <p className="text-gray-500">Your life goals and aspirations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Goal
        </button>
      </div>

      {/* Goal Form Modal */}
      {(showForm || editingGoal) && (
        <GoalForm
          goal={editingGoal}
          onSubmit={(data) => {
            if (editingGoal) {
              updateGoal(editingGoal.id, data)
            } else {
              createGoal(data)
            }
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingGoal(null)
          }}
        />
      )}

      {/* Goals Grid */}
      {goals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => setEditingGoal(goal)}
              onDelete={() => deleteGoal(goal.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-gray-900">No goals yet</h3>
          <p className="text-gray-500 mt-1">Create your first goal to get started</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Goal
          </button>
        </div>
      )}
    </div>
  )
}

function GoalCard({ 
  goal, 
  onEdit, 
  onDelete 
}: { 
  goal: GoalWithTasks
  onEdit: () => void
  onDelete: () => void
}) {
  const totalTasks = goal.tasks?.length || 0
  const completedTasks = goal.tasks?.filter(t => t.is_completed).length || 0
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <Link href={`/goals/${goal.id}`}>
      <div
        className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer h-full"
        style={{ borderTopColor: goal.color, borderTopWidth: 4 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{goal.title}</h3>
            {goal.category && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                {goal.category}
              </span>
            )}
          </div>
          <div className="flex gap-1" onClick={(e) => e.preventDefault()}>
            <button
              onClick={(e) => {
                e.preventDefault()
                onEdit()
              }}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            >
              🗑️
            </button>
          </div>
        </div>
        {goal.description && (
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">{goal.description}</p>
        )}
        
        {/* Progress */}
        {totalTasks > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">{completedTasks}/{totalTasks} tasks</span>
              <span className="font-medium text-gray-700">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {goal.target_date && (
          <p className="mt-3 text-xs text-gray-500">
            🎯 Target: {new Date(goal.target_date).toLocaleDateString()}
          </p>
        )}
      </div>
    </Link>
  )
}

function GoalForm({
  goal,
  onSubmit,
  onCancel,
}: {
  goal: Goal | null
  onSubmit: (data: Omit<GoalInsert, 'user_id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(goal?.title || '')
  const [description, setDescription] = useState(goal?.description || '')
  const [category, setCategory] = useState(goal?.category || '')
  const [color, setColor] = useState(goal?.color || COLORS[0])
  const [targetDate, setTargetDate] = useState(goal?.target_date || '')
  const [generating, setGenerating] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    description: string
    category: string
    target_date: string
    suggested_projects?: { title: string; description: string }[]
  } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description: description || null,
      category: category as any || null,
      color,
      target_date: targetDate || null,
    })
  }

  const generateWithAI = async () => {
    if (!title.trim()) return
    setGenerating(true)
    setAiSuggestion(null)
    
    try {
      const res = await fetch('/api/ai/generate-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      
      if (res.ok) {
        const data = await res.json()
        setAiSuggestion(data)
      }
    } catch (error) {
      console.error('AI generation failed:', error)
    } finally {
      setGenerating(false)
    }
  }

  const acceptAISuggestion = () => {
    if (!aiSuggestion) return
    setDescription(aiSuggestion.description)
    setCategory(aiSuggestion.category)
    setTargetDate(aiSuggestion.target_date)
    setAiSuggestion(null)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {goal ? 'Edit Goal' : 'New Goal'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="e.g., Learn Python"
              />
              {!goal && (
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={generating || !title.trim()}
                  className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {generating ? '...' : '✨ AI'}
                </button>
              )}
            </div>
          </div>

          {/* AI Suggestion Preview */}
          {aiSuggestion && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-800">✨ AI Suggestion</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                  >
                    Dismiss
                  </button>
                  <button
                    type="button"
                    onClick={acceptAISuggestion}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Accept
                  </button>
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <p><strong>Description:</strong> {aiSuggestion.description}</p>
                <p><strong>Category:</strong> {aiSuggestion.category}</p>
                <p><strong>Target:</strong> {aiSuggestion.target_date}</p>
                {aiSuggestion.suggested_projects && (
                  <div className="mt-2">
                    <strong>Suggested Projects:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {aiSuggestion.suggested_projects.map((p, i) => (
                        <li key={i}>{p.title}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="What does success look like?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">Select category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="capitalize">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {goal ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
