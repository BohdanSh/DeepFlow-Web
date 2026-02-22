'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Project, Goal, ProjectInsert } from '@/types/database'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<(Project & { goals: Goal | null })[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [projectsRes, goalsRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, goals(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
    ])

    setProjects((projectsRes.data as (Project & { goals: Goal | null })[]) || [])
    setGoals((goalsRes.data as Goal[]) || [])
    setLoading(false)
  }

  async function createProject(project: Omit<ProjectInsert, 'user_id'>) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('projects')
      .insert({ ...project, user_id: user.id } as never)

    if (!error) {
      fetchData()
      setShowForm(false)
    }
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const { error } = await supabase
      .from('projects')
      .update(updates as never)
      .eq('id', id)

    if (!error) {
      fetchData()
      setEditingProject(null)
    }
  }

  async function deleteProject(id: string) {
    if (!confirm('Delete this project? All tasks will be moved to Inbox.')) return

    const { error } = await supabase
      .from('projects')
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-500">Organize work towards your goals</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Project
        </button>
      </div>

      {/* Project Form Modal */}
      {(showForm || editingProject) && (
        <ProjectForm
          project={editingProject}
          goals={goals}
          onSubmit={(data) => {
            if (editingProject) {
              updateProject(editingProject.id, data)
            } else {
              createProject(data)
            }
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingProject(null)
          }}
        />
      )}

      {/* Projects List */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => setEditingProject(project)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <div className="text-4xl mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900">No projects yet</h3>
          <p className="text-gray-500 mt-1">
            {goals.length === 0 
              ? 'Create a goal first, then add projects to it'
              : 'Create a project to organize your tasks'}
          </p>
          {goals.length > 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Project
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
}: {
  project: Project & { goals: Goal | null }
  onEdit: () => void
  onDelete: () => void
}) {
  const statusColors = {
    active: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {project.goals && (
            <div
              className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
              style={{ backgroundColor: project.goals.color }}
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-900">{project.title}</h3>
            {project.goals && (
              <p className="text-sm text-gray-500">{project.goals.title}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusColors[project.status]}`}>
            {project.status}
          </span>
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
          >
            🗑️
          </button>
        </div>
      </div>
      {project.description && (
        <p className="mt-2 text-sm text-gray-600 ml-6">{project.description}</p>
      )}
      {project.deadline && (
        <p className="mt-2 text-xs text-gray-500 ml-6">
          Deadline: {new Date(project.deadline).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

function ProjectForm({
  project,
  goals,
  onSubmit,
  onCancel,
}: {
  project: Project | null
  goals: Goal[]
  onSubmit: (data: Omit<ProjectInsert, 'user_id'>) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState(project?.title || '')
  const [description, setDescription] = useState(project?.description || '')
  const [goalId, setGoalId] = useState(project?.goal_id || '')
  const [status, setStatus] = useState(project?.status || 'active')
  const [deadline, setDeadline] = useState(project?.deadline || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      description: description || null,
      goal_id: goalId || null,
      status: status as any,
      deadline: deadline || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start md:items-center justify-center z-50 overflow-y-auto py-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6 my-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {project ? 'Edit Project' : 'New Project'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="e.g., Launch MVP"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Goal
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="">No goal (standalone project)</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              placeholder="What's this project about?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'on_hold')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
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
              {project ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
