'use client'

import { Task } from '@/types/database'

interface TaskListProps {
  tasks: Task[]
  onToggleComplete: (taskId: string, isCompleted: boolean) => void
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export default function TaskList({ tasks, onToggleComplete, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-3xl mb-2">📋</div>
        <p>No tasks yet. Add your first task!</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow ${
            task.is_completed ? 'opacity-60' : ''
          }`}
        >
          {/* Checkbox */}
          <button
            onClick={() => onToggleComplete(task.id, !task.is_completed)}
            className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors ${
              task.is_completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
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

          {/* Task content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4
                className={`font-medium text-gray-900 ${
                  task.is_completed ? 'line-through text-gray-500' : ''
                }`}
              >
                {task.title}
              </h4>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
            </div>
            {task.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            )}
            {task.due_date && (
              <p className="text-xs text-gray-400 mt-2">
                📅 Due: {new Date(task.due_date).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
            >
              ✏️
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
