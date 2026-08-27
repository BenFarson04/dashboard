import assert from 'node:assert/strict'
import {
  createLocalStorageProvider, createTask, getTaskCategory, groupTasks, migrateTasks,
  setTaskCompleted, TASK_STATUS, updateTask,
} from '../src/services/taskService.js'
import { generateBriefing } from '../src/services/briefingService.js'

const now = new Date('2025-01-15T09:00:00Z')
const task = (id, dueDate, priority = 'medium') => createTask({ id, title: `Task ${id}`, dueDate, priority }, now)
const overdue = task('overdue', '2025-01-14T09:00:00Z', 'high')
const due = task('due', '2025-01-15T12:00:00Z', 'high')
const later = task('later', '2025-01-16T12:00:00Z', 'low')

assert.deepEqual(groupTasks([], now), { due: [], overdue: [], completed: [], unscheduled: [] })
const created = task('created', '2025-01-20T12:00:00Z')
assert.equal(created.status, TASK_STATUS.DUE)
assert.equal(created.createdAt, now.toISOString())
assert.equal(updateTask(created, { title: 'Edited' }).title, 'Edited')
assert.deepEqual([created, later].filter(item => item.id !== created.id), [later])

const completed = setTaskCompleted(created, true, now)
assert.equal(completed.status, TASK_STATUS.COMPLETED)
assert.equal(completed.completedAt, now.toISOString())
const restored = setTaskCompleted(completed, false, now)
assert.equal(restored.status, TASK_STATUS.DUE)
assert.equal(restored.completedAt, null)

assert.equal(getTaskCategory(overdue, now), TASK_STATUS.OVERDUE)
assert.equal(getTaskCategory(due, now), TASK_STATUS.DUE)
assert.equal(getTaskCategory(completed, now), TASK_STATUS.COMPLETED)
assert.equal(getTaskCategory(task('undated', null), now), 'unscheduled')
const sorted = groupTasks([later, due, overdue], now)
assert.deepEqual(sorted.overdue.map(item => item.id), ['overdue'])
assert.deepEqual(sorted.due.map(item => item.id), ['due', 'later'])
assert.deepEqual(groupTasks([setTaskCompleted(later, true, now)], now).completed.map(item => item.id), ['later'])

const legacy = migrateTasks([
  { id: 't3', title: 'Compare Aegon vs AJ Bell SIPP charges before call' },
  { id: 't3', title: 'A genuine replacement task', completed: false },
  { id: 'u1', title: 'User task', due: '2025-01-20T12:00:00Z', completed: false },
])
assert.deepEqual(legacy.map(item => item.title), ['A genuine replacement task', 'User task'])

const storage = new Map()
const provider = createLocalStorageProvider({ getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) })
provider.save([created])
assert.equal(provider.load()[0].id, 'created')

const briefing = generateBriefing({ now, tasks: [completed, overdue, due, later], prefs: { includeCalendar: false, includeEmail: false, includeWeather: false, includeNews: false } })
assert.match(briefing.text, /overdue/)
assert.equal(briefing.parts[0].refs[0].id, 'overdue')
assert.equal(briefing.parts[0].refs.some(ref => ref.id === 'created'), false)
console.log('task persistence, migration, lifecycle, sorting, dashboard data, and briefing tests passed')