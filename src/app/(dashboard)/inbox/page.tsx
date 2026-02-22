'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, Goal } from '@/types/database'

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<{
    goal_id: string | null
    goal_title?: string
    confidence: number
    reason: string
    priority?: 'low' | 'medium' | 'high'
  } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [tasksRes, goalsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_inbox', true)
        .eq('is_completed', false)
        .order('created_at', { ascending: false }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
    ])

    setTasks((tasksRes.data as Task[]) || [])
    setGoals((goalsRes.data as Goal[]) || [])
    setLoading(false)
  }

  async function suggestGoal() {
    if (!newTask.trim() || goals.length === 0) return
    setSuggesting(true)
    setSuggestion(null)

    try {
      const res = await fetch('/api/ai/suggest-goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_title: newTask,
          available_goals: goals.map(g => ({ id: g.id, title: g.title }))
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const suggestedGoal = goals.find(g => g.id === data.suggested_goal_id)
        setSuggestion({
          ...data,
          goal_title: suggestedGoal?.title
        })
      }
    } catch (error) {
      console.error('AI suggestion failed:', error)
    } finally {
      setSuggesting(false)
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: newTask.trim(),
        is_inbox: true,
      } as never)

    if (!error) {
      setNewTask('')
      setSuggestion(null)
      fetchData()
    }
  }

  async function addTaskToGoal(goalId: string, priority?: 'low' | 'medium' | 'high') {
    if (!newTask.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        title: newTask.trim(),
        goal_id: goalId,
        priority: priority || 'medium',
        is_inbox: false,
      } as never)

    if (!error) {
      setNewTask('')
      setSuggestion(null)
      fetchData()
    }
  }

  async function moveTaskToGoal(taskId: string, goalId: string) {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        goal_id: goalId, 
        is_inbox: false 
      } as never)
      .eq('id', taskId)

    if (!error) {
      fetchData()
    }
  }

  async function toggleTask(id: string, completed: boolean) {
    const { error } = await supabase
      .from('tasks')
      .update({ 
        is_completed: completed,
        completed_at: completed ? new Date().toISOString() : null
      } as never)
      .eq('id', id)

    if (!error) {
      fetchData()
    }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchData()
    }
  }

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
        <p className="text-gray-500">Quick capture — organize later</p>
      </div>

      {/* Quick Add */}
      <form onSubmit={addTask} className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => {
              setNewTask(e.target.value)
              setSuggestion(null)
            }}
            placeholder="Add a task..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
          />
          {goals.length > 0 && (
            <button
              type="button"
              onClick={suggestGoal}
              disabled={suggesting || !newTask.trim()}
              className="px-3 py-2 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="AI suggest goal"
            >
              {suggesting ? '⏳' : '✨'}
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add
          </button>
        </div>

        {/* AI Suggestion */}
        {suggestion && suggestion.goal_id && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-purple-800">
                  <span className="font-medium">✨ Suggested:</span> Add to{' '}
                  <span className="font-semibold">{suggestion.goal_title}</span>
                  {suggestion.priority && (
                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-100 text-red-700' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {suggestion.priority}
                    </span>
                  )}
                </p>
                <p className="text-xs text-purple-600 mt-0.5">{suggestion.reason}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="text-xs px-2 py-1 text-gray-600 hover:bg-gray-200 rounded"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => addTaskToGoal(suggestion.goal_id!, suggestion.priority)}
                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  Add to Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Tasks */}
      {tasks.length > 0 ? (
        <div className="space-y-2">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow"
            >
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={(e) => toggleTask(task.id, e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1 text-gray-900">{task.title}</span>
              
              {/* Move to Goal dropdown */}
              {goals.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      moveTaskToGoal(task.id, e.target.value)
                    }
                  }}
                  className="text-xs px-2 py-1 border border-gray-200 rounded text-gray-600 bg-white"
                  defaultValue=""
                >
                  <option value="" disabled>Move to...</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      🎯 {goal.title}
                    </option>
                  ))}
                </select>
              )}
              
              <button
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">📥</div>
          <h3 className="text-lg font-medium text-gray-900">Inbox is empty</h3>
          <p className="text-gray-500 mt-1">
            Quickly capture tasks here, organize them later
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        <strong>💡 Tip:</strong> Use Inbox for quick capture. Click ✨ to let AI suggest which goal 
        your task belongs to, or use &quot;Move to...&quot; to organize manually.
      </div>
    </div>
  )
}
