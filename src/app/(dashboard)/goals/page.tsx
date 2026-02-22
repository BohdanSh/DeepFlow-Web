'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Goal, GoalInsert } from '@/types/database'

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
    if (data && data.length > 0) {
      const goalsWithTasks = await Promise.all(
        (data as Goal[]).map(async (goal: Goal) => {
          const { data: tasks } = await supabase
            .from('tasks')
            .select('is_completed')
            .eq('goal_id', goal.id)
          return { ...goal, tasks: tasks || [] } as GoalWithTasks
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
    if (!confirm('Delete this goal? All tasks will be deleted too.')) return

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchGoals()
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🎯 Goals</h1>
          <p className="text-gray-400">Your life goals and aspirations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
        <div className="text-center py-16 bg-gray-800 rounded-xl border border-gray-700">
          <div className="text-5xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-white">No goals yet</h3>
          <p className="text-gray-400 mt-1">Create your first goal to get started</p>
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
        className="bg-gray-800 rounded-xl border border-gray-700 p-5 hover:border-gray-600 hover:shadow-lg transition-all cursor-pointer h-full group"
        style={{ borderTopColor: goal.color, borderTopWidth: 4 }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-white group-hover:text-blue-400 transition-colors">{goal.title}</h3>
            {goal.category && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-700 text-gray-300 rounded-full capitalize">
                {goal.category}
              </span>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
            <button
              onClick={(e) => {
                e.preventDefault()
                onEdit()
              }}
              className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.preventDefault()
                onDelete()
              }}
              className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
            >
              🗑️
            </button>
          </div>
        </div>
        {goal.description && (
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">{goal.description}</p>
        )}
        
        {/* Progress */}
        {totalTasks > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-400">
                <span className="text-green-400">{completedTasks}</span>/{totalTasks} tasks
              </span>
              <span className="font-medium text-white">{progressPercent}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
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
  } | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description: description || null,
      category: category as Goal['category'] || null,
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
    <div className="fixed inset-0 bg-black/70 flex items-start md:items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto border border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-4">
          {goal ? 'Edit Goal' : 'New Goal'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Title
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
                placeholder="e.g., Learn Python"
              />
              {!goal && (
                <button
                  type="button"
                  onClick={generateWithAI}
                  disabled={generating || !title.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
                >
                  {generating ? '⏳' : '✨ AI'}
                </button>
              )}
            </div>
          </div>

          {/* AI Suggestion Preview */}
          {aiSuggestion && (
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-300">✨ AI Suggestion</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAiSuggestion(null)}
                    className="text-xs px-2 py-1 text-gray-400 hover:bg-gray-700 rounded"
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
              <div className="text-sm text-gray-300 space-y-1">
                <p><span className="text-gray-500">Description:</span> {aiSuggestion.description}</p>
                <p><span className="text-gray-500">Category:</span> {aiSuggestion.category}</p>
                <p><span className="text-gray-500">Target:</span> {aiSuggestion.target_date}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-500"
              placeholder="What does success look like?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white cursor-pointer"
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
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-offset-gray-800 ring-white scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Target date
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
            />
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
              {goal ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
