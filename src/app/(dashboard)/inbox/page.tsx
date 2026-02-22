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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white space-y-6 transition-colors">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📥 Inbox</h1>
        <p className="text-gray-500 dark:text-gray-400">Quick capture — organize later</p>
      </div>

      {/* Quick Add */}
      <form onSubmit={addTask} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => {
              setNewTask(e.target.value)
              setSuggestion(null)
            }}
            placeholder="Add a task..."
            className="flex-1 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm"
          />
          {goals.length > 0 && (
            <button
              type="button"
              onClick={suggestGoal}
              disabled={suggesting || !newTask.trim()}
              className="px-4 py-3 bg-purple-100 dark:bg-purple-600/20 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-200 dark:border-purple-500/30 hover:bg-purple-200 dark:hover:bg-purple-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="AI suggest goal"
            >
              {suggesting ? '⏳' : '✨'}
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add
          </button>
        </div>

        {/* AI Suggestion */}
        {suggestion && suggestion.goal_id && (
          <div className="bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  <span className="font-medium">✨ Suggested:</span> Add to{' '}
                  <span className="font-semibold text-purple-800 dark:text-purple-200">{suggestion.goal_title}</span>
                  {suggestion.priority && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                      suggestion.priority === 'high' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400' :
                      suggestion.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {suggestion.priority}
                    </span>
                  )}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">{suggestion.reason}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  type="button"
                  onClick={() => setSuggestion(null)}
                  className="text-sm px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => addTaskToGoal(suggestion.goal_id!, suggestion.priority)}
                  className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700"
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
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors shadow-sm"
            >
              <button
                onClick={() => toggleTask(task.id, !task.is_completed)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                  task.is_completed
                    ? 'bg-green-500 border-green-500 text-white'
                    : 'border-gray-400 dark:border-gray-500 hover:border-green-500'
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
              <span className="flex-1 text-gray-900 dark:text-white">{task.title}</span>
              
              {/* Move to Goal dropdown */}
              {goals.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      moveTaskToGoal(task.id, e.target.value)
                    }
                  }}
                  className="text-sm px-3 py-1.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 cursor-pointer"
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
                className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-5xl mb-4">📥</div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Inbox is empty</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quickly capture tasks here, organize them later
          </p>
        </div>
      )}

      {/* Tip */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>💡 Tip:</strong> Use Inbox for quick capture. Click ✨ to let AI suggest which goal 
        your task belongs to, or use &quot;Move to...&quot; to organize manually.
      </div>
    </div>
  )
}
