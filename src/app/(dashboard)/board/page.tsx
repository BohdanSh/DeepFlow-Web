'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Task, Goal, Database } from '@/types/database'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type TaskUpdate = Database['public']['Tables']['tasks']['Update']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']

type ColumnType = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done'

interface Column {
  id: ColumnType
  title: string
  icon: string
}

const columns: Column[] = [
  { id: 'backlog', title: 'Backlog', icon: '📥' },
  { id: 'todo', title: 'To Do', icon: '📝' },
  { id: 'in_progress', title: 'In Progress', icon: '⚡' },
  { id: 'review', title: 'In Review', icon: '👀' },
  { id: 'done', title: 'Done', icon: '✅' },
]

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

// Sortable Task Card Component
function SortableTaskCard({ 
  task, 
  goals, 
  onToggleComplete 
}: { 
  task: Task
  goals: Goal[]
  onToggleComplete: (taskId: string, isCompleted: boolean) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const goal = goals.find(g => g.id === task.goal_id)
  const today = getToday()
  
  // Due date status
  let dueDateStatus: 'overdue' | 'soon' | 'normal' | null = null
  if (task.due_date && !task.is_completed) {
    const dueDate = new Date(task.due_date)
    const todayDate = new Date(today)
    const diffDays = Math.ceil((dueDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) dueDateStatus = 'overdue'
    else if (diffDays <= 2) dueDateStatus = 'soon'
    else dueDateStatus = 'normal'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700
        p-3 cursor-grab active:cursor-grabbing
        hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        transition-all duration-200
        ${task.is_completed ? 'opacity-70' : ''}
      `}
    >
      <div className="flex items-start gap-2">
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleComplete(task.id, !task.is_completed)
          }}
          className={`
            flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 flex items-center justify-center transition-colors
            ${task.is_completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
          `}
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
          <p className={`text-sm font-medium text-gray-900 dark:text-white ${task.is_completed ? 'line-through' : ''}`}>
            {task.title}
          </p>
          
          <div className="flex flex-wrap gap-1 mt-2">
            {/* Goal badge */}
            {goal && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: goal.color }}
              >
                {goal.title}
              </span>
            )}
            
            {/* Due date badge */}
            {task.due_date && (
              <span className={`
                text-xs px-2 py-0.5 rounded-full
                ${dueDateStatus === 'overdue' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                ${dueDateStatus === 'soon' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                ${dueDateStatus === 'normal' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : ''}
              `}>
                {dueDateStatus === 'overdue' && '🔴 '}
                {dueDateStatus === 'soon' && '🟡 '}
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Task Card for Drag Overlay
function TaskCardOverlay({ task, goals }: { task: Task; goals: Goal[] }) {
  const goal = goals.find(g => g.id === task.goal_id)
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border-2 border-blue-500 p-3 shadow-lg rotate-2">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-5 h-5 mt-0.5 rounded border-2 border-gray-300" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {task.title}
          </p>
          {goal && (
            <span 
              className="inline-block text-xs px-2 py-0.5 rounded-full text-white mt-2"
              style={{ backgroundColor: goal.color }}
            >
              {goal.title}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Quick Add Input Component
function QuickAddInput({ 
  columnId, 
  onAdd 
}: { 
  columnId: ColumnType
  onAdd: (title: string, columnId: ColumnType) => void 
}) {
  const [title, setTitle] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    
    setIsAdding(true)
    await onAdd(title.trim(), columnId)
    setTitle('')
    setIsAdding(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="+ Add task..."
        disabled={isAdding}
        className="
          w-full px-3 py-2 text-sm
          bg-white/50 dark:bg-gray-800/50 
          border border-gray-200 dark:border-gray-700
          rounded-lg
          placeholder-gray-400 dark:placeholder-gray-500
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50
        "
      />
    </form>
  )
}

// Main Board Page
export default function BoardPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    // Get tasks from last 7 days if completed, or all incomplete
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [tasksRes, goalsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .or(`is_completed.eq.false,completed_at.gte.${sevenDaysAgo.toISOString()}`)
        .order('created_at', { ascending: false }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
    ])

    if (tasksRes.data) setTasks(tasksRes.data)
    if (goalsRes.data) setGoals(goalsRes.data)
    setLoading(false)
  }

  const getTasksForColumn = (columnId: ColumnType): Task[] => {
    return tasks.filter(t => {
      const taskStatus = t.status || 'backlog'
      return taskStatus === columnId
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    if (task) setActiveTask(task)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null)
    
    const { active, over } = event
    if (!over) return

    const taskId = active.id as string
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    // Find which column the task was dropped into
    const overId = over.id as string
    let targetColumn: ColumnType | null = null
    
    // Check if dropped on a column
    if (['backlog', 'todo', 'in_progress', 'review', 'done'].includes(overId)) {
      targetColumn = overId as ColumnType
    } else {
      // Dropped on another task - find that task's column
      const overTask = tasks.find(t => t.id === overId)
      if (overTask) {
        targetColumn = (overTask.status || 'backlog') as ColumnType
      }
    }

    if (!targetColumn) return

    // Don't update if dropped in same column
    const currentStatus = task.status || 'backlog'
    if (currentStatus === targetColumn) return

    const supabase = createClient()
    
    const isDone = targetColumn === 'done'
    const updateData: TaskUpdate = {
      status: targetColumn,
      is_completed: isDone,
      completed_at: isDone ? new Date().toISOString() : null
    }

    // Optimistic update
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, ...updateData } as Task : t
    ))

    await supabase
      .from('tasks')
      .update(updateData as never)
      .eq('id', taskId)
  }

  const handleToggleComplete = async (taskId: string, isCompleted: boolean) => {
    const supabase = createClient()
    
    const updateData: TaskUpdate = isCompleted 
      ? { status: 'done', is_completed: true, completed_at: new Date().toISOString() }
      : { status: 'todo', is_completed: false, completed_at: null }

    // Optimistic update
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, ...updateData } as Task : t
    ))

    await supabase
      .from('tasks')
      .update(updateData as never)
      .eq('id', taskId)
  }

  const handleQuickAdd = async (title: string, columnId: ColumnType) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const isDone = columnId === 'done'
    
    const newTask: TaskInsert = {
      user_id: user.id,
      title,
      status: columnId,
      is_completed: isDone,
      completed_at: isDone ? new Date().toISOString() : null,
      priority: 'medium',
      is_inbox: false,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(newTask as never)
      .select()
      .single()

    if (data && !error) {
      setTasks(prev => [data, ...prev])
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">📋 Board</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Drag tasks between columns to organize your work
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {columns.map(column => {
            const columnTasks = getTasksForColumn(column.id)
            
            return (
              <div
                key={column.id}
                className="bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 min-h-[400px] flex flex-col flex-shrink-0 w-72"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{column.icon}</span>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                      {column.title}
                    </h3>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <SortableContext
                  id={column.id}
                  items={columnTasks.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 space-y-2 min-h-[100px]" data-column={column.id}>
                    {columnTasks.length === 0 ? (
                      <div className="flex items-center justify-center h-20 text-gray-400 dark:text-gray-500 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                        Drop tasks here
                      </div>
                    ) : (
                      columnTasks.map(task => (
                        <SortableTaskCard
                          key={task.id}
                          task={task}
                          goals={goals}
                          onToggleComplete={handleToggleComplete}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>

                {/* Quick Add */}
                <QuickAddInput columnId={column.id} onAdd={handleQuickAdd} />
              </div>
            )
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeTask && <TaskCardOverlay task={activeTask} goals={goals} />}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
