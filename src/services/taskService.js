export const TASK_STORAGE_KEY = 'pd.tasks'

export const TASK_STATUS = {
  DUE: 'due',
  OVERDUE: 'overdue',
  COMPLETED: 'completed',
}

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }
const DEMO_TASKS = [
  ['t1', 'Prep GSA model + load takedowns for 10:00 review'],
  ['t2', 'Send placement report draft to mentor for sign-off'],
  ['t3', 'Compare Aegon vs AJ Bell SIPP charges before call'],
  ['t4', 'Add Kanazawa food tiers to Wanderlog'],
  ['t5', 'Grocery run — rice cakes, bananas, corn flakes'],
  ['t6', 'Update Section Studio member-check edge cases'],
  ['t7', 'Book gym induction slot'],
]
const DEMO_BY_ID = new Map(DEMO_TASKS)
const DEMO_TITLES = new Set(DEMO_TASKS.map(([, title]) => title))

export function isCompleted(task) {
  return task?.status === TASK_STATUS.COMPLETED || task?.completed === true
}

export function getTaskCategory(task, now = new Date()) {
  if (isCompleted(task)) return TASK_STATUS.COMPLETED
  const dueDate = task?.dueDate ?? task?.due
  if (dueDate && new Date(dueDate) < new Date(now)) return TASK_STATUS.OVERDUE
  if (dueDate) return TASK_STATUS.DUE
  return 'unscheduled'
}

function normalizeTask(task, now = new Date()) {
  const completed = isCompleted(task)
  const dueDate = task.dueDate ?? task.due ?? null
  return {
    id: task.id,
    title: task.title || '',
    description: task.description || '',
    priority: task.priority || 'medium',
    category: task.category || 'Personal',
    dueDate,
    createdAt: task.createdAt || new Date().toISOString(),
    completedAt: completed ? (task.completedAt || new Date().toISOString()) : null,
    status: completed ? TASK_STATUS.COMPLETED : dueDate && new Date(dueDate) < new Date(now) ? TASK_STATUS.OVERDUE : TASK_STATUS.DUE,
  }
}

export function migrateTasks(value) {
  if (!Array.isArray(value)) return []
  return value
    .filter(task => task && !(DEMO_BY_ID.get(task.id) === task.title || DEMO_TITLES.has(task.title)))
    .filter(task => task && task.id && task.title)
    .map(normalizeTask)
}

export function createTask(input, now = new Date()) {
  return normalizeTask({
    ...input,
    id: input.id || `task-${Date.now()}`,
    createdAt: input.createdAt || new Date(now).toISOString(),
    status: TASK_STATUS.DUE,
    completed: false,
  }, now)
}

export function updateTask(task, patch) {
  return normalizeTask({ ...task, ...patch, dueDate: patch.dueDate ?? patch.due ?? task.dueDate })
}

export function setTaskCompleted(task, completed, now = new Date()) {
  return normalizeTask({
    ...task,
    status: completed ? TASK_STATUS.COMPLETED : TASK_STATUS.DUE,
    completed: completed,
    completedAt: completed ? new Date(now).toISOString() : null,
  }, now)
}

export function sortTasks(tasks, category) {
  return [...tasks].sort((a, b) => {
    if (category === TASK_STATUS.COMPLETED) return new Date(b.completedAt || 0) - new Date(a.completedAt || 0)
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
      || new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31')
  })
}

export function groupTasks(tasks, now = new Date()) {
  const groups = { due: [], overdue: [], completed: [], unscheduled: [] }
  tasks.forEach(task => {
    const category = getTaskCategory(task, now)
    if (category) groups[category].push(task)
  })
  return Object.fromEntries(Object.entries(groups).map(([key, list]) => [key, sortTasks(list, key)]))
}

// Provider boundary for a future Google Tasks, Microsoft To Do, or Firestore adapter.
export function createLocalStorageProvider(storage = globalThis.localStorage) {
  return {
    load() {
      try { return migrateTasks(JSON.parse(storage.getItem(TASK_STORAGE_KEY) || '[]')) } catch { return [] }
    },
    save(tasks) {
      try { storage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks)) } catch { /* storage unavailable */ }
    },
  }
}