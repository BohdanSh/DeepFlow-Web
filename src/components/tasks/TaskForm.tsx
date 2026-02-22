'use client'

import { useState } from 'react'
import { Task, TaskInsert } from '@/types/database'

interface TaskFormProps {
  task?: Task | null
  goalId: string
  goalTitle?: string
  onSubmit: (data: Omit<TaskInsert, 'user_id' | 'goal_id'>) => void
  onCancel: () => void
}

export default function TaskForm({ task, goalId, goalTitle, onSubmit, onCancel }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '')
  const [description, setDescription] = useState(task?.description || '')
  const [dueDate, setDueDate] = useState(task?.due_date || '')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>(task?.priority || 'medium')
  const [enhancing, setEnhancing] = useState(false)
  const [generatingDesc, setGeneratingDesc] = useState(false)

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

  const generateDescription = async () => {
    if (!title.trim()) return
    setGeneratingDesc(true)
    
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
        if (data.description) setDescription(data.description)
      }
    } catch (error) {
      console.error('AI description failed:', error)
    } finally {
      setGeneratingDesc(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {task ? 'Edit Task' : 'New Task'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                placeholder="What needs to be done?"
              />
              <button
                type="button"
                onClick={enhanceTitle}
                disabled={enhancing || !title.trim()}
                className="px-2 py-2 text-purple-600 hover:bg-purple-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Enhance with AI"
              >
                {enhancing ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span>✨</span>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDesc || !title.trim()}
                className="ml-2 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-40"
              >
                {generatingDesc ? '⏳ generating...' : '✨ AI generate'}
              </button>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="Add more details..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {task ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
