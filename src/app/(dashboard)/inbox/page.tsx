'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task } from '@/types/database'

export default function InboxPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTask, setNewTask] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_inbox', true)
      .eq('is_completed', false)
      .order('created_at', { ascending: false })

    setTasks((data as Task[]) || [])
    setLoading(false)
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
      fetchTasks()
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
      fetchTasks()
    }
  }

  async function deleteTask(id: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (!error) {
      fetchTasks()
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
      <form onSubmit={addTask} className="flex gap-2">
        <input
          type="text"
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
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
        <strong>💡 Tip:</strong> Use Inbox for quick capture. Later, assign tasks to Goals 
        and set due dates from the Goals page.
      </div>
    </div>
  )
}
